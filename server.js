const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/predict", async (req, res) => {
    try {
        let imageData = req.body.image;
        if (!imageData) return res.status(400).json({ error: "لا توجد صورة" });
        if (imageData.includes("base64,")) imageData = imageData.split("base64,")[1];

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro",
            generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
        });

        const prompt = `أنت خبير زراعي. حلل الصورة المرفقة.
1. حدد نوع النبات.
2. حدد المرض أو الآفة (إذا كانت الصورة عامة، خمن بناءً على الخضرة والمظهر العام).
3. اعطِ نسبة ثقة واقعية (لا تستخدم 0%).
4. اعطِ نصيحة علاجية مفصلة.

أجب فقط بتنسيق JSON:
{"plant": "اسم النبات", "disease": "التشخيص", "confidence": "نسبة", "treatment": "العلاج"}`;

        const result = await model.generateContent([
            prompt, { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        return res.json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        console.error("خطأ سيرفر:", error.message);
        return res.status(200).json({
            plant: "غير معروف",
            disease: "تعذر التحليل، يرجى التقاط صورة أقرب للورقة",
            confidence: "0",
            treatment: "حاول مرة أخرى في ضوء أفضل"
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
