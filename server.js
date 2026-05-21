const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const API_KEY = process.env.GEMINI_API_KEY;

// اختبار
app.get("/", (req, res) => {
    res.send("GreenMind API is running 🚀");
});

// تحليل الصورة
app.post("/predict", async (req, res) => {

    try {

        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({
                error: "No image"
            });
        }

        // تنظيف base64
        imageData = imageData
            .replace(/^data:image\/(png|jpeg|jpg);base64,/, "")
            .replace(/\s/g, "");

        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: imageData
                            }
                        },
                        {
                            text: "حلل مرض النبات في الصورة واذكر المرض والعلاج باختصار"
                        }
                    ]
                }
            ]
        };

        const response = await axios.post(url, requestBody, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        const text =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text
            || "لا توجد نتيجة";

        console.log("GEMINI:", text);

        return res.json({
            disease: text,
            confidence: "90",
            treatment: "تم التحليل"
        });

    } catch (error) {

        console.log(
            error.response?.data || error.message
        );

        return res.status(500).json({
            error: error.response?.data || error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
