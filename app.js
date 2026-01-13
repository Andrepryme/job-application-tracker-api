// load the express library and create server instance
const express = require("express");
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Import environment variables
const { NODE_ENV } = require("./config/env");
// Import the logging utility
const { logError, logInfo } = require("./utils/logger");

// Development logging middleware
if (NODE_ENV !== "production") {
    app.use((req, res, next) => {
        logInfo(`${req.method} ${req.originalUrl}`);
        next();
    });
}

// App-level routes health check
app.get('/', (req, res) => {
    return res.send('Job Application Tracker API is running!');
});


// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
    logError("UNHANDLED ERROR:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

// Export the app for use in other modules (e.g., server.js, tests)
module.exports = app;