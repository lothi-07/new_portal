import { useEffect, useState } from 'react'
import { getTopFiveStudents } from '../api'

export default function StaffDashboardTab() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getTopFiveStudents()
      .then(({ data }) => setStudents(data.top_performers || []))
      .catch(err => setError(err.response?.data?.detail || 'Unable to load top students'))
      .finally(() => setLoading(false))
  }, [])

  return <div style={s.wrap}>
    <h1 style={s.title}>Staff Dashboard</h1>
    <p style={s.subtitle}>Top five students by achievement count.</p>
    <div style={s.card}>
      {loading && <p style={s.empty}>Loading...</p>}
      {error && <p style={s.error}>{error}</p>}
      {!loading && !error && students.length === 0 && <p style={s.empty}>No student achievements yet.</p>}
      {!loading && !error && students.length > 0 && <table style={s.table}>
        <thead><tr><th style={s.th}>Rank</th><th style={s.th}>Student</th><th style={s.th}>Roll No</th><th style={s.th}>Achievements</th></tr></thead>
        <tbody>{students.map((student, index) => <tr key={student.id}><td style={s.td}>{index + 1}</td><td style={s.td}>{student.name}</td><td style={s.td}>{student.roll_no}</td><td style={s.td}>{student.achievement_count}</td></tr>)}</tbody>
      </table>}
    </div>
  </div>
}

const s = {
  wrap: { animation: 'fadeIn .3s ease' },
  title: { margin: 0, color: '#1a2469', fontSize: 22, fontWeight: 800 },
  subtitle: { margin: '6px 0 18px', color: '#666', fontSize: 13.5 },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.06)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: 10, color: '#1a2469', borderBottom: '2px solid #eee' },
  td: { padding: 10, borderBottom: '1px solid #eee', color: '#555' },
  empty: { color: '#999', textAlign: 'center', padding: 22 },
  error: { color: '#c0392b', padding: 12 },
}
