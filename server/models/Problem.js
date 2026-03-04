const mongoose = require("mongoose");

const exampleSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String }
});

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  difficulty: {
    type: String,
    enum: ["Basic", "Easy", "Medium", "Hard"],
    required: true
  },

  category: {
    type: String,
    required: true
  },

  approach: {
    type: String
  },

  description: {
    type: String,
    required: true
  },

  examples: [exampleSchema],

  constraints: {
    type: String
  },

  timeComplexity: {
    type: String
  },

  spaceComplexity: {
    type: String
  }

}, { timestamps: true });

module.exports = mongoose.model("Problem", problemSchema);