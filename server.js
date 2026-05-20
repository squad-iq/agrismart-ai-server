const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

// رفع الصور
const upload = multer({ dest: "uploads/" });

// مفتاح Gemini من Render Environment Variables
const API_KEY = process.env.GEMINI_API_KEY;

// الصفحة الرئيسية
app.get("/", (req, res) => {
    res.send("GreenMind API with Gemini 2.0 is running 🚀");
});

// تحليل الصورة
app.post("/predict", upload.single("image"), async (req, res) => {

    try {

        // التحقق من وجود صورة
        if (!req.file) {
            return res.status(400).json({
                error: "No image uploaded"
            });
        }

        // قراءة الصورة وتحويلها Base64
        const imageData = fs.readFileSync(req.file.path, {
            encoding: "base64"
        });

        // إرسال الطلب إلى Gemini
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
                                    text:
`أنت خبير زراعي محترف.

حلل صورة النبات.

أعد النتيجة بصيغة JSON فقط بهذا الشكل:

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

        // تحويل الرد JSON
        const data = await response.json();

        // حذف الصورة المؤقتة
        fs.unlinkSync(req.file.path);

        // إرسال الرد للتطبيق
        res.json(data);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
