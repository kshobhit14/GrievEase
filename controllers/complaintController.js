const Complaint = require("../models/Complaint");
const { calculatePriority } = require("../services/nlpService");

// @route  POST /api/complaints
// @access Student/Staff (authenticated)
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, station } = req.body;

    if (!title || !description || !station) {
      return res.status(400).json({ message: "Title, description and station are required" });
    }

    const { score, level } = calculatePriority(`${title}. ${description}`, station);

    const complaint = await Complaint.create({
      title,
      description,
      station,
      raisedBy: req.user._id,
      priorityScore: score,
      priorityLevel: level,
      status: "Open"
    });

    res.status(201).json({
      message: "Complaint submitted successfully",
      ticketId: complaint._id,
      priorityLevel: complaint.priorityLevel,
      status: complaint.status
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit complaint", error: error.message });
  }
};

// @route  GET /api/complaints/mine
// @access Student/Staff (authenticated) - view own complaints
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ raisedBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch complaints", error: error.message });
  }
};

// @route  GET /api/complaints?station=Hostel&status=Open
// @access Admin - view priority-sorted queue, optionally filtered by station/status
exports.getAllComplaints = async (req, res) => {
  try {
    const { station, status } = req.query;
    const filter = {};
    if (station) filter.station = station;
    if (status) filter.status = status;

    const complaints = await Complaint.find(filter)
      .populate("raisedBy", "name email role")
      .sort({ priorityScore: -1, createdAt: 1 }); // highest priority first, then oldest first

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch complaints", error: error.message });
  }
};

// @route  GET /api/complaints/:id
// @access Owner or Admin
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate("raisedBy", "name email role");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const isOwner = complaint.raisedBy._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this complaint" });
    }

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch complaint", error: error.message });
  }
};

// @route  PATCH /api/complaints/:id/status
// @access Admin
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

    complaint.status = status;
    if (status === "Resolved") {
      complaint.resolvedBy = req.user._id;
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    res.status(200).json({
      message:
        status === "Resolved"
          ? "Ticket has been resolved"
          : `Complaint status updated to "${status}"`,
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update complaint status", error: error.message });
  }
};
