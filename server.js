const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

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

    console.log("📥 Request received");

    try {

        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({
                disease: "غير معروف",
                confidence: "0",
                treatment: "لا توجد صورة"
            });
        }

        // تنظيف الصورة
        imageData = imageData
            .replace(/^data:image\/(png|jpeg|jpg);base64,/, "")
            .replace(/\s/g, "");

        console.log("🤖 Sending to AI...");

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "meta-llama/llama-3.2-11b-vision-instruct",

                messages: [
                    {
                        role: "system",
                        content: `
أنت خبير زراعي متخصص جدًا في أمراض النباتات.

⚠️ قواعد صارمة:
- لا تكتب شرح
- لا تكتب نص إضافي
- أعد فقط JSON صحيح

الصيغة:
{
  "disease": "اسم المرض أو صحي",
  "confidence": "رقم من 0 إلى 100",
  "treatment": "علاج مختصر وواضح"
}

إذا الصورة غير واضحة:
{
  "disease": "غير معروف",
  "confidence": "0",
  "treatment": "حاول صورة أوضح"
}
`
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: "data:image/jpeg;base64," + imageData
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

        // 🧹 تنظيف أي markdown
        text = text.replace(/```json/g, "")
                   .replace(/```/g, "")
                   .trim();

        let result;

        try {
            result = JSON.parse(text);
        } catch (e) {
            console.log("⚠️ JSON parse failed:", text);

            result = {
                disease: "تحليل غير دقيق",
                confidence: "0",
                treatment: "حاول صورة أوضح"
            };
        }

        console.log("📤 Response sent");

        return res.json(result);

    } catch (error) {

        console.log("❌ ERROR:", error.response?.data || error.message);

        return res.status(500).json({
            disease: "خطأ في السيرفر",
            confidence: "0",
            treatment: "حاول مرة أخرى"
        });
    }
});

// 🚀 start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
