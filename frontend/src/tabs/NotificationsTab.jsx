import { useState } from 'react'
import { getStudentsBelowTarget, sendAchievementReminders } from '../api'

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
    const withEmail = students.filter(student => student.email).length
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
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.title}>Achievement Mail Reminders</h1>
        <p style={s.subtitle}>Notify students who have not yet reached the selected achievement target.</p>
      </div>

      <div style={s.card}>
        <div style={s.controls}>
          <label style={s.label}>Minimum achievements
            <input style={s.input} type="number" min="1" value={minimum} onChange={e => setMinimum(Math.max(1, Number(e.target.value) || 1))} />
          </label>
          <label style={s.label}>Year (optional)
            <select style={s.input} value={year} onChange={e => setYear(e.target.value)}>
              <option value="">All years</option>
              {YEARS.map(value => <option key={value} value={value}>{value} Year</option>)}
            </select>
          </label>
          <label style={s.label}>Section (optional)
            <input style={s.input} placeholder="e.g. A" value={section} onChange={e => setSection(e.target.value)} />
          </label>
          <button style={s.previewBtn} onClick={preview} disabled={loading}>{loading ? 'Loading...' : 'Preview Students'}</button>
          <button style={{ ...s.sendBtn, opacity: students.length && !sending ? 1 : 0.55 }} onClick={send} disabled={!students.length || sending}>
            {sending ? 'Sending...' : 'Send Reminders'}
          </button>
        </div>
        <p style={s.note}>Only students with an email address receive a reminder. The message includes their current count and target.</p>
      </div>

      {result && <div style={s.result}>
        Sent: <strong>{result.sent}</strong> · No email: <strong>{result.skipped_no_email.length}</strong> · Failed: <strong>{result.failures.length}</strong>
      </div>}

      <div style={s.tableCard}>
        <div style={s.tableTitle}>Students below target ({students.length})</div>
        {students.length === 0 ? <div style={s.empty}>Preview students to review recipients before sending.</div> : (
          <table style={s.table}>
            <thead><tr><th style={s.th}>NAME</th><th style={s.th}>ROLL NO</th><th style={s.th}>YEAR / SECTION</th><th style={s.th}>ACHIEVEMENTS</th><th style={s.th}>EMAIL</th></tr></thead>
            <tbody>{students.map(student => <tr key={student.id}>
              <td style={s.td}>{student.name}</td><td style={s.td}>{student.roll_no}</td><td style={s.td}>{student.year} / {student.section}</td><td style={s.td}>{student.achievement_count}</td><td style={s.td}>{student.email || 'No email address'}</td>
            </tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const s = {
  wrap: { animation: 'fadeIn 0.3s ease' },
  header: { marginBottom: 18 }, title: { margin: 0, color: '#1a2469', fontSize: 22, fontWeight: 800 }, subtitle: { margin: '6px 0 0', color: '#666', fontSize: 13.5 },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 16 },
  controls: { display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }, label: { display: 'flex', flexDirection: 'column', gap: 6, color: '#555', fontSize: 12.5, fontWeight: 600 },
  input: { padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: 7, minWidth: 130, fontSize: 13 },
  previewBtn: { padding: '9px 16px', border: 'none', borderRadius: 7, background: '#1a2469', color: '#fff', fontWeight: 600, fontSize: 13 },
  sendBtn: { padding: '9px 16px', border: 'none', borderRadius: 7, background: '#2e7d5b', color: '#fff', fontWeight: 600, fontSize: 13 },
  note: { margin: '14px 0 0', color: '#777', fontSize: 12.5 }, result: { marginBottom: 16, padding: '11px 14px', borderRadius: 8, background: '#eaf6ef', color: '#236544', fontSize: 13 },
  tableCard: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }, tableTitle: { padding: '15px 16px', color: '#1a2469', fontWeight: 700, fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse' }, th: { padding: '11px 14px', background: '#1a2469', color: '#fff', textAlign: 'left', fontSize: 11.5, letterSpacing: 0.4 }, td: { padding: '11px 14px', borderBottom: '1px solid #f2f2f5', color: '#444', fontSize: 13 },
  empty: { padding: 32, textAlign: 'center', color: '#999', fontSize: 13.5 },
}
