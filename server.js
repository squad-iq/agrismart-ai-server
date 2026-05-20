const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

const API_KEY = process.env.GEMINI_API_KEY;

// 🟢 اختبار السيرفر
app.get("/", (req, res) => {
    res.send("GreenMind API is running 🚀");
});

// 🚀 تحليل الصورة
app.post("/predict", async (req, res) => {

    try {

        const imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({
                error: "No image provided"
            });
        }

        // 🤖 إرسال إلى Gemini
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `
أنت خبير زراعي.

حلل صورة النبات وأعد فقط JSON بدون أي شرح:

{
  "disease": "اسم المرض",
  "confidence": "رقم من 0 إلى 100",
  "treatment": "العلاج"
}
`
                                },
                                {
                                    inline_data: {
                                        mime_type: "image/jpeg",
                                        data: imageData
                                    }
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        // 🔥 استخراج النص من Gemini
        let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        console.log("RAW GEMINI RESPONSE:", text);

        // 🧹 تنظيف الرد
        text = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let result;

        try {
            result = JSON.parse(text);
        } catch (e) {
            console.log("JSON PARSE ERROR:", e.message);

            return res.json({
                disease: "غير معروف",
                confidence: "0",
                treatment: text || "لا يوجد تحليل واضح"
            });
        }

        // 📤 إرسال النتيجة النهائية
        res.json(result);

    } catch (error) {

        console.log("SERVER ERROR:", error.message);

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
