const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")



/**
 * @description Controller to generate interview report.
 * Resume is optional — if not uploaded, selfDescription is used instead.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription, jobDescription } = req.body

        // Resume is optional: parse it only when a file was uploaded
        let resumeText = ""
        if (req.file && req.file.buffer) {
            // Dynamic require avoids pdf-parse's test-PDF loader running at startup (causes crash on Render)
            // pdf-parse v2.x uses ESM-style default export, so unwrap it if needed
            const pdfParseModule = require("pdf-parse")
            const pdfParse = pdfParseModule.default || pdfParseModule
            const parsed = await pdfParse(req.file.buffer)
            resumeText = parsed.text
        }

        if (!resumeText && !selfDescription) {
            return res.status(400).json({
                message: "Please provide either a resume (PDF) or a self description."
            })
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("generateInterViewReportController error:", err)
        res.status(500).json({ message: "Failed to generate interview report. Please try again." })
    }
}


/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (err) {
        res.status(500).json({ message: "Server error. Please try again." })
    }
}


/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (err) {
        res.status(500).json({ message: "Server error. Please try again." })
    }
}


/**
 * @description Controller to delete an interview report (owner only).
 */
async function deleteInterviewReportController(req, res) {
    try {
        const { interviewId } = req.params
        const interviewReport = await interviewReportModel.findOneAndDelete({
            _id: interviewId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found or you are not authorized to delete it." })
        }

        res.status(200).json({ message: "Interview report deleted successfully." })
    } catch (err) {
        res.status(500).json({ message: "Server error. Please try again." })
    }
}


/**
 * @description Controller to generate resume PDF.
 * Authorization check: only the owner of the report can generate the PDF.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        // Fix: check ownership with req.user.id to prevent unauthorized access
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found or you are not authorized." })
        }

        const { resume, jobDescription, selfDescription } = interviewReport
        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (err) {
        console.error("generateResumePdfController error:", err)
        res.status(500).json({ message: "Failed to generate resume PDF. Please try again." })
    }
}


/**
 * @description Toggle the completed status of a specific skill gap within a report.
 * Uses the subdocument _id to locate the exact skill gap.
 */
async function toggleSkillGapCompletionController(req, res) {
    try {
        const { interviewId, skillGapId } = req.params

        const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })
        if (!report) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        let skillGap = report.skillGaps.id(skillGapId)
        if (!skillGap) {
            // Fallback for older reports without _id
            skillGap = report.skillGaps.find(g => g.skill === skillGapId)
        }

        if (!skillGap) {
            return res.status(404).json({ message: "Skill gap not found." })
        }

        skillGap.completed = !skillGap.completed
        await report.save()

        res.status(200).json({
            message: `Skill gap marked as ${skillGap.completed ? "completed" : "incomplete"}.`,
            skillGap
        })
    } catch (err) {
        console.error("toggleSkillGapCompletionController error:", err)
        res.status(500).json({ message: "Server error. Please try again." })
    }
}


/**
 * @description Returns a dashboard summary: all skill gaps across all reports
 * with their completion status, resources, severity, and per-report grouping.
 */
async function getDashboardController(req, res) {
    try {
        const reports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("title matchScore skillGaps createdAt")

        const dashboardData = reports.map(report => ({
            reportId: report._id,
            title: report.title,
            matchScore: report.matchScore,
            createdAt: report.createdAt,
            skillGaps: report.skillGaps.map(gap => ({
                _id: gap._id,
                skill: gap.skill,
                severity: gap.severity,
                completed: gap.completed,
                resources: gap.resources
            })),
            totalGaps: report.skillGaps.length,
            completedGaps: report.skillGaps.filter(g => g.completed).length
        }))

        const globalStats = {
            totalReports: reports.length,
            totalSkillGaps: dashboardData.reduce((acc, r) => acc + r.totalGaps, 0),
            completedSkillGaps: dashboardData.reduce((acc, r) => acc + r.completedGaps, 0),
        }

        res.status(200).json({
            message: "Dashboard data fetched successfully.",
            globalStats,
            reports: dashboardData
        })
    } catch (err) {
        res.status(500).json({ message: "Server error. Please try again." })
    }
}


module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    deleteInterviewReportController,
    generateResumePdfController,
    toggleSkillGapCompletionController,
    getDashboardController
}