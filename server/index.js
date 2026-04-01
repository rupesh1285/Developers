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

const User = require("./models/User"); 

const app = express();

app.use(express.json());
// 🌟 DELETED: app.use(express.static("client")); because we trashed that folder!

app.use('/api/workspace', require('./routes/workspaceRoutes'));
app.use('/api/ai', require('./routes/aiRoutes')); 

// ==========================================
// 🚀 GOOGLE OAUTH CONFIGURATION
// ==========================================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/auth/google/callback" 
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
    callbackURL: "http://localhost:5000/api/auth/github/callback"
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

// 🌟 THE FIX: Ensure failureRedirect points to React!
app.get("/api/auth/google/callback", passport.authenticate("google", { session: false, failureRedirect: "http://localhost:5173/signin" }), 
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.redirect('http://localhost:5173/problems?token=' + token);
  }
);

// ==========================================
// 🚀 GITHUB OAUTH ROUTES
// ==========================================
app.get("/api/auth/github", passport.authenticate("github", { 
  scope: ["user:email"], 
  session: false 
}));

// 🌟 THE FIX: Ensure failureRedirect points to React!
app.get("/api/auth/github/callback", passport.authenticate("github", { session: false, failureRedirect: "http://localhost:5173/signin" }), 
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.redirect('http://localhost:5173/problems?token=' + token);
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