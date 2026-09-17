const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");

dotenv.config();
connectDB();

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// 1. Create HTTP Server wrapping Express app
const server = http.createServer(app);

// 2. Initialize Socket.io with CORS enabled
const io = new Server(server, {
  cors: corsOptions
});

// 3. Make 'io' instance available in express controllers via req.app.get("socketio")
app.set("socketio", io);

// Socket connection event logs
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role assignedStation");
    if (!user) return next(new Error("User not found"));
    socket.user = user;
    return next();
  } catch {
    return next(new Error("Invalid authentication token"));
  }
});

io.on("connection", (socket) => {
  if (socket.user.role === "main_admin") {
    socket.join("main-admins");
  } else if (socket.user.role === "admin" && socket.user.assignedStation) {
    socket.join(`station:${socket.user.assignedStation}`);
  }
  console.log(`⚡ Authenticated client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

app.use(cors(corsOptions));
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
