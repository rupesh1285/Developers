const express = require("express");
const Progress = require("../models/Progress");
const Problem = require("../models/Problem");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================
   MARK PROBLEM AS SOLVED (OLD ROUTE)
   (kept for safety)
========================= */

router.post("/:problemId", protect, async (req, res) => {
  try {

    const { problemId } = req.params;

    const alreadySolved = await Progress.findOne({
      user: req.user,
      problem: problemId
    });

    if (alreadySolved) {
      return res.status(400).json({ message: "Already marked as solved" });
    }

    const progress = new Progress({
      user: req.user,
      problem: problemId,
      solved: true
    });

    await progress.save();

    res.status(201).json({ message: "Marked as solved" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* =========================
   TOGGLE SOLVED (NEW)
========================= */

router.post("/toggle-solved/:problemId", protect, async (req, res) => {
  try {

    const { problemId } = req.params;

    let progress = await Progress.findOne({
      user: req.user,
      problem: problemId
    });

    if (!progress) {
      progress = new Progress({
        user: req.user,
        problem: problemId,
        solved: true
      });
    } else {
      progress.solved = !progress.solved;
    }

    await progress.save();

    res.json(progress);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* =========================
   TOGGLE STAR (NEW)
========================= */

router.post("/toggle-star/:problemId", protect, async (req, res) => {
  try {

    const { problemId } = req.params;

    let progress = await Progress.findOne({
      user: req.user,
      problem: problemId
    });

    if (!progress) {
      progress = new Progress({
        user: req.user,
        problem: problemId,
        starred: true
      });
    } else {
      progress.starred = !progress.starred;
    }

    await progress.save();

    res.json(progress);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* =========================
   GET USER PROGRESS
========================= */

router.get("/", protect, async (req, res) => {
  try {

    const progress = await Progress.find({
      user: req.user
    }).populate("problem");

    res.json(progress);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* =========================
   GET PROGRESS SUMMARY
========================= */

router.get("/summary", protect, async (req, res) => {
  try {

    const totalProblems = await Problem.countDocuments();

    const solvedProblems = await Progress.countDocuments({
      user: req.user,
      solved: true
    });

    const percentage =
      totalProblems === 0
        ? 0
        : Math.round((solvedProblems / totalProblems) * 100);

    res.json({
      totalProblems,
      solvedProblems,
      percentage
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;