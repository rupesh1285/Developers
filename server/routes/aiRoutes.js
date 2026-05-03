const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/authMiddleware');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_FALLBACKS = [
    "gemini-2.5-flash",    
    "gemini-2.0-flash",    
    "gemini-flash-latest"  
];

router.post('/ask', auth, async (req, res) => {
    const { message, code, problemTitle, chatHistory } = req.body;

    for (const modelName of MODEL_FALLBACKS) {
        try {
            console.log(`🤖 Attempting connection with: ${modelName}...`);
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                // 🧠 SYSTEM INSTRUCTION: This acts as the permanent "brain" or persona
                systemInstruction: `You are Finalist, an elite, highly direct coding mentor. 
            
                Context: The user is currently solving the problem: "${problemTitle}".
                
                Rule 1: NO ROBOTIC GREETINGS. Never say "I am an AI" or "How can I help you?". Talk like a senior developer. 
                Rule 2: BE CONCISE. Get straight to the point. No fluff.
                Rule 3: THE CODE POLICY. Provide hints, logical steps, or small 2-3 line snippets. Do NOT give the full answer immediately. HOWEVER, if the user explicitly demands the full code, you MUST provide it. 
                Rule 4: ALWAYS format code in markdown blocks with the correct language tag.`
            });
            
            // 🔄 FORMAT HISTORY: Map your frontend history format to Gemini's required format
            const formattedHistory = (chatHistory || []).map(msg => ({
                role: msg.role === 'bot' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            // 💬 START CHAT: This passes the memory into the model
            const chat = model.startChat({
                history: formattedHistory,
            });

            // 📩 SEND MESSAGE: Inject the current code context alongside their question
            const currentContext = `[CURRENT EDITOR CODE]\n${code || '(empty)'}\n\n[USER QUESTION]\n${message}`;
            
            const result = await chat.sendMessage(currentContext);
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