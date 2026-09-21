import { useEffect, useState } from 'react'
import { API_BASE, getMotivationalMessage, getStudentStats, registerForEvent } from '../api'

const BADGES = [
  { name: 'Hackathon Hero', emoji: '🥇', events: 1, desc: 'Participate in 1 event' },
  { name: 'Continuous Learner', emoji: '📗', events: 3, desc: 'Complete 3 events' },
  { name: 'Campus Star', emoji: '⭐', events: 5, desc: 'Complete 5 events' },
  { name: 'Research Scholar', emoji: '🎓', events: 10, desc: 'Achieve 10 milestones' },
  { name: 'Innovation Spark', emoji: '💡', events: 15, desc: 'Complete 15 milestones' },
  { name: 'Trailblazer', emoji: '🚀', events: 20, desc: 'Complete 20 milestones' },
  { name: 'Excellence Champion', emoji: '🏆', events: 30, desc: 'Complete 30 milestones' },
  { name: 'Impact Maker', emoji: '🌟', events: 40, desc: 'Complete 40 milestones' },
  { name: 'ESEC Luminary', emoji: '💎', events: 50, desc: 'Complete 50 milestones' },
  { name: 'Legacy Builder', emoji: '🏛️', events: 65, desc: 'Complete 65 milestones' },
  { name: 'Hall of Fame', emoji: '👑', events: 80, desc: 'Complete 80 milestones' },
  { name: 'ESEC Legend', emoji: '🔥', events: 100, desc: 'Complete 100 milestones' },
]

const CATEGORY_TABS = [
  { key: 'All', label: 'All Events' },
  { key: 'Technical', label: 'Technical' },
  { key: 'Non-Technical', label: 'Non-Technical' },
  { key: 'Cultural', label: 'Cultural' },
  { key: 'Sports', label: 'Sports' },
  { key: 'Other', label: 'Other' },
]

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First' },
  { key: 'title', label: 'A → Z' },
]

export default function StudentDashboardTab({ studentId, profile, flyers = [], onNavigateTab }) {
  const [stats, setStats] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedFlyer, setSelectedFlyer] = useState(null)
  const [registrationFlyer, setRegistrationFlyer] = useState(null)
  const [eventType, setEventType] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [registration, setRegistration] = useState({
    name: profile?.first_name || '',
    email: profile?.email || '',
    roll_no: profile?.roll_no || '',
    screenshot: null,
  })

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      if (!studentId) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const [statsRes, messageRes] = await Promise.all([
          getStudentStats(studentId),
          getMotivationalMessage(studentId),
        ])
        if (!active) return
        setStats(statsRes?.data || null)
        setMessage(messageRes?.data?.message || '')
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()
    return () => { active = false }
  }, [studentId])

  if (loading) {
    return (
      <div style={styles.statusWrap}>
        <div style={styles.spinner} />
        <p>Loading your student dashboard...</p>
      </div>
    )
  }

  const name = profile?.first_name || 'Student'
  const events = Number(stats?.total_events || profile?.achievements?.length || 0)
  const unlockedBadgeCount = BADGES.filter(badge => events >= badge.events).length
  const studentLevel = Math.min(BADGES.length, unlockedBadgeCount + 1)

  const currentBadge = [...BADGES].reverse().find(badge => events >= badge.events)
  const nextBadge = BADGES.find(badge => events < badge.events)
  const prevThreshold = [...BADGES].reverse().find(badge => events >= badge.events)?.events || 0
  const progressPct = nextBadge
    ? Math.min(100, Math.round(((events - prevThreshold) / (nextBadge.events - prevThreshold)) * 100))
    : 100
  const eventsToNextBadge = nextBadge ? Math.max(0, nextBadge.events - events) : 0

  let filteredFlyers = eventType === 'All' ? flyers : flyers.filter(flyer => (flyer.event_type || 'Other') === eventType)
  filteredFlyers = [...filteredFlyers].sort((a, b) => {
    if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '')
    return new Date(b.event_date || 0) - new Date(a.event_date || 0)
  })

  const trending = [...flyers]
    .sort((a, b) => new Date(b.event_date || 0) - new Date(a.event_date || 0))
    .slice(0, 5)

  return (
    <div style={styles.dashboardContainer}>
      {/* ── Welcome Hero Banner ── */}
      <section style={styles.heroCard}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadgeRow}>
            <span style={styles.levelBadge}>Level {studentLevel} Innovator</span>
            <span style={styles.deptBadge}>
              {profile?.department && profile.department !== 'N/A' ? profile.department : 'Engineering'} • {profile?.year || 'I'} Year
            </span>
          </div>

          <h1 style={styles.heroTitle}>
            Welcome back, {name}! 👋
          </h1>

          <p style={styles.heroSub}>
            {message || "Track your event registrations, co-curricular milestones, and verified credentials in one place."}
          </p>
          {profile?.mentor_name && (
            <div style={styles.mentorChip}>
              <span>👨‍🏫</span>
              <span>Mentor: <strong>{profile.mentor_name}</strong></span>
              {profile.mentor_email && <span style={styles.mentorEmail}>· {profile.mentor_email}</span>}
            </div>
          )}

          <div style={styles.heroQuickActions}>
            <button
              style={styles.heroPrimaryBtn}
              onClick={() => onNavigateTab && onNavigateTab('participation')}
            >
              🏆 View My Achievements
            </button>
            <button
              style={styles.heroSecondaryBtn}
              onClick={() => onNavigateTab && onNavigateTab('certificates')}
            >
              📜 Certificate Gallery
            </button>
          </div>
        </div>

        <div style={styles.heroTrophyGraphic}>
          <div style={styles.graphicCircle}>
            <span style={styles.bigTrophyIcon}>🏆</span>
          </div>
          <div style={styles.graphicPill}>ESEC Scholar</div>
        </div>
      </section>

      {/* ── KPI Stats Grid ── */}
      <section style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, background: '#eff6ff', color: '#2563eb' }}>🎯</div>
          <div>
            <div style={styles.statNumber}>{events}</div>
            <div style={styles.statLabel}>Total Events Participated</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, background: '#ecfdf5', color: '#059669' }}>📜</div>
          <div style={styles.statNumber}>
            {profile?.achievements?.filter(a => a.certificate_upload_path)?.length || 0}
          </div>
          <div style={styles.statLabel}>Verified Certificates</div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, background: '#f5f3ff', color: '#7c3aed' }}>⚡</div>
          <div style={styles.statNumber}>{events * 100} XP</div>
          <div style={styles.statLabel}>Achievement Points</div>
        </div>
      </section>

      {/* ── Main Two-Column Layout ── */}
      <div style={styles.layoutColumns}>
        {/* Left Primary Column: Milestone Progress + Event Opportunities */}
        <div style={styles.leftCol}>
          {/* Milestone Progress Bar Card */}
          <div style={styles.card}>
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardTitle}>Milestone Journey</h3>
                <p style={styles.cardSub}>Progress towards your next institutional badge.</p>
              </div>
              {nextBadge && (
                <span style={styles.nextBadgeChip}>
                  🔒 New level awaits
                </span>
              )}
            </div>

            <div style={styles.progressWrap}>
              <div style={styles.progressInfo}>
                <span>{events} events completed</span>
                <span>
                  {nextBadge
                    ? `${eventsToNextBadge} more event${eventsToNextBadge === 1 ? '' : 's'} to unlock a new level`
                    : 'All levels unlocked!'}
                </span>
              </div>
              <div style={styles.trackBar}>
                <div style={{ ...styles.fillBar, width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Current milestone */}
            <div style={styles.currentMilestone}>
              <div style={styles.currentBadgeEmoji}>{currentBadge?.emoji || '🌱'}</div>
              <div style={styles.currentBadgeDetails}>
                <div style={styles.currentBadgeLabel}>Current level</div>
                <div style={styles.currentBadgeName}>{currentBadge?.name || 'Getting Started'}</div>
                <div style={styles.currentBadgeDesc}>
                  {currentBadge?.desc || 'Complete your first event to unlock your first badge'}
                </div>
              </div>
              <div style={styles.currentBadgeStatus}>✓ Unlocked</div>
            </div>

            <div style={styles.unlockHint}>
              {nextBadge
                ? `Keep achieving in more events to unlock your next surprise level.`
                : 'You have unlocked every surprise level. Amazing work!'}
            </div>
          </div>

          {/* Academic Event Notices & Flyers */}
          <div style={styles.card}>
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardTitle}>Upcoming Academic Events & Flyers</h3>
                <p style={styles.cardSub}>Discover symposiums, hackathons, and conferences to participate in.</p>
              </div>
              <select
                style={styles.sortSelect}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
              </select>
            </div>

            {/* Category Filter Pills */}
            <div style={styles.filterPillsRow}>
              {CATEGORY_TABS.map(tab => {
                const active = eventType === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setEventType(tab.key)}
                    style={{ ...styles.filterPill, ...(active ? styles.filterPillActive : {}) }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Flyers Grid */}
            {filteredFlyers.length === 0 ? (
              <div style={styles.emptyFlyers}>
                <p>No active event flyers published in this category.</p>
              </div>
            ) : (
              <div style={styles.flyerGrid}>
                {filteredFlyers.map(flyer => (
                  <div key={flyer.id} style={styles.flyerCard}>
                    <div
                      style={styles.flyerThumbWrap}
                      onClick={() => setSelectedFlyer(flyer)}
                    >
                      {flyer.flyer_path?.toLowerCase().endsWith('.pdf') ? (
                        <div style={styles.pdfThumbPlaceholder}>
                          <span>📄</span>
                          <strong>PDF Flyer Notice</strong>
                        </div>
                      ) : (
                        <img
                          src={flyer.flyer_path?.startsWith('http') ? flyer.flyer_path : `${API_BASE}${flyer.flyer_path}`}
                          alt={flyer.title}
                          style={styles.flyerImg}
                        />
                      )}
                      <span style={styles.flyerTypeTag}>{flyer.event_type || 'Event'}</span>
                    </div>

                    <div style={styles.flyerContent}>
                      <h4 style={styles.flyerTitle} title={flyer.title}>{flyer.title}</h4>

                      <div style={styles.flyerMeta}>
                        {flyer.organizer && <div>🏛️ {flyer.organizer}</div>}
                        {flyer.event_date && <div>📅 Event: {flyer.event_date}</div>}
                        {flyer.registration_deadline && (
                          <div style={styles.deadlineMeta}>⏰ Register by: {flyer.registration_deadline}</div>
                        )}
                      </div>

                      <div style={styles.flyerActions}>
                        <button
                          type="button"
                          style={styles.viewPosterBtn}
                          onClick={() => setSelectedFlyer(flyer)}
                        >
                          View Flyer
                        </button>
                        <button
                          type="button"
                          style={styles.registerBtn}
                          onClick={() => setRegistrationFlyer(flyer)}
                        >
                          Register Now →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Column: Trending Events */}
        <div style={styles.rightCol}>
          {/* Quick Trending Noticeboard */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Trending Notices</h3>
            <p style={styles.cardSub}>Latest college symposium announcements.</p>
            <div style={styles.trendingList}>
              {trending.map(item => (
                <div
                  key={item.id}
                  style={styles.trendingItem}
                  onClick={() => setSelectedFlyer(item)}
                >
                  <div style={styles.trendingDot} />
                  <div style={styles.trendingText}>
                    <strong>{item.title}</strong>
                    <span>{item.organizer || 'ESEC Campus'} • {item.event_date || 'Upcoming'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Flyer Preview Modal ── */}
      {selectedFlyer && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedFlyer(null)}>
          <div style={styles.flyerModal} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              style={styles.modalCloseBtn}
              onClick={() => setSelectedFlyer(null)}
            >
              ✕
            </button>

            {selectedFlyer.flyer_path?.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={selectedFlyer.flyer_path?.startsWith('http') ? selectedFlyer.flyer_path : `${API_BASE}${selectedFlyer.flyer_path}`}
                title={selectedFlyer.title}
                style={styles.previewFrame}
              />
            ) : (
              <img
                src={selectedFlyer.flyer_path?.startsWith('http') ? selectedFlyer.flyer_path : `${API_BASE}${selectedFlyer.flyer_path}`}
                alt={selectedFlyer.title}
                style={styles.previewImg}
              />
            )}

            <div style={styles.modalFlyerFooter}>
              <div>
                <h3 style={styles.modalFlyerTitle}>{selectedFlyer.title}</h3>
                <p style={styles.modalFlyerDesc}>{selectedFlyer.description || 'No description provided.'}</p>
              </div>
              {selectedFlyer.registration_url && (
                <a
                  href={selectedFlyer.registration_url}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.externalRegBtn}
                >
                  Open Official Registration Link ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Event Registration Modal ── */}
      {registrationFlyer && (
        <div style={styles.modalBackdrop} onClick={() => setRegistrationFlyer(null)}>
          <div style={styles.regModal} onClick={e => e.stopPropagation()}>
            <div style={styles.regModalHeader}>
              <h3 style={styles.regHeading}>Register for {registrationFlyer.title}</h3>
              <button style={styles.modalCloseBtn} onClick={() => setRegistrationFlyer(null)}>✕</button>
            </div>

            <div style={styles.regModalBody}>
              <p style={styles.regInstruction}>
                Step 1: Open and complete the external event registration form (if applicable).<br />
                Step 2: Upload the confirmation screenshot below to record your campus entry.
              </p>

              {registrationFlyer.registration_url && (
                <button
                  type="button"
                  style={styles.openFormBtn}
                  onClick={() => window.open(registrationFlyer.registration_url, '_blank', 'noopener,noreferrer')}
                >
                  🔗 Open External Registration Portal
                </button>
              )}

              <label style={styles.regLabel}>Full Name</label>
              <input
                style={styles.regInput}
                placeholder="Full Name"
                value={registration.name}
                onChange={e => setRegistration({ ...registration, name: e.target.value })}
              />

              <label style={styles.regLabel}>Campus Email</label>
              <input
                style={styles.regInput}
                placeholder="Email"
                type="email"
                value={registration.email}
                onChange={e => setRegistration({ ...registration, email: e.target.value })}
              />

              <label style={styles.regLabel}>Roll Number</label>
              <input
                style={styles.regInput}
                placeholder="Roll Number"
                value={registration.roll_no}
                onChange={e => setRegistration({ ...registration, roll_no: e.target.value })}
              />

              <label style={styles.regLabel}>Registration Confirmation Screenshot *</label>
              <input
                style={styles.regFileInput}
                type="file"
                accept="image/*,application/pdf"
                onChange={e => setRegistration({ ...registration, screenshot: e.target.files?.[0] || null })}
              />

              <button
                type="button"
                style={styles.regSubmitBtn}
                onClick={async () => {
                  if (!registration.name || !registration.email || !registration.roll_no || !registration.screenshot) {
                    return alert('Please fill in your details and upload the registration screenshot.')
                  }
                  try {
                    await registerForEvent(registrationFlyer.id, registration.screenshot)
                    alert(`Registration successfully submitted for ${registrationFlyer.title}`)
                    setRegistrationFlyer(null)
                  } catch (error) {
                    alert(error.response?.data?.detail || 'Unable to submit registration')
                  }
                }}
              >
                Submit Verified Registration →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Modern Dashboard Styles ── */
const styles = {
  dashboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    maxWidth: 1280,
    margin: '0 auto',
  },
  statusWrap: {
    padding: 60,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 15,
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    margin: '0 auto 16px',
  },

  /* Hero Card */
  heroCard: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a8a 100%)',
    borderRadius: 20,
    padding: '36px 36px',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  heroContent: {
    flex: 1,
    maxWidth: 680,
  },
  heroBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  levelBadge: {
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#ffffff',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 800,
    letterSpacing: '0.04em',
  },
  deptBadge: {
    background: 'rgba(255, 255, 255, 0.12)',
    color: '#e2e8f0',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 600,
  },
  heroTitle: {
    fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)',
    fontWeight: 800,
    letterSpacing: '-0.025em',
    margin: '0 0 10px',
    color: '#ffffff',
  },
  heroSub: {
    fontSize: 14.5,
    color: '#cbd5e1',
    lineHeight: 1.6,
    margin: '0 0 24px',
  },
  mentorChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    color: '#e2e8f0',
    fontSize: 11.5,
    marginBottom: 16,
  },
  mentorEmail: {
    color: '#94a3b8',
  },
  heroQuickActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  heroPrimaryBtn: {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
  },
  heroSecondaryBtn: {
    padding: '10px 20px',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  heroTrophyGraphic: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  graphicCircle: {
    width: 90,
    height: 90,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(15, 23, 42, 0) 70%)',
    border: '2px solid rgba(245, 158, 11, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigTrophyIcon: {
    fontSize: 46,
  },
  graphicPill: {
    fontSize: 11,
    fontWeight: 700,
    color: '#fbbf24',
    letterSpacing: '0.05em',
  },

  /* Stats Grid */
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  statCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '20px',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  statIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flexShrink: 0,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    marginTop: 2,
  },

  /* Two Column Layout */
  layoutColumns: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: 20,
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  /* General Card */
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '24px',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
  },
  cardHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  cardSub: {
    margin: '4px 0 0',
    fontSize: 12.5,
    color: '#64748b',
  },
  nextBadgeChip: {
    padding: '4px 12px',
    borderRadius: 999,
    background: '#eff6ff',
    color: '#2563eb',
    fontSize: 11.5,
    fontWeight: 700,
  },
  sortSelect: {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 12,
    color: '#334155',
    background: '#ffffff',
  },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: '#2563eb',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
  },

  /* Progress Bar */
  progressWrap: {
    marginBottom: 20,
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12.5,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 8,
  },
  trackBar: {
    height: 10,
    borderRadius: 999,
    background: '#e2e8f0',
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #2563eb, #38bdf8, #f59e0b)',
    transition: 'width 0.4s ease',
  },

  currentMilestone: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 18px',
    borderRadius: 14,
    background: '#eff6ff',
    border: '1px solid #93c5fd',
  },
  currentBadgeEmoji: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 30,
    flexShrink: 0,
  },
  currentBadgeDetails: {
    flex: 1,
    minWidth: 0,
  },
  currentBadgeLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  currentBadgeName: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: 800,
    color: '#0f172a',
  },
  currentBadgeDesc: {
    marginTop: 3,
    fontSize: 11.5,
    color: '#64748b',
  },
  currentBadgeStatus: {
    fontSize: 11,
    fontWeight: 800,
    color: '#059669',
    whiteSpace: 'nowrap',
  },
  unlockHint: {
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 10,
    background: '#fffbeb',
    color: '#92400e',
    fontSize: 11.5,
    fontWeight: 700,
    textAlign: 'center',
  },

  /* Category Filter Pills */
  filterPillsRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterPill: {
    padding: '6px 14px',
    borderRadius: 999,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    color: '#475569',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterPillActive: {
    background: '#2563eb',
    borderColor: '#2563eb',
    color: '#ffffff',
  },

  /* Flyer Cards */
  emptyFlyers: {
    padding: 30,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
  },
  flyerGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
  },
  flyerCard: {
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    overflow: 'hidden',
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  },
  flyerThumbWrap: {
    position: 'relative',
    height: 130,
    background: '#0f172a',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  flyerImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  pdfThumbPlaceholder: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    color: '#ffffff',
    fontSize: 12,
  },
  flyerTypeTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 700,
  },
  flyerContent: {
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  },
  flyerTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  flyerMeta: {
    fontSize: 11.5,
    color: '#64748b',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  deadlineMeta: {
    color: '#b45309',
    fontWeight: 700,
  },
  flyerActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 8,
  },
  viewPosterBtn: {
    padding: '7px 8px',
    borderRadius: 7,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#334155',
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
  registerBtn: {
    padding: '7px 8px',
    borderRadius: 7,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
  },

  /* Trending List */
  trendingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 12,
  },
  trendingItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px',
    borderRadius: 8,
    background: '#f8fafc',
    cursor: 'pointer',
  },
  trendingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#2563eb',
    marginTop: 6,
    flexShrink: 0,
  },
  trendingText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: 12,
    color: '#334155',
  },

  /* Modals */
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  flyerModal: {
    position: 'relative',
    width: '100%',
    maxWidth: 780,
    maxHeight: '85vh',
    background: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(15, 23, 42, 0.7)',
    color: '#ffffff',
    fontSize: 14,
    cursor: 'pointer',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImg: {
    width: '100%',
    maxHeight: '65vh',
    objectFit: 'contain',
    background: '#0f172a',
  },
  previewFrame: {
    width: '100%',
    height: '65vh',
    border: 'none',
  },
  modalFlyerFooter: {
    padding: '18px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    background: '#ffffff',
    borderTop: '1px solid #e2e8f0',
  },
  modalFlyerTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: '#0f172a',
  },
  modalFlyerDesc: {
    margin: '4px 0 0',
    fontSize: 12.5,
    color: '#64748b',
  },
  externalRegBtn: {
    padding: '9px 18px',
    borderRadius: 8,
    background: '#2563eb',
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: 700,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },

  /* Registration Modal */
  regModal: {
    width: '100%',
    maxWidth: 460,
    background: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
  },
  regModalHeader: {
    padding: '18px 22px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regHeading: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: '#0f172a',
  },
  regModalBody: {
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  regInstruction: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 1.5,
    margin: '0 0 4px',
  },
  openFormBtn: {
    padding: '9px 14px',
    borderRadius: 8,
    border: '1px solid #93c5fd',
    background: '#eff6ff',
    color: '#1d4ed8',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 6,
  },
  regLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
    marginBottom: -4,
  },
  regInput: {
    padding: '9px 12px',
    borderRadius: 8,
    border: '1.5px solid #cbd5e1',
    fontSize: 13,
    outline: 'none',
  },
  regFileInput: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1.5px dashed #cbd5e1',
    background: '#f8fafc',
    fontSize: 12,
  },
  regSubmitBtn: {
    marginTop: 8,
    padding: '12px 18px',
    borderRadius: 9,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
  },
}
