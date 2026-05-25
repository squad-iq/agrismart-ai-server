const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        const imageData = image.includes("base64,") ? image.split("base64,")[1] : image;

        const prompt = `أنت خبير نباتات. حلل الصورة وأجب بصيغة JSON فقط: {"plant": "اسم النبات", "disease": "سليم أو المرض", "confidence": "100", "treatment": "العلاج"}. إذا لم يكن نباتاً اجعل plant قيمتها error.`;

        // الاتصال المباشر بجوجل بدون مكتبات وسيطة
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
            contents: [{
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: "image/jpeg", data: imageData } }
                ]
            }]
        });

        const text = response.data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        res.json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        console.error("Direct API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            plant: "error", 
            disease: "خطأ في الاتصال المباشر: " + (error.response ? error.response.data.error.message : error.message), 
            confidence: "0", 
            treatment: "يرجى التأكد من المفتاح ومسح الـ Cache" 
        });
    }
});

// رابط المساعد الذكي (اتصال مباشر أيضاً)
app.post("/chat", async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: `أجب باختصار بالعربية: ${req.body.message}` }] }]
        });
        res.json({ reply: response.data.candidates[0].content.parts[0].text });
    } catch (e) { res.json({ reply: "تعذر الرد حالياً" }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on Direct API mode..."));
