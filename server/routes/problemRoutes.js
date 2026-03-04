const express = require("express");
const Problem = require("../models/Problem");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================
   ADD NEW PROBLEM (Protected)
========================= */

router.post("/", protect, async (req, res) => {
  try {
    const {
      title,
      difficulty,
      category,
      approach,
      description,
      examples,
      constraints,
      timeComplexity,
      spaceComplexity
    } = req.body;

    const newProblem = new Problem({
      title,
      difficulty,
      category,
      approach,
      description,
      examples,
      constraints,
      timeComplexity,
      spaceComplexity
    });

    await newProblem.save();

    res.status(201).json(newProblem);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   GET ALL PROBLEMS
========================= */

router.get("/", async (req, res) => {
  try {
    const problems = await Problem.find().sort({ createdAt: -1 });
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