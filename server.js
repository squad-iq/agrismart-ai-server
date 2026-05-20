const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// 🌿 Test route
app.get("/", (req, res) => {
  res.send("🌿 AgriSmart API is running");
});

// 🔥 Analyze endpoint
app.post("/analyze", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "No image provided"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Missing GEMINI_API_KEY in environment variables"
      });
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: "Analyze this plant image and detect disease with treatment suggestions."
              }
            ]
          }
        ]
      }
    );

    return res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.log("ERROR:", error.message);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🚀 Start server (IMPORTANT for Railway)
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server running on port " + port);
});
