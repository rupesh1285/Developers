const express = require('express');
const router = express.Router();
const Workspace = require('../models/workSpace'); 
const auth = require('../middleware/authMiddleware'); 

// 🌟 HELPER FUNCTION: Safely converts the binary User ID buffer into a readable string
const getSafeUserId = (reqUser) => {
    // Check if the ID is hidden in .id, ._id, or if req.user IS the id
    const id = reqUser.id || reqUser._id || reqUser;
    // If it's a binary Buffer, convert to hex string. Otherwise, normal toString().
    return Buffer.isBuffer(id) ? id.toString('hex') : id.toString();
};

// ==========================================
// 1. GET WORKSPACE (Loads code & chat on page load)
// ==========================================
router.get('/:problemId', auth, async (req, res) => {
    try {
        const safeUserId = getSafeUserId(req.user);

        const workspace = await Workspace.findOne({
            user: safeUserId, 
            problem: req.params.problemId
        });

        if (!workspace) {
            return res.json({ code: "", chat: [] });
        }

        res.json(workspace);
    } catch (err) {
        console.error("Error fetching workspace:", err);
        res.status(500).json({ error: "Server Error" });
    }
});

// ==========================================
// 2. SAVE CODE (Triggered by our 1.5s Debounce)
// ==========================================
router.post('/code/:problemId', auth, async (req, res) => {
    try {
        const safeUserId = getSafeUserId(req.user);
        const { code } = req.body;

        const workspace = await Workspace.findOneAndUpdate(
            { user: safeUserId, problem: req.params.problemId },
            { $set: { code: code } },
            { returnDocument: 'after', upsert: true } // 🌟 FIX: Updated to silence Mongoose warnings
        );

        res.json({ success: true, workspace });
    } catch (err) {
        console.error("Error saving code:", err);
        res.status(500).json({ error: "Server Error" });
    }
});

// ==========================================
// 3. SAVE CHAT (Triggered every time a message is sent)
// ==========================================
router.post('/chat/:problemId', auth, async (req, res) => {
    try {
        const safeUserId = getSafeUserId(req.user);
        const { chat } = req.body;

        const workspace = await Workspace.findOneAndUpdate(
            { user: safeUserId, problem: req.params.problemId },
            { $set: { chat: chat } },
            { returnDocument: 'after', upsert: true } // 🌟 FIX: Updated to silence Mongoose warnings
        );

        res.json({ success: true, workspace });
    } catch (err) {
        console.error("Error saving chat:", err);
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;