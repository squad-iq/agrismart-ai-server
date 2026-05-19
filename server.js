const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = "AIzaSyD-jXQd2KuaZ59Sq-jKCtxuOO5s_uYKVMQ";

app.post("/analyze", async (req, res) => {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: "حلل صورة نبات واذكر المرض والعلاج"
                            }
                        ]
                    }
                ]
            }
        );

        res.json({
            success: true,
            result: response.data
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});