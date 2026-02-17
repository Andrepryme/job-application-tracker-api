const { pool } = require("./database");

async function userHasPermission(userId, permissionName) {
    const result = await pool.query(
        `
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = $1
        AND p.name = $2
        LIMIT 1
        `,
        [userId, permissionName]
    );

    return result.rowCount > 0;
}

module.exports = { userHasPermission };