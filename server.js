const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.send("🌿 AgriSmart API is running");
});

// استقبال صورة (Base64)
app.post("/analyze", (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image received"
      });
    }

    // هنا لاحقًا نربط AI
    return res.json({
      success: true,
      message: "Image received successfully",
      size: image.length
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
