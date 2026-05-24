const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.post("/predict", async (req, res) => {
    try {
        let imageData = req.body.image;
        if (!imageData) return res.status(400).json({ error: "لا توجد صورة" });

        if (imageData.includes("base64,")) imageData = imageData.split("base64,")[1];

        // تغيير الموديل إلى Pro لقوة أكبر في الفهم
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `حلل الصورة كخبير زراعي. أجب فقط بتنسيق JSON: 
        {"plant": "اسم النبات", "disease": "اسم المرض", "confidence": "نسبة مئوية", "treatment": "العلاج"}`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const responseText = result.response.text();
        // تنظيف متقدم جداً للرد
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("لم يتم الحصول على JSON من الموديل");
        
        return res.json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        // بدلاً من انهيار السيرفر، سنقوم بطباعة الخطأ محلياً وإرسال رد منطقي
        console.error("خطأ معالجة:", error.message);
        return res.status(200).json({
            plant: "غير معروف",
            disease: "تعذر التحليل، جرب زاوية تصوير أخرى",
            confidence: "0",
            treatment: "تأكد من إضاءة الصورة ووضوحها"
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server active on " + PORT));
