const adminMiddleware = (req, res, next) => {
    const adminEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

    if (adminEmails.length === 0) {
        return res.status(503).json({ message: "Admin routes are disabled. Set ADMIN_EMAILS on the server." });
    }

    if (!req.user?.email || !adminEmails.includes(req.user.email.toLowerCase())) {
        return res.status(403).json({ message: "Admin access required" });
    }

    next();
};

module.exports = adminMiddleware;
