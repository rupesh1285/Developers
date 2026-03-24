require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const jwt = require("jsonwebtoken");

const progressRoutes = require("./routes/progressRoutes");
const problemRoutes = require("./routes/problemRoutes");
const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");

// IMPORT YOUR USER MODEL HERE (Adjust path if needed)
const User = require("./models/User"); 

const app = express();

app.use(express.json());
app.use(express.static("client"));
// Add this near your other app.use() statements in server.js
app.use('/api/workspace', require('./routes/workspaceRoutes'));
app.use('/api/ai', require('./routes/aiRoutes')); // 🌟 NEW AI ROUTE

// ==========================================
// 🚀 GOOGLE OAUTH CONFIGURATION
// ==========================================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // Make sure this exact URL is pasted in your Google Cloud Console!
    callbackURL: "http://localhost:5000/api/auth/google/callback" 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. Check if user already exists in your database
      let user = await User.findOne({ email: profile.emails[0].value });
      
      // 🌟 Extract the Google Avatar URL safely
      const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "";

      if (!user) {
        // 2. If they are new, create a FINALIST account for them WITH the avatar
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: Math.random().toString(36).slice(-10) + process.env.JWT_SECRET,
          avatar: avatarUrl // 👈 Saves the image!
        });
      } else {
        // 🌟 BONUS: If they already exist but don't have an avatar (or changed it), update it!
        if (avatarUrl && user.avatar !== avatarUrl) {
            user.avatar = avatarUrl;
            await user.save();
        }
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// ==========================================
// 🚀 GITHUB OAUTH CONFIGURATION
// ==========================================
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // GitHub sometimes hides emails based on user privacy settings
      const email = (profile.emails && profile.emails.length > 0) 
        ? profile.emails[0].value 
        : `${profile.username}@github-placeholder.com`;

      let user = await User.findOne({ email: email });
      
      // 🌟 Extract the GitHub Avatar URL safely
      const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "";
      
      if (!user) {
        user = await User.create({
          name: profile.displayName || profile.username, // Fallback to username
          email: email,
          password: Math.random().toString(36).slice(-10) + process.env.JWT_SECRET,
          avatar: avatarUrl // 👈 Saves the image!
        });
      } else {
        // 🌟 BONUS: Update existing GitHub users with their profile picture
        if (avatarUrl && user.avatar !== avatarUrl) {
            user.avatar = avatarUrl;
            await user.save();
        }
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

app.use(passport.initialize());

// ==========================================
// 🚀 GOOGLE OAUTH ROUTES
// ==========================================

// Route A: User clicks "Continue with Google" -> Sends them to Google
app.get("/api/auth/google", passport.authenticate("google", { 
  scope: ["profile", "email"], 
  session: false 
}));

// Route B: Google redirects back here -> Generate JWT & Send to Dashboard
app.get("/api/auth/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/login.html" }), 
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.redirect(`/problems.html?token=${token}`);
  }
);

// ==========================================
// 🚀 GITHUB OAUTH ROUTES
// ==========================================

// Route A: User clicks "Continue with GitHub"
app.get("/api/auth/github", passport.authenticate("github", { 
  scope: ["user:email"], 
  session: false 
}));

// Route B: GitHub redirects back here
app.get("/api/auth/github/callback", passport.authenticate("github", { session: false, failureRedirect: "/login.html" }), 
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.redirect(`/problems.html?token=${token}`);
  }
);

// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/progress", progressRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});