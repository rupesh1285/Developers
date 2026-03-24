const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("-password");

            if (!user) {
                console.log("🛑 AUTH ERROR: Token is valid, but User ID not found in database.");
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            req.user = user._id;
            next();

        } catch (error) {
            console.log("🛑 AUTH ERROR: Token verification failed ->", error.message);
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        console.log("🛑 AUTH ERROR: No token provided in the frontend request headers.");
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};

module.exports = protect;