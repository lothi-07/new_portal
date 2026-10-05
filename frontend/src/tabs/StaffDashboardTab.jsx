import { useEffect, useMemo, useState } from 'react'
import { API_BASE, getMyMentees } from '../api'
import CertificateViewer from '../components/CertificateViewer'
import { shared as sh } from './sharedStyles'

export default function StaffDashboardTab() {
  const [mentees, setMentees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [selectedCertificate, setSelectedCertificate] = useState(null)

  const loadMentees = async () => {
    setLoading(true)
    try {
      const { data } = await getMyMentees()
      setMentees(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load your mentees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMentees() }, [])

  const summary = useMemo(() => ({
    achievements: mentees.reduce((total, student) => total + (student.achievement_count || 0), 0),
    certificates: mentees.reduce(
      (total, student) => total + student.achievements.filter(item => item.certificate_upload_path).length,
      0,
    ),
    activeStudents: mentees.filter(student => student.achievement_count > 0).length,
  }), [mentees])

  return (
    <div className="staff-dashboard" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="staff-dashboard-header" style={s.headerRow}>
        <div>
          <div style={s.headerBadge}>MENTOR DASHBOARD</div>
          <h1 style={sh.pageTitle}>My Mentees</h1>
          <div style={sh.pageTitleUnderline} />
          <p style={sh.sectionSub}>Review every assigned student regularly, including students who have not registered for events.</p>
        </div>
        <button style={sh.btnGhost} onClick={loadMentees}>↻ Refresh</button>
      </div>

      <div className="staff-dashboard-stats" style={s.statsGrid}>
        <SummaryCard icon="👥" value={mentees.length} label="Assigned Mentees" />
        <SummaryCard icon="🏆" value={summary.achievements} label="Total Achievements" />
        <SummaryCard icon="📜" value={summary.certificates} label="Verified Certificates" />
        <SummaryCard icon="📈" value={summary.activeStudents} label="Students With Progress" />
      </div>

      <div style={sh.card}>
        <div style={s.sectionHeader}>
          <div>
            <div style={sh.sectionTitle}>Mentee Performance Overview</div>
            <p style={sh.sectionSub}>Click a student to view their complete academic and achievement details.</p>
          </div>
          <div style={s.countPill}>{mentees.length} students</div>
        </div>

        {loading && <div style={sh.emptyState}>Loading mentee performance...</div>}
        {error && <div style={s.errorBox}>{error}</div>}
        {!loading && !error && mentees.length === 0 && (
          <div style={sh.emptyState}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            No students have been assigned to you yet.
          </div>
        )}

        {!loading && !error && mentees.length > 0 && (
          <div style={s.menteeList}>
            {mentees.map(student => (
              <div key={student.id} className="staff-mentee-card" style={s.menteeCard}>
                <button
                  type="button"
                  className="staff-mentee-summary"
                  style={s.menteeSummary}
                  onClick={() => setExpandedId(expandedId === student.id ? null : student.id)}
                >
                  <div style={s.avatar}>{student.name?.[0] || '?'}</div>
                  <div style={s.studentInfo}>
                    <div style={s.studentName}>{student.name}</div>
                    <div style={s.studentMeta}>
                      {student.roll_no} · {student.department || 'Engineering'} · {student.year} Year / Section {student.section}
                    </div>
                  </div>
                  <div style={s.metric}><strong>{student.achievement_count}</strong><h3>achievements</h3></div>
                  <div style={s.metric}><strong>{student.total_points || 0}</strong><span>XP</span></div>
                  <div style={s.expand}>{expandedId === student.id ? '⌃' : '⌄'}</div>
                </button>

                {expandedId === student.id && (
                  <MenteeDetails
                    student={student}
                    onViewCertificate={(achievement) => setSelectedCertificate({
                      ...achievement,
                      studentName: student.name,
                    })}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedCertificate && (
        <CertificateViewer
          certificateUrl={
            selectedCertificate.certificate_upload_path?.startsWith('http')
              ? selectedCertificate.certificate_upload_path
              : `${API_BASE}${selectedCertificate.certificate_upload_path}`
          }
          studentName={selectedCertificate.studentName}
          eventName={selectedCertificate.event_name}
          eventType={selectedCertificate.event_type}
          prize={selectedCertificate.prize_type}
          eventDate={selectedCertificate.event_date}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  )
}

function SummaryCard({ icon, value, label }) {
  return (
    <div style={s.statCard}>
      <div style={s.statIcon}>{icon}</div>
      <div><strong style={s.statValue}>{value}</strong><span style={s.statLabel}>{label}</span></div>
    </div>
  )
}

function MenteeDetails({ student, onViewCertificate }) {
  return (
    <div style={s.details}>
      <div className="staff-mentee-detail-grid" style={s.detailGrid}>
        <Detail label="Registration No" value={student.reg_no || 'Not provided'} />
        <Detail label="Email" value={student.email || 'Not provided'} />
        <Detail label="Mobile" value={student.mobile_number || 'Not provided'} />
        <Detail label="Current Badge" value={student.current_badge || 'Getting Started'} />
      </div>
      <h4 style={s.historyTitle}>Achievement History ({student.achievements.length})</h4>
      {student.achievements.length === 0 ? (
        <div style={s.noHistory}>No achievements recorded yet. This student can still be monitored and guided.</div>
      ) : (
        <div className="staff-mentee-history-list" style={s.historyList}>
          {student.achievements.map(item => (
            <div key={item.id} className="staff-mentee-history-row" style={s.historyRow}>
              <div><strong>{item.event_name}</strong><div style={s.historyMeta}>{item.event_date || 'Date not provided'} · {item.event_type || 'Other'}</div></div>
              <span style={s.prize}>{item.prize_type || 'Participation'}</span>
              {item.certificate_upload_path && (
                <button
                  type="button"
                  style={s.certificateButton}
                  onClick={() => onViewCertificate(item)}
                >
                  📜 View Certificate
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }) {
  return <div><span style={s.detailLabel}>{label}</span><strong style={s.detailValue}>{value}</strong></div>
}

const s = {
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 16 },
  headerBadge: { display: 'inline-block', fontSize: 10.5, fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '3px 9px', borderRadius: 6, letterSpacing: '0.06em', marginBottom: 6 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 22 },
  statCard: { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' },
  statIcon: { width: 40, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', fontSize: 21 },
  statValue: { display: 'block', color: '#0f172a', fontSize: 21 },
  statLabel: { display: 'block', color: '#64748b', fontSize: 11, marginTop: 2 },
  sectionHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 12 },
  countPill: { fontSize: 12, fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: 999, flexShrink: 0 },
  errorBox: { padding: '12px 16px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 },
  menteeList: { display: 'flex', flexDirection: 'column', gap: 8 },
  menteeCard: { border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' },
  menteeSummary: { width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', border: 'none', background: '#fff', textAlign: 'left', cursor: 'pointer' },
  avatar: { width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dbeafe', color: '#1d4ed8', fontWeight: 800, flexShrink: 0 },
  studentInfo: { flex: 1, minWidth: 0 },
  studentName: { color: '#0f172a', fontWeight: 800, fontSize: 13.5 },
  studentMeta: { color: '#64748b', fontSize: 11.5, marginTop: 3 },
  metric: { minWidth: 75, textAlign: 'center', color: '#64748b', fontSize: 10 },
  metricStrong: { display: 'block' },
  expand: { color: '#2563eb', fontSize: 18, paddingLeft: 8 },
  details: { padding: '0 18px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, padding: '16px 0' },
  detailLabel: { display: 'block', color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' },
  detailValue: { display: 'block', color: '#334155', fontSize: 12.5, marginTop: 3 },
  historyTitle: { margin: '3px 0 10px', color: '#334155', fontSize: 12.5 },
  noHistory: { padding: 12, borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12 },
  historyList: { display: 'flex', flexDirection: 'column', gap: 6 },
  historyRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: '#fff', fontSize: 12, color: '#334155' },
  historyMeta: { marginTop: 3, color: '#94a3b8', fontSize: 10.5 },
  prize: { marginLeft: 'auto', padding: '3px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontSize: 10.5, fontWeight: 700 },
  certificate: { color: '#047857', fontSize: 10.5, fontWeight: 700 },
  certificateButton: { border: 'none', background: '#ecfdf5', color: '#047857', borderRadius: 999, padding: '4px 9px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' },
}
