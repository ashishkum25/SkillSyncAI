import {
    getAllInterviewReports,
    generateInterviewReport,
    getInterviewReportById,
    generateResumePdf,
    deleteInterviewReport,
    toggleSkillGapCompletion,
    getDashboard
} from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"
import toast from "react-hot-toast"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            toast.success("Interview plan generated! 🚀")
            return response.interviewReport
        } catch (error) {
            toast.error(error.message || "Failed to generate report. Please try again.")
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (id) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(id)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            toast.error(error.message || "Failed to load report.")
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (error) {
            toast.error(error.message || "Failed to load your reports.")
            return []
        } finally {
            setLoading(false)
        }
    }

    const deleteReport = async (id) => {
        try {
            await deleteInterviewReport(id)
            setReports(prev => prev.filter(r => r._id !== id))
            toast.success("Report deleted successfully.")
            return true
        } catch (error) {
            toast.error(error.message || "Failed to delete report.")
            return false
        }
    }

    const getResumePdf = async (interviewReportId) => {
        const toastId = toast.loading("Generating your resume PDF…")
        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([response], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success("Resume downloaded! 📄", { id: toastId })
        } catch (error) {
            toast.error(error.message || "Failed to generate PDF.", { id: toastId })
        }
    }

    /**
     * Toggle a skill gap's completed status.
     * Optimistically updates the report state so UI responds instantly.
     */
    const toggleSkillGap = async ({ interviewId, skillGapId }) => {
        // Optimistic update
        setReport(prev => {
            if (!prev) return prev
            return {
                ...prev,
                skillGaps: prev.skillGaps.map(g =>
                    (g._id === skillGapId || g.skill === skillGapId) ? { ...g, completed: !g.completed } : g
                )
            }
        })
        try {
            const response = await toggleSkillGapCompletion({ interviewId, skillGapId })
            // Sync with server truth
            setReport(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    skillGaps: prev.skillGaps.map(g =>
                        (g._id === skillGapId || g.skill === skillGapId) ? { ...g, completed: response.skillGap.completed } : g
                    )
                }
            })
        } catch (error) {
            // Revert optimistic update on failure
            setReport(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    skillGaps: prev.skillGaps.map(g =>
                        (g._id === skillGapId || g.skill === skillGapId) ? { ...g, completed: !g.completed } : g
                    )
                }
            })
            toast.error(error.message || "Failed to update skill gap.")
        }
    }

    /**
     * Fetch dashboard data (all reports with skill gaps + completion stats).
     */
    const fetchDashboard = async () => {
        setLoading(true)
        try {
            const response = await getDashboard()
            return response
        } catch (error) {
            toast.error(error.message || "Failed to load dashboard.")
            return null
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [interviewId])

    return { loading, report, reports, generateReport, getReportById, getReports, deleteReport, getResumePdf, toggleSkillGap, fetchDashboard }
}