const rateLimit = require("express-rate-limit")

/**
 * @description Rate limiter for authentication routes (login / register).
 * Allows at most 10 requests per 15 minutes per IP to prevent brute-force attacks.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { message: "Too many requests from this IP. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
})

/**
 * @description Rate limiter for the AI report generation endpoint.
 * Allows at most 5 report generations per 10 minutes per IP
 * to prevent abuse of expensive Gemini API calls.
 */
const reportGenerationLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    message: { message: "Too many reports generated. Please wait 10 minutes before generating another." },
    standardHeaders: true,
    legacyHeaders: false,
})

module.exports = { authLimiter, reportGenerationLimiter }
