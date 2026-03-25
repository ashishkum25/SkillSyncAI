const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")


async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body

        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ username }, { email }]
        })
        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        const hash = await bcrypt.hash(password, 10)
        const user = await userModel.create({ username, email, password: hash })

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )
        res.cookie("token", token, { httpOnly: true })

        res.status(201).json({
            message: "User registered successfully",
            user: { id: user._id, username: user.username, email: user.email }
        })
    } catch (err) {
        res.status(500).json({ message: "Server error. Please try again." })
    }
};


async function loginUserController(req, res) {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )
        res.cookie("token", token, { httpOnly: true })

        res.status(200).json({
            message: "User loggedIn successfully.",
            user: { id: user._id, username: user.username, email: user.email }
        })
    } catch (err) {
        res.status(500).json({ message: "Server error. Please try again." })
    }
};


/**
 * @name logoutUserController
 * @description Clear token from user cookie and add the token in blacklist.
 */
async function logoutUserController(req, res) {
    try {
        const token = req.cookies.token
        if (token) {
            await tokenBlacklistModel.create({ token })
        }
        res.clearCookie("token")
        res.status(200).json({ message: "User logged out successfully" })
    } catch (err) {
        res.status(500).json({ message: "Server error. Please try again." })
    }
};


/**
 * @name getMeController
 * @description Get the current logged in user details.
 */
async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id)
        if (!user) {
            return res.status(404).json({ message: "User not found." })
        }
        res.status(200).json({
            message: "User details fetched successfully",
            user: { id: user._id, username: user.username, email: user.email }
        })
    } catch (err) {
        res.status(500).json({ message: "Server error. Please try again." })
    }
};


/**
 * @name updateProfileController
 * @description Update the logged-in user's username, email, or password.
 */
async function updateProfileController(req, res) {
    try {
        const { username, email, currentPassword, newPassword } = req.body
        const user = await userModel.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ message: "User not found." })
        }

        // Update username if provided
        if (username) {
            const exists = await userModel.findOne({ username, _id: { $ne: user._id } })
            if (exists) {
                return res.status(400).json({ message: "Username is already taken." })
            }
            user.username = username
        }

        // Update email if provided
        if (email) {
            const exists = await userModel.findOne({ email, _id: { $ne: user._id } })
            if (exists) {
                return res.status(400).json({ message: "Email is already in use." })
            }
            user.email = email
        }

        // Update password if provided
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required to set a new password." })
            }
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
            if (!isPasswordValid) {
                return res.status(400).json({ message: "Current password is incorrect." })
            }
            user.password = await bcrypt.hash(newPassword, 10)
        }

        await user.save()

        res.status(200).json({
            message: "Profile updated successfully.",
            user: { id: user._id, username: user.username, email: user.email }
        })
    } catch (err) {
        res.status(500).json({ message: "Server error. Please try again." })
    }
}


module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
    updateProfileController
};