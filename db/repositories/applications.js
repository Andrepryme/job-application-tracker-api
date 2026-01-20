const { pool } = require('../database');

//defaultStatus = applied | interview | offer | rejected
let defaultStatus = 'applied';

// Function to create a new job application
async function createApp(comapanyName, roleTitle, user_id) {
    const sql = "INSERT INTO job_applications (company_name, role_title, current_status, user_id) VALUES ($1, $2, $3, $4) RETURNING *";
    const result = await pool.query(sql, [comapanyName, roleTitle, defaultStatus, user_id]);
    return result.rows[0];
}

// Function to get a job application by ID
async function getAppById(id, user_id) {
    const sql = "SELECT * FROM job_applications WHERE id = $1 AND user_id = $2";
    const result = await pool.query(sql, [id, user_id]);
    return result.rows[0] || null;
}

// Function to get all job applications
async function getAllApps(user_id, limit, offset) {
    const sql =`
        SELECT *
        FROM job_applications
        WHERE user_id = $1
        ORDER by created_at DESC
        LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(sql, [user_id, limit, offset]);
    return result.rows || null;
}

// Function to update a job application
async function updateAppStatus(applicationId, userId, newStatus) {
    const { thisPool } = require('../database');
    try {
        await thisPool.query('BEGIN');

        // 1. Get current status (ownership enforced)
        const currentStatus = await thisPool.query(
            `
                SELECT current_status
                FROM job_applications
                WHERE id = $1 AND user_id = $2
            `,
            [applicationId, userId]
        );
        if (currentStatus.rowCount === 0) {
            throw new Error('Application not found');
        }
        const oldStatus = currentResult.rows[0].current_status;
        // 2. Update current status
        await thisPool.query(
            `
            UPDATE job_applications
            SET curent_status = $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3
            `,
            [newStatus, applicationId, userId]
        );

        // 3. Insert history
        await thisPool.query(
            `
            INSERT INTO application_status_history
            (application_is, old_status, new_status)
            VALUES ($1, $2, $3)
            `,
            [applicationId, oldStatus, newStatus]
        );
        await thisPool.query('COMMIT');
        return { oldStatus, newStatus };
    } catch (err) {
        await thisPool.query('ROLLBACK');
        throw err;
    } finally {
        thisPool.release();
    }
}

// Function to delete a job application by ID
async function deleteApp(id, user_id) {
    const sql = "DELETE FROM job_applications WHERE id = $1 AND user_id = $2";
    const result = await pool.query(sql, [id, user_id]);
    return result.rowCount; 
}   

module.exports = {
    createApp,
    getAllApps,
    getAppById,
    updateAppStatus,
    deleteApp
}