import React, { useState } from 'react'
import { Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleLogin({ email, password })
    }

    if (loading) {
        return (
            <main className="auth-main">
                <div className="form-container">
                    <div className="auth-spinner" />
                </div>
            </main>
        )
    }

    return (
        <main className="auth-main">
            <div className="auth-brand">
                <svg className="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                <h1 className="brand-name">SkillSyncAI</h1>
                <p className="brand-tagline">AI-Powered Interview Preparation</p>
            </div>
            <div className="form-container">
                <h2>Welcome Back</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address'
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password'
                            required
                        />
                    </div>
                    <button type="submit" className='button primary-button' disabled={loading}>
                        {loading ? "Logging in…" : "Login"}
                    </button>
                </form>
                <div className="auth-links">
                    Don't have an account? <Link to={"/register"}>Register</Link>
                </div>
            </div>
        </main>
    )
}

export default Login