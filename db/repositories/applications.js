const { pool } = require('../database');

// Create an array of business status
const allStatus = [
    { id : 1, name: 'applied' },
    { id : 2, name: 'interview' },
    { id : 3, name: 'offer' },
    { id : 4, name: 'accepted' },
    { id : 5, name: 'rejected' }
];

const statusTransitions = {
    applied: ['interview', 'rejected'],
    interview: ['offer', 'rejected'],
    offer: ['accepted', 'rejected'],
    accepted: [],
    rejected: []
};

// Function to create a new job application
async function createApp(comapanyName, roleTitle, user_id) {
    const defaultStatus = allStatus[0].name;
    const sql = "INSERT INTO job_applications (company_name, role_title, current_status, user_id) VALUES ($1, $2, $3, $4) RETURNING *";
    const result = await pool.query(
        sql,
        [comapanyName, roleTitle, defaultStatus, user_id]
    );
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
    const client = await pool.connect();
    
    // Checks the allStatus array to if request status matches one of business approved status
    const approvedNewStatus = allStatus.find(aStatus => aStatus.name === newStatus)?.name;

    // Return 404 status code if request status does not match any of business approved status
    if (!approvedNewStatus) {
        throw new Error('InvalidStatus');
    }

    try {
        await client.query('BEGIN');

        // 1. Get current status (ownership enforced)
        const currentStatus = await client.query(
            `
                SELECT current_status
                FROM job_applications
                WHERE id = $1 AND user_id = $2
                FOR UPDATE
            `,
            [applicationId, userId]
        );
        // Ensure the job application exists before proceeding
        if (currentStatus.rowCount === 0) {
            throw new Error('ApplicationNotFound');
        }

        const oldStatus = currentStatus.rows[0].current_status;

        // Check that the new status and the old status are not the same
        if (newStatus === oldStatus) {
            throw new Error('SameStatusAsOld');
        }

        // Transition validation
        const allowedTransitions = statusTransitions[oldStatus] || [];
        if (!allowedTransitions.includes(approvedNewStatus)) {
         throw new Error('InvalidTransition');
        }

        // 2. Update current status
         const updatedResult = await client.query(
            `
            UPDATE job_applications
            SET current_status = $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3
            `,
            [approvedNewStatus, applicationId, userId]
        );

        // Ensure update was successful before inserting history
        if (updatedResult.rowCount === 0) {
            throw new Error('UpdateFailed');
        }

        // 3. Insert history
        await client.query(
            `
            INSERT INTO application_status_history
            (application_id, old_status, new_status)
            VALUES ($1, $2, $3)
            `,
            [applicationId, oldStatus, approvedNewStatus]
        );
        await client.query('COMMIT');
        return { applicationId, oldStatus, approvedNewStatus };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
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