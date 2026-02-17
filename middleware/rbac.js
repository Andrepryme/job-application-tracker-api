const { userHasPermission } = require("../db/rbac");

function requirePermission(permissionNames) {
  return async function (req, res, next) {
    try {
      const userId = req.user.userId;
      
      for (const thisPermission of permissionNames) {
        const allowed = await userHasPermission(userId, thisPermission);
        
        if (allowed) {
          req.matchedPermission = thisPermission;
          return next();
        }
      }

      console.error("Forbidden");
      return res.status(403).json({ error: "Forbidden: insufficient permission" });

    } catch (err) {
      console.error("RBAC ERROR:", err);
      res.status(500).json({ error: "Authorization check failed" });
    }
  };
}

module.exports = { requirePermission };