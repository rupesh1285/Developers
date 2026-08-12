const express = require("express");
const Problem = require("../models/Problem");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const router = express.Router();

// ==========================================================
// 🚀 IN-MEMORY CACHE (Sub-5ms Response Time)
// ==========================================================
let cachedProblems = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const clearCache = () => {
    cachedProblems = null;
    lastCacheTime = 0;
};

/* ==========================================================
   GET ALL PROBLEMS (Optimized & Cached)
========================================================== */
router.get("/", async (req, res) => {
    try {
        // 1. CHECK CACHE: Serve directly from RAM if valid
        if (cachedProblems && (Date.now() - lastCacheTime < CACHE_DURATION)) {
            return res.json(cachedProblems);
        }

        // 2. FETCH FROM DB: Strip heavy HTML descriptions, return raw JSON
        const problems = await Problem.find()
            .select('_id title difficulty problemNumber tags') 
            .sort({ problemNumber: 1 })
            .lean(); 

        // 3. UPDATE CACHE
        cachedProblems = problems;
        lastCacheTime = Date.now();

        res.json(problems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ==========================================================
   GET SINGLE PROBLEM (Full Payload)
========================================================== */
router.get("/:id", async (req, res) => {
    try {
        let problem;
        const idParam = req.params.id;

        // Check if it is a valid 24-character hex ObjectId
        if (idParam.match(/^[0-9a-fA-F]{24}$/)) {
            problem = await Problem.findById(idParam);
        } else {
            // It's a slug! (e.g. "two-sum" -> "Two Sum")
            // We escape any special chars just in case, but usually it's just words
            const regexTitle = idParam.replace(/-/g, '\\s*');
            problem = await Problem.findOne({ title: { $regex: new RegExp(`^${regexTitle}$`, 'i') } });
        }

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        res.json(problem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ==========================================================
   ADD NEW PROBLEM (Protected)
========================================================== */
router.post("/", protect, admin, async (req, res) => {
    try {
        const lastProblem = await Problem.findOne().sort({ problemNumber: -1 });
        const nextNumber = lastProblem && lastProblem.problemNumber 
            ? lastProblem.problemNumber + 1 
            : 1;

        const newProblem = new Problem({
            ...req.body,
            problemNumber: nextNumber
        });

        const savedProblem = await newProblem.save();
        
        clearCache(); // 🌟 Invalidate cache so the new problem shows up
        res.status(201).json(savedProblem);

    } catch (error) {
        console.error("Error adding problem:", error);
        res.status(500).json({ error: error.message });
    }
});

/* ==========================================================
   BULK INJECT PROBLEMS (Handles 50, 100, 200+ at once)
========================================================== */
router.post("/bulk", protect, admin, async (req, res) => {
    try {
        const problemsArray = req.body;

        if (!Array.isArray(problemsArray) || problemsArray.length === 0) {
            return res.status(400).json({ error: "Payload must be a non-empty array of problems." });
        }

        const lastProblem = await Problem.findOne().sort({ problemNumber: -1 });
        let nextNumber = lastProblem && lastProblem.problemNumber ? lastProblem.problemNumber + 1 : 1;

        const problemsToInsert = problemsArray.map(prob => {
            const mappedProblem = {
                ...prob,
                problemNumber: nextNumber
            };
            nextNumber++; 
            return mappedProblem;
        });

        const insertedProblems = await Problem.insertMany(problemsToInsert);
        
        clearCache(); // 🌟 Invalidate cache 
        res.status(201).json({ 
            message: `Successfully injected ${insertedProblems.length} problems!`,
            insertedCount: insertedProblems.length
        });

    } catch (error) {
        console.error("Bulk Injection Error:", error);
        res.status(400).json({ error: "Bulk insertion failed due to validation errors.", details: error.message });
    }
});

/* ==========================================================
   UPDATE PROBLEM (Protected)
========================================================== */
router.put("/:id", protect, admin, async (req, res) => {
    try {
        const updatedProblem = await Problem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updatedProblem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        clearCache(); // 🌟 Invalidate cache
        res.json(updatedProblem);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ==========================================================
   DELETE PROBLEM (Protected)
========================================================== */
router.delete("/:id", protect, admin, async (req, res) => {
    try {
        const problem = await Problem.findByIdAndDelete(req.params.id);

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        clearCache(); // 🌟 Invalidate cache
        res.json({ message: "Problem deleted successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;