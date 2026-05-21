const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🟢 health check (مهم لتجنب sleep)
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});

// 🟢 keep alive ping
app.get("/ping", (req, res) => {
    res.send("alive");
});

// 🚀 predict
app.post("/predict", async (req, res) => {

    console.log("📥 request received");

    try {

        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({ error: "No image provided" });
        }

        imageData = imageData
            .replace(/^data:image\/(png|jpeg|jpg);base64,/, "")
            .replace(/\s/g, "");

        console.log("🤖 calling OpenRouter...");

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
حلل مرض النبات في الصورة وأعطني:
- اسم المرض
- نسبة الثقة
- العلاج
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
                },
                timeout: 90000
            }
        );

        const result =
            response.data?.choices?.[0]?.message?.content
            || "لا توجد نتيجة";

        console.log("📤 response sent");

        return res.json({
            result,
            disease: result,
            confidence: "غير محدد",
            treatment: "راجع النص"
        });

    } catch (error) {

        console.log("ERROR:", error.response?.data || error.message);

        return res.status(500).json({
            error: error.response?.data || error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
