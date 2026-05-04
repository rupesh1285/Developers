require('dotenv').config();
const mongoose = require('mongoose');
// Make sure this path points to your actual Problem model!
const Problem = require('./models/Problem'); 

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to DB. Fetching titles...");
        
        // Grab only the 'title' field to save memory
        const problems = await Problem.find({}, 'title -_id'); 
        
        // Flatten it into a simple array of strings
        const titles = problems.map(p => p.title);
        
        console.log("\n🎯 PASTE THIS ARRAY TO ME:");
        console.log(JSON.stringify(titles, null, 2));
        console.log(`\nTotal existing problems: ${titles.length}`);
        
        process.exit(0);
    })
    .catch(err => {
        console.error("Database error:", err);
        process.exit(1);
    });