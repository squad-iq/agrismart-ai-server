const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// إعدادات السيرفر
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// تهيئة Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("❌ FATAL ERROR: GEMINI_API_KEY is not set in environment variables.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// صفحة الترحيب (Health Check)
app.get("/", (req, res) => {
    res.send("AgriSmart Gemini API is running 🚀🌿");
});

// نقطة الفحص (Predict Endpoint)
app.post("/predict", async (req, res) => {
    console.log("📥 Request received from AgriSmart App");

    try {
        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({
                plant: "غير معروف",
                disease: "غير معروف",
                confidence: "0",
                treatment: "لا توجد صورة مرسلة"
            });
        }

        // تنظيف نص الـ Base64
        if (imageData.includes("base64,")) {
            imageData = imageData.split("base64,")[1];
        }
        imageData = imageData.replace(/\s/g, "");

        console.log("🤖 Analyzing image with Gemini...");

        // استخدام موديل Gemini Flash المحدث
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash", 
            generationConfig: { responseMimeType: "application/json" }
        });

        // الـ Prompt المحسّن ليطلب اسم النبات
        const prompt = `أنت خبير زراعي متخصص. قم بتحليل صورة النبات المرفقة بدقة وأعطني النتيجة باللغة العربية داخل كائن JSON بنفس المفاتيح التالية تماماً:
{
  "plant": "اسم النبات (مثال: طماطم، بطاطس، ذرة، إلخ)",
  "disease": "اسم المرض النباتي أو 'نبات صحي' إذا لم تكن هناك أمراض",
  "confidence": "نسبة التأكد كرقَم فقط من 0 إلى 100",
  "treatment": "خطوات العلاج والمكافحة المختصرة والعملية"
}

إذا كانت الصورة غير واضحة أو لا تحتوي على نبات:
{
  "plant": "غير معروف",
  "disease": "غير معروف",
  "confidence": "0",
  "treatment": "حاول التقاط صورة أوضح للنبات المصاب"
}`;

        const imagePart = {
            inlineData: {
                data: imageData,
                mimeType: "image/jpeg"
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        console.log("📥 Gemini Raw Response:", responseText);

        // تحويل النص إلى JSON
        const finalJson = JSON.parse(responseText.trim());

        console.log("📤 Structured Response sent to Android!");
        return res.json(finalJson);

    } catch (error) {
        console.error("❌ ERROR:", error.message);
        return res.status(500).json({
            plant: "خطأ",
            disease: "خطأ في معالجة الذكاء الاصطناعي",
            confidence: "0",
            treatment: "يرجى المحاولة مرة أخرى لاحقاً"
        });
    }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running successfully on port " + PORT);
});
