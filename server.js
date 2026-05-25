const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        // التأكد من وجود المفتاح في كل طلب لضمان عدم ضياعه
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey || apiKey.length < 10) {
            return res.status(200).json({ 
                plant: "error", 
                disease: "المفتاح غير موجود في Render", 
                confidence: "0", 
                treatment: "يرجى إضافة GEMINI_API_KEY في Environment Variables" 
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // استخدام الموديل بدون تحديد نسخة API لترك المكتبة تختار الأحدث تلقائياً
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `تحليل نبات، الرد JSON فقط: {"plant":"..", "disease":"..", "confidence":"..", "treatment":".."}`;
        const imageData = image.includes("base64,") ? image.split("base64,")[1] : image;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        res.json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        console.error("LOG:", error.message);
        // إرسال تفاصيل الخطأ الحقيقية بدلاً من 500
        res.json({ 
            plant: "error", 
            disease: "تفاصيل الخطأ: " + error.message, 
            confidence: "0", 
            treatment: "راجع سجلات السيرفر" 
        });
    }
});

// روابط الشات
app.post("/chat", async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(req.body.message);
        res.json({ reply: result.response.text() });
    } catch (e) { res.json({ reply: "مشكلة في المفتاح" }); }
});

app.listen(process.env.PORT || 3000, () => console.log("Server Debug Mode Live"));
