const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🟢 health check
app.get("/", (req, res) => {
    res.send("API running 🚀");
});

// 🚀 predict endpoint
app.post("/predict", async (req, res) => {

    try {

        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({
                disease: "غير معروف",
                confidence: "0",
                treatment: "لا توجد صورة"
            });
        }

        imageData = imageData
            .replace(/^data:image\/(png|jpeg|jpg);base64,/, "")
            .replace(/\s/g, "");

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "meta-llama/llama-3.2-11b-vision-instruct",

                messages: [
                    {
                        role: "system",
                        content: `
أنت خبير أمراض نباتات.

⚠️ قواعد صارمة:
- لا تكتب أي شرح
- لا تستخدم أي لغة غير JSON
- أعد فقط JSON صحيح

الصيغة:
{
  "disease": "اسم المرض",
  "confidence": "رقم فقط",
  "treatment": "علاج مختصر"
}

إذا غير واضح:
{
  "disease": "غير معروف",
  "confidence": "0",
  "treatment": "لا يوجد تحليل واضح"
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

        let parsed;

        try {
            parsed = JSON.parse(text);
        } catch (e) {
            parsed = {
                disease: "تحليل غير دقيق",
                confidence: "0",
                treatment: "حاول صورة أوضح"
            };
        }

        return res.json(parsed);

    } catch (error) {

        console.log(error.response?.data || error.message);

        return res.status(500).json({
            disease: "خطأ في السيرفر",
            confidence: "0",
            treatment: "حاول مرة أخرى"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
