const mongoose = require("mongoose"); // 👈 THIS WAS THE MISSING LINE!

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  notes: { 
    type: String,
    default: "" 
  },
  streak: {
    type: Number,
    default: 0
  },
  maxStreak: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  // Google/GitHub profile picture URL
  avatar: { 
    type: String, 
    default: "" 
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);