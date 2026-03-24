const mongoose = require('mongoose');

// 1. Define the exact structure of a chat message (Validation & Safety)
const chatMessageSchema = new mongoose.Schema({
    role: { 
        type: String, 
        required: true,
        enum: ['user', 'bot', 'model', 'system'] // Only allows these roles
    },
    content: { 
        type: String, 
        required: true 
    }
}, { _id: false }); // Prevents MongoDB from creating unnecessary IDs for every single message

// 2. Define the main Workspace Schema
const workspaceSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true 
    },
    problem: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Problem', 
        required: true,
        index: true
    },
    code: { 
        type: String, 
        default: "" 
    },
    chat: { 
        type: [chatMessageSchema], // Uses the strict schema defined above
        default: [] 
    }
}, { 
    timestamps: true 
});

// Ensures a user only has ONE workspace per problem
workspaceSchema.index({ user: 1, problem: 1 }, { unique: true });

module.exports = mongoose.model('Workspace', workspaceSchema);