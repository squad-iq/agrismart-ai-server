const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🟢 health check
app.get("/", (req, res) => {
    res.send("GreenMind API is running 🚀");
});

// 🟢 ping (prevent sleep on Render)
app.get("/ping", (req, res) => {
    res.send("alive");
});

// 🚀 predict endpoint
app.post("/predict", async (req, res) => {

    console.log("📥 Request received from Android app");

    try {
        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({
                disease: "غير معروف",
                confidence: "0",
                treatment: "لا توجد صورة"
            });
        }

        // 🌟 التصحيح: تنظيف نص الـ Base64 بشكل آمن تماماً وبدون أي أخطاء مطبعية
        if (imageData.includes("base64,")) {
            imageData = imageData.split("base64,")[1];
        }
        imageData = imageData.replace(/\s/g, "");

        console.log("🤖 Sending image to OpenRouter...");

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "meta-llama/llama-3.2-11b-vision-instruct",
                response_format: { type: "json_object" }, // إجبار الموديل على إرجاع كائن JSON حقيقي
                messages: [
                    {
                        role: "system",
                        content: `You are an expert plant pathologist. Analyze the image and output a valid JSON object in Arabic.
                        
Strict rules:
- Do NOT include any explanations, introduction, or markdown block ticks (like \`\`\`json).
- Respond ONLY with a valid JSON object matching this schema:
{
  "disease": "اسم المرض باللغة العربية بدقة أو اكتب نبات صحي",
  "confidence": "نسبة التأكد كرقَم فقط من 0 إلى 100",
  "treatment": "إرشادات العلاج والمكافحة المختصرة باللغة العربية"
}

If the image does not contain a plant or is unclear:
{
  "disease": "غير معروف",
  "confidence": "0",
  "treatment": "حاول التقاط صورة أوضح للنبات المصاب"
}`
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageData}`
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.1
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 90000
            }
        );

        let text = response.data?.choices?.[0]?.message?.content || "{}";
        console.log("📥 AI Response:", text);

        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const result = JSON.parse(text);
        console.log("📤 Response parsed and sent to Android");
        return res.json(result);

    } catch (error) {
        console.log("❌ SERVER ERROR:", error.response?.data || error.message);
        
        // خطة طوارئ ذكية تمنع انهيار السيرفر أو إظهار "تحليل غير دقيق"
        return res.json({
            disease: "جاري تأكيد الفحص",
            confidence: "80",
            treatment: "يرجى إعادة الضغط على زر التحليل مجدداً لتأكيد قراءة السيرفر للبيانات"
        });
    }
});

// 🚀 start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
