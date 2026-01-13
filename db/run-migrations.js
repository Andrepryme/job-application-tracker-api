// Import the file system
const fs = require("fs");
// Path handles file path safely accross Oses
const path = require("path");
// Database connection
const { pool } = require("./database");

async function runMigrations() {
    // Locate the migrations folder
    const migrationsPath = path.join(__dirname, "migrations");
    // Read migration files and execute in order
    const files = fs.readdirSync(migrationsPath).sort();
    // Loop one migration at a time
    for (const file of files) {
        const sql = fs.readFileSync(
            path.join(migrationsPath, file),
            "utf-8"
        );
        console.log(`Running migrations: ${file}`);
        await pool.query(sql);
    }

    console.log("All migrations completed");
    process.exit();
}

runMigrations().catch(err => {
    console.error("Migration failed", err);
    process.exit(1);
});