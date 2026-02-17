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
async function getAppById(id, user_id, permission) {
    let sql, result;
    if (permission === "read_own_application") {
        sql = ` SELECT * FROM job_applications WHERE id = $1 AND user_id = $2 `;
        result = await pool.query(sql, [id, user_id]);
    } else if (permission === "read_all_applications") {
        sql =` SELECT * FROM job_applications WHERE id = $1 `;
        result = await pool.query(sql, [id]);
    } else {
        throw new Error("ForbiddenOwnership");
    }
    return result.rows[0] || null;
}

// Function to get all job applications
async function getAllApps(user_id, limit, offset, permission) {
    let sql, result;
    if (permission === "read_own_application") {
        sql = `
            SELECT *
            FROM job_applications
            WHERE user_id = $1
            ORDER by created_at DESC
            LIMIT $2 OFFSET $3
        `;
        result = await pool.query(sql, [user_id, limit, offset]);
    } else if (permission === "read_all_applications") {
        sql =`
            SELECT *
            FROM job_applications
            ORDER by created_at DESC
            LIMIT $1 OFFSET $2
        `;
        result = await pool.query(sql, [limit, offset]);
    } else {
        throw new Error("ForbiddenOwnership");
    }
    return result.rows || null;
}

// Function to update a job application
async function updateApp(id, fields, user_id) {
    // Build the SQL query dynamically based on provided fields
    const updates = [];
    // Parameters array for the SQL query
    const values = [];
    // paramIndex tracks placeholder
    let paramIndex = 1;

    // Only update the company_name if it's provided
    if (fields.company_name !== undefined) {
        updates.push(`company_name = $${paramIndex}`);
        values.push(fields.company_name);
        paramIndex++;
    }
    // Only update the role_title if it's provided
    if (fields.role_title !== undefined) {
        updates.push(`role_title = $${paramIndex}`);
        values.push(fields.role_title);
        paramIndex++;
    }

    // If there are fields to update, update the updated_at else return early
    if (updates.length !== 0) {
        const currentTimeStamp = new Date();
        updates.push(`updated_at  = $${paramIndex}`);
        values.push(currentTimeStamp);
    } else {
        return null;
    }

    const sql = `
        UPDATE job_applications
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex + 1}
        AND user_id = $${paramIndex + 2}
        RETURNING *;
    `;
    // Add the applications ID and user ID to the parameters array
    values.push(id, user_id);
    const result = await pool.query(sql, values);
    return result.rows[0] || null;
}  

// Function to update a job application status
async function updateAppStatus(applicationId, newStatus) {
    // Checks the allStatus array to if request status matches one of business approved status
    const businessStatus = allStatus.find(aStatus => aStatus.name === newStatus)?.name;

    //  Check for valid status
    if (!businessStatus) {
        throw new Error('InvalidStatus');
    }

    // Begin update transaction
    const client = await pool.connect();
    try { 
        await client.query('BEGIN');

        // 1. Get current status and lock row
        const adminSql = ` SELECT * FROM job_applications WHERE id = $1 FOR UPDATE `;
        const adminResult = await client.query(adminSql, [applicationId]);

        // Ensure the job application exists before proceeding
        if (adminResult.rowCount === 0) {
            throw new Error('ApplicationNotFound');
        }

        const oldStatus = adminResult.rows[0].current_status;

        // Check that the new status and the old status are not the same
        if (newStatus === oldStatus) {
            throw new Error('SameStatusAsOld');
        }

        // Transition validation
        const allowedTransitions = statusTransitions[oldStatus] || [];
        if (!allowedTransitions.includes(businessStatus)) {
        throw new Error('InvalidTransition');
        }

        // 2. Update current status
        const updatedResult = await client.query(
            `
            UPDATE job_applications
            SET current_status = $1, updated_at = NOW()
            WHERE id = $2
            `,
            [businessStatus, applicationId]
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
            [applicationId, oldStatus, businessStatus]
        );
        await client.query('COMMIT');
        return { applicationId, oldStatus, businessStatus };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

// Function to delete a job application by ID
async function deleteApp(id, user_id, permission) {

    let sql, result;
    if (permission === "delete_own_application") {
        sql = ` DELETE FROM job_applications WHERE id = $1 AND user_id = $2 `;
        result = await pool.query(sql, [id, user_id]);
    } else if (permission === "delete_any_application") {
        // sql =` DELETE FROM job_applications WHERE id = $1 AND user_id = $2 `;
        // result = await pool.query(sql, [id]);
        throw new Error("WorkInProgress");
    } else {
        throw new Error("ForbiddenOwnership");
    }
    return result.rowCount; 
}   

module.exports = {
    createApp,
    getAllApps,
    getAppById,
    updateApp,
    updateAppStatus,
    deleteApp
}