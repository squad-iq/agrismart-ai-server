const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// رابط السيرفر الأساسي للتأكد من العمل
app.get("/", (req, res) => res.send("GreenMind AI Server is Running!"));

// 1. رابط تشخيص الأمراض والتعرف على النباتات
app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        const apiKey = (process.env.OPENAI_API_KEY || "").trim();

        if (!apiKey) {
            return res.json({ plant: "error", disease: "المفتاح OPENAI_API_KEY غير مضاف في Render", confidence: "0", treatment: "" });
        }

        // تعليمات ذكية جداً تجبر الموديل على تحليل أدق التفاصيل
        const prompt = `
        أنت خبير زراعي عالمي ومستشار في أمراض النباتات. حلل الصورة المرفقة بعناية فائقة:
        1. حدد اسم النبات الشائع باللغة العربية.
        2. افحص الورقة أو الشجرة بحثاً عن أي علامات للمرض (بقع، تغير لون، حشرات، جفاف).
        3. إذا كان النبات سليماً، اذكر ذلك بوضوح.
        4. إذا كان مريضاً، قدم خطة علاج احترافية تشمل (نوع المبيد أو السماد، وطريقة الري).
        5. أعطِ نسبة ثقة حقيقية لدقتك في هذا التشخيص.

        يجب أن يكون ردك عبارة عن كائن JSON حصراً باللغة العربية بهذه المفاتيح:
        {
          "plant": "اسم النبات",
          "disease": "التشخيص الدقيق للحالة",
          "confidence": "نسبة الدقة كرقيم فقط بين 0 و 100",
          "treatment": "خطة العلاج والوقاية المقترحة"
        }
        ملحوظة: إذا لم تكن الصورة لنبات أو جزء من نبات، اجعل قيمة plant هي "error".
        `;

        // التأكد من أن الصورة بتنسيق Base64 صحيح
        const base64Image = image.includes("base64,") ? image : `data:image/jpeg;base64,${image}`;

        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { 
                            type: "image_url", 
                            image_url: { 
                                url: base64Image,
                                detail: "high" // طلب أعلى دقة ممكنة لرؤية الأمراض الصغيرة
                            } 
                        }
                    ]
                }
            ],
            response_format: { type: "json_object" } // ضمان استلام JSON نظيف
        }, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        // إرسال النتيجة للتطبيق
        const result = JSON.parse(response.data.choices[0].message.content);
        res.json(result);

    } catch (error) {
        console.error("OpenAI Error:", error.response ? error.response.data : error.message);
        
        let errorMessage = "تعذر الاتصال بالذكاء الاصطناعي حالياً.";
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error.message;
        }

        res.json({ 
            plant: "error", 
            disease: "فشل التحليل: " + errorMessage, 
            confidence: "0", 
            treatment: "يرجى التأكد من جودة الصورة وتوفر رصيد في حسابك." 
        });
    }
});

// 2. رابط المساعد الذكي (الدردشة الزراعية)
app.post("/chat", async (req, res) => {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "أنت مساعد زراعي ذكي خبير في تطبيق حديقتي - الذكي. أجب باختصار واحترافية باللغة العربية." },
                { role: "user", content: req.body.message }
            ]
        }, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });
        
        res.json({ reply: response.data.choices[0].message.content });
    } catch (e) { 
        res.json({ reply: "عذراً، أواجه مشكلة تقنية في الرد على سؤالك." }); 
    }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`GreenMind Expert Server is Live on Port ${PORT}`);
    console.log(`Using Model: GPT-4o-mini`);
    console.log(`========================================`);
});
