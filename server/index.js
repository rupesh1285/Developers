require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const progressRoutes = require("./routes/progressRoutes");
const problemRoutes = require("./routes/problemRoutes");
const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");

const app = express();

app.use(express.json());
app.use(express.static("client"));
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/progress", progressRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});