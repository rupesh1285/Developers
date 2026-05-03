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
        // Note: We "spread" the req.body (title, difficulty, etc.) 
        // and manually inject the problemNumber so validation passes.
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

        // 1. Validate payload is an array
        if (!Array.isArray(problemsArray) || problemsArray.length === 0) {
            return res.status(400).json({ error: "Payload must be a non-empty array of problems." });
        }

        // 2. Find the current highest problemNumber to continue the sequence
        const lastProblem = await Problem.findOne().sort({ problemNumber: -1 });
        let nextNumber = lastProblem && lastProblem.problemNumber ? lastProblem.problemNumber + 1 : 1;

        // 3. Inject the auto-incrementing problemNumber into every problem
        const problemsToInsert = problemsArray.map(prob => {
            const mappedProblem = {
                ...prob,
                problemNumber: nextNumber
            };
            nextNumber++; 
            return mappedProblem;
        });

        // 4. insertMany runs strict validation against your Schema!
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
   GET ALL PROBLEMS (Sorted)
========================= */

// Remove 'protect' if you want public access, but keep it if you want it private
router.get("/", async (req, res) => {
    try {
        // .sort({ problemNumber: 1 }) means "Ascending Order (1, 2, 3...)"
        const problems = await Problem.find().sort({ problemNumber: 1 });

        res.json(problems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/* =========================
   GET SINGLE PROBLEM
========================= */

router.get("/:id", async (req, res) => {
    try {
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