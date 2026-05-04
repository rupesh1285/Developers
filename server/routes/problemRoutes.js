const express = require("express");
const Problem = require("../models/Problem");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================
   ADD NEW PROBLEM (Protected)
========================= */

/* ==========================================================
   ADD NEW PROBLEM (With Auto-Incrementing problemNumber)
   ========================================================== */
router.post("/", protect, async (req, res) => {
    try {
        // 1. Find the current highest problemNumber in the database
        const lastProblem = await Problem.findOne().sort({ problemNumber: -1 });

        // 2. Calculate the next number (Start at 1 if DB is empty)
        const nextNumber = lastProblem && lastProblem.problemNumber 
            ? lastProblem.problemNumber + 1 
            : 1;

        // 3. Create the new problem object 
        const newProblem = new Problem({
            ...req.body,
            problemNumber: nextNumber
        });

        // 4. Save to MongoDB
        const savedProblem = await newProblem.save();
        
        // 5. Send back the success response
        res.status(201).json(savedProblem);

    } catch (error) {
        console.error("Error adding problem:", error);
        res.status(500).json({ error: error.message });
    }
});

/* ==========================================================
   BULK INJECT PROBLEMS (Handles 50, 100, 200+ at once)
   ========================================================== */
router.post("/bulk", protect, async (req, res) => {
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
        
        res.status(201).json({ 
            message: `Successfully injected ${insertedProblems.length} problems!`,
            insertedCount: insertedProblems.length
        });

    } catch (error) {
        console.error("Bulk Injection Error:", error);
        res.status(400).json({ error: "Bulk insertion failed due to validation errors.", details: error.message });
    }
});

/* =========================
   GET ALL PROBLEMS (Optimized for Sub-50ms Response)
========================= */
router.get("/", async (req, res) => {
    try {
        // 🌟 THE FIX: Select only needed fields and use .lean() to strip Mongoose overhead
        const problems = await Problem.find()
            .select('_id title difficulty problemNumber tags') 
            .sort({ problemNumber: 1 })
            .lean(); 

        res.json(problems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   GET SINGLE PROBLEM (Full Payload)
========================= */
router.get("/:id", async (req, res) => {
    try {
        // When a user clicks a problem, WE DO want the full description and examples here.
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        res.json(problem);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   UPDATE PROBLEM (Protected)
========================= */
router.put("/:id", protect, async (req, res) => {
    try {
        const updatedProblem = await Problem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updatedProblem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        res.json(updatedProblem);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   DELETE PROBLEM (Protected)
========================= */
router.delete("/:id", protect, async (req, res) => {
    try {
        const problem = await Problem.findByIdAndDelete(req.params.id);

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        res.json({ message: "Problem deleted successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;