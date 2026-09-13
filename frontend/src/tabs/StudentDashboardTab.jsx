import { useEffect, useState } from 'react'
import { API_BASE, getLeaderboard, getMotivationalMessage, getStudentStats, registerForEvent } from '../api'

const BADGES = [
  { name: 'Hackathon Hero', emoji: '🥇', events: 1 },
  { name: 'Continuous Learner', emoji: '📗', events: 3 },
  { name: 'Volunteering Star', emoji: '⭐', events: 5 },
  { name: 'Research Scholar', emoji: '🎓', events: 10 },
]

// Kept to your real backend categories (Technical / Non-Technical / Sports / Cultural / Other)
// rather than the screenshot's placeholder labels, so filtering actually works against your data.
const CATEGORY_TABS = [
  { key: 'All', label: 'All Events' },
  { key: 'Technical', label: 'Technical' },
  { key: 'Non-Technical', label: 'Non-Technical' },
  { key: 'Cultural', label: 'Cultural' },
  { key: 'Sports', label: 'Sports' },
  { key: 'Other', label: 'Other' },
]

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'title', label: 'A → Z' },
]

export default function StudentDashboardTab({ studentId, profile, flyers = [], onNavigateTab }) {
  const [stats, setStats] = useState(null)
  const [message, setMessage] = useState('')
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFlyer, setSelectedFlyer] = useState(null)
  const [registrationFlyer, setRegistrationFlyer] = useState(null)
  const [eventType, setEventType] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [registration, setRegistration] = useState({ name: profile?.first_name || '', email: profile?.email || '', roll_no: profile?.roll_no || '', screenshot: null })

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      if (!studentId) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const [statsRes, messageRes, leaderboardRes] = await Promise.all([
          getStudentStats(studentId),
          getMotivationalMessage(studentId),
          getLeaderboard({ limit: 10 }),
        ])
        if (!active) return
        setStats(statsRes?.data || null)
        setMessage(messageRes?.data?.message || '')
        setLeaderboard(Array.isArray(leaderboardRes?.data) ? leaderboardRes.data : [])
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()
    return () => { active = false }
  }, [studentId])

  if (loading) return <div style={styles.status}>Loading your trail...</div>
  if (!stats) return <div style={styles.status}>Unable to load your dashboard.</div>

  const name = profile?.first_name || 'Student'
  const events = Number(stats.total_events || 0)
  const currentRank = leaderboard.findIndex(student => student.id === studentId) + 1

  const nextBadge = BADGES.find(badge => events < badge.events)
  const prevThreshold = [...BADGES].reverse().find(badge => events >= badge.events)?.events || 0
  const progressPct = nextBadge
    ? Math.min(100, ((events - prevThreshold) / (nextBadge.events - prevThreshold)) * 100)
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
    <div style={styles.dashboard}>
      <section style={styles.welcomeStrip}>
        <div>
          <h2 style={styles.welcomeTitle}>👋 Welcome, {name}! <span>Level {Math.max(1, Math.ceil(events / 3))} Innovator 🏆</span></h2>
        </div>
      </section>

      <section style={styles.statsBar}>
        <MiniStat value={stats.total_points || 0} label="Total XP" />
        <MiniStat value={stats.certificates_uploaded ?? events} label="Verified Certs" />
        <MiniStat value={currentRank > 0 ? `#${currentRank}` : '—'} label="Rank" />
      </section>

      <div style={styles.dashboardColumns}>
        <div style={styles.columnStack}>
          <section style={styles.card}>
            <div style={styles.cardHeading}>
              <h3 style={styles.sectionTitle}>Live Events & Flyers Feed</h3>
              <select value={sortBy} onChange={event => setSortBy(event.target.value)} style={styles.sortSelect}>
                {SORT_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
              </select>
            </div>

            <div style={styles.tabRow}>
              {CATEGORY_TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setEventType(tab.key)}
                  style={{ ...styles.tabPill, ...(eventType === tab.key ? styles.tabPillActive : {}) }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filteredFlyers.length === 0 ? (
              <p style={styles.empty}>No events in this category yet.</p>
            ) : (
              <div style={styles.flyerGrid}>
                {filteredFlyers.slice(0, 4).map(flyer => {
                  const flyerUrl = flyer.flyer_path?.startsWith('http') ? flyer.flyer_path : `${API_BASE}${flyer.flyer_path}`
                  return (
                    <article key={flyer.id} style={styles.flyerCard}>
                      <img src={flyerUrl} alt={flyer.title} style={styles.flyerImage} />
                      <div style={styles.flyerText}>
                        <strong>{flyer.title}</strong>
                        <small>▣ {flyer.event_date || 'Upcoming'} &nbsp; ◉ Online</small>
                        <div style={styles.flyerActions}>
                          <button type="button" style={styles.viewPoster} onClick={() => setSelectedFlyer(flyer)}>View Poster</button>
                          <button type="button" style={styles.registerNow}                           onClick={() => {
                            setRegistrationFlyer(flyer)
                            setRegistration({ name: profile?.first_name || '', email: profile?.email || '', roll_no: profile?.roll_no || '' })
                          }}>Register Now</button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <div style={styles.columnStack}>
          <section style={styles.card}>
            <h3 style={styles.sectionTitle}>Badges & Motivation Engine</h3>
            <p style={styles.message}>{message || 'Every achievement takes you one step closer to your next badge.'}</p>

            {nextBadge ? (
              <>
                <div style={styles.progressMeta}>
                  <span>Earn <strong>{eventsToNextBadge}</strong> more event{eventsToNextBadge === 1 ? '' : 's'} to unlock '{nextBadge.name}'!</span>
                </div>
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
                </div>
              </>
            ) : (
              <p style={styles.message}>You've unlocked every badge — amazing work!</p>
            )}

            <div style={styles.badgeGrid}>
              {BADGES.map(badge => {
                const unlocked = events >= badge.events
                return (
                  <div key={badge.name} style={{ ...styles.badge, ...(unlocked ? styles.badgeUnlocked : {}) }}>
                    <span style={styles.badgeIcon}>{unlocked ? badge.emoji : '🔒'}</span>
                    <strong>{badge.name}</strong>
                    <small>{unlocked ? 'Unlocked' : 'Locked'}</small>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>

      {selectedFlyer && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedFlyer(null)}>
          <div style={styles.modal} onClick={event => event.stopPropagation()}>
            <button type="button" style={styles.modalClose} onClick={() => setSelectedFlyer(null)} aria-label="Close flyer preview">
              ×
            </button>

            {selectedFlyer.flyer_path?.toLowerCase().endsWith('.pdf') || selectedFlyer.flyer_content_type === 'application/pdf' ? (
              <iframe
                src={selectedFlyer.flyer_path?.startsWith('http') ? selectedFlyer.flyer_path : `${API_BASE}${selectedFlyer.flyer_path}`}
                title={selectedFlyer.title || 'Event flyer preview'}
                style={styles.previewFrame}
              />
            ) : (
              <img
                src={selectedFlyer.flyer_path?.startsWith('http') ? selectedFlyer.flyer_path : `${API_BASE}${selectedFlyer.flyer_path}`}
                alt={selectedFlyer.title || 'Event flyer'}
                style={styles.previewImage}
              />
            )}
            <div style={styles.modalInfo}>
              <strong style={styles.modalTitle}>{selectedFlyer.title || 'Event flyer'}</strong>
            </div>
          </div>
        </div>
      )}
      {registrationFlyer && <div style={styles.modalBackdrop} onClick={() => setRegistrationFlyer(null)}><div style={styles.registrationModal} onClick={event => event.stopPropagation()}><button type="button" style={styles.modalClose} onClick={() => setRegistrationFlyer(null)}>×</button><h3>Register for {registrationFlyer.title}</h3><p>Complete the external registration first, then upload its confirmation screenshot.</p>{registrationFlyer.registration_url && <button type="button" style={styles.viewPoster} onClick={() => window.open(registrationFlyer.registration_url, '_blank', 'noopener,noreferrer')}>Open registration form</button>}<input style={styles.registrationInput} placeholder="Full name" value={registration.name} onChange={event => setRegistration({ ...registration, name: event.target.value })} /><input style={styles.registrationInput} placeholder="Email" type="email" value={registration.email} onChange={event => setRegistration({ ...registration, email: event.target.value })} /><input style={styles.registrationInput} placeholder="Roll number" value={registration.roll_no} onChange={event => setRegistration({ ...registration, roll_no: event.target.value })} /><label style={styles.registrationInput}>Registration screenshot<input type="file" accept="image/*,application/pdf" onChange={event => setRegistration({ ...registration, screenshot: event.target.files?.[0] || null })} /></label><button type="button" style={styles.registerSubmit} onClick={async () => { if (!registration.name || !registration.email || !registration.roll_no || !registration.screenshot) return alert('Please complete the form and upload the registration screenshot.'); try { await registerForEvent(registrationFlyer.id, registration.screenshot); alert(`Registration submitted for ${registrationFlyer.title}`); setRegistrationFlyer(null) } catch (error) { alert(error.response?.data?.detail || 'Unable to record registration') } }}>Submit Registration</button></div></div>}
    </div>
  )
}

function MiniStat({ value, label }) {
  return <div style={styles.miniStat}><strong>{value}</strong><span>{label}</span></div>
}

const styles = {
  dashboard: { display: 'grid', gap: 14, color: '#161b2d' },
  welcomeStrip: { padding: '8px 14px 0', borderLeft: '3px solid #4d50d5' },
  welcomeTitle: { margin: 0, fontSize: 19, color: '#171c2d' },
  uploadCertificate: { marginTop: 9, padding: '8px 22px', border: 0, borderRadius: 7, background: 'linear-gradient(90deg,#434bd5,#bb5acf)', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  statsBar: { display: 'flex', gap: 0, background: '#fff', border: '1px solid #dce4ed', borderRadius: 9, boxShadow: '0 2px 8px rgba(20,36,60,.06)' },
  dashboardColumns: { display: 'grid', gridTemplateColumns: '1.45fr .85fr', gap: 14, alignItems: 'start' },
  columnStack: { display: 'grid', gap: 14 },
  sectionTitle: { margin: 0, fontSize: 16, color: '#171c2d' },
  cardHeading: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 },
  sortSelect: { padding: '6px 9px', border: '1px solid #dce4ed', borderRadius: 6, color: '#4c5870', background: '#fff', fontSize: 11 },
  linkBtn: { border: 0, background: 'transparent', color: '#4a4dd0', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  tabRow: { display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0 4px' },
  tabPill: { padding: '6px 13px', borderRadius: 999, border: '1px solid #dce4ed', background: '#f6f7fb', color: '#4c5870', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  tabPillActive: { background: '#4a4dd0', borderColor: '#4a4dd0', color: '#fff' },
  empty: { color: '#7d8798', fontSize: 13 },
  status: { padding: 42, textAlign: 'center', color: '#52727a', fontSize: 15 },
  miniStat: { flex: 1, minWidth: 102, padding: '12px 16px', textAlign: 'center', borderRight: '1px solid #e0e6ee' },
  card: { padding: 14, borderRadius: 9, background: '#fff', border: '1px solid #dce4ed', boxShadow: '0 2px 8px rgba(20,36,60,.05)' },
  message: { margin: '10px 0', color: '#617d83', lineHeight: 1.7, fontSize: 14 },
  progressMeta: { color: '#4c5870', fontSize: 13, marginBottom: 8 },
  progressTrack: { height: 10, marginTop: 4, overflow: 'hidden', borderRadius: 99, background: '#e6e8f5' },
  progressFill: { height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #434bd5, #bb5acf)', transition: 'width .3s ease' },
  badgeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 18 },
  badge: { display: 'grid', justifyItems: 'center', gap: 6, padding: '14px 8px', borderRadius: 12, color: '#95a0b8', background: '#f5f6fb', border: '1px solid #e5e8f2', opacity: 0.6, textAlign: 'center' },
  badgeUnlocked: { color: '#3a3ea0', background: 'rgba(74, 77, 208, 0.08)', borderColor: '#4a4dd0', opacity: 1 },
  badgeIcon: { fontSize: 30 },
  miniLeaderboard: { display: 'grid', gap: 6, marginTop: 10 },
  miniLeaderboardRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, background: '#f8f9fd', fontSize: 13, color: '#252d43' },
  miniLeaderboardMe: { background: '#eef0ff', fontWeight: 700 },
  miniRank: { width: 20, color: '#4b50d5' },
  miniName: { flex: 1 },
  miniXp: { color: '#2d9a72', fontWeight: 700 },
  trendingRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  trendingChip: { padding: '7px 12px', borderRadius: 999, border: '1px solid #dce4ed', background: '#f6f7fb', color: '#3f49a7', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  flyerGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 12 },
  flyerCard: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, padding: 0, border: '1px solid #d7e4e7', borderRadius: 8,
    background: '#f6fbfc', color: '#0d4d5d', textAlign: 'left', overflow: 'hidden',
    cursor: 'pointer', boxShadow: '0 8px 18px rgba(13,77,93,0.08)', transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  },
  flyerImage: { width: '100%', height: 120, objectFit: 'cover', display: 'block' },
  flyerText: { padding: 9, display: 'grid', gap: 7, fontSize: 12 },
  flyerActions: { display: 'flex', gap: 5 },
  viewPoster: { padding: '5px 7px', border: '1px solid #5a61be', borderRadius: 5, background: '#fff', color: '#3f49a7', fontSize: 10, cursor: 'pointer' },
  registerNow: { padding: '5px 7px', border: 0, borderRadius: 5, background: '#4a4dd0', color: '#fff', fontSize: 10, cursor: 'pointer' },
  registrationModal: { position: 'relative', width: 'min(92vw, 420px)', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,.25)' },
  registrationInput: { display: 'block', width: '100%', boxSizing: 'border-box', margin: '10px 0', padding: '10px 12px', border: '1px solid #dce4ed', borderRadius: 7, fontSize: 13 },
  registerSubmit: { width: '100%', marginTop: 10, padding: 11, border: 0, borderRadius: 7, background: '#4a4dd0', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(12, 23, 31, 0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { position: 'relative', width: 'min(90vw, 900px)', maxHeight: '85vh', background: '#ffffff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.22)' },
  modalClose: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, border: 'none', borderRadius: '50%', background: 'rgba(13, 77, 93, 0.12)', color: '#0d4d5d', fontSize: 26, cursor: 'pointer', zIndex: 2 },
  previewImage: { display: 'block', width: '100%', maxHeight: '70vh', objectFit: 'contain', background: '#f4f7f8' },
  previewFrame: { width: '100%', height: '70vh', border: 'none', background: '#f4f7f8', display: 'block' },
  modalInfo: { padding: '16px 20px 20px', borderTop: '1px solid #e3edf0' },
  modalTitle: { fontSize: 18, color: '#0d4d5d' },
}
