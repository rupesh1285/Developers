require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listAvailableModels() {
    try {
        console.log("Checking available models for your API key...");
        // This is the raw fetch to see what Google allows you to use
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("\n✅ YOUR KEY SUPPORTS THESE MODELS:");
            data.models.forEach(m => console.log(`- ${m.name.replace('models/', '')}`));
        } else {
            console.log("❌ No models found. Your API key might be restricted.");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Error listing models:", err.message);
    }
}

listAvailableModels();