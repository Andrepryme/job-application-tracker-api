// Import express and create a new router instance
const express = require("express");
const router = express.Router();
// Import bcrypt for password hashing
const bcrypt = require("bcrypt");
// Import jsonwebtoken for token generation
const jwt = require("jsonwebtoken");
// Secret key for JWT signing
const { JWT_SECRET } = require("../config/env");
// Import logger
const {logInfo, logError } = require("../utils/logger")

// Import database function to create a user
const {
  createUser,
  getUserByEmail
} = require("../db/repositories/users");

// Test route to verify the auth router is working
router.get("/", async(req, res) => {
  res.send("Auth route is working");
});

// Route to handle user registration
router.post("/register", async (req, res) => {
  // Validate request body
  if (!req.body) {
    // Client & console log error message
    logInfo("Missing request body error");
    return res.status(400).json({ error: "Request body is missing" });
  }
  // Extract email and password from the request body
  const { email, password } = req.body;
  // Basic validation for email and password
  if (!email || !password) {
    // Client & console log error message
    logInfo("Missing email or password error");
    return res.status(400).json({ error: "Email and password are required" });
  }
  // Attempt to create a new user
  try {
    // Hash the password before storing it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hashSync(password, saltRounds);
    // Call the createUser function from the database module
    const newUser = await createUser(email, hashedPassword);
    // Successful response
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id, email: newUser.email
      }
    });
  } catch (err) {
    // Handle unique constraint violation for email
    if (err.code === '23505') {
      // Client & console log error message
      logInfo("Email already exist")
      return res.status(409).json({ error: "Email already exists" });
    }
    // Client & console log error message
    logError("Error registering user", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Route to handle user login
router.post('/login', async (req, res) => {
  // Validate request body
  if (!req.body) {
    // Client & console log error message
    logInfo("Missing request body error");
    return res.status(400).json({ error: "Request body is missing" });
  }
  // Extract email and password from the request body
  const { email, password } = req.body;
  // Basic validation for email and password
  if (!email || !password) {
    // Client & console log error message
    logInfo("Missing email or password error");
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    // Retrieve user by email
    const thisUser = await getUserByEmail(email);
    if (!thisUser) {
      // Client & console log error message
      logInfo("User not found error");
      return res.status(401).json({ error: "Invalid email or password" });
    }
    // Compare provided password with stored password hash
    const passwordMatch = await bcrypt.compare(password, thisUser.password_hash);
    if (!passwordMatch) {
      // Client & console log error message
      logInfo("Invalid email or password");
      return res.status(401).json({ error: "Invalid email or password" });
    }
    // Generate JWT token
    const token = jwt.sign(
      { userId: thisUser.id, email: thisUser.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    // Successful login response
    res.json({ 
      message: "Login successful",
      user: { id: thisUser.id, email: thisUser.email },
      token
    });
  } catch (err) {
    // Client & console log error message
    logError("Error logging in user:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Export the router to be used in the main application
module.exports = router;