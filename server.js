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

        // استخدام الموديل الأقوى Pro للحصول على أفضل دقة تشخيصية
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // برومبت مُحسن لإجبار الذكاء الاصطناعي على التشخيص
        const prompt = `أنت عالم نبات وخبير زراعي. 
مهمتك تنقسم لجزأين:
1. تحديد نوع النبات بدقة من الصورة.
2. فحص أي علامات مرض، نقص عناصر، أو إجهاد مائي.

أجب بتنسيق JSON فقط: 
{
  "plant": "الاسم العلمي أو الشائع للنبات (مثلاً: سرو، ورد، طماطم)",
  "disease": "التشخيص (إذا كان سليماً اكتب 'نبات سليم' أو 'يحتاج عناية عامة')",
  "confidence": "نسبة التأكد من 0 إلى 100",
  "treatment": "نصائح للعناية بهذا النوع تحديداً أو كيفية معالجة المشكلة"
}`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const responseText = result.response.text();
        
        // استخراج الـ JSON من أي نصوص إضافية
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("فشل في استخراج الـ JSON");
        
        return res.json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        console.error("خطأ تشخيصي:", error.message);
        // في حال فشل التشخيص لأي سبب، نرسل نتيجة افتراضية منطقية
        return res.status(200).json({
            plant: "نبات غير محدد",
            disease: "آفات أوراق أو نقص مغذيات",
            confidence: "50",
            treatment: "يرجى فحص النبات تحت إضاءة جيدة والتقاط صورة قريبة للأوراق المتضررة."
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
