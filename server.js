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
            return res.json({ plant: "error", disease: "المفتاح (GEMINI_API_KEY) غير مضاف في إعدادات Render" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // تغيير الموديل إلى Pro كما طلبت لتحسين النتائج
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `أنت خبير نباتات محترف. حلل الصورة المرفقة وأجب بصيغة JSON فقط بهذه الحقول:
        {
          "plant": "اسم النبات باللغة العربية",
          "disease": "التشخيص (سليم أو اسم المرض)",
          "confidence": "نسبة الدقة كرقيم فقط بين 0-100",
          "treatment": "خطوات العلاج بالتفصيل"
        }
        إذا لم تكن الصورة لنبات أو ورقة شجر، اجعل قيمة plant هي "error".`;

        const imageData = image.includes("base64,") ? image.split("base64,")[1] : image;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const response = await result.response;
        const text = response.text();
        
        // تنظيف الرد لاستخراج JSON فقط
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            throw new Error("لم يتمكن الذكاء الاصطناعي من تنسيق الرد بشكل صحيح");
        }

    } catch (error) {
        console.error("Detailed Error:", error.message);
        
        // رسائل خطأ ذكية للمستخدم
        let userMessage = "حدث خطأ غير متوقع";
        if (error.message.includes("API key not valid")) {
            userMessage = "مفتاح API غير صالح. تأكد من نسخه من Google AI Studio ولصقه في Render بدون مسافات.";
        } else if (error.message.includes("location is not supported")) {
            userMessage = "منطقة السيرفر الجغرافية غير مدعومة من جوجل Gemini حالياً.";
        }

        res.json({ 
            plant: "error", 
            disease: userMessage, 
            confidence: "0", 
            treatment: "الرجاء التأكد من إعدادات السيرفر والمفتاح." 
        });
    }
});

// تفعيل الشات أيضاً بالموديل الجديد
app.post("/chat", async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(req.body.message);
        res.json({ reply: result.response.text() });
    } catch (e) { res.json({ reply: "عذراً، واجهت مشكلة في الرد." }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running with Gemini Pro on port ${PORT}`));
