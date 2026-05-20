const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🌿 AgriSmart API is running");
});

app.post("/analyze", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
    data: req.body
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
