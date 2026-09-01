import { useState, useEffect } from 'react'
import { shared as s } from './sharedStyles'
import { getDashboardStats, exportTopPerformersUrl, exportParticipantsUrl, exportNonParticipantsUrl } from '../api'

const YEARS = ['I', 'II', 'III', 'IV']
const SECTIONS = ['A', 'B', 'C']
const VIEWS = [
  { key: 'top', label: 'Top Performers' },
  { key: 'participants', label: 'Participants' },
  { key: 'non_participants', label: 'Non-Participants' },
]

export default function DashboardTab() {
  const [year, setYear] = useState('')
  const [section, setSection] = useState('')
  const [view, setView] = useState('top')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const params = {}
    if (year) params.year = year
    if (section) params.section = section
    const res = await getDashboardStats(params)
    setStats(res.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [year, section])

  const list = stats
    ? view === 'top' ? stats.top_performers
    : view === 'participants' ? stats.participants
    : stats.non_participants
    : []

  const exportUrl = view === 'top' ? exportTopPerformersUrl
    : view === 'participants' ? exportParticipantsUrl
    : exportNonParticipantsUrl

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={s.pageTitle}>Dashboard</h1>
        <div style={s.pageTitleUnderline} />
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 22 }}>
        <StatCard label="Total Students" value={stats?.total_students ?? '—'} color="#1a2469" />
        <StatCard label="Participants" value={stats?.total_participants ?? '—'} color="#2e7d5b" />
        <StatCard label="Non-Participants" value={stats?.total_non_participants ?? '—'} color="#c0392b" />
      </div>

      {/* Table Card */}
      <div style={s.card}>
        {/* Filter Bar */}
        <div style={s.filterBar}>
          <select style={s.select} value={year} onChange={e => setYear(e.target.value)}>
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
          </select>
          <select style={s.select} value={section} onChange={e => setSection(e.target.value)}>
            <option value="">All Sections</option>
            {SECTIONS.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
          </select>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', background: '#f4f4f8', borderRadius: 8, padding: 3 }}>
            {VIEWS.map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                style={{
                  padding: '7px 14px', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 600,
                  background: view === v.key ? '#fff' : 'transparent',
                  color: view === v.key ? '#1a2469' : '#888',
                  boxShadow: view === v.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >{v.label}</button>
            ))}
          </div>

          <a href={exportUrl({ year, section })} style={{ ...s.btnGhost, textDecoration: 'none' }}>⬇ Export</a>
        </div>

        {loading && <p style={{ color: '#999', padding: 20 }}>Loading…</p>}
        {!loading && list.length === 0 && <div style={s.emptyState}>No students in this list.</div>}
        {!loading && list.length > 0 && (
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #eee' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>Roll No</th>
                  <th style={s.th}>Section</th>
                  <th style={s.th}>Year</th>
                  <th style={s.th}>Event Name</th>
                  {view !== 'non_participants' && <th style={s.th}>Achievements</th>}
                </tr>
              </thead>
              <tbody>
                {list.map((p, i) => (
                  <tr key={p.id}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={{ ...s.td, fontWeight: 600, color: '#1a2469' }}>{p.name}</td>
                    <td style={s.td}>{p.roll_no}</td>
                    <td style={s.td}>{p.section}</td>
                    <td style={s.td}>{p.year}</td>
                    <td style={s.td}>{p.event_name || '—'}</td>
                    {view !== 'non_participants' && (
                      <td style={s.td}><span style={s.badge('#c9a227')}>{p.achievement_count}</span></td>
                    )}
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

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 12.5, color: '#888', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}
