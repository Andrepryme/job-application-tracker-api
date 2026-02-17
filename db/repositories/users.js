const { pool } = require('../database');

// Function to create a new user
async function createUser(email, password) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Create user
        const userResult = await client.query(
            `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email`,
            [email, password]);
        const userId = userResult.rows[0].id;

        // Assign default role = "user"
        await client.query(
            `INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE name = 'user' `,
            [userId]
        );

        await client.query("COMMIT");

        return userResult.rows[0];

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

// Function to get a user by email
async function getUserByEmail(email) {
    const sql = "SELECT * FROM users WHERE email = $1 ";
    const result = await pool.query(sql, [email]);
    return result.rows[0] || null;
}

module.exports = {
  createUser,
  getUserByEmail
};
