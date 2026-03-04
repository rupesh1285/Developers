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
  }

}, { timestamps: true });

module.exports = mongoose.model("Progress", progressSchema);