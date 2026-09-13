import { useEffect, useState } from 'react'
import { API_BASE, getRegistrations } from '../api'

export default function RegistrationReviewTab() {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try { setRegistrations((await getRegistrations()).data) }
    catch (e) { setError(e.response?.data?.detail || 'Unable to load registrations') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return <div style={s.wrap}>
    <h1 style={s.title}>Event Registrations</h1>
    <p style={s.subtitle}>View student event registrations and uploaded registration screenshots.</p>
    <div style={s.card}>
      {loading && <p>Loading...</p>}
      {error && <p style={s.error}>{error}</p>}
      {!loading && !error && registrations.length === 0 && <p style={s.empty}>No registrations submitted yet.</p>}
      {!loading && !error && registrations.length > 0 && <table style={s.table}>
        <thead><tr><th style={s.th}>Student Name</th><th style={s.th}>Event Name</th><th style={s.th}>Registered Screenshot</th><th style={s.th}>Certificate Upload</th></tr></thead>
        <tbody>{registrations.map(item => <tr key={item.id}>
          <td style={s.td}>{item.student_name}</td>
          <td style={s.td}>{item.event_title}</td>
          <td style={s.td}>{item.registration_screenshot_path ? <a href={`${API_BASE}${item.registration_screenshot_path}`} target="_blank" rel="noreferrer">View</a> : 'Not uploaded'}</td>
          <td style={s.td}>{item.certificate_upload_path ? <a href={`${API_BASE}${item.certificate_upload_path}`} target="_blank" rel="noreferrer">View</a> : 'No'}</td>
        </tr>)}</tbody>
      </table>}
    </div>
  </div>
}

const s = {
  wrap: { animation: 'fadeIn .3s ease' }, title: { margin: 0, color: '#1a2469', fontSize: 22, fontWeight: 800 },
  subtitle: { margin: '6px 0 18px', color: '#666', fontSize: 13.5 }, card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.06)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, th: { textAlign: 'left', padding: 10, color: '#1a2469', borderBottom: '2px solid #eee' }, td: { padding: 10, borderBottom: '1px solid #eee', color: '#555' },
  empty: { color: '#999', textAlign: 'center', padding: 22 }, error: { color: '#c0392b' },
}
