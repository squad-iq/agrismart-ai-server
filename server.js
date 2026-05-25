const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// الاتصال بمكتبة OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post("/predict", async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: "Image is required" });

        // تجهيز الصورة لـ OpenAI
        const base64Image = image.includes("base64,") ? image : `data:image/jpeg;base64,${image}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "أنت خبير نباتات. حلل الصورة وأجب بصيغة JSON فقط باللغة العربية: {\"plant\": \"اسم النبات\", \"disease\": \"التشخيص\", \"confidence\": \"الدقة كرقيم فقط\", \"treatment\": \"العلاج\"}. إذا لم تكن لنبات، اجعل plant قيمتها error." },
                        {
                            type: "image_url",
                            image_url: { "url": base64Image },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
        });

        res.json(JSON.parse(response.choices[0].message.content));

    } catch (error) {
        console.error("OpenAI Error:", error.message);
        res.status(200).json({ 
            plant: "error", 
            disease: "مشكلة في الرصيد أو الاتصال: " + error.message, 
            confidence: "0", 
            treatment: "تأكد من شحن رصيد في OpenAI." 
        });
    }
});

app.post("/chat", async (req, res) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: `أجب باختصار بالعربية: ${req.body.message}` }],
        });
        res.json({ reply: response.choices[0].message.content });
    } catch (e) { res.json({ reply: "عذراً، واجهت مشكلة تقنية." }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Running with GPT-4o-mini"));
