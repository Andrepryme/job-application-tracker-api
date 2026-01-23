const { pool } = require('../database');

// Function to create a new user
async function createUser(email, password) {
    const sql = "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, user_role";
    const result = await pool.query(sql, [email, password]);
    return result.rows[0];
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
