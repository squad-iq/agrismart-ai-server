const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ======================
// 🟢 Main Route
// ======================
app.get("/", (req, res) => {
  res.status(200).send("🌿 AgriSmart API is running");
});

// ======================
// 🟢 Health Check
// ======================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is healthy"
  });
});

// ======================
// 🟢 Analyze Image API
// ======================
app.post("/analyze", (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image provided"
      });
    }

    // هنا لاحقًا نربط AI (Gemini أو أي ذكاء)
    return res.status(200).json({
      success: true,
      message: "Image received successfully",
      imageSize: image.length,
      result: "processing_done"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ======================
// 🟢 Start Server
// ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
