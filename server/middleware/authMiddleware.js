const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // 1. Get the token from the header
            token = req.headers.authorization.split(" ")[1];

            // 2. Verify the token using the secret from .env
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Find the user in Database (exclude password field)
            const user = await User.findById(decoded.id).select("-password");

            // Safety check: ensure user still exists in DB
            if (!user) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            // 4. Attach the user ID to the request object
            req.user = user._id;

            next();

        } catch (error) {
            // Token is invalid, expired, or signature doesn't match
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        // No token provided in the header
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};

module.exports = protect;