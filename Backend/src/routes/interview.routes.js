const express = require("express")
const { body } = require("express-validator")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")
const { handleValidationErrors } = require("../middlewares/validation.middleware")
const { reportGenerationLimiter } = require("../middlewares/rateLimit.middleware")

const interviewRouter = express.Router()


/**
 * @route POST /api/interview/
 * @description Generate new interview report.
 * @access private
 */
interviewRouter.post(
    "/",
    authMiddleware.authUser,
    reportGenerationLimiter,
    upload.single("resume"),
    [body("jobDescription").trim().notEmpty().withMessage("Job description is required")],
    handleValidationErrors,
    interviewController.generateInterViewReportController
)

/**
 * @route GET /api/interview/dashboard
 * @description Get all skill gaps with resources + completion status across all user reports.
 * @access private
 */
interviewRouter.get("/dashboard", authMiddleware.authUser, interviewController.getDashboardController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description Get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)

/**
 * @route GET /api/interview/
 * @description Get all interview reports (summary) of logged in user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)

/**
 * @route DELETE /api/interview/:interviewId
 * @description Delete an interview report (owner only).
 * @access private
 */
interviewRouter.delete("/:interviewId", authMiddleware.authUser, interviewController.deleteInterviewReportController)

/**
 * @route PATCH /api/interview/:interviewId/skill-gap/:skillGapId/toggle
 * @description Toggle the completed status of a specific skill gap.
 * @access private
 */
interviewRouter.patch(
    "/:interviewId/skill-gap/:skillGapId/toggle",
    authMiddleware.authUser,
    interviewController.toggleSkillGapCompletionController
)

/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description Generate resume pdf.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)


module.exports = interviewRouter