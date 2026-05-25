const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ plant: "error", disease: "الصورة مفقودة" });

        // التأكد من قراءة المفتاح
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ plant: "error", disease: "المفتاح غير معرف في Render" });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `تحليل نبات، الرد JSON فقط: {"plant":"..", "disease":"..", "confidence":"..", "treatment":".."}`;
        const imageData = image.includes("base64,") ? image.split("base64,")[1] : image;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        res.json(JSON.parse(response.text().match(/\{[\s\S]*\}/)[0]));

    } catch (error) {
        // أهم سطر: إرسال سبب الخطأ الحقيقي للتطبيق
        console.error("DEBUG:", error.message);
        res.status(500).json({ 
            plant: "error", 
            disease: "سبب الخطأ: " + error.message, 
            confidence: "0", 
            treatment: "افحص سجلات Render لمزيد من التفاصيل" 
        });
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Server Live"));
