const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");

const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

const createAdmin = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
  if (!mongoUri) throw new Error("MONGO_URI is missing in .env");

  await mongoose.connect(mongoUri, { family: 4 });

  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_STATION, ADMIN_ROLE } = process.env;
    const role = ADMIN_ROLE === "main_admin" ? "main_admin" : "admin";
    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || (role === "admin" && !ADMIN_STATION)) {
      throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, and (for a station admin) ADMIN_STATION in .env");
    }

    const existingUser = await User.findOne({ email: ADMIN_EMAIL });
    if (existingUser) throw new Error("An account already exists for ADMIN_EMAIL. Refusing to overwrite it.");

    const admin = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role,
      assignedStation: role === "admin" ? ADMIN_STATION : null
    });

    await admin.save();
    console.log(role === "main_admin" ? "SUCCESS: Main admin created." : `SUCCESS: Admin created for ${ADMIN_STATION}.`);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin().catch((error) => {
  console.error("Error resetting admin:", error.message);
  process.exitCode = 1;
});