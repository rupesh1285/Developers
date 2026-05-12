const express = require('express');
const router = express.Router();
const { runCode } = require('../services/codeRunner');
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

        // Support all 5 languages
        const supportedLangs = ['cpp', 'c++', 'c', 'python', 'javascript', 'java', 'text/x-c++src', 'text/x-csrc', 'text/x-java'];
        const normalizedLang = language.toLowerCase();
        
        if (!supportedLangs.includes(normalizedLang)) {
            return res.status(400).json({ 
                success: false, 
                error: `Language '${language}' is not supported yet.` 
            });
        }

        // Call our multi-language execution service
        const result = await runCode(language, code, input);

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
