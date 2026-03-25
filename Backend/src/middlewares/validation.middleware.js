const { validationResult } = require("express-validator")

/**
 * @description Middleware to handle express-validator errors.
 * Reads validation result from the request and returns 400 with error messages if any.
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        })
    }
    next()
}

module.exports = { handleValidationErrors }
