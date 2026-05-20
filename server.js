const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ✅ الصفحة الرئيسية (تحل مشكلة Cannot GET /)
app.get("/", (req, res) => {
  res.status(200).send("🌿 AgriSmart API is running");
});

// ✅ API test
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ✅ analyze endpoint (أساسي لمشروعك)
app.post("/analyze", (req, res) => {
  try {
    const data = req.body;

    if (!data) {
      return res.status(400).json({ error: "No data received" });
    }

    return res.status(200).json({
      success: true,
      message: "Image received successfully",
      data: data
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
