const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// قراءة المفتاح من Environment Variables في Render
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// إعدادات الأمان لتعطيل الفلترة التلقائية التي قد تسبب خطأ 500
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ plant: "error", disease: "الصورة مفقودة" });

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            safetySettings: safetySettings // تطبيق إعدادات الأمان الجديدة
        });

        const prompt = `أنت خبير نباتات. حلل الصورة:
        1. إذا لم تكن لنبات، أجب بكلمة "error" في حقل plant.
        2. الرد JSON فقط: {"plant":"..", "disease":"..", "confidence":"..", "treatment":".."}`;

        const imageData = image.includes("base64,") ? image.split("base64,")[1] : image;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        const text = response.text();
        
        // استخراج الـ JSON بذكاء لضمان عدم الانهيار
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            res.json({ plant: "error", disease: "رد غير صالح من الذكاء الاصطناعي", confidence: "0", treatment: "حاول مجدداً" });
        }

    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ 
            plant: "error", 
            disease: "خطأ في الاتصال بـ Gemini", 
            confidence: "0", 
            treatment: "تأكد من صلاحية مفتاح API وحالة السيرفر." 
        });
    }
});

// روابط الشات والتعرف (إصلاح الانهيار فيها أيضاً)
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
        const result = await model.generateContent(message);
        res.json({ reply: result.response.text() });
    } catch (e) { res.status(500).json({ reply: "مشكلة في السيرفر" }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
