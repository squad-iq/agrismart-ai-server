const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 🌟 تهيئة مفتاح جيميناي (تأكد من إضافته في إعدادات Render باسم GEMINI_API_KEY)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 🟢 health check
app.get("/", (req, res) => {
    res.send("AgriSmart Gemini API is running 🚀🌿");
});

// 🚀 predict endpoint
app.post("/predict", async (req, res) => {
    console.log("📥 Request received from AgriSmart App");

    try {
        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({
                disease: "غير معروف",
                confidence: "0",
                treatment: "لا توجد صورة"
            });
        }

        // تنظيف نص الـ Base64 بشكل آمن
        if (imageData.includes("base64,")) {
            imageData = imageData.split("base64,")[1];
        }
        imageData = imageData.replace(/\s/g, "");

        console.log("🤖 Analyzing image with Gemini 2.5 Flash...");

        // استدعاء الموديل الحديث فلاش (يدعم الصور والـ JSON بشكل خارق)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" } // إجبار جيميناي على إخراج JSON حقيقي
        });

        const prompt = `أنت خبير زراعي متخصص جدًا في أمراض النباتات وحمايتها.
قم بتحليل صورة النبات المرفقة بدقة وأعطني النتيجة باللغة العربية داخل كائن JSON بنفس المفاتيح التالية تماماً:
{
  "disease": "اسم المرض النباتي باللغة العربية أو اكتب نبات صحي إذا كان سليماً",
  "confidence": "نسبة التأكد كرقَم فقط من 0 إلى 100 بدون علامة %",
  "treatment": "خطوات العلاج والمكافحة المختصرة والعملية باللغة العربية"
}

إذا كانت الصورة غير واضحة أو لا تحتوي على نبات:
{
  "disease": "غير معروف",
  "confidence": "0",
  "treatment": "حاول التقاط صورة أوضح للنبات المصاب"
}`;

        // تجهيز الصورة والمضمون لإرسالها لجيميناي
        const imagePart = {
            inlineData: {
                data: imageData,
                mimeType: "image/jpeg"
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        console.log("📥 Gemini Response:", responseText);

        // تحويل النص المستلم إلى JSON حقيقي لإرساله للأندرويد
        const finalJson = JSON.parse(responseText.trim());

        console.log("📤 Structured Response sent to Android successfully!");
        return res.json(finalJson);

    } catch (error) {
        console.error("❌ ERROR:", error.message);
        return res.status(500).json({
            disease: "خطأ في معالجة جيميناي",
            confidence: "0",
            treatment: "يرجى التحقق من إعدادات الـ API Key في سيرفر Render"
        });
    }
});

// 🚀 start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running successfully on port " + PORT);
});
