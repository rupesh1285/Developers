const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport"); // 🌟 Added Passport for OAuth
const User = require("../models/User");
const protect = require("../middleware/authMiddleware"); // 👈 The Bouncer

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function redirectWithToken(res, user) {
    try {
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing");
            return res.redirect(`${FRONTEND_URL}/signin?error=server_error`);
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
        return res.redirect(`${FRONTEND_URL}/problems?token=${token}`);
    } catch (error) {
        console.error("OAuth JWT sign failed:", error);
        return res.redirect(`${FRONTEND_URL}/signin?error=server_error`);
    }
}

// ================= SIGNUP (Manual) =================
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, avatar } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            avatar: avatar || "" 
        });

        await newUser.save();

        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET, 
            { expiresIn: "30d" } 
        );

        res.status(201).json({
            message: "User registered successfully",
            token
        });

    } catch (error) {
        res.status(500).json({ message: "Server error during signup" });
    }
});

// ================= LOGIN (Manual) =================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // If user signed up with Google/GitHub, they might not have a password
        if (!user.password) {
            return res.status(400).json({ message: "Please log in using Google or GitHub." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET, 
            { expiresIn: "30d" }
        );

        res.json({
            message: "Login successful",
            token
        });

    } catch (error) {
        res.status(500).json({ message: "Server error during login" });
    }
});

// ================= GOOGLE OAUTH =================
// 1. React button sends user here
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

// 2. Google sends user back here
router.get("/google/callback", (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
        if (err) {
            console.error("Google OAuth Error:", err);
            return res.redirect(`${FRONTEND_URL}/signin?error=oauth_failed`);
        }
        if (!user) {
            console.error("Google OAuth: No user returned", info);
            return res.redirect(`${FRONTEND_URL}/signin?error=no_user`);
        }
        return redirectWithToken(res, user);
    })(req, res, next);
});

// ================= GITHUB OAUTH =================
// 1. React button sends user here
router.get("/github", passport.authenticate("github", { scope: ["user:email"], session: false }));

// 2. GitHub sends user back here
router.get("/github/callback", (req, res, next) => {
    passport.authenticate("github", { session: false }, (err, user, info) => {
        if (err) {
            console.error("GitHub OAuth Error:", err);
            return res.redirect(`${FRONTEND_URL}/signin?error=oauth_failed`);
        }
        if (!user) {
            console.error("GitHub OAuth: No user returned", info);
            return res.redirect(`${FRONTEND_URL}/signin?error=no_user`);
        }
        return redirectWithToken(res, user);
    })(req, res, next);
});

// ================= GET PROFILE =================
router.get("/profile", protect, async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching profile" });
    }
});

// ================= SAVE CLOUD NOTES =================
router.put("/notes", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.notes = req.body.notes;
        await user.save();
        
        res.json({ message: "Notes saved to cloud" });
    } catch (error) {
        res.status(500).json({ message: "Server error saving notes" });
    }
});

module.exports = router;