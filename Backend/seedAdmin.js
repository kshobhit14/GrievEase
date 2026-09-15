const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

const resetAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
    if (!mongoUri) throw new Error("MONGO_URI is missing in .env");

    await mongoose.connect(mongoUri, { family: 4 });

    const email = "admin@grievease.com";

    // Delete previously double-hashed admin
    await User.deleteOne({ email });

    // Pass plain string so User model pre-save hook handles hashing properly
    const admin = new User({
      name: "System Admin",
      email: email,
      password: "adminpassword123",
      role: "admin"
    });

    await admin.save();
    console.log("SUCCESS: Admin reset successfully!");
    console.log("Email: admin@grievease.com");
    console.log("Password: adminpassword123");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting admin:", error.message);
    process.exit(1);
  }
};

resetAdmin();