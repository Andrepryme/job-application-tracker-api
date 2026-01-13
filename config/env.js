// Determine the current environment
const nodeEnv = process.env.NODE_ENV || 'development';
// Load environment variables from .env file in non-production environments
if (nodeEnv !== 'production') {
    require("dotenv").config();

    // Validate required environment variables
    const requiredVars = [
        'PORT',
        'JWT_SECRET',
        'DB_HOST',
        'DB_PORT',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD'
    ];

    // Check for missing variables
    for (const key of requiredVars) {
        if (!process.env[key]) {
            console.log(`Missing required environment variable ${key}`);
            process.exit(1);
        }
    }
}

// Export the validated environment variables
module.exports = {
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD
};