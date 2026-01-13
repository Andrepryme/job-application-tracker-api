// Import the PostGres module
const { Pool } = require("pg");

const { logInfo, logError } = require("../utils/logger");

// Import database configuration from environment variables
const {
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD 
} = require("../config/env");

let pool;
// Create a new PostgreSQL connection pool
if  (process.env.DATABASE_URL) {
    // Render / Production
    pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false, },
    });
} else {
    // Local development
    pool = new Pool({
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        user: DB_USER,
        password: DB_PASSWORD
    });
}

pool.on("connect", () => {
    logInfo("Connected to the PostgreSQL database");
});


pool.on("error", (err) => {
    logError("Unexpected PostGresSQL error", err);
    process.exit(-1);
});

// Export the pool for use in other modules
module.exports = { pool };