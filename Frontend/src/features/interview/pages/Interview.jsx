import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams, Link } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth.js'


const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

const getScoreLabel = (score) => {
    if (score >= 80) return "Strong match for this role 🎯"
    if (score >= 60) return "Good match — some gaps to address"
    if (score >= 40) return "Moderate match — focused prep needed"
    return "Stretch role — significant prep required"
}

// Resource type icon + colour
const RESOURCE_META = {
    youtube: { label: 'YouTube', color: '#fc8181', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.71C13.9 2.51 11.38 2 9 2 4.7 2 1 5.7 1 10s3.7 8 8 8c2.38 0 4.9-.51 6.82-2 .8-.58 1.58-1.37 2.05-2.26A4.83 4.83 0 0 1 21.5 12c1.38 0 2.5-1.12 2.5-2.5S22.88 7 21.5 7a4.85 4.85 0 0 1-1.91-.31z" /></svg>) },
    documentation: { label: 'Docs', color: '#63b3ed', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>) },
    article: { label: 'Article', color: '#68d391', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>) },
    course: { label: 'Course', color: '#f6ad55', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>) },
}

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => (
                <li key={i}>
                    <span className='roadmap-day__bullet' />
                    {task}
                </li>
            ))}
        </ul>
    </div>
)

// ── Skill Gap Card (with resources + mark complete) ───────────────────────────
const SkillGapCard = ({ gap, interviewId, onToggle }) => {
    const [open, setOpen] = useState(false)
    const meta = RESOURCE_META
    const gapId = gap._id || gap.skill

    return (
        <div className={`sg-card ${gap.completed ? 'sg-card--done' : ''}`}>
            <div className='sg-card__header'>
                <button
                    className={`sg-card__check ${gap.completed ? 'sg-card__check--done' : ''}`}
                    onClick={() => onToggle({ interviewId, skillGapId: gapId })}
                    title={gap.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                    {gap.completed && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                </button>
                <span className={`sg-card__name ${gap.completed ? 'sg-card__name--done' : ''}`}>{gap.skill}</span>
                <span className={`skill-tag skill-tag--${gap.severity}`}>{gap.severity}</span>
                {gap.resources?.length > 0 && (
                    <button className='sg-card__toggle' onClick={() => setOpen(o => !o)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} /></svg>
                        {gap.resources.length} resources
                    </button>
                )}
            </div>

            {open && gap.resources?.length > 0 && (
                <div className='sg-card__resources'>
                    {gap.resources.map((res, i) => {
                        const m = meta[res.type] || meta.article
                        return (
                            <a
                                key={i}
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className='sg-resource'
                            >
                                <span className='sg-resource__type' style={{ color: m.color, borderColor: m.color }}>
                                    {m.icon} {m.label}
                                </span>
                                <div className='sg-resource__info'>
                                    <span className='sg-resource__title'>{res.title}</span>
                                    {res.description && <span className='sg-resource__desc'>{res.description}</span>}
                                </div>
                                <svg className='sg-resource__arrow' xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                            </a>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical')
    const { report, getReportById, loading, getResumePdf, toggleSkillGap } = useInterview()
    const { user } = useAuth()
    const { interviewId } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        if (interviewId) getReportById(interviewId)
    }, [interviewId])

    if (loading || !report) {
        return (
            <main className='loading-screen'>
                <div className='loading-spinner' />
                <h2>Loading your interview plan…</h2>
            </main>
        )
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'

    const completedCount = report.skillGaps.filter(g => g.completed).length
    const totalGaps = report.skillGaps.length
    const progressPct = totalGaps > 0 ? Math.round((completedCount / totalGaps) * 100) : 0

    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <div className='nav-top-actions'>
                            <button className='nav-back-btn' onClick={() => navigate('/')}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                All Plans
                            </button>
                            <Link to="/profile" className='nav-avatar' title="Account Settings">
                                {user?.username?.charAt(0).toUpperCase()}
                            </Link>
                        </div>

                        <div className="global-brand-badge" style={{ margin: '1rem 0.5rem', alignSelf: 'flex-start' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                            <span>SkillSyncAI</span>
                        </div>

                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}

                        <div className='nav-divider' />

                        {/* Dashboard link */}
                        <Link to="/dashboard" className='interview-nav__item interview-nav__item--link'>
                            <span className='interview-nav__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            </span>
                            Skills Dashboard
                        </Link>
                    </div>

                    <button
                        onClick={() => getResumePdf(interviewId)}
                        className='button primary-button' >
                        <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                        Download Resume
                    </button>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions.map((q, i) => <QuestionCard key={i} item={q} index={i} />)}
                            </div>
                        </section>
                    )}
                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions.map((q, i) => <QuestionCard key={i} item={q} index={i} />)}
                            </div>
                        </section>
                    )}
                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan.map((day) => <RoadMapDay key={day.day} day={day} />)}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>{getScoreLabel(report.matchScore)}</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps with Resources + Progress */}
                    <div className='skill-gaps'>
                        <div className='skill-gaps__header'>
                            <p className='skill-gaps__label'>Skill Gaps</p>
                            <span className='skill-gaps__progress-label'>{completedCount}/{totalGaps} done</span>
                        </div>

                        {/* Progress bar */}
                        <div className='skill-gaps__progressbar'>
                            <div className='skill-gaps__progressbar-fill' style={{ width: `${progressPct}%` }} />
                        </div>

                        <div className='sg-list'>
                            {report.skillGaps.map((gap) => (
                                <SkillGapCard
                                    key={gap._id || gap.skill}
                                    gap={gap}
                                    interviewId={interviewId}
                                    onToggle={toggleSkillGap}
                                />
                            ))}
                        </div>
                    </div>

                </aside>
            </div>
        </div>
    )
}

export default Interview