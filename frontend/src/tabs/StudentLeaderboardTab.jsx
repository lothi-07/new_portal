import { useEffect, useState } from 'react'
import { getLeaderboard } from '../api'

export default function StudentLeaderboardTab({ studentId }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getLeaderboard({ limit: 20 }).then(({ data }) => setStudents(Array.isArray(data) ? data : [])).finally(() => setLoading(false))
  }, [])
  if (loading) return <div style={s.empty}>Loading leaderboard...</div>
  return <div style={s.wrap}>
    <h2 style={s.title}>Leaderboard</h2>
    <p style={s.subtitle}>Every achievement moves you closer to the top. Keep learning, participating, and inspiring your classmates!</p>
    {students.length === 0 ? <div style={s.empty}>No leaderboard positions yet.</div> : <div style={s.card}>{students.map((student, index) => <div key={student.id} style={{ ...s.row, ...(student.id === studentId ? s.current : {}) }}><strong style={s.rank}>#{index + 1}</strong><div><strong>{student.name}</strong><small style={s.rowSmall}>{student.total_events || student.achievement_count || 0} achievements</small></div><strong style={s.points}>{student.total_points || student.achievement_count || 0} XP</strong></div>)}</div>}
  </div>
}

const s = {
  wrap: { maxWidth: 720 },
  title: { margin: 0, color: '#171c2d', fontSize: 24 },
  subtitle: { color: '#637089', lineHeight: 1.6 },
  card: { background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, padding: 10 },
  row: { display: 'flex', alignItems: 'center', gap: 14, padding: '13px 12px', borderBottom: '1px solid #edf0f5', color: '#252d43' },
  current: { background: '#eef0ff', borderRadius: 8 },
  rank: { width: 42, color: '#4b50d5', fontSize: 16 },
  rowSmall: { display: 'block', color: '#758198', marginTop: 4 },
  points: { marginLeft: 'auto', color: '#2d9a72' },
  empty: { padding: 30, color: '#758198', textAlign: 'center' },
}
