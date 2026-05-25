const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ضع مفتاح Gemini الخاص بك هنا أو في إعدادات Render (Environment Variables)
const genAI = new GoogleGenerativeAI("AIzaSyD6vPkFG2Ksplhj_uRO7pEVaAAy8JQ_rLI");

// 1. رابط تشخيص الأمراض
app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        أنت خبير نباتات عالمي. قم بتحليل الصورة بدقة:
        1. إذا كانت الصورة لا تحتوي على نبات أو ورقة شجر، أجب بكلمة "error" في حقل plant.
        2. إذا كان نباتاً، حدد النوع بدقة والتشخيص (سليم أو مريض).
        3. أعطِ نسبة ثقة حقيقية (0-100).
        4. إذا كان مريضاً، أعطِ خطوات علاج عملية.
        يجب أن يكون الرد بصيغة JSON حصراً:
        {
          "plant": "اسم النبات أو error",
          "disease": "اسم المرض أو سليم",
          "confidence": "نسبة الدقة كرقيم فقط",
          "treatment": "خطوات العلاج"
        }
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: image.split(",")[1] || image, mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        res.json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        res.status(500).json({ plant: "نبات غير معروف", disease: "خطأ في السيرفر", confidence: "0", treatment: "حاول مرة أخرى" });
    }
});

// 2. رابط تحديد نوع النبات فقط
app.post("/identify", async (req, res) => {
    try {
        const { image } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "حدد اسم هذا النبات فقط من الصورة. الرد يكون JSON: {'plant': 'اسم النبات'}";
        
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: image.split(",")[1] || image, mimeType: "image/jpeg" } }
        ]);
        const text = (await result.response).text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        res.json(JSON.parse(jsonMatch[0]));
    } catch (e) { res.json({ plant: "نبات غير معروف" }); }
});

// 3. رابط المساعد الذكي (الدردشة) - مفقود سابقاً
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chatPrompt = `أنت مساعد زراعي ذكي في تطبيق GreenMind. أجب باختصار واحترافية باللغة العربية على هذا السؤال الزراعي: ${message}`;
        
        const result = await model.generateContent(chatPrompt);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (error) {
        res.status(500).json({ reply: "عذراً، أنا متعب قليلاً الآن. اسألني لاحقاً!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
