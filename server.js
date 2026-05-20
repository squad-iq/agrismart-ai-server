const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

const API_KEY = process.env.GEMINI_API_KEY;

// 🟢 اختبار
app.get("/", (req, res) => {
    res.send("GreenMind API is running 🚀");
});

// 🚀 تحليل الصورة
app.post("/predict", async (req, res) => {

    try {

        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({ error: "No image provided" });
        }

        // 🧹 تنظيف Base64 (مهم جدًا)
        imageData = imageData
            .replace(/^data:image\/\w+;base64,/, "")
            .replace(/\s/g, "");

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
أنت خبير زراعي محترف.

حلل صورة النبات بدقة.

أعد فقط JSON بدون أي شرح:

{
  "disease": "اسم المرض أو healthy",
  "confidence": "رقم من 0 إلى 100",
  "treatment": "العلاج المناسب"
}

إذا لم تستطع التحديد اكتب "غير معروف".
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

        let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        console.log("RAW RESPONSE:", text);

        // 🧹 تنظيف markdown
        text = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        try {
            const result = JSON.parse(text);
            return res.json(result);
        } catch (err) {

            return res.json({
                disease: "غير معروف",
                confidence: "0",
                treatment: text || "لا يوجد تحليل واضح"
            });
        }

    } catch (error) {

        console.log("ERROR:", error.message);

        res.status(500).json({
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
