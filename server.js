const express = require("express");
const cors = require("cors");

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

        // تنظيف بسيط فقط (بدون مبالغة)
        imageData = imageData.replace(/^data:image\/\w+;base64,/, "");

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    inline_data: {
                                        mime_type: "image/jpeg",
                                        data: imageData
                                    }
                                },
                                {
                                    text: "حلل هذه الصورة لنبات وقل اسم المرض والعلاج باختصار"
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return res.json({
            disease: text,
            confidence: "0",
            treatment: " "
        });

    } catch (error) {

        return res.status(500).json({
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
