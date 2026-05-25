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

        // جربنا 1.5 وفشل، الآن سنستخدم gemini-pro-vision وهو الموديل الأكثر استقراراً للصور
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
            contents: [{
                parts: [
                    { text: "تحليل نبات، الرد JSON فقط: {'plant':'..', 'disease':'..', 'confidence':'..', 'treatment':'..'}" },
                    { inline_data: { mime_type: "image/jpeg", data: imageData } }
                ]
            }]
        });

        const text = response.data.candidates[0].content.parts[0].text;
        res.json(JSON.parse(text.match(/\{[\s\S]*\}/)[0]));

    } catch (error) {
        // إذا فشل الموديل القديم، سنحاول مع الموديل الجديد بصيغة مختلفة
        try {
             const urlFlash = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
             const resFlash = await axios.post(urlFlash, {
                 contents: [{ parts: [{ text: "تحليل نبات JSON" }, { inline_data: { mime_type: "image/jpeg", data: image.split("base64,")[1] || image } }] }]
             });
             res.json(JSON.parse(resFlash.data.candidates[0].content.parts[0].text.match(/\{[\s\S]*\}/)[0]));
        } catch (e) {
            res.json({ plant: "error", disease: "جوجل يرفض الطلب (404/400). تأكد أن المفتاح من AI Studio وليس Cloud." });
        }
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Stable Mode Live"));
