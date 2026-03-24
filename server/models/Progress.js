const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true
  },
  solved: {
    type: Boolean,
    default: false
  },
  starred: {
    type: Boolean,
    default: false
  },
  // Legacy field (kept so your current test data doesn't crash)
  solvedAt: { 
    type: Date,
    default: null
  },
  // 🌟 THE FIX: Immutable Event Log!
  // Records every single time they check the box.
  solveHistory: [{ 
    type: Date 
  }]
}, { timestamps: true });

module.exports = mongoose.model("Progress", progressSchema);