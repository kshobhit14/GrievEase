const mongoose = require("mongoose");
const dns = require("node:dns");
const path = require("path");
const dotenv = require("dotenv");
const User = require("./models/User");

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");
dotenv.config({ path: path.join(__dirname, ".env") });

const admins = [
  { name: "Main Admin", email: "mainadmin@college.edu", role: "main_admin", assignedStation: null, passwordEnv: "MAIN_ADMIN_PASSWORD" },
  { name: "Academic Block Admin", email: "academic.admin@college.edu", role: "admin", assignedStation: "Academic Block", passwordEnv: "ACADEMIC_BLOCK_ADMIN_PASSWORD" },
  { name: "Classroom Admin", email: "classroom.admin@college.edu", role: "admin", assignedStation: "Classroom", passwordEnv: "CLASSROOM_ADMIN_PASSWORD" },
  { name: "Main Gate Admin", email: "maingate.admin@college.edu", role: "admin", assignedStation: "Main Gate", passwordEnv: "MAIN_GATE_ADMIN_PASSWORD" },
  { name: "Library Admin", email: "library.admin@college.edu", role: "admin", assignedStation: "Library", passwordEnv: "LIBRARY_ADMIN_PASSWORD" },
  { name: "Hostel Admin", email: "hostel.admin@college.edu", role: "admin", assignedStation: "Hostel", passwordEnv: "HOSTEL_ADMIN_PASSWORD" },
  { name: "Pedestrian Admin", email: "pedestrian.admin@college.edu", role: "admin", assignedStation: "Pedestrian", passwordEnv: "PEDESTRIAN_ADMIN_PASSWORD" },
  { name: "Other Issues Admin", email: "other.admin@college.edu", role: "admin", assignedStation: "Other", passwordEnv: "OTHER_ADMIN_PASSWORD" }
];

async function syncAdmin(admin) {
  const password = process.env[admin.passwordEnv];
  if (!password) throw new Error(`${admin.passwordEnv} is required.`);

  let user = await User.findOne({ email: admin.email }).select("+password");
  if (!user) {
    user = new User({ ...admin, password });
  } else {
    user.name = admin.name;
    user.role = admin.role;
    user.assignedStation = admin.assignedStation;
    user.password = password;
  }
  await user.save();
  return admin.email;
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
  try {
    const emails = [];
    for (const admin of admins) emails.push(await syncAdmin(admin));
    console.log(`Synced ${emails.length} admin credential(s).`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Admin credential sync failed:", error.message);
  process.exitCode = 1;
});
