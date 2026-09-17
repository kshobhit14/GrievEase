const express = require("express");
const router = express.Router();

const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus
} = require("../controllers/complaintController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All complaint routes require authentication
router.use(authMiddleware);

// Student / Staff / Parent routes
router.post("/", createComplaint);
router.get("/mine", getMyComplaints);

// Admin routes
router.get("/", roleMiddleware("admin", "main_admin"), getAllComplaints);
router.patch("/:id/status", roleMiddleware("admin", "main_admin"), updateComplaintStatus);

// Shared (owner or admin) - keep below /mine to avoid path clash
router.get("/:id", getComplaintById);

module.exports = router;
