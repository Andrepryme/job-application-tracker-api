const jwt = require('jsonwebtoken');
// Secret key for JWT signing (in a real application, store this securely)
const { JWT_SECRET } = require("../config/env");
const { logInfo, logError } = require("../utils/logger");

// Middleware function to authenticate requests using JWT tokens
function authMiddleware (req, res, next) {
    //  Check if JWT secret is defined
    if (!JWT_SECRET) {
        // JWT secret is missing
        logInfo("JWT_SECRET is not defined in environment variables.");
        return res.status(500).json({ error: "Authentication failed." });
    }
    // Check if the request has headers
    if (!req.headers) {
        // Request headers are missing
        logInfo("Request headers are missing.");
        return res.status(401).json({ error: "Authentication failed." });
    }
    // Check if the Authorization header is present
    if (!req.headers.authorization) {
        // Authorization header is missing
        logInfo("Authorization header is missing.");
        return res.status(401).json({ error: "Authentication failed." });
    }
    // Get the Authorization header from the request
    const authHeader = req.headers.authorization;
    // Extract the token from the header
    const parts = authHeader.split(' ');
    // Validate the format of the Authorization header
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        // Invalid Authorization header format
        logInfo("Invalid Authorization header format.");
        return res.status(401).json({ error: "Authentication failed." });
    }
    // Extract the token from the header
    const token = parts[1];
    // Retrieve user by email from the database
    try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        // Check if the token is valid
        if (!decoded) {
            // Token is invalid
            logInfo("Token verification failed.");
            return res.status(401).json({ error: "Authentication failed." });
        }
        // Attach the decoded user information to the request object
        req.user = decoded;
        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        // Handle invalid token error
        if (err.name === "TokenExpiredError") {
            logInfo("Session expired.");
            return res.status(401).json({
                error: "Session expired, Please login!"
            });
        }
        logError("AUTH ERROR:", err);
        return res.status(401).json({ error: "Authentication failed." });
    }
};

module.exports = { authMiddleware };