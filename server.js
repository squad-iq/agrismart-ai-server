const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.get("/", (req, res) => {
    res.send("AgriSmart Gemini API is running 🚀🌿");
});

app.post("/predict", async (req, res) => {
    console.log("📥 Request received...");

    try {
        let imageData = req.body.image;
        if (!imageData) {
            return res.status(400).json({ plant: "غير معروف", disease: "غير معروف", confidence: "0", treatment: "لا توجد صورة" });
        }

        if (imageData.includes("base64,")) {
            imageData = imageData.split("base64,")[1];
        }
        imageData = imageData.replace(/\s/g, "");

        // استخدام الموديل الصحيح والمستقر
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash", 
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `أنت خبير زراعي. حلل الصورة وأعطني الرد بتنسيق JSON فقط بالمفاتيح التالية:
{
  "plant": "اسم النبات",
  "disease": "اسم المرض أو 'نبات صحي'",
  "confidence": "رقم من 0 إلى 100",
  "treatment": "طريقة العلاج"
}`;

        const imagePart = {
            inlineData: { data: imageData, mimeType: "image/jpeg" }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        // تنظيف الرد من أي رموز مارك داون غير مرغوبة
        const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const finalJson = JSON.parse(cleanedJson);

        return res.json(finalJson);

    } catch (error) {
        console.error("❌ ERROR:", error.message);
        return res.status(500).json({
            plant: "خطأ",
            disease: "خطأ في المعالجة",
            confidence: "0",
            treatment: "تأكد من مفتاح API وسلامة الصورة"
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
