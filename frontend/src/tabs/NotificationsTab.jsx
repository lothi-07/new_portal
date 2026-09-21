import { useState } from 'react'
import { getStudentsBelowTarget, sendAchievementReminders } from '../api'
import { shared as sh } from './sharedStyles'

const YEARS = ['I', 'II', 'III', 'IV']

export default function NotificationsTab() {
  const [minimum, setMinimum] = useState(1)
  const [year, setYear] = useState('')
  const [section, setSection] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const params = () => ({ minimum, ...(year && { year }), ...(section.trim() && { section: section.trim() }) })

  const preview = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await getStudentsBelowTarget(params())
      setStudents(response.data)
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to load students')
    } finally {
      setLoading(false)
    }
  }

  const send = async () => {
    if (!students.length) return alert('Preview the students to notify first.')
    const withEmail = students.filter(s => s.email).length
    if (!withEmail) return alert('None of the listed students has an email address.')
    if (!confirm(`Send achievement reminders to ${withEmail} student(s)?`)) return

    setSending(true)
    try {
      const response = await sendAchievementReminders(params())
      setResult(response.data)
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to send reminders. Check the SMTP settings.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Page Header */}
      <div style={s.headerRow}>
        <div>
          <div style={s.headerBadge}>BULK EMAIL NOTIFICATIONS</div>
          <h1 style={sh.pageTitle}>Achievement Mail Reminders</h1>
          <div style={sh.pageTitleUnderline} />
        </div>
      </div>

      {/* Controls Card */}
      <div style={sh.card}>
        <div style={s.formGrid}>
          <div style={s.fieldGroup}>
            <label style={s.fieldLabel}>Minimum Achievements Target</label>
            <input
              style={sh.input}
              type="number"
              min="1"
              value={minimum}
              onChange={e => setMinimum(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.fieldLabel}>Filter by Year (optional)</label>
            <select style={sh.select} value={year} onChange={e => setYear(e.target.value)}>
              <option value="">All Academic Years</option>
              {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
            </select>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.fieldLabel}>Filter by Section (optional)</label>
            <input
              style={sh.input}
              placeholder="e.g. A"
              value={section}
              onChange={e => setSection(e.target.value)}
            />
          </div>
        </div>

        <div style={s.actionRow}>
          <button style={sh.btnPrimary} onClick={preview} disabled={loading}>
            {loading ? 'Loading Preview...' : '🔍 Preview Recipients'}
          </button>
          <button
            style={{ ...sh.btnGreen, opacity: students.length && !sending ? 1 : 0.5, cursor: students.length && !sending ? 'pointer' : 'not-allowed' }}
            onClick={send}
            disabled={!students.length || sending}
          >
            {sending ? 'Sending...' : '📧 Send Reminders'}
          </button>
        </div>

        <p style={s.hintText}>
          ℹ️ Only students with a registered email address receive a reminder. The message includes their current achievement count and target.
        </p>
      </div>

      {/* Result Banner */}
      {result && (
        <div style={s.resultBanner}>
          <span style={s.resultIcon}>✓</span>
          <div>
            <strong>Reminders Sent Successfully</strong>
            <div style={s.resultDetails}>
              {result.sent} sent · {result.skipped_no_email?.length || 0} skipped (no email) · {result.failures?.length || 0} failed
            </div>
          </div>
        </div>
      )}

      {/* Recipients Table */}
      <div style={sh.card}>
        <div style={s.tableHeaderRow}>
          <div style={sh.sectionTitle}>Preview Recipients</div>
          <span style={s.countBadge}>{students.length} students</span>
        </div>
        <p style={sh.sectionSub}>
          {students.length === 0
            ? 'Click "Preview Recipients" to see students who will receive the reminder.'
            : `These students have fewer than ${minimum} achievement(s) and will receive a reminder email.`}
        </p>

        {students.length > 0 && (
          <div style={s.tableWrap}>
            <table style={sh.table}>
              <thead>
                <tr>
                  <th style={sh.th}>#</th>
                  <th style={sh.th}>Student Name</th>
                  <th style={sh.th}>Roll Number</th>
                  <th style={sh.th}>Year / Section</th>
                  <th style={{ ...sh.th, textAlign: 'center' }}>Achievements</th>
                  <th style={sh.th}>Email Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr key={student.id}>
                    <td style={{ ...sh.td, color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ ...sh.td, fontWeight: 700, color: '#0f172a' }}>{student.name}</td>
                    <td style={sh.td}>
                      <span style={s.rollChip}>{student.roll_no}</span>
                    </td>
                    <td style={sh.td}>{student.year} Year / Section {student.section}</td>
                    <td style={{ ...sh.td, textAlign: 'center' }}>
                      <span style={s.achCount}>{student.achievement_count}</span>
                    </td>
                    <td style={sh.td}>
                      {student.email ? (
                        <span style={s.emailBadge}>✓ {student.email}</span>
                      ) : (
                        <span style={s.noEmailBadge}>No email</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerBadge: {
    display: 'inline-block',
    fontSize: 10.5,
    fontWeight: 800,
    color: '#2563eb',
    background: '#eff6ff',
    padding: '3px 9px',
    borderRadius: 6,
    letterSpacing: '0.06em',
    marginBottom: 6,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 20,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
  },
  actionRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  hintText: {
    margin: 0,
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 1.5,
  },
  resultBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: 12,
    padding: '14px 18px',
    marginBottom: 20,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#10b981',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 14,
    flexShrink: 0,
  },
  resultDetails: {
    fontSize: 12.5,
    color: '#065f46',
    marginTop: 2,
  },
  tableHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  countBadge: {
    fontSize: 11.5,
    fontWeight: 700,
    background: '#f1f5f9',
    color: '#475569',
    padding: '3px 10px',
    borderRadius: 999,
  },
  tableWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    marginTop: 16,
  },
  rollChip: {
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: 12,
    color: '#2563eb',
    background: '#eff6ff',
    padding: '3px 8px',
    borderRadius: 6,
  },
  achCount: {
    fontSize: 13,
    fontWeight: 800,
    color: '#dc2626',
    background: '#fef2f2',
    padding: '3px 10px',
    borderRadius: 6,
    border: '1px solid #fecaca',
  },
  emailBadge: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: 600,
  },
  noEmailBadge: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
}
