const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        // نقوم بعمل Trim للمفتاح لإزالة أي مسافات مخفية
        const apiKey = (process.env.GEMINI_API_KEY || "").trim();

        if (!apiKey) {
            return res.json({ plant: "error", disease: "المفتاح غير موجود نهائياً في Render" });
        }

        // سطر للتأكد (سيظهر في Logs موقع Render فقط)
        console.log(`المفتاح المستخدم يبدأ بـ: ${apiKey.substring(0, 5)} وينتهي بـ: ${apiKey.substring(apiKey.length - 5)}`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `أنت خبير نباتات. حلل الصورة وأجب بصيغة JSON فقط:
        {"plant": "اسم النبات", "disease": "سليم أو مريض", "confidence": "100", "treatment": "العلاج"}`;

        const imageData = image.includes("base64,") ? image.split("base64,")[1] : image;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        res.json(JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]));

    } catch (error) {
        console.error("Gemini Error:", error.message);
        res.json({ 
            plant: "error", 
            disease: "رد جوجل: " + error.message, 
            confidence: "0", 
            treatment: "افحص سجلات (Logs) موقع Render لتتأكد من المفتاح." 
        });
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Server Debugging..."));
