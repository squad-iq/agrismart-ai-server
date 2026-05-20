const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json({ limit: "30mb" }));

const API_KEY = process.env.GEMINI_API_KEY;

app.get("/", (req, res) => {
    res.send("GreenMind API is running 🚀");
});

app.post("/predict", async (req, res) => {

    try {

        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({ error: "No image provided" });
        }

        // تنظيف الصورة
        imageData = imageData.replace(/^data:image\/\w+;base64,/, "");

        const body = {
            contents: [
                {
                    parts: [
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: imageData
                            }
                        },
                        {
                            text: "حلل هذه الصورة لنبات واذكر المرض والعلاج باختصار"
                        }
                    ]
                }
            ]
        };

        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await axios.post(url, body, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "لا توجد نتيجة";

        return res.json({
            result: result
        });

    } catch (error) {

        console.log(error.response?.data || error.message);

        return res.status(500).json({
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
