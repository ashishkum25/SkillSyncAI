import { useContext, useEffect } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe, updateProfile } from "../services/auth.api";



export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context
    const navigate = useNavigate()


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
            toast.success("Welcome back! 👋")
            navigate("/")
        } catch (err) {
            toast.error(err.message || "Login failed. Please check your credentials.")
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
            toast.success("Account created successfully! 🎉")
            navigate("/")
        } catch (err) {
            toast.error(err.message || "Registration failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
            toast.success("Logged out successfully.")
            navigate("/login")
        } catch (err) {
            toast.error(err.message || "Logout failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (payload) => {
        try {
            const data = await updateProfile(payload)
            setUser(data.user)
            toast.success("Profile updated successfully! ✅")
            return true
        } catch (err) {
            toast.error(err.message || "Failed to update profile.")
            return false
        }
    }

    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe()
                setUser(data.user)
            } catch (err) {
                // silently fail — user is not logged in
            } finally {
                setLoading(false)
            }
        }
        getAndSetUser()
    }, [])

    return { user, loading, handleRegister, handleLogin, handleLogout, handleUpdateProfile }
}