const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
// زيادة حجم الاستقبال ليتسع للصور بوضوح عالٍ دون مشاكل
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

        // 🌟 تنظيف ذكي ومضمون لنص الـ Base64 لتفادي أي تشويه أو فراغات زائدة
        if (imageData.includes("base64,")) {
            imageData = imageData.split("base64,")[1];
        }
        imageData = imageData.replace(/\s/g, "");

        console.log("🤖 Sending image to OpenRouter (Llama 3.2 Vision)...");

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "meta-llama/llama-3.2-11b-vision-instruct",
                messages: [
                    {
                        role: "system",
                        content: `أنت خبير زراعي متخصص جدًا في أمراض النباتات.
⚠️ قواعد صارمة:
- لا تكتب شرح نهائياً
- لا تكتب مقدمات أو نص إضافي خارج قوسين الـ JSON
- أعد فقط نص JSON صحيح وقابل للقراءة بنسبة 100%

الصيغة المطلوبة حرفياً:
{
  "disease": "اسم المرض باللغة العربية أو نبات صحي",
  "confidence": "رقم نسبة الثقة من 0 إلى 100 فقط بدون علامة %",
  "treatment": "علاج مختصر وواضح باللغة العربية"
}

إذا كانت الصورة غير واضحة أو لا تحتوي على نبات:
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
                temperature: 0.2
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
        console.log("📥 Raw Response from AI:", text);

        // 🧹 تنظيف الرد من أي علامات Markdown قد يضيفها الموديل بالخطأ
        text = text.replace(/```json/g, "")
                   .replace(/```/g, "")
                   .trim();

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.log("⚠️ JSON parse failed, trying to extract JSON block:", text);
            // محاولة إنقاذ أخيرة إذا وضع الموديل نصوصاً خارج القوسين
            const startIdx = text.indexOf("{");
            const endIdx = text.lastIndexOf("}");
            if (startIdx !== -1 && endIdx !== -1) {
                try {
                    result = JSON.parse(text.substring(startIdx, endIdx + 1));
                } catch (err) {
                    result = {
                        disease: "تحليل يحتاج لإعادة",
                        confidence: "0",
                        treatment: "يرجى إعادة التقاط الصورة"
                    };
                }
            } else {
                result = {
                    disease: "تحليل غير دقيق",
                    confidence: "0",
                    treatment: "حاول صورة أوضح"
                };
            }
        }

        console.log("📤 Structured Response sent to Android successfully");
        return res.json(result);

    } catch (error) {
        console.log("❌ SERVER ERROR:", error.response?.data || error.message);
        return res.status(500).json({
            disease: "خطأ في الاتصال بالـ AI",
            confidence: "0",
            treatment: "يرجى التحقق من رصيد مفتاح OpenRouter الخاص بك"
        });
    }
});

// 🚀 start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
