const express = require("express");
const router = express.Router();
const Progress = require("../models/Progress");
const Problem = require("../models/Problem");
const protect = require("../middleware/authMiddleware");

/* =======================================
   GET SUMMARY (For Progress Bars)
   ======================================= */
router.get("/summary", protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const solvedProgress = await Progress.find({ user: userId, solved: true });
        const solvedProblemIds = solvedProgress.map(p => p.problem);
        const solvedProblems = await Problem.find({ _id: { $in: solvedProblemIds } });
        const allProblems = await Problem.find({});

        const calculateStats = (difficulty) => {
            const total = allProblems.filter(p => p.difficulty === difficulty).length;
            const solved = solvedProblems.filter(p => p.difficulty === difficulty).length;
            const percentage = total === 0 ? 0 : Math.round((solved / total) * 100);
            return { total, solved, percentage };
        };

        res.json({
            totalSolved: solvedProblems.length,
            totalProblems: allProblems.length,
            stats: {
                basic: calculateStats("Basic"),
                easy: calculateStats("Easy"),
                medium: calculateStats("Medium"),
                hard: calculateStats("Hard")
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =======================================
   GET ALL PROGRESS (For Checkboxes)
   ======================================= */
router.get("/", protect, async (req, res) => {
    try {
        const progress = await Progress.find({ user: req.user._id });
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =======================================
   TOGGLE SOLVED (The Deep Clean Fix)
   ======================================= */
router.post("/toggle-solved/:problemId", protect, async (req, res) => {
    try {
        const { problemId } = req.params;
        const userId = req.user._id;

        let progress = await Progress.findOne({ user: userId, problem: problemId });

        const getLocalDateStr = (dInput) => {
            const d = new Date(dInput);
            return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        };

        if (progress) {
            progress.solved = !progress.solved;
            
            if (progress.solved) {
                progress.solveHistory.push(new Date());
            } else {
                const todayStr = getLocalDateStr(new Date());
                
                // THE NUKE: Filter out ALL instances of today's date to destroy ghost clicks
                if (progress.solveHistory && progress.solveHistory.length > 0) {
                    progress.solveHistory = progress.solveHistory.filter(dateObj => {
                        return getLocalDateStr(dateObj) !== todayStr;
                    });
                }
                
                if (progress.solvedAt && getLocalDateStr(progress.solvedAt) === todayStr) {
                    progress.solvedAt = null;
                }
            }
        } else {
            progress = new Progress({ 
                user: userId, 
                problem: problemId, 
                solved: true,
                solveHistory: [new Date()] 
            });
        }

        progress.markModified('solveHistory');
        await progress.save();
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =======================================
   TOGGLE STARRED
   ======================================= */
router.post("/toggle-star/:problemId", protect, async (req, res) => {
    try {
        const { problemId } = req.params;
        const userId = req.user._id;

        let progress = await Progress.findOne({ user: userId, problem: problemId });

        if (progress) {
            progress.starred = !progress.starred;
        } else {
            progress = new Progress({ user: userId, problem: problemId, starred: true });
        }

        await progress.save();
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =======================================
   GET ANALYTICS (The Bouncer & Local Time Fix)
   ======================================= */
router.get("/analytics", protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = req.user;
        const allProblems = await Problem.find({});
        const allUserProgress = await Progress.find({ user: userId }).populate("problem");
        const currentlySolved = allUserProgress.filter(p => p.solved);

        const getLocalDateStr = (dateInput) => {
            const d = new Date(dateInput);
            return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        };

        // ---------------------------------------------------------
        // EXTRACT THE IMMUTABLE EVENT LEDGER
        // ---------------------------------------------------------
        const dailyUniqueSolves = {}; 
        const todayStr = getLocalDateStr(new Date());

        allUserProgress.forEach(p => {
            if (!p.problem) return; 

            let eventDates = p.solveHistory && p.solveHistory.length > 0 ? p.solveHistory : [];
            if (eventDates.length === 0 && p.solvedAt) eventDates.push(p.solvedAt);

            eventDates.forEach(dateObj => {
                const dateStr = getLocalDateStr(dateObj);
                
                // 🌟 THE ULTIMATE BOUNCER
                // If the event is from TODAY, but the checkbox is CURRENTLY UNCHECKED... throw it in the trash.
                if (dateStr === todayStr && p.solved === false) {
                    return; 
                }

                if (!dailyUniqueSolves[dateStr]) {
                    dailyUniqueSolves[dateStr] = new Set();
                }
                dailyUniqueSolves[dateStr].add(p.problem._id.toString());
            });
        });

        const activeDays = Object.keys(dailyUniqueSolves).sort((a, b) => new Date(b) - new Date(a));

        // ---------------------------------------------------------
        // ENGINE 1: STREAK TRACKER
        // ---------------------------------------------------------
        let currentStreak = 0;
        let maxStreak = 0;
        let checkDate = new Date();
        
        if (activeDays.includes(todayStr)) {
            currentStreak = 1;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            checkDate.setDate(checkDate.getDate() - 1);
            if (activeDays.includes(getLocalDateStr(checkDate))) { 
                currentStreak = 1;
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        while (currentStreak > 0) {
            const checkStr = getLocalDateStr(checkDate); 
            if (activeDays.includes(checkStr)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        let tempStreak = 0;
        let prevDate = null;
        const ascDates = [...activeDays].reverse();
        
        ascDates.forEach(dStr => {
            const d = new Date(dStr);
            if (!prevDate) {
                tempStreak = 1;
            } else {
                const diff = (d - prevDate) / (1000 * 60 * 60 * 24);
                if (diff === 1) tempStreak++;
                else tempStreak = 1;
            }
            if (tempStreak > maxStreak) maxStreak = tempStreak;
            prevDate = d;
        });

        // ---------------------------------------------------------
        // ENGINE 2: 16-WEEK ACTIVITY HEATMAP (112 Days)
        // ---------------------------------------------------------
        const heatmap = [];
        const today = new Date();

        for (let i = 111; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dStr = getLocalDateStr(d);

            const count = dailyUniqueSolves[dStr] ? dailyUniqueSolves[dStr].size : 0;

            let level = 0;
            if (count >= 1 && count <= 2) level = 1;
            else if (count >= 3 && count <= 5) level = 2;
            else if (count >= 6 && count <= 9) level = 3;
            else if (count >= 10) level = 4;

            heatmap.push({ date: dStr, count, level });
        }

        // ---------------------------------------------------------
        // ENGINE 3: TOPIC DISTRIBUTION
        // ---------------------------------------------------------
        const tagMap = {};

        allProblems.forEach(prob => {
            if (prob.tags) {
                prob.tags.forEach(tag => {
                    if (!tagMap[tag]) tagMap[tag] = { name: tag, total: 0, solved: 0 };
                    tagMap[tag].total++;
                });
            }
        });

        currentlySolved.forEach(prog => {
            if (prog.problem && prog.problem.tags) {
                prog.problem.tags.forEach(tag => {
                    if (tagMap[tag]) tagMap[tag].solved++;
                });
            }
        });

        const colorPalette = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"];
        
        const topics = Object.values(tagMap)
            .sort((a, b) => b.total - a.total)
            .map((t, index) => ({
                ...t,
                color: colorPalette[index % colorPalette.length]
            }));

        // ---------------------------------------------------------
        // SEND FINAL PAYLOAD
        // ---------------------------------------------------------
        res.json({
            streak: {
                current: currentStreak,
                max: Math.max(user.maxStreak || 0, maxStreak),
                timeSpentHrs: Math.floor((user.totalTimeSpent || 0) / 3600)
            },
            heatmap: heatmap,
            topics: topics
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;