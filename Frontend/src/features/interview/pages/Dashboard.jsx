import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useInterview } from '../hooks/useInterview.js'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { toggleSkillGapCompletion } from '../services/interview.api.js'
import toast from 'react-hot-toast'
import '../style/dashboard.scss'

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 }

const RESOURCE_META = {
    youtube:       { label: 'YouTube',  color: '#fc8181' },
    documentation: { label: 'Docs',     color: '#63b3ed' },
    article:       { label: 'Article',  color: '#68d391' },
    course:        { label: 'Course',   color: '#f6ad55' },
}

const Dashboard = () => {
    const { fetchDashboard, loading } = useInterview()
    const { user } = useAuth()
    const navigate = useNavigate()

    const [data, setData] = useState(null)
    const [filter, setFilter] = useState('all')      // all | pending | completed
    const [expandedGaps, setExpandedGaps] = useState({})  // { [gapId]: bool }
    const [togglingId, setTogglingId] = useState(null)

    useEffect(() => {
        fetchDashboard().then(res => setData(res))
    }, [])

    const handleToggle = async (reportId, gapId) => {
        setTogglingId(gapId)
        try {
            const res = await toggleSkillGapCompletion({ interviewId: reportId, skillGapId: gapId })
            setData(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    globalStats: {
                        ...prev.globalStats,
                        completedSkillGaps: prev.globalStats.completedSkillGaps + (res.skillGap.completed ? 1 : -1)
                    },
                    reports: prev.reports.map(r =>
                        r.reportId === reportId
                            ? {
                                ...r,
                                skillGaps: r.skillGaps.map(g => (g._id === gapId || g.skill === gapId) ? { ...g, completed: res.skillGap.completed } : g),
                                completedGaps: r.skillGaps.filter(g => (g._id === gapId || g.skill === gapId) ? res.skillGap.completed : g.completed).length
                            }
                            : r
                    )
                }
            })
        } catch (err) {
            toast.error(err.message || "Failed to update skill gap.")
        } finally {
            setTogglingId(null)
        }
    }

    const toggleExpand = (gapId) => {
        setExpandedGaps(prev => ({ ...prev, [gapId]: !prev[gapId] }))
    }

    if (loading || !data) {
        return (
            <main className='db-loading'>
                <div className='loading-spinner' />
                <p>Loading your skills dashboard…</p>
            </main>
        )
    }

    const { globalStats, reports } = data
    const overallPct = globalStats.totalSkillGaps > 0
        ? Math.round((globalStats.completedSkillGaps / globalStats.totalSkillGaps) * 100)
        : 0

    // Flatten all skill gaps across reports with their report context
    const allGaps = reports.flatMap(r =>
        r.skillGaps.map(g => ({ ...g, reportId: r.reportId, reportTitle: r.title }))
    ).sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

    const filteredGaps = allGaps.filter(g => {
        if (filter === 'pending') return !g.completed
        if (filter === 'completed') return g.completed
        return true
    })

    return (
        <div className='dashboard-page'>

            {/* Header */}
            <header className='db-header'>
                <div className='db-header__left'>
                    <button className='db-back-btn' onClick={() => navigate('/')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        Back to Home
                    </button>
                    <div>
                        <div className="global-brand-badge" style={{ marginBottom: "1rem" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                            <span>SkillSyncAI</span>
                        </div>
                        <h1>Skills Dashboard</h1>
                        <p>Track your learning progress across all interview plans.</p>
                    </div>
                </div>
                <Link to="/profile" className='db-avatar' title="Account Settings">
                    {user?.username?.charAt(0).toUpperCase()}
                </Link>
            </header>

            {/* Global Stats Cards */}
            <div className='db-stats-row'>
                <div className='db-stat-card'>
                    <span className='db-stat-card__value'>{globalStats.totalReports}</span>
                    <span className='db-stat-card__label'>Interview Plans</span>
                </div>
                <div className='db-stat-card'>
                    <span className='db-stat-card__value'>{globalStats.totalSkillGaps}</span>
                    <span className='db-stat-card__label'>Total Skill Gaps</span>
                </div>
                <div className='db-stat-card db-stat-card--success'>
                    <span className='db-stat-card__value'>{globalStats.completedSkillGaps}</span>
                    <span className='db-stat-card__label'>Skills Mastered</span>
                </div>
                <div className='db-stat-card db-stat-card--accent'>
                    <span className='db-stat-card__value'>{overallPct}%</span>
                    <span className='db-stat-card__label'>Overall Progress</span>
                </div>
            </div>

            {/* Overall Progress Bar */}
            <div className='db-overall-progress'>
                <div className='db-overall-progress__bar'>
                    <div className='db-overall-progress__fill' style={{ width: `${overallPct}%` }} />
                </div>
                <span className='db-overall-progress__label'>
                    {globalStats.completedSkillGaps} of {globalStats.totalSkillGaps} skills completed
                </span>
            </div>

            {/* Per-report mini progress */}
            {reports.length > 0 && (
                <div className='db-reports-row'>
                    {reports.map(r => {
                        const pct = r.totalGaps > 0 ? Math.round((r.completedGaps / r.totalGaps) * 100) : 0
                        return (
                            <Link to={`/interview/${r.reportId}`} key={r.reportId} className='db-report-card'>
                                <div className='db-report-card__top'>
                                    <span className='db-report-card__title'>{r.title}</span>
                                    <span className='db-report-card__pct'>{pct}%</span>
                                </div>
                                <div className='db-report-card__bar'>
                                    <div className='db-report-card__fill' style={{ width: `${pct}%` }} />
                                </div>
                                <span className='db-report-card__sub'>{r.completedGaps}/{r.totalGaps} skills done</span>
                            </Link>
                        )
                    })}
                </div>
            )}

            {/* Filter Tabs */}
            <div className='db-filters'>
                {['all', 'pending', 'completed'].map(f => (
                    <button
                        key={f}
                        className={`db-filter-btn ${filter === f ? 'db-filter-btn--active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        <span className='db-filter-btn__count'>
                            {f === 'all' ? allGaps.length : f === 'pending' ? allGaps.filter(g => !g.completed).length : allGaps.filter(g => g.completed).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Skill Gaps List */}
            {filteredGaps.length === 0 ? (
                <div className='db-empty'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    <p>{filter === 'completed' ? "No completed skills yet — start learning!" : "All skills are completed! 🎉"}</p>
                </div>
            ) : (
                <div className='db-gap-list'>
                    {filteredGaps.map(gap => {
                        const gapId = gap._id || gap.skill
                        const isExpanded = expandedGaps[gapId]
                        return (
                            <div key={gapId} className={`db-gap-card ${gap.completed ? 'db-gap-card--done' : ''}`}>
                                <div className='db-gap-card__main'>
                                    {/* Checkbox */}
                                    <button
                                        className={`db-check ${gap.completed ? 'db-check--done' : ''}`}
                                        onClick={() => handleToggle(gap.reportId, gapId)}
                                        disabled={togglingId === gapId}
                                        title={gap.completed ? "Mark as incomplete" : "Mark as complete"}
                                    >
                                        {togglingId === gapId ? (
                                            <span className='db-check__spinner' />
                                        ) : gap.completed ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        ) : null}
                                    </button>

                                    {/* Skill info */}
                                    <div className='db-gap-card__info'>
                                        <span className={`db-gap-card__skill ${gap.completed ? 'db-gap-card__skill--done' : ''}`}>{gap.skill}</span>
                                        <Link to={`/interview/${gap.reportId}`} className='db-gap-card__report' onClick={e => e.stopPropagation()}>
                                            {gap.reportTitle}
                                        </Link>
                                    </div>

                                    <span className={`severity-badge severity-badge--${gap.severity}`}>{gap.severity}</span>

                                    {/* Resources toggle */}
                                    {gap.resources?.length > 0 && (
                                        <button className='db-resources-btn' onClick={() => toggleExpand(gapId)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                            {gap.resources.length} resources
                                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points={isExpanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} /></svg>
                                        </button>
                                    )}
                                </div>

                                {/* Resource links */}
                                {isExpanded && gap.resources?.length > 0 && (
                                    <div className='db-gap-card__resources'>
                                        {gap.resources.map((res, i) => {
                                            const m = RESOURCE_META[res.type] || RESOURCE_META.article
                                            return (
                                                <a
                                                    key={i}
                                                    href={res.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className='db-resource-link'
                                                >
                                                    <span className='db-resource-link__badge' style={{ color: m.color, borderColor: m.color + '50' }}>
                                                        {m.label}
                                                    </span>
                                                    <div className='db-resource-link__text'>
                                                        <span className='db-resource-link__title'>{res.title}</span>
                                                        {res.description && <span className='db-resource-link__desc'>{res.description}</span>}
                                                    </div>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                                                </a>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default Dashboard
