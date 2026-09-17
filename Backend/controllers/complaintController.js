const axios = require('axios');
const Complaint = require("../models/Complaint");

// @route   POST /api/complaints
// @access  Student/Staff/Parent (authenticated)
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, station } = req.body;

    if (!title || !description || !station) {
      return res.status(400).json({ message: "Title, description, and station are required." });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User authentication missing. Please log in again." });
    }

    // Default Fallbacks
    let predictedCategory = "Other";
    let predictedPriority = "Low";
    let predictedPriorityScore = 25;

    // 1. ML API Call -> Hits Python Flask running on Port 5000
    try {
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL || "http://127.0.0.1:5000"}/predict`, {
        title,
        complaint: description,
        station: station
      }, { timeout: 3000 }); // 3-second timeout guard

      if (mlResponse.data) {
        predictedCategory = mlResponse.data.category || mlResponse.data.predicted_category || "Other";
        predictedPriority = mlResponse.data.priorityLevel || mlResponse.data.priority || mlResponse.data.priority_level || "Low";
        predictedPriorityScore = Number(mlResponse.data.priorityScore ?? mlResponse.data.priority_score ?? 25);
      }
    } catch (mlErr) {
      console.warn("Python ML Service (Port 5000) Offline/Error. Using fallback:", mlErr.message);
    }

    // 2. Save Complaint
    const newComplaint = await Complaint.create({
      title,
      description,
      station,
      category: predictedCategory,
      priorityLevel: predictedPriority,
      priorityScore: Number.isFinite(predictedPriorityScore) ? predictedPriorityScore : 25,
      raisedBy: req.user._id,
      status: "Open"
    });

    // 3. Populate user details
    const populatedComplaint = await Complaint.findById(newComplaint._id)
      .populate("raisedBy", "name email role studentId staffId wardId");

    // 4. Emit Socket Event
    try {
      const io = req.app.get("socketio");
      if (io) {
        io.to(`station:${station}`).emit("new_complaint", populatedComplaint);
        io.to("main-admins").emit("new_complaint", populatedComplaint);
      }
    } catch (socketErr) {
      console.error("Socket emission failed:", socketErr.message);
    }

    return res.status(201).json({
      message: "Complaint submitted successfully",
      complaint: populatedComplaint
    });

  } catch (error) {
    console.error("Error creating complaint:", error);
    return res.status(500).json({ 
      message: error.message || "Failed to submit complaint" 
    });
  }
};

// @route   GET /api/complaints/mine
// @access  Authenticated user - view own complaints
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ raisedBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch complaints", error: error.message });
  }
};

// @route   GET /api/complaints
// @access  Admin - view queue with populated role IDs
exports.getAllComplaints = async (req, res) => {
  try {
    const { station, status } = req.query;
    const isMainAdmin = req.user.role === "main_admin";
    if (!isMainAdmin && !req.user.assignedStation) {
      return res.status(403).json({ message: "This admin account has no assigned station." });
    }

    // Station admins are isolated; the main admin can view all stations or one station.
    const filter = isMainAdmin ? {} : { station: req.user.assignedStation };
    if (isMainAdmin && station) filter.station = station;
    if (status) filter.status = status;

    const complaints = await Complaint.find(filter)
      .populate("raisedBy", "name email role studentId staffId wardId")
      .sort({ priorityScore: -1, createdAt: 1 });

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch complaints", error: error.message });
  }
};

// @route   GET /api/complaints/:id
// @access  Owner or Admin
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("raisedBy", "name email role studentId staffId wardId");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const isOwner = complaint.raisedBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin" || req.user.role === "main_admin";
    const canAccessStation = req.user.role === "main_admin" || complaint.station === req.user.assignedStation;
    if (!isOwner && (!isAdmin || !canAccessStation)) {
      return res.status(403).json({ message: "Not authorized to view this complaint" });
    }

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch complaint", error: error.message });
  }
};

// @route   PATCH /api/complaints/:id/status
// @access  Admin
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["Open", "In Progress", "Resolved"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowedStatuses.join(", ")}` });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (req.user.role !== "main_admin" && (!req.user.assignedStation || complaint.station !== req.user.assignedStation)) {
      return res.status(403).json({ message: "You can only update complaints from your assigned station." });
    }

    complaint.status = status;
    if (status === "Resolved") {
      complaint.resolvedBy = req.user._id;
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("raisedBy", "name email role studentId staffId wardId");

    // Emit real-time status update to all connected clients
    const io = req.app.get("socketio");
    if (io) {
      io.to(`station:${complaint.station}`).emit("status_updated", populatedComplaint);
      io.to("main-admins").emit("status_updated", populatedComplaint);
    }

    res.status(200).json({
      message:
        status === "Resolved"
          ? "Ticket has been resolved"
          : `Complaint status updated to "${status}"`,
      complaint: populatedComplaint
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update complaint status", error: error.message });
  }
};
