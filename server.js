const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// 🔑 آمن: من Environment Variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// test
app.get("/", (req, res) => {
    res.send("GreenMind API with Gemini is running 🚀");
});

app.post("/predict", upload.single("image"), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }

        const imageData = fs.readFileSync(req.file.path, {
            encoding: "base64"
        });

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });

        const prompt = `
أنت خبير زراعي.
حلل الصورة وأعد JSON فقط:
{
  "disease": "",
  "confidence": "",
  "treatment": ""
}
إذا النبات سليم اكتب healthy.
`;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: imageData,
                    mimeType: "image/jpeg"
                }
            },
            prompt
        ]);

        const text = result.response.text();

        res.json({ result: text });

        fs.unlinkSync(req.file.path);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
