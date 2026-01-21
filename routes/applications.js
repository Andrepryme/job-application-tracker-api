// load the express library and loads the method that handles the routes
const express = require("express");
const router = express.Router();

// Import database functions for Tasks
const {
    createApp,
    getAllApps,
    getAppById,
    updateAppStatus,
    deleteApp
} = require("../db/repositories/applications");

const {
    authMiddleware
 } = require("../middleware/auth");

const { 
    logError,
    logInfo
} = require("../utils/logger");

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

// Create an array of business status
let allStatus = [
    { id : 1, name: 'applied' },
    { id : 2, name: 'interview' },
    { id : 3, name: 'offered' },
    { id : 4, name: 'rejected' }
];
// Handles POST requests, and used to create data
router.post("/", async(req, res) => {
    // Extract user inputs from the request body
    const comapanyName = req.body.company_name;
    const roleTitle = req.body.role_title;
    // Validate user inputs
    if (!comapanyName) {
        return res.status(400).json({ error: "Comapany name is required" });
    }
    if (!roleTitle) {
        return res.status(400).json({ error: "Role title is required" });
    }
    // Set the default status for a new job application
    const defaultStatus = allStatus[0].name;
    // Insert the new application into the database
    try {
        const newApplication = await createApp(comapanyName, roleTitle, defaultStatus, req.user.userId);
        // Send the created application as JSON
        res.status(201).json(newApplication);
    } catch (err) {
        // Client & console log error message
        logError("CREATE ERROR:", err);
        res.status(500).json({ error: "Failed to create job application" });
    }
});

// Handle GET requests for /applications and sends data as JSON
router.get("/", async(req, res) => {
    // Prepares the limit parameter from the request query
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    // Prepares the offset parameter from the request query
    const offset = parseInt(req.query.offset) || 0;
    // Retrieve the applications from the database
    try {
        const allApplications = await getAllApps(req.user.userId, limit, offset);
        if (!allApplications) {
            return res.status(404).json({ error: "No applications found" });
        }
        // Send the applications as JSON
        res.json(allApplications);
    } catch (err) {
        // Client & console log error message
        logError("GET ALL ERROR:", err);
        res.status(500).json({ error: "Failed to retrieve applications" });
    }
});

// Handle GET requests for /tasks/:id and sends data as JSON
router.get("/:id", async(req, res) => {
    // Extract the task ID from the URL parameters
    const taskId = Number(req.params.id);
    // Validate the task ID
    if (Number.isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
    }
    // Retrieve the task from the database
    try {
        const thisTask = await getTaskById(taskId, req.user.userId);
        // If task not found, send 404 response
        if (!thisTask) {
            return res.status(404).json({ error: "Task not found" });
        }
        // Send the task as JSON
        res.status(200).json(thisTask);
    } catch (err) {
        // Console error for debugging
        logError("GET BY ID ERROR:", err);
        // Return a 500 error response
        res.status(500).json({ error: "Failed to retrieve task" });  
    }
});

// Handles PATCH requests for /application/:id to update a job application
router.patch("/:id", async(req, res) => {
    // Extract the application ID from the URL parameters
    const applicationId = Number(req.params.id);
    // Validate the application ID
    if (Number.isNaN(applicationId)) {
        return res.status(400).json({ error: "Invalid application ID" });
    }
    // Extract the status from the request body and trims the text
    const current_status = req.body.current_status.trim();
    // Validate the status
    if (!current_status) {
        return res.status(400).json({ error: "Job status is required" });
    }

    // Loop through the allStatus array
    // then check if request status matches on of business approved status
    // then fetch the statusId if found (this is incase the status name changes in the future) 
    // let newStatusId;
    // for (const status of allStatus) {
    //     if (status.name === current_status) {
    //          newStatusId = status.id;
    //         break;
    //     }
    // }

    // Checks the allStatus array to if request status matches one of business approved status
    const newStatus = allStatus.find(status => status.name === current_status)?.name;

    // Return 404 status code if request status does not match any of business approved status
    if (!newStatus) {
        logInfo(current_status + ' is a forbidden status');
        return res.status(404).json({
            error: "Forbidden status used!"
        });
    }
    // Update the application in the database
    try {
        // Get the application from the DB
        const jobApplication = await getAppById(applicationId, req.user.userId);
        // Check if it exists
        if (!jobApplication) {
            logInfo('Job application not found');
            return res.status(404).json({
                error: 'Job application not found'
            });
        }
        // Check that the new status and the old status are not the same
        if (newStatus === jobApplication.current_status) {
            logInfo('Choose a different status to complete the update');
            return res.status(400).json({
                error: 'Choose a different status to complete the update'
            });
        }
        // Update the DB with the new status
        const updatedApp = await updateAppStatus(
            applicationId,
            req.user.userId,
            jobApplication.current_status,
            newStatus
        );
        // If no rows were affected, the application was not found
        if (updatedApp === 0) {
            return res.status(404).json({ error: "Job application not found here" });
        }
        // Send the updated task as JSON
        res.status(200).json({ message: "Job application updated successfully", updatedApp });
    } catch (err) {
        logError("Failed to update job applications", err);
        res.status(500).json({ error: "Failed to update job application" });
    }
});

// Handle DELETE requests for /tasks/:id to delete a task
router.delete("/:id", async (req, res) => {
    // Extract the task ID from the URL parameters
    const taskId = Number(req.params.id);
    // Validate the task ID
    if (Number.isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
    }
    // Delete the task from the database
    try {
        const deletedTask = await deleteTask(taskId, req.user.userId);
        // If no rows were affected, the task was not found
        if (deletedTask === 0) {
            return res.status(404).json({ error: "Task not found" });
        }
        // Send a 204 No Content response        
        res.status(204).send();
    } catch (err) {
        // Console error for debugging
        console.error("DELETE ERROR:", err);
        // Return a 500 error response
        res.status(500).json({ error: "Failed to delete task" });
    }
});

// Server makes this router available to other files
module.exports = router;