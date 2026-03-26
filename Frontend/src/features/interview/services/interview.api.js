import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    withCredentials: true,
})

// Intercept responses to throw proper Error objects with backend messages.
// When responseType is "blob", error bodies are also Blobs — we must parse
// them as text/JSON to extract the real backend message.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const data = error.response?.data

        if (data instanceof Blob && data.type === "application/json") {
            try {
                const text = await data.text()
                const json = JSON.parse(text)
                return Promise.reject(new Error(json.message || "Something went wrong. Please try again."))
            } catch {
                return Promise.reject(new Error("Something went wrong. Please try again."))
            }
        }

        const message = data?.message || "Something went wrong. Please try again."
        return Promise.reject(new Error(message))
    }
)


/**
 * @description Generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    if (selfDescription) formData.append("selfDescription", selfDescription)
    if (resumeFile) formData.append("resume", resumeFile)

    const response = await api.post("/api/interview/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })

    return response.data
}


/**
 * @description Get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)
    return response.data
}


/**
 * @description Get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")
    return response.data
}


/**
 * @description Delete an interview report by id.
 */
export const deleteInterviewReport = async (interviewId) => {
    const response = await api.delete(`/api/interview/${interviewId}`)
    return response.data
}


/**
 * @description Generate resume PDF based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })
    return response.data
}

/**
 * @description Toggle the completed flag of a skill gap subdocument.
 */
export const toggleSkillGapCompletion = async ({ interviewId, skillGapId }) => {
    const response = await api.patch(`/api/interview/${interviewId}/skill-gap/${skillGapId}/toggle`)
    return response.data
}

/**
 * @description Get the full dashboard data: all reports with skill gaps, resources, and completion stats.
 */
export const getDashboard = async () => {
    const response = await api.get("/api/interview/dashboard")
    return response.data
}