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

        const prompt = `
        أنت أعظم خبير زراعي في العالم. حلل هذه الصورة بدقة:
        1. حدد نوع النبات بدقة (مثلاً: شجرة ليمون، نبتة طماطم).
        2. افحص الأوراق والسيقان؛ هل هناك مرض؟ (فطريات، حشرات، نقص مغذيات، أو سليمة).
        3. أعطِ خطوات علاج عملية واضحة (نوع السماد، طريقة الري، أو المبيد المناسب).
        4. نسبة الثقة يجب أن تكون رقماً حقيقياً.
        5. إذا كانت الصورة لا علاقة لها بالنباتات، اجعل قيمة plant هي "error" وقيمة disease هي "ليست صورة نبات".

        يجب أن يكون الرد JSON حصراً بهذه المفاتيح (تأكد من ملء جميع الحقول):
        {
          "plant": "اسم النبات",
          "disease": "التشخيص الدقيق",
          "confidence": "95",
          "treatment": "وصف العلاج بالتفصيل"
        }
        `;

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

        const result = JSON.parse(response.data.choices[0].message.content);
        
        // ضمان عدم وجود أي قيمة null
        const finalResult = {
            plant: result.plant || "نبات غير معروف",
            disease: result.disease || "غير محدد",
            confidence: result.confidence || "0",
            treatment: result.treatment || "لا توجد إرشادات حالياً"
        };

        res.json(finalResult);

    } catch (error) {
        const errorMsg = error.response ? error.response.data.error.message : error.message;
        res.json({ plant: "error", disease: errorMsg, confidence: "0", treatment: "حاول مجدداً" });
    }
});

// تفعيل الشات بنفس القوة
app.post("/chat", async (req, res) => {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: `أنت خبير زراعي، أجب باختصار وبالعربية: ${req.body.message}` }]
        }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (e) { res.json({ reply: "مشكلة في الاتصال" }); }
});

app.listen(process.env.PORT || 3000, () => console.log("Expert AI Server Live"));
