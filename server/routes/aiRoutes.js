const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/authMiddleware');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🌟 THE REAL MODELS FROM YOUR API KEY
const MODEL_FALLBACKS = [
    "gemini-2.5-flash",    // The newest, fastest coding model
    "gemini-2.0-flash",    // Solid backup
    "gemini-flash-latest"  // Ultimate fallback
];

router.post('/ask', auth, async (req, res) => {
    const { message, code, problemTitle, chatHistory } = req.body;

    for (const modelName of MODEL_FALLBACKS) {
        try {
            console.log(`🤖 Attempting connection with: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            // 🌟 THE "SENIOR DEV" MENTOR BRAIN
            const prompt = `You are Finalist, an elite, highly direct coding mentor. 
            
            Context:
            User is solving: ${problemTitle}
            Current Code: 
            ${code}
            
            User Message: ${message}
            
            Rule 1: NO ROBOTIC GREETINGS. Never say "I am an AI" or "How can I help you?". Talk like a senior developer. If the user just says "hi", respond with something casual like: "Hey. Working on ${problemTitle}? Need a hint or got a bug?"
            Rule 2: BE CONCISE. Get straight to the point. No fluff.
            Rule 3: THE CODE POLICY. If a user asks for help, provide hints or small, specific 2-3 line code blocks for a specific logic jump. Do NOT give the full answer immediately. HOWEVER, if the user explicitly demands the full code or solution, you MUST provide the complete, optimized code. 
            Rule 4: Always format your code in markdown blocks with the correct language tag.`;

            const result = await model.generateContent(prompt);
            const aiResponse = result.response.text();

            console.log(`✅ Success with ${modelName}!`);
            return res.json({ reply: aiResponse }); 

        } catch (err) {
            console.warn(`⚠️ ${modelName} failed. Reason: ${err.message}`);
        }
    }

    // If we get here, all models failed
    res.status(500).json({ error: "AI is currently over capacity. Please try again in 1 minute." });
});

module.exports = router;