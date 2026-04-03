require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const jwt = require("jsonwebtoken");
const cors = require("cors"); // 🌟 ADDED: CORS for security

const progressRoutes = require("./routes/progressRoutes");
const problemRoutes = require("./routes/problemRoutes");
const authRoutes = require("./routes/authRoutes");
const protect = require("./middleware/authMiddleware");

const User = require("./models/User"); 

const app = express();

// 🌟 ADDED: CORS Configuration (Allows your React frontend to talk to this backend)
// It uses an environment variable, falling back to localhost for local testing
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

app.use('/api/workspace', require('./routes/workspaceRoutes'));
app.use('/api/ai', require('./routes/aiRoutes')); 

// ==========================================
// 🚀 GOOGLE OAUTH CONFIGURATION
// ==========================================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${BACKEND_URL}/api/auth/google/callback` // 🌟 FIX: Dynamic Backend URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "";

      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: Math.random().toString(36).slice(-10) + process.env.JWT_SECRET,
          avatar: avatarUrl 
        });
      } else {
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
    callbackURL: `${BACKEND_URL}/api/auth/github/callback` // 🌟 FIX: Dynamic Backend URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = (profile.emails && profile.emails.length > 0) 
        ? profile.emails[0].value 
        : `${profile.username}@github-placeholder.com`;

      let user = await User.findOne({ email: email });
      const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "";
      
      if (!user) {
        user = await User.create({
          name: profile.displayName || profile.username, 
          email: email,
          password: Math.random().toString(36).slice(-10) + process.env.JWT_SECRET,
          avatar: avatarUrl 
        });
      } else {
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
app.get("/api/auth/google", passport.authenticate("google", { 
  scope: ["profile", "email"], 
  session: false 
}));

app.get("/api/auth/google/callback", passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/signin` }), // 🌟 FIX: Dynamic Frontend URL
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.redirect(`${FRONTEND_URL}/problems?token=` + token); // 🌟 FIX: Dynamic Frontend URL
  }
);

// ==========================================
// 🚀 GITHUB OAUTH ROUTES
// ==========================================
app.get("/api/auth/github", passport.authenticate("github", { 
  scope: ["user:email"], 
  session: false 
}));

app.get("/api/auth/github/callback", passport.authenticate("github", { session: false, failureRedirect: `${FRONTEND_URL}/signin` }), // 🌟 FIX: Dynamic Frontend URL
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.redirect(`${FRONTEND_URL}/problems?token=` + token); // 🌟 FIX: Dynamic Frontend URL
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
  res.send("Finalist API Server Running");
});

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

// 🌟 FIX: Dynamic Port allocation for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});