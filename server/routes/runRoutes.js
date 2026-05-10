const express = require('express');
const router = express.Router();
const { runCppCode } = require('../services/codeRunner');
const protect = require('../middleware/authMiddleware');

// POST /api/run
// Route to execute code
router.post('/', protect, async (req, res) => {
    try {
        const { language, code, input } = req.body;

        // Basic validation
        if (!language || !code) {
            return res.status(400).json({ 
                success: false, 
                error: "Language and code are required fields." 
            });
        }

        // Currently we only support C++ in Phase 1
        if (language.toLowerCase() !== 'cpp' && language.toLowerCase() !== 'c++') {
            return res.status(400).json({ 
                success: false, 
                error: `Language '${language}' is not supported yet. Only C++ is available.` 
            });
        }

        // Call our Docker execution service
        const result = await runCppCode(code, input);

        return res.status(200).json(result);

    } catch (error) {
        console.error("Error in code runner route:", error);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error executing code."
        });
    }
});

module.exports = router;
