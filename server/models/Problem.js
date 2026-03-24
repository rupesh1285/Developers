const mongoose = require("mongoose");

// Sub-schema for Examples
const exampleSchema = new mongoose.Schema({
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String }
}, { _id: false });

const problemSchema = new mongoose.Schema({
    // 1. SERIAL NUMBER
    problemNumber: { 
        type: Number, 
        required: true, 
        unique: true, 
        index: true 
    },

    // 2. BASIC INFO
    title: { 
        type: String, 
        required: true, 
        trim: true 
    },
    difficulty: { 
        type: String, 
        enum: ["Basic", "Easy", "Medium", "Hard"], 
        required: true,
        index: true 
    },

    // 3. DETAILS
    description: { type: String, required: true },
    examples: [exampleSchema],
    constraints: { type: [String], default: [] },
    timeComplexity: { type: String, default: "" },
    spaceComplexity: { type: String, default: "" },

    // 4. TAGS
    tags: { type: [String], index: true }

}, { timestamps: true });

// Enable Search
problemSchema.index({ title: 'text', tags: 'text' });

module.exports = mongoose.model("Problem", problemSchema);