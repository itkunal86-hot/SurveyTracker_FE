import express from "express";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - firstName
 *         - lastName
 *         - password
 *         - role
 *         - company
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User's password
 *         role:
 *           type: string
 *           enum: [MANAGER, SURVEY MANAGER]
 *           description: User's role in the system
 *         company:
 *           type: string
 *           description: User's company
 *     UserRegisterResponse:
 *       type: object
 *       properties:
 *         status_code:
 *           type: number
 *           example: 200
 *         status_message:
 *           type: string
 *           example: "success"
 *         message:
 *           type: string
 *           example: "User registered successfully"
 *         data:
 *           type: string
 *           example: "user_id_123"
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user identifier
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         role:
 *           type: string
 *           enum: [ADMIN, MANAGER, SURVEY MANAGER]
 *           description: User's role in the system
 *         company:
 *           type: string
 *           description: User's company
 *         isActive:
 *           type: boolean
 *           description: Whether the user account is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the user was created
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the user last logged in
 */

// Mock user storage (in production, this would be a database)
let users = [
  {
    id: "1",
    email: "john.smith@company.com",
    firstName: "John",
    lastName: "Smith",
    role: "ADMIN",
    company: "Infrastep",
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    lastLogin: "2024-08-29T09:30:00Z",
  },
  {
    id: "2",
    email: "sarah.johnson@company.com",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "MANAGER",
    company: "Infrastep",
    isActive: true,
    createdAt: "2024-02-20T14:30:00Z",
    lastLogin: "2024-08-28T16:45:00Z",
  },
  {
    id: "3",
    email: "mike.wilson@company.com",
    firstName: "Mike",
    lastName: "Wilson",
    role: "SURVEY MANAGER",
    company: "Infrastep",
    isActive: true,
    createdAt: "2024-03-10T09:15:00Z",
    lastLogin: "2024-08-29T08:15:00Z",
  },
  {
    id: "4",
    email: "emily.davis@company.com",
    firstName: "Emily",
    lastName: "Davis",
    role: "SURVEY MANAGER",
    company: "Infrastep",
    isActive: false,
    createdAt: "2024-01-25T11:20:00Z",
    lastLogin: "2024-08-25T13:30:00Z",
  },
];

let nextUserId = 5;

/**
 * @swagger
 * /api/User/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 200
 *                 status_message:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 401
 *                 status_message:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Invalid email or password"
 *                 data:
 *                   type: string
 *                   example: null
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 400
 *                 status_message:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Email and password are required"
 *                 data:
 *                   type: string
 *                   example: null
 */
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Email and password are required",
        data: null,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Invalid email format",
        data: null,
      });
    }

    // Find user by email
    const user = users.find(user => user.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({
        status_code: 401,
        status_message: "error",
        message: "Invalid email or password",
        data: null,
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status_code: 401,
        status_message: "error",
        message: "Account is inactive. Please contact administrator.",
        data: null,
      });
    }

    // In a real implementation, you would hash and compare passwords
    // For this mock implementation, we'll assume password validation passes
    // TODO: Add proper password hashing and validation

    // Update last login
    const userIndex = users.findIndex(u => u.id === user.id);
    // if (userIndex !== -1) {
    //   users[userIndex].lastLogin = new Date().toISOString();
    // }

    // Remove sensitive information before sending response
    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      company: user.company,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: userIndex !== -1 ? users[userIndex]?.lastLogin : null,

      //lastLogin: users[userIndex]?.lastLogin,
    };

    console.log(`✅ User logged in: ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);

    res.status(200).json({
      status_code: 200,
      status_message: "success",
      message: "Login successful",
      data: safeUser,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      status_code: 500,
      status_message: "error",
      message: "Internal server error",
      data: null,
    });
  }
});

/**
 * @swagger
 * /api/User/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Initiate password reset process by sending reset instructions to user's email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Password reset instructions sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 200
 *                 status_message:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Password reset instructions sent to your email"
 *                 data:
 *                   type: string
 *                   example: "reset_token_id"
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 400
 *                 status_message:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Invalid email format"
 *                 data:
 *                   type: string
 *                   example: null
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 404
 *                 status_message:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "No account found with this email address"
 *                 data:
 *                   type: string
 *                   example: null
 */
router.post("/forgot-password", (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Email is required",
        data: null,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Invalid email format",
        data: null,
      });
    }

    // Find user by email
    const user = users.find(user => user.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(404).json({
        status_code: 404,
        status_message: "error",
        message: "No account found with this email address",
        data: null,
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Account is inactive. Please contact administrator.",
        data: null,
      });
    }

    // In a real implementation, you would:
    // 1. Generate a secure reset token
    // 2. Store it in database with expiration time
    // 3. Send email with reset link
    // For this mock implementation, we'll simulate the process

    const resetTokenId = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🔐 Password reset requested for: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`📧 Mock: Reset instructions would be sent to ${email}`);
    console.log(`🎫 Reset token generated: ${resetTokenId}`);

    res.status(200).json({
      status_code: 200,
      status_message: "success",
      message: "Password reset instructions sent to your email",
      data: resetTokenId,
    });
  } catch (error) {
    console.error("Error processing forgot password request:", error);
    res.status(500).json({
      status_code: 500,
      status_message: "error",
      message: "Internal server error",
      data: null,
    });
  }
});

/**
 * @swagger
 * /api/User/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset user password using a valid reset token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               token:
 *                 type: string
 *                 description: Password reset token received via email
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password for the user
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 200
 *                 status_message:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *                 data:
 *                   type: string
 *                   example: "user_id"
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 400
 *                 status_message:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "All fields are required"
 *                 data:
 *                   type: string
 *                   example: null
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 401
 *                 status_message:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired reset token"
 *                 data:
 *                   type: string
 *                   example: null
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 404
 *                 status_message:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "No account found with this email address"
 *                 data:
 *                   type: string
 *                   example: null
 */
router.post("/reset-password", (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    // Validation
    if (!email || !token || !newPassword) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "All fields are required: email, token, newPassword",
        data: null,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Invalid email format",
        data: null,
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "New password must be at least 6 characters long",
        data: null,
      });
    }

    // Find user by email
    const userIndex = users.findIndex(user => user.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      return res.status(404).json({
        status_code: 404,
        status_message: "error",
        message: "No account found with this email address",
        data: null,
      });
    }

    const user = users[userIndex];

    // Check if user is active
    if (!user?.isActive) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Account is inactive. Please contact administrator.",
        data: null,
      });
    }

    // In a real implementation, you would:
    // 1. Validate the reset token against stored tokens in database
    // 2. Check token expiration time
    // 3. Ensure token hasn't been used already
    // 4. Hash the new password before storing
    // For this mock implementation, we'll simulate basic token validation

    // Basic token format validation (should start with "reset_" for this demo)
    if (!token.startsWith("reset_")) {
      return res.status(401).json({
        status_code: 401,
        status_message: "error",
        message: "Invalid or expired reset token",
        data: null,
      });
    }

    // Simulate token expiration check (tokens older than 1 hour in real implementation)
    const tokenTimestamp = token.split("_")[1];
    if (tokenTimestamp) {
      const tokenTime = parseInt(tokenTimestamp);
      const currentTime = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

      if (currentTime - tokenTime > oneHour) {
        return res.status(401).json({
          status_code: 401,
          status_message: "error",
          message: "Reset token has expired. Please request a new one.",
          data: null,
        });
      }
    }

    // Update user password (in real implementation, this would be hashed)
    // For demo purposes, we're not actually storing the password
    console.log(`🔐 Password reset completed for: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`🎫 Token used: ${token}`);
    console.log(`🔑 New password would be set (length: ${newPassword.length} characters)`);

    res.status(200).json({
      status_code: 200,
      status_message: "success",
      message: "Password reset successfully",
      data: user.id,
    });
  } catch (error) {
    console.error("Error processing password reset:", error);
    res.status(500).json({
      status_code: 500,
      status_message: "error",
      message: "Internal server error",
      data: null,
    });
  }
});

/**
 * @swagger
 * /api/User/change-password:
 *   post:
 *     summary: Change password
 *     description: Change user password using current password for authentication
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               currentPassword:
 *                 type: string
 *                 description: User's current password
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password for the user
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 200
 *                 status_message:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *                 data:
 *                   type: string
 *                   example: "user_id"
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 400
 *                 status_message:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "All fields are required"
 *                 data:
 *                   type: string
 *                   example: null
 *       401:
 *         description: Invalid current password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 401
 *                 status_message:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Current password is incorrect"
 *                 data:
 *                   type: string
 *                   example: null
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 404
 *                 status_message:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "No account found with this email address"
 *                 data:
 *                   type: string
 *                   example: null
 */
router.post("/change-password", (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // Validation
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "All fields are required: email, currentPassword, newPassword",
        data: null,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Invalid email format",
        data: null,
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "New password must be at least 6 characters long",
        data: null,
      });
    }

    // Check if new password is same as current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "New password must be different from current password",
        data: null,
      });
    }

    // Find user by email
    const userIndex = users.findIndex(user => user.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      return res.status(404).json({
        status_code: 404,
        status_message: "error",
        message: "No account found with this email address",
        data: null,
      });
    }

    const user = users[userIndex];

    // Check if user is active
    if (!user?.isActive) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Account is inactive. Please contact administrator.",
        data: null,
      });
    }

    // In a real implementation, you would:
    // 1. Hash and compare the current password with stored hash
    // 2. Hash the new password before storing
    // For this mock implementation, we'll simulate password verification
    // Since we don't store actual passwords, we'll accept any current password

    console.log(`🔐 Password change requested for: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`🔑 Current password verification: simulated (length: ${currentPassword.length} characters)`);
    console.log(`🔑 New password would be set (length: ${newPassword.length} characters)`);

    res.status(200).json({
      status_code: 200,
      status_message: "success",
      message: "Password changed successfully",
      data: user.id,
    });
  } catch (error) {
    console.error("Error processing password change:", error);
    res.status(500).json({
      status_code: 500,
      status_message: "error",
      message: "Internal server error",
      data: null,
    });
  }
});

/**
 * @swagger
 * /api/User/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new manager or survey manager user account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegisterRequest'
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserRegisterResponse'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 400
 *                 status_message:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 data:
 *                   type: string
 *                   example: null
 *       409:
 *         description: Conflict - email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 409
 *                 status_message:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Email already exists"
 *                 data:
 *                   type: string
 *                   example: null
 */
router.post("/register", (req, res) => {
  try {
    const { email, firstName, lastName, password, role, company } = req.body;

    // Validation
    if (!email || !firstName || !lastName || !password || !role || !company) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "All fields are required: email, firstName, lastName, password, role, company",
        data: null,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Invalid email format",
        data: null,
      });
    }

    // Validate role
    if (!["MANAGER", "SURVEY MANAGER"].includes(role)) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Role must be either MANAGER or SURVEY MANAGER",
        data: null,
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Password must be at least 6 characters long",
        data: null,
      });
    }

    // Check if email already exists
    const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        status_code: 409,
        status_message: "error",
        message: "Email already exists",
        data: null,
      });
    }

    // Create new user
    const newUser = {
      id: nextUserId.toString(),
      email: email.toLowerCase(),
      firstName,
      lastName,
      role,
      company,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: "",
    };

    users.push(newUser);
    nextUserId++;

    console.log(`✅ New user registered: ${firstName} ${lastName} (${email}) - Role: ${role}`);

    res.status(200).json({
      status_code: 200,
      status_message: "success",
      message: "User registered successfully",
      data: newUser.id,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      status_code: 500,
      status_message: "error",
      message: "Internal server error",
      data: null,
    });
  }
});

/**
 * @swagger
 * /api/User:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users with optional filtering
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, MANAGER, SURVEY MANAGER]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by user status
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Filter by company
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 200
 *                 status_message:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Users retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get("/", (req, res) => {
  try {
    const { role, isActive, company } = req.query;
    
    let filteredUsers = [...users];

    // Apply filters
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    if (isActive !== undefined) {
      const isActiveBoolean = isActive === "true";
      filteredUsers = filteredUsers.filter(user => user.isActive === isActiveBoolean);
    }
    
    if (company) {
      filteredUsers = filteredUsers.filter(user => 
        user.company.toLowerCase().includes(company.toString().toLowerCase())
      );
    }

    // Remove sensitive information (passwords would be excluded in real implementation)
    const safeUsers = filteredUsers.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      company: user.company,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    }));

    res.status(200).json({
      status_code: 200,
      status_message: "success",
      message: "Users retrieved successfully",
      data: safeUsers,
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({
      status_code: 500,
      status_message: "error",
      message: "Internal server error",
      data: null,
    });
  }
});

/**
 * @swagger
 * /api/User/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status_code:
 *                   type: number
 *                   example: 200
 *                 status_message:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "User retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({
        status_code: 404,
        status_message: "error",
        message: "User not found",
        data: null,
      });
    }

    // Remove sensitive information
    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      company: user.company,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };

    res.status(200).json({
      status_code: 200,
      status_message: "success",
      message: "User retrieved successfully",
      data: safeUser,
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({
      status_code: 500,
      status_message: "error",
      message: "Internal server error",
      data: null,
    });
  }
});

/**
 * @swagger
 * /api/User/{id}:
 *   put:
 *     summary: Update user
 *     description: Update an existing user's information
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [MANAGER, SURVEY MANAGER]
 *               company:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already exists
 */
router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, company, isActive } = req.body;

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        status_code: 404,
        status_message: "error",
        message: "User not found",
        data: null,
      });
    }

    // Check if email already exists (excluding current user)
    if (email) {
      const existingUser = users.find(user => 
        user.email.toLowerCase() === email.toLowerCase() && user.id !== id
      );
      if (existingUser) {
        return res.status(409).json({
          status_code: 409,
          status_message: "error",
          message: "Email already exists",
          data: null,
        });
      }
    }

    // Validate role if provided
    if (role && !["MANAGER", "SURVEY MANAGER"].includes(role)) {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Role must be either MANAGER or SURVEY MANAGER",
        data: null,
      });
    }

    // Update user
    const updatedUser = {
      ...users[userIndex],
      ...(email && { email: email.toLowerCase() }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(role && { role }),
      ...(company && { company }),
      ...(isActive !== undefined && { isActive }),
    };

    users[userIndex] = updatedUser;

    console.log(`✅ User updated: ${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.email})`);

    res.status(200).json({
      status_code: 200,
      status_message: "success",
      message: "User updated successfully",
      data: updatedUser.id,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      status_code: 500,
      status_message: "error",
      message: "Internal server error",
      data: null,
    });
  }
});

/**
 * @swagger
 * /api/User/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user account (Admin users cannot be deleted)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete admin user
 *       404:
 *         description: User not found
 */
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        status_code: 404,
        status_message: "error",
        message: "User not found",
        data: null,
      });
    }

    // Prevent deletion of admin users
    if (users[userIndex]?.role === "ADMIN") {
      return res.status(400).json({
        status_code: 400,
        status_message: "error",
        message: "Admin users cannot be deleted",
        data: null,
      });
    }

    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);

    console.log(`🗑️ User deleted: ${deletedUser?.firstName} ${deletedUser?.lastName} (${deletedUser?.email})`);

    res.status(200).json({
      status_code: 200,
      status_message: "success",
      message: "User deleted successfully",
      data: deletedUser?.id,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      status_code: 500,
      status_message: "error",
      message: "Internal server error",
      data: null,
    });
  }
});

export { router as userRoutes };
