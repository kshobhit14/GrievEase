const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },
    station: {
      type: String,
      required: [true, "Station is required"],
      enum: ["Classroom", "Main Gate", "Library", "Hostel", "Other"]
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    priorityScore: {
      type: Number,
      default: 0
    },
    priorityLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low"
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved"],
      default: "Open"
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Useful for admin dashboard: sort open tickets by urgency, then oldest first
complaintSchema.index({ station: 1, status: 1, priorityScore: -1, createdAt: 1 });

module.exports = mongoose.model("Complaint", complaintSchema);
