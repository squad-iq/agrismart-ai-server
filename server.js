const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.json({ plant: "error", disease: "المفتاح مفقود في إعدادات Render" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `أنت خبير نباتات. حلل الصورة وأجب بصيغة JSON فقط:
        {"plant": "اسم النبات", "disease": "سليم أو مريض", "confidence": "100", "treatment": "العلاج"}
        إذا لم تكن الصورة لنبات، اجعل plant هي "error".`;

        // معالجة الصورة بشكل آمن
        const imageData = image.includes("base64,") ? image.split("base64,")[1] : image;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        const text = response.text();
        
        // استخراج الـ JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            res.json({ plant: "error", disease: "الذكاء الاصطناعي أعطى رداً غير مفهوم: " + text.substring(0, 50) });
        }

    } catch (error) {
        console.error(error);
        // إرسال الخطأ الحقيقي كما هو لكي نعرف المشكلة
        res.json({ 
            plant: "error", 
            disease: "خطأ صريح: " + error.message, 
            confidence: "0", 
            treatment: "افحص إعدادات السيرفر" 
        });
    }
});

app.post("/chat", async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(req.body.message);
        res.json({ reply: result.response.text() });
    } catch (e) { res.json({ reply: "خطأ: " + e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Live on port ${PORT}`));
