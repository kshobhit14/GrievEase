const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");

const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config({ path: path.join(__dirname, ".env") });

const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;

const stationAdmins = [
  {
    name: process.env.ACADEMIC_ADMIN_NAME || "Academic Block Admin",
    email: process.env.ACADEMIC_ADMIN_EMAIL || "academic.admin@college.edu",
    assignedStation: "Academic Block",
    password: process.env.ACADEMIC_ADMIN_PASSWORD || defaultPassword,
  },
  {
    name: process.env.CLASSROOM_ADMIN_NAME || "Classroom Admin",
    email: process.env.CLASSROOM_ADMIN_EMAIL || "classroom.admin@college.edu",
    assignedStation: "Classroom",
    password: process.env.CLASSROOM_ADMIN_PASSWORD || defaultPassword,
  },
  {
    name: process.env.MAINGATE_ADMIN_NAME || "Main Gate Admin",
    email: process.env.MAINGATE_ADMIN_EMAIL || "maingate.admin@college.edu",
    assignedStation: "Main Gate",
    password: process.env.MAINGATE_ADMIN_PASSWORD || defaultPassword,
  },
  {
    name: process.env.LIBRARY_ADMIN_NAME || "Library Admin",
    email: process.env.LIBRARY_ADMIN_EMAIL || "library.admin@college.edu",
    assignedStation: "Library",
    password: process.env.LIBRARY_ADMIN_PASSWORD || defaultPassword,
  },
  {
    name: process.env.HOSTEL_ADMIN_NAME || "Hostel Admin",
    email: process.env.HOSTEL_ADMIN_EMAIL || "hostel.admin@college.edu",
    assignedStation: "Hostel",
    password: process.env.HOSTEL_ADMIN_PASSWORD || defaultPassword,
  },
  {
    name: process.env.PEDESTRIAN_ADMIN_NAME || "Pedestrian Admin",
    email: process.env.PEDESTRIAN_ADMIN_EMAIL || "pedestrian.admin@college.edu",
    assignedStation: "Pedestrian",
    password: process.env.PEDESTRIAN_ADMIN_PASSWORD || defaultPassword,
  },
  {
    name: process.env.OTHER_ADMIN_NAME || "Other Issues Admin",
    email: process.env.OTHER_ADMIN_EMAIL || "other.admin@college.edu",
    assignedStation: "Other",
    password: process.env.OTHER_ADMIN_PASSWORD || defaultPassword,
  },
];

async function createIfMissing({ name, email, password, role, assignedStation = null }) {
  const existing = await User.findOne({ email });
  if (existing) return { email, result: "skipped (already exists)" };

  if (!password || password.length < 8) {
    throw new Error(`Password for ${email} must be at least 8 characters long.`);
  }

  await User.create({ name, email, password, role, assignedStation });
  return { email, result: "created" };
}

async function seedAllAdmins() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
  if (!mongoUri) throw new Error("MONGO_URI is missing in .env");

  await mongoose.connect(mongoUri, { family: 4 });

  try {
    const results = [];

    // Main Admin
    results.push(
      await createIfMissing({
        name: process.env.MAIN_ADMIN_NAME || "Main Admin",
        email: process.env.MAIN_ADMIN_EMAIL || "mainadmin@college.edu",
        password: process.env.MAIN_ADMIN_PASSWORD || defaultPassword,
        role: "main_admin",
      })
    );

    // Station Admins
    for (const admin of stationAdmins) {
      results.push(
        await createIfMissing({
          name: admin.name,
          email: admin.email,
          password: admin.password,
          role: "admin",
          assignedStation: admin.assignedStation,
        })
      );
    }

    console.table(results);
  } finally {
    await mongoose.disconnect();
  }
}

seedAllAdmins().catch((error) => {
  console.error("Bulk admin setup failed:", error.message);
  process.exitCode = 1;
});