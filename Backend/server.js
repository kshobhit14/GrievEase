const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");

dotenv.config();
connectDB();

const app = express();

// 1. Create HTTP Server wrapping Express app
const server = http.createServer(app);

// 2. Initialize Socket.io with CORS enabled
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust to specific frontend URL if needed (e.g., "http://localhost:5173")
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});

// 3. Make 'io' instance available in express controllers via req.app.get("socketio")
app.set("socketio", io);

// Socket connection event logs
io.on("connection", (socket) => {
  console.log(`⚡ Client connected to socket: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "GrievEase API is running with Real-time Socket Support" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/grievances", complaintRoutes); // Primary endpoint matching Axios requests
app.use("/api/complaints", complaintRoutes); // Alias route for backward compatibility

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 8000;

// 4. Start HTTP Server (Important: Use 'server.listen', NOT 'app.listen')
server.listen(PORT, () => {
  console.log(`GrievEase server running on port ${PORT} with WebSockets active`);
});