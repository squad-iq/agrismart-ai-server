const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// جلب المفتاح من إعدادات Render
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `أنت خبير نباتات. حلل الصورة وأجب بصيغة JSON فقط:
        {
          "plant": "اسم النبات أو error إذا لم يكن نباتاً",
          "disease": "التشخيص",
          "confidence": "نسبة الدقة كرقيم فقط",
          "treatment": "العلاج"
        }`;

        const imageData = image.includes("base64,") ? image.split("base64,")[1] : image;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            throw new Error("Invalid AI format");
        }

    } catch (error) {
        console.error("Error details:", error.message);
        res.status(500).json({ 
            plant: "error", 
            disease: "خطأ: " + error.message, 
            confidence: "0", 
            treatment: "تأكد من تحديث package.json والمفتاح" 
        });
    }
});

// رابط الشات
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(message);
        res.json({ reply: result.response.text() });
    } catch (e) { res.status(500).json({ reply: "تعذر الاتصال" }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server is running..."));
