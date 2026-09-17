const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const stations = ["Academic Block", "Classroom", "Main Gate", "Library", "Hostel", "Pedestrian", "Other"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ["student", "staff", "parent", "admin", "main_admin"],
      default: "student"
    },
    studentId: {
      type: String,
      trim: true,
      default: null
    },
    staffId: {
      type: String,
      trim: true,
      default: null
    },
    wardId: {
      type: String,
      trim: true,
      default: null
    },
    // Every admin is responsible for exactly one campus station. This is set
    // only by the administrator-creation script, never through public signup.
    assignedStation: {
      type: String,
      enum: stations,
      default: null
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
