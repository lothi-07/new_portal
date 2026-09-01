import { useState } from 'react'
import { shared as s } from './sharedStyles'
import { searchEvents, exportEventSearchUrl } from '../api'

const EVENT_TYPES = ['Technical', 'Non-Technical', 'Sports', 'Cultural', 'Other']

export default function EventSearchTab() {
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const runSearch = async () => {
    setLoading(true)
    const params = {}
    if (eventName) params.event_name = eventName
    if (eventType) params.event_type = eventType
    const res = await searchEvents(params)
    setResults(res.data)
    setSearched(true)
    setLoading(false)
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={s.pageTitle}>Event Search</h1>
        <div style={s.pageTitleUnderline} />
      </div>
      <div style={s.card}>
      <p style={s.sectionSub}>Search which students participated in a specific event (e.g. "Hackathon")</p>

      <div style={s.filterBar}>
        <input
          style={s.input}
          placeholder="Event name (e.g. Hackathon, Paper Presentation)"
          value={eventName}
          onChange={e => setEventName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runSearch()}
        />
        <select style={s.select} value={eventType} onChange={e => setEventType(e.target.value)}>
          <option value="">All Types</option>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button style={s.btnPrimary} onClick={runSearch}>Search</button>
        {searched && results.length > 0 && (
          <a href={exportEventSearchUrl({ event_name: eventName, event_type: eventType })} style={{ ...s.btnGhost, textDecoration: 'none' }}>
            ⬇ Export Results
          </a>
        )}
      </div>

      {loading && <p style={{ color: '#999', padding: '16px 0' }}>Searching…</p>}
      {!loading && searched && results.length === 0 && (
        <div style={s.emptyState}>No matching participation records found.</div>
      )}
      {!loading && results.length > 0 && (
        <>
          <div style={{ fontSize: 12.5, color: '#888', marginBottom: 10 }}>{results.length} result(s)</div>
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #eee' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Name</th>
                <th style={s.th}>Roll No</th>
                <th style={s.th}>Event Name</th>
                <th style={s.th}>Type</th>
                <th style={s.th}>Prize</th>
                <th style={s.th}>Date</th>
                <th style={s.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.achievement_id}>
                  <td style={s.td}>{i + 1}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{r.student_name}</td>
                  <td style={s.td}>{r.roll_no}</td>
                  <td style={s.td}>{r.event_name}</td>
                  <td style={s.td}>{r.event_type || '—'}</td>
                  <td style={s.td}>{r.prize_type || '—'}</td>
                  <td style={s.td}>{r.event_date || '—'}</td>
                  <td style={s.td}>
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent('openStudentProfile', { detail: { studentId: r.student_id } }))}
                      style={{
                        border: 'none',
                        background: '#1a2469',
                        color: '#fff',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
      </div>
    </div>
  )
}
