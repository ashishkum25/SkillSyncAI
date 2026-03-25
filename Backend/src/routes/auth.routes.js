const { Router } = require('express')
const { body } = require("express-validator")
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middlewares/auth.middleware")
const { handleValidationErrors } = require("../middlewares/validation.middleware")
const { authLimiter } = require("../middlewares/rateLimit.middleware")

const authRouter = Router()


/**
 * @route POST /api/auth/register
 * @description Register a new user.
 */
authRouter.post(
    "/register",
    authLimiter,
    [
        body("username").trim().notEmpty().withMessage("Username is required"),
        body("email").isEmail().withMessage("Please provide a valid email address"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    ],
    handleValidationErrors,
    authController.registerUserController
)

/**
 * @route POST /api/auth/login
 * @description Login a user.
 */
authRouter.post(
    "/login",
    authLimiter,
    [
        body("email").isEmail().withMessage("Please provide a valid email address"),
        body("password").notEmpty().withMessage("Password is required"),
    ],
    handleValidationErrors,
    authController.loginUserController
)

/**
 * @route GET /api/auth/logout
 * @description Logout the current user.
 */
authRouter.get("/logout", authController.logoutUserController)

/**
 * @route GET /api/auth/get-me
 * @description Get current logged-in user details.
 */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)

/**
 * @route PUT /api/auth/update-profile
 * @description Update username or email for the logged-in user.
 */
authRouter.put(
    "/update-profile",
    authMiddleware.authUser,
    [
        body("username").optional().trim().notEmpty().withMessage("Username cannot be empty"),
        body("email").optional().isEmail().withMessage("Please provide a valid email address"),
        body("currentPassword").optional().notEmpty().withMessage("Current password is required to change password"),
        body("newPassword").optional().isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
    ],
    handleValidationErrors,
    authController.updateProfileController
)


module.exports = authRouter;