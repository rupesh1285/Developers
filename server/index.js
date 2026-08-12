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
const runRoutes = require("./routes/runRoutes");
const protect = require("./middleware/authMiddleware");

const User = require("./models/User"); 

const app = express();

// Render sits behind a proxy; needed so OAuth callback URLs stay https
app.set("trust proxy", 1);

// 🌟 ADDED: CORS Configuration (Allows your React frontend to talk to this backend)
// It uses an environment variable, falling back to localhost for local testing
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

const mongoStates = ["disconnected", "connected", "connecting", "disconnecting"];

// 🌟 THE PULSE ENDPOINT: Keeps Render awake without touching MongoDB
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'alive',
        mongo: mongoStates[mongoose.connection.readyState] || "unknown",
        time: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    // This line will make it show up in the Render logs!
    console.log(`[${new Date().toISOString()}] ⚡ Ping received! Keeping server awake.`); 
    
    res.status(200).send('Finalist API Server Running');
});
// 🌟 FIX: Allow both the live Vercel site AND your local Vite server
app.use(cors({
  origin: [FRONTEND_URL, "http://localhost:5173"], 
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
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      if (!email) {
        return done(new Error("Google did not return an email"), null);
      }

      let user = await User.findOne({ email });
      const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "";

      if (!user) {
        user = await User.create({
          name: profile.displayName || email.split("@")[0],
          email,
          password: Math.random().toString(36).slice(-10) + (process.env.JWT_SECRET || "oauth"),
          avatar: avatarUrl 
        });
      } else if (avatarUrl && user.avatar !== avatarUrl) {
        user.avatar = avatarUrl;
        await user.save();
      }
      return done(null, user);
    } catch (error) {
      console.error("Google verify callback failed:", error);
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
          name: profile.displayName || profile.username || email.split("@")[0], 
          email: email,
          password: Math.random().toString(36).slice(-10) + (process.env.JWT_SECRET || "oauth"),
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

app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/run", runRoutes);

async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Google login and all DB routes will fail.");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }
}

mongoose.connection.on("disconnected", () => {
  console.error("MongoDB disconnected");
});
mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err.message);
});

connectDB();

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

// Never show Express's blank "Internal Server Error" page for OAuth
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (req.path && req.path.startsWith("/api/auth/")) {
    return res.redirect(`${FRONTEND_URL}/signin?error=server_error`);
  }
  if (res.headersSent) return next(err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

// 🌟 FIX: Dynamic Port allocation for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});