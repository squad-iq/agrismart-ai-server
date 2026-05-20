const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "40mb" }));

const API_KEY = process.env.GEMINI_API_KEY;

// 🟢 Test route
app.get("/", (req, res) => {
    res.send("GreenMind API is running 🚀");
});

// 🚀 Predict route
app.post("/predict", async (req, res) => {

    try {

        let imageData = req.body.image;

        if (!imageData) {
            return res.status(400).json({
                error: "No image provided"
            });
        }

        // 🧹 تنظيف قوي للصورة
        imageData = imageData
            .replace(/^data:image\/(png|jpeg|jpg);base64,/, "")
            .replace(/\n/g, "")
            .replace(/\r/g, "")
            .replace(/\s/g, "");

        console.log("IMAGE SIZE:", imageData.length);

        // 🔥 Prompt قوي جدًا لإجبار التحليل
        const prompt = `
أنت خبير عالمي في أمراض النباتات والزراعة.

مهم جدًا:
- يجب عليك تحليل الصورة بدقة.
- لا يُسمح بالرد بكلمات مثل "غير دقيق" أو "غير معروف".
- إذا لم تكن متأكدًا، اختر أقرب مرض نباتي ممكن.

أعد فقط JSON بدون أي شرح:

{
  "disease": "اسم المرض",
  "confidence": "0-100",
  "treatment": "العلاج"
}
`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
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
                                    text: prompt
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

        // 🧹 تنظيف JSON
        text = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        try {
            const result = JSON.parse(text);
            return res.json(result);
        } catch (err) {

            return res.json({
                disease: "leaf spot",
                confidence: "50",
                treatment: "تحليل غير كامل - حاول صورة أوضح"
            });
        }

    } catch (error) {

        console.log("ERROR:", error.message);

        return res.status(500).json({
            error: error.message
        });
    }
});

// 🚀 start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
