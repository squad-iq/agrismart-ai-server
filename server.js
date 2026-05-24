const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// إعدادات السيرفر
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// تهيئة Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.get("/", (req, res) => {
    res.send("AgriSmart Gemini API is running 🚀🌿");
});

app.post("/predict", async (req, res) => {
    console.log("📥 طلب جديد قادم من التطبيق...");

    try {
        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({ error: "لا توجد صورة مرسلة" });
        }

        // تنظيف البيانات
        if (imageData.includes("base64,")) {
            imageData = imageData.split("base64,")[1];
        }
        imageData = imageData.replace(/\s/g, "");

        // إعداد الموديل
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        // البرومبت (Prompt) الموحد
        const prompt = `أنت خبير زراعي. حلل صورة النبات المرفقة بدقة وأعطني الرد بتنسيق JSON فقط (بدون أي نصوص إضافية) بالمفاتيح التالية:
        {
          "plant": "اسم النبات",
          "disease": "اسم المرض أو 'نبات صحي'",
          "confidence": "رقم من 0 إلى 100",
          "treatment": "شرح طريقة العلاج والوقاية المختصرة"
        }`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const responseText = result.response.text();
        console.log("📥 رد جيميناي الخام:", responseText);

        // تنظيف الرد والتأكد من أنه JSON صالح
        const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const finalJson = JSON.parse(cleanedJson);

        return res.json(finalJson);

    } catch (error) {
        console.error("❌ خطأ فادح في السيرفر:", error.message);
        // نرسل استجابة توضيحية بدلاً من ترك التطبيق ينهار
        return res.status(500).json({
            plant: "خطأ",
            disease: "تعذر تحليل الصورة حالياً",
            confidence: "0",
            treatment: "يرجى التأكد من أن الصورة واضحة أو المحاولة لاحقاً"
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("🚀 السيرفر يعمل الآن على المنفذ " + PORT);
});
