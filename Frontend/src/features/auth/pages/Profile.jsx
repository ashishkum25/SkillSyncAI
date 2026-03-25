import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import '../profile.scss'

const Profile = () => {
    const { user, handleUpdateProfile, handleLogout, loading } = useAuth()
    const navigate = useNavigate()

    const [username, setUsername] = useState(user?.username || "")
    const [email, setEmail] = useState(user?.email || "")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        const payload = {}
        if (username !== user.username) payload.username = username
        if (email !== user.email) payload.email = email
        if (newPassword) {
            payload.currentPassword = currentPassword
            payload.newPassword = newPassword
        }

        if (Object.keys(payload).length === 0) {
            setSaving(false)
            return
        }

        const success = await handleUpdateProfile(payload)
        if (success) {
            setCurrentPassword("")
            setNewPassword("")
        }
        setSaving(false)
    }

    return (
        <div className='profile-page'>
            <div className='profile-container'>
                {/* Header */}
                <div className='profile-header'>
                    <button className='back-btn' onClick={() => navigate('/')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        Back to Home
                    </button>
                    <div className="global-brand-badge" style={{ marginBottom: "1rem" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                        <span>SkillSyncAI</span>
                    </div>
                    <h1>Account Settings</h1>
                    <p>Manage your profile details and password.</p>
                </div>

                <form className='profile-form' onSubmit={handleSubmit}>

                    {/* Avatar Section */}
                    <div className='profile-avatar-section'>
                        <div className='profile-avatar'>
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2>{user?.username}</h2>
                            <p>{user?.email}</p>
                        </div>
                    </div>

                    <div className='profile-divider' />

                    {/* Profile Info */}
                    <div className='profile-section'>
                        <h3 className='profile-section__title'>Profile Information</h3>

                        <div className='profile-field'>
                            <label htmlFor='profile-username'>Username</label>
                            <input
                                id='profile-username'
                                type='text'
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder='Enter username'
                            />
                        </div>

                        <div className='profile-field'>
                            <label htmlFor='profile-email'>Email Address</label>
                            <input
                                id='profile-email'
                                type='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='Enter email address'
                            />
                        </div>
                    </div>

                    <div className='profile-divider' />

                    {/* Password Change */}
                    <div className='profile-section'>
                        <h3 className='profile-section__title'>Change Password</h3>
                        <p className='profile-section__subtitle'>Leave blank if you don't want to change your password.</p>

                        <div className='profile-field'>
                            <label htmlFor='current-password'>Current Password</label>
                            <input
                                id='current-password'
                                type='password'
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder='Enter current password'
                            />
                        </div>

                        <div className='profile-field'>
                            <label htmlFor='new-password'>New Password</label>
                            <input
                                id='new-password'
                                type='password'
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder='At least 6 characters'
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className='profile-actions'>
                        <button type='submit' className='button primary-button' disabled={saving}>
                            {saving ? "Saving…" : "Save Changes"}
                        </button>
                        <button
                            type='button'
                            className='button logout-button'
                            onClick={handleLogout}
                            disabled={loading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            Logout
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Profile
