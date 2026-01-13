// Import the app module
const app = require("./app");
// Import the PORT from environment configuration
const { PORT } = require("./config/env");
// Import the logging utility
const { logInfo } = require("./utils/logger");
// Start the server
app.listen(PORT, () => {
    logInfo(`Server running on port ${PORT}`);
});