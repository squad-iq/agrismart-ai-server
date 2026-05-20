const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const API_KEY = process.env.GEMINI_API_KEY;

// 🟢 test
app.get("/", (req, res) => {
    res.send("GreenMind API is running 🚀");
});

// 🚀 predict
app.post("/predict", async (req, res) => {

    try {

        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({
                error: "No image provided"
            });
        }

        // 🧹 تنظيف قوي جدًا للصورة
        imageData = imageData
            .replace(/^data:image\/(png|jpeg|jpg);base64,/, "")
            .replace(/\n/g, "")
            .replace(/\r/g, "")
            .replace(/\s/g, "");

        console.log("IMAGE SIZE:", imageData.length);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

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
                            text: `
أنت خبير أمراض نباتات.

حلل الصورة بدقة عالية.

إذا لم تكن متأكدًا، اختر أقرب مرض نباتي ممكن.

لا تُرجع "غير معروف" أو "0".

أعد فقط JSON:

{
  "disease": "",
  "confidence": "",
  "treatment": ""
}
`
                        }
                    ]
                }
            ]
        };

        const response = await axios.post(url, body, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        console.log("RAW:", text);

        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            return res.json(JSON.parse(text));
        } catch (e) {
            return res.json({
                disease: "leaf spot",
                confidence: "60",
                treatment: "تحليل غير مكتمل - حاول صورة أوضح"
            });
        }

    } catch (error) {

        console.log("ERROR:", error.response?.data || error.message);

        return res.status(500).json({
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
