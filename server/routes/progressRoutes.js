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
   TOGGLE SOLVED (Timezone Aware!)
======================================= */
router.post("/toggle-solved/:problemId", protect, async (req, res) => {
    try {
        const { problemId } = req.params;
        const userId = req.user._id;

        let progress = await Progress.findOne({ user: userId, problem: problemId });

        // 🌟 READ THE TIMEZONE HEADER FROM REACT
        const clientOffset = req.headers['timezone-offset'] ? parseInt(req.headers['timezone-offset'], 10) : new Date().getTimezoneOffset();
        
        const getLocalDateStr = (dInput) => {
            const d = new Date(dInput);
            return new Date(d.getTime() - (clientOffset * 60000)).toISOString().split('T')[0];
        };

        if (progress) {
            progress.solved = !progress.solved;
            
            if (progress.solved) {
                progress.solveHistory.push(new Date());
            } else {
                const todayStr = getLocalDateStr(new Date());
                
                // Filter out ALL instances of today's date using the client's timezone
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
   GET ANALYTICS (Timezone Aware!)
======================================= */
router.get("/analytics", protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = req.user;
        const allProblems = await Problem.find({});
        const allUserProgress = await Progress.find({ user: userId }).populate("problem");
        const currentlySolved = allUserProgress.filter(p => p.solved);

        // 🌟 READ THE TIMEZONE HEADER FROM REACT
        const clientOffset = req.headers['timezone-offset'] ? parseInt(req.headers['timezone-offset'], 10) : new Date().getTimezoneOffset();

        const getLocalDateStr = (dateInput) => {
            const d = new Date(dateInput);
            return new Date(d.getTime() - (clientOffset * 60000)).toISOString().split('T')[0];
        };

        // ---------------------------------------------------------
        // EXTRACT THE IMMUTABLE EVENT LEDGER
        // ---------------------------------------------------------
        const dailyUniqueSolves = {}; 
        const todayMs = Date.now();
        const todayStr = getLocalDateStr(todayMs);

        allUserProgress.forEach(p => {
            if (!p.problem) return; 

            let eventDates = p.solveHistory && p.solveHistory.length > 0 ? p.solveHistory : [];
            if (eventDates.length === 0 && p.solvedAt) eventDates.push(p.solvedAt);

            eventDates.forEach(dateObj => {
                const dateStr = getLocalDateStr(dateObj);
                
                // The Bouncer: Discard if un-checked today
                if (dateStr === todayStr && p.solved === false) return; 

                if (!dailyUniqueSolves[dateStr]) dailyUniqueSolves[dateStr] = new Set();
                dailyUniqueSolves[dateStr].add(p.problem._id.toString());
            });
        });

        const activeDays = Object.keys(dailyUniqueSolves).sort((a, b) => new Date(b) - new Date(a));

        // ---------------------------------------------------------
        // ENGINE 1: BULLETPROOF STREAK TRACKER (Using absolute milliseconds)
        // ---------------------------------------------------------
        let currentStreak = 0;
        let maxStreak = 0;
        
        const yesterdayMs = todayMs - 86400000;
        const yesterdayStr = getLocalDateStr(yesterdayMs);
        
        let expectedNextStr = '';
        
        if (activeDays.includes(todayStr)) {
            currentStreak = 1;
            expectedNextStr = yesterdayStr;
        } else if (activeDays.includes(yesterdayStr)) {
            currentStreak = 1;
            expectedNextStr = getLocalDateStr(todayMs - (2 * 86400000));
        }
        
        if (currentStreak === 1) {
            let offsetDays = (expectedNextStr === yesterdayStr) ? 1 : 2;
            while (true) {
                const checkStr = getLocalDateStr(todayMs - (offsetDays * 86400000));
                if (activeDays.includes(checkStr)) {
                    currentStreak++;
                    offsetDays++;
                } else {
                    break;
                }
            }
        }

        let tempStreak = 0;
        let prevDateStr = null;
        const ascDates = [...activeDays].reverse();
        
        ascDates.forEach(dStr => {
            if (!prevDateStr) {
                tempStreak = 1;
            } else {
                // Parse strings as UTC noon to safely diff without Daylight Savings issues
                const currentD = new Date(dStr + "T12:00:00Z");
                const prevD = new Date(prevDateStr + "T12:00:00Z");
                const diffDays = Math.round((currentD - prevD) / 86400000);
                
                if (diffDays === 1) tempStreak++;
                else tempStreak = 1;
            }
            if (tempStreak > maxStreak) maxStreak = tempStreak;
            prevDateStr = dStr;
        });

        // ---------------------------------------------------------
        // ENGINE 2: 16-WEEK ACTIVITY HEATMAP (Absolute ms back-stepping)
        // ---------------------------------------------------------
        const heatmap = [];

        for (let i = 111; i >= 0; i--) {
            const targetDateMs = todayMs - (i * 86400000);
            const dStr = getLocalDateStr(new Date(targetDateMs));

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