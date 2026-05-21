const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// 🔑 ضع مفتاح OpenRouter هنا أو في Render ENV
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🟢 test
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});
});

// 🚀 تحليل الصورة
app.post("/predict", async (req, res) => {

    try {

        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({
                error: "No image provided"
            });
        }

        // تنظيف الصورة
        imageData = imageData
            .replace(/^data:image\/(png|jpeg|jpg);base64,/, "")
            .replace(/\s/g, "");

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "meta-llama/llama-3.2-11b-vision-instruct",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `
أنت خبير أمراض نباتات.

حلل هذه الصورة وحدد:
- اسم المرض
- نسبة الثقة
- العلاج

إذا لم تكن متأكدًا اختر أقرب مرض نباتي.
`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: "data:image/jpeg;base64," + imageData
                                }
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const result =
            response.data?.choices?.[0]?.message?.content
            || "لا توجد نتيجة";

        console.log("OPENROUTER:", result);

        // نحاول استخراج بيانات بسيطة
        return res.json({
            result: result,
            disease: result,
            confidence: "غير محدد",
            treatment: "راجع النص"
        });

    } catch (error) {

        console.log(error.response?.data || error.message);

        return res.status(500).json({
            error: error.response?.data || error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
