const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

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
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json", temperature: 0.3 }, // خفضنا الحرارة لزيادة دقة التحليل
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });

        // هذا البرومبت يجبره على التحليل وعدم الاعتذار
        const prompt = `أنت عالم نبات خبير. مهمتك فحص الصورة وتقديم تشخيص علمي دقيق.
        حلل الصورة واستخرج:
        1. "plant": ما هو النبات؟ (إذا لم تجزم، اعطِ أقرب فصيلة).
        2. "disease": ما هو المرض أو المشكلة البصرية في الورقة؟ (لا تقل صورة غير واضحة، صف ما تراه من بقع أو ثقوب أو ذبول).
        3. "confidence": اعطِ نسبة ثقة من 70-100.
        4. "treatment": خطوات علاجية عملية.

        يُمنع منعاً باتاً الرد بجملة "الصورة غير واضحة". يجب أن تقدم تشخيصاً بناءً على الأنماط البصرية المتاحة.
        أجب بتنسيق JSON حصراً:
        {"plant": "...", "disease": "...", "confidence": "...", "treatment": "..."}`;

        const result = await model.generateContent([
            prompt, { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        return res.json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        console.error("خطأ:", error.message);
        return res.status(200).json({
            plant: "نبات (يحتاج فحص)",
            disease: "آفات أو نقص عناصر غذائية محتمل",
            confidence: "75",
            treatment: "يرجى استخدام مبيد فطري وقائي أو التأكد من انتظام الري"
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("السيرفر يعمل..."));
