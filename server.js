const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        const apiKey = (process.env.OPENAI_API_KEY || "").trim();

        // تعليمات مرنة جداً لضمان تحليل أي ورقة أو نبتة
        const prompt = "أنت خبير زراعي. حلل الصورة بدقة. الرد يجب أن يكون JSON حصراً باللغة العربية: {\"plant\": \"اسم النبات\", \"disease\": \"التشخيص (سليم أو مريض)\", \"confidence\": \"95\", \"treatment\": \"خطوات العلاج\"}. ملاحظة: حتى لو كانت الصورة غير واضحة قليلاً، حاول إعطاء أفضل تخمين ممكن ولا ترفض التحليل.";

        const base64Image = image.includes("base64,") ? image : `data:image/jpeg;base64,${image}`;

        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
        });

        // استلام الرد وضمان عدم وجود قيم فارغة
        const aiResult = JSON.parse(response.data.choices[0].message.content);
        res.json({
            plant: aiResult.plant || "نبات غير معروف",
            disease: aiResult.disease || "غير محدد",
            confidence: aiResult.confidence || "0",
            treatment: aiResult.treatment || "لا تتوفر إرشادات حالياً"
        });

    } catch (error) {
        res.json({ plant: "error", disease: "خطأ: " + error.message, confidence: "0", treatment: "" });
    }
});

app.post("/chat", async (req, res) => {
    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: req.body.message }]
        }, {
            headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (e) { res.json({ reply: "مشكلة تقنية" }); }
});

app.listen(process.env.PORT || 3000, () => console.log("Server Live"));
