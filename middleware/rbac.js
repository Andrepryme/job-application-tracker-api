const { logInfo } = require("../utils/logger");

// Middleware function to authenticate requests using JWT tokens
function requireRole (...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            logInfo("Access denied");
            return res.status(403).json({ 
                error: 'Access denied'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            logInfo("Insufficient permission");
            return res.status(403).json({ 
                error: 'Insufficient permission'
            });
        }

        next();
    };
}

module.exports = { requireRole };