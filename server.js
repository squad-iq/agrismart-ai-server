const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const API_KEY = process.env.GEMINI_API_KEY;

// اختبار السيرفر
app.get("/", (req, res) => {
    res.send("GreenMind API with Gemini REST is running 🚀");
});

// تحليل الصورة
app.post("/predict", upload.single("image"), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                error: "No image uploaded"
            });
        }

        // تحويل الصورة Base64
        const imageData = fs.readFileSync(req.file.path, {
            encoding: "base64"
        });

        // إرسال مباشر إلى Gemini REST API
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
                            parts: [
                                {
                                    text: `
أنت خبير زراعي.
حلل صورة النبات.
أجب بصيغة JSON فقط:
{
  "disease": "",
  "confidence": "",
  "treatment": ""
}
إذا النبات سليم اكتب healthy.
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

        res.json(data);

        // حذف الصورة المؤقتة
        fs.unlinkSync(req.file.path);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
