const express = require("express");
const multer = require("multer");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// تخزين مؤقت للصور
const upload = multer({ dest: "uploads/" });

// 🔥 اختبار السيرفر
app.get("/", (req, res) => {
    res.send("GreenMind API is running 🚀");
});

// 🔥 مهم: endpoint التحليل
app.post("/predict", upload.single("image"), (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            error: "No image uploaded"
        });
    }

    // هنا لاحقًا نربط Gemini أو AI
    return res.json({
        result: "تم استلام الصورة بنجاح ✅",
        filename: req.file.filename
    });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
