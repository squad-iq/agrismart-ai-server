const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "30mb" }));

const API_KEY = process.env.GEMINI_API_KEY;

// 🟢 اختبار السيرفر
app.get("/", (req, res) => {
    res.send("GreenMind API is running 🚀");
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

        // 🧹 تنظيف قوي للصورة (حل مشكلة عدم قراءة الصورة)
        imageData = imageData
            .replace(/^data:image\/(png|jpeg|jpg);base64,/, "")
            .replace(/\n/g, "")
            .replace(/\r/g, "")
            .replace(/\s/g, "");

        console.log("IMAGE SIZE:", imageData.length);

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
                                    text: `
أنت خبير أمراض نباتات محترف.

حلل الصورة بدقة شديدة.

أعد فقط JSON بدون أي شرح:

{
  "disease": "اسم المرض",
  "confidence": "0-100",
  "treatment": "العلاج"
}

إذا لم تكن متأكدًا، حاول التخمين ولا ترد "غير معروف".
`
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        console.log("RAW GEMINI RESPONSE:", text);

        // 🧹 تنظيف الرد
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            return res.json(JSON.parse(text));
        } catch (err) {

            return res.json({
                disease: "تحليل غير دقيق",
                confidence: "0",
                treatment: "حاول صورة أوضح"
            });
        }

    } catch (error) {

        console.log("ERROR:", error.message);

        res.status(500).json({
            error: error.message
        });
    }
});

// 🚀 تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
