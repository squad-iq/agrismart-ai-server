const express = require("express");
const cors = require("cors");
const axios = require("axios"); // سنستخدم axios للاتصال المباشر لضمان الاستقرار

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        const apiKey = (process.env.OPENAI_API_KEY || "").trim();

        if (!apiKey) return res.json({ plant: "error", disease: "المفتاح OPENAI_API_KEY غير موجود في Render" });

        const prompt = "أنت خبير نباتات. حلل الصورة وأعطِ النتيجة بصيغة JSON حصراً باللغة العربية: {\"plant\": \"اسم النبات\", \"disease\": \"التشخيص\", \"confidence\": \"100\", \"treatment\": \"العلاج\"}. إذا لم يكن نباتاً اجعل plant هي error.";

        // تجهيز الصورة (التأكد من وجود الترويسة الصحيحة)
        const base64Image = image.includes("base64,") ? image : `data:image/jpeg;base64,${image}`;

        // الاتصال المباشر بـ OpenAI (أكثر استقراراً من المكتبة في النسخ المجانية)
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        const result = JSON.parse(response.data.choices[0].message.content);
        res.json(result);

    } catch (error) {
        // استخراج رسالة الخطأ الحقيقية من OpenAI
        let detailedError = error.message;
        if (error.response && error.response.data && error.response.data.error) {
            detailedError = error.response.data.error.message;
        }
        
        console.error("OpenAI Final Error:", detailedError);
        
        res.json({ 
            plant: "error", 
            disease: "رد OpenAI الحقيقي: " + detailedError, 
            confidence: "0", 
            treatment: "إذا كان الخطأ insufficient_quota، انتظر 30 دقيقة لتفعيل الرصيد." 
        });
    }
});

app.listen(process.env.PORT || 3000, () => console.log("OpenAI Direct Server Live"));
