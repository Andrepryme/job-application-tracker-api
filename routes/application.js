// load the express library and loads the method that handles the routes
const express = require("express");
const router = express.Router();

// Import database functions for Tasks
const {
    createApp,
    getAllApps,
    getAppById,
    updateApp,
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

// Handles POST requests, and used to create data
router.post("/", async(req, res) => {
    // Extract title from the request body
    const title = req.body.title;
    // Validate the title
    if (!title) {
        return res.status(400).json({ error: "Title is required" });
    }
    // Insert the new task into the database
    try {
        const newTask = await createApp(title, req.user.userId);
        // Send the created task as JSON
        res.status(201).json(newTask);
    } catch (err) {
        // Client & console log error message
        logError("CREATE ERROR:", err);
        res.status(500).json({ error: "Failed to create task" });
    }
});

// Handle GET requests for /tasks and sends data as JSON
router.get("/", async(req, res) => {
    // Prepares the limit parameter from the request query
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    // Prepares the offset parameter from the request query
    const offset = parseInt(req.query.offset) || 0;
    // Retrieve the task from the database
    try {
        const allTasks = await getAllTasks(req.user.userId, limit, offset);
        if (!allTasks) {
            return res.status(404).json({ error: "No tasks found" });
        }
        // Send the task as JSON
        res.json(allTasks);
    } catch (err) {
        // Client & console log error message
        logError("GET ALL ERROR:", err);
        res.status(500).json({ error: "Failed to retrieve tasks" });
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

// Handle PATCH requests for /tasks/:id to update a task
router.patch("/:id", async(req, res) => {
    // Extract the task ID from the URL parameters
    const taskId = Number(req.params.id);
    // Validate the task ID
    if (Number.isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
    }
    // Extract fields to update from the request body
    const { title, completed } = req.body;

    // Validate that at least one field to update is provided
    if (title  === undefined && completed === undefined) {
        return res.status(400).json({
            error: "Title or completed must be provided"
        });
    }
    // Update the task in the database
    try {
        const updatedTask = await updateTask(
            taskId,
            { title, completed },
            req.user.userId
        );
        // If no rows were affected, the task was not found
        if (updatedTask === 0) {
            return res.status(404).json({ error: "Task not found" });
        }
        // Send the updated task as JSON
        res.status(200).json({ message: "Task updated successfully", updatedTask });
    } catch (err) {
        logError("Failed to update task", err);
        res.status(500).json({ error: "Failed to update task" });
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