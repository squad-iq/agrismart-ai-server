const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// التأكد من وجود المفتاح
if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not defined.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// وظيفة مساعدة لتنظيف ومعالجة الصورة
function prepareImage(imageField) {
    if (!imageField) return null;
    return imageField.includes("base64,") ? imageField.split("base64,")[1] : imageField;
}

// 1. رابط تشخيص الأمراض
app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        const imageData = prepareImage(image);
        if (!imageData) return res.status(400).json({ error: "Image data is missing" });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
        أنت خبير نباتات. حلل الصورة:
        1. إذا لم تكن لنبات، أجب بكلمة "error" في حقل plant.
        2. إذا كان نباتاً، حدد النوع والتشخيص.
        3. الدقة (0-100).
        4. العلاج إن وجد.
        الرد JSON فقط: {"plant":"..", "disease":"..", "confidence":"..", "treatment":".."}
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            throw new Error("Invalid AI Response");
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ plant: "error", disease: "فشل التحليل", confidence: "0", treatment: "حاول مجدداً" });
    }
});

// 2. رابط تحديد النوع
app.post("/identify", async (req, res) => {
    try {
        const { image } = req.body;
        const imageData = prepareImage(image);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([
            'حدد اسم النبات في الصورة. الرد JSON: {"plant": "اسم النبات"}',
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);
        const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
        res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { plant: "نبات غير معروف" });
    } catch (e) { res.json({ plant: "نبات غير معروف" }); }
});

// 3. رابط المساعد الذكي
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`أجب باختصار باللغة العربية: ${message}`);
        res.json({ reply: result.response.text() });
    } catch (error) {
        res.status(500).json({ reply: "المعذرة، واجهت مشكلة تقنية." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
