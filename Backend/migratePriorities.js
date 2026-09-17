const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Complaint = require("./models/Complaint");

dotenv.config();

async function migratePriorities() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    // Existing High records are upgraded to Critical so no complaint is silently deprioritized.
    const result = await Complaint.updateMany(
      { priorityLevel: "High" },
      { $set: { priorityLevel: "Critical", priorityScore: 75 } }
    );
    console.log(`Migrated ${result.modifiedCount} High-priority complaint(s) to Critical.`);
  } finally {
    await mongoose.disconnect();
  }
}

migratePriorities().catch((error) => {
  console.error("Priority migration failed:", error.message);
  process.exitCode = 1;
});
