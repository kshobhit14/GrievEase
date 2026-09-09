const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "GrievEase API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler (catches errors passed via next(err))
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`GrievEase server running on port ${PORT}`);
});
