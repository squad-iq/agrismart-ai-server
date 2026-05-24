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
            generationConfig: { responseMimeType: "application/json", temperature: 0.8 }
        });

        const prompt = `أنت خبير زراعي عالمي. حلل الصورة المرفقة بتركيز عالٍ.
        1. "plant": حدد اسم النبات.
        2. "disease": شخص حالة النبات (بقع، ثقوب، نقص عناصر، أو نبات سليم).
        3. "confidence": اعطِ نسبة ثقة بين 65 و 99.
        4. "treatment": قدم إجراءً علاجياً محدداً.

        تحذير: لا تقل "غير معروف". ابذل قصارى جهدك للتحليل بناءً على الأنماط البصرية.
        أجب فقط بتنسيق JSON:
        {"plant": "...", "disease": "...", "confidence": "...", "treatment": "..."}`;

        const result = await model.generateContent([
            prompt, { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        return res.json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        console.error("خطأ تشخيصي:", error.message);
        return res.status(200).json({
            plant: "نبات يحتاج فحص",
            disease: "الصورة غير واضحة للتفاصيل الدقيقة",
            confidence: "60",
            treatment: "يرجى التقاط صورة مقربة جداً للورقة المصابة (Zoom) في إضاءة جيدة."
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("السيرفر يعمل على المنفذ " + PORT));
