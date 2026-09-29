import { useState, useEffect } from 'react'
import { shared as s } from './sharedStyles'
import { getDashboardStats, exportTopPerformersUrl, exportParticipantsUrl, exportNonParticipantsUrl, createBulkAchievement } from '../api'

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
  const [showBulkAchievement, setShowBulkAchievement] = useState(false)
  const [bulkForm, setBulkForm] = useState({ event_name: '', event_type: 'Technical', prize_type: 'Participation', event_date: '', organizer: '' })
  const [bulkSaving, setBulkSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const params = {}
    if (year) params.year = year
    if (section) params.section = section
    try {
      const res = await getDashboardStats(params)
      setStats(res.data)
    } catch (err) {
      console.error('Failed to load dashboard stats', err)
    } finally {
      setLoading(false)
    }
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

  const totalStudents = Number(stats?.total_students || 0)
  const participants = Number(stats?.total_participants || 0)
  const participationRate = totalStudents > 0 ? Math.round((participants / totalStudents) * 100) : 0

  const selectedStudentIds = (view === 'non_participants' ? stats?.non_participants : stats?.participants || [])
    .map(student => student.id)
    .filter(Boolean)

  const handleBulkAdd = async () => {
    if (!bulkForm.event_name) return alert('Event name is required')
    if (!selectedStudentIds.length) return alert('No students available for this category.')
    if (!confirm(`Add this achievement to all ${selectedStudentIds.length} students in the current ${view.replace('_', ' ')} list?`)) return

    setBulkSaving(true)
    try {
      await createBulkAchievement({ student_ids: selectedStudentIds, ...bulkForm })
      alert(`Achievement added to ${selectedStudentIds.length} student(s).`)
      setBulkForm({ event_name: '', event_type: 'Technical', prize_type: 'Participation', event_date: '', organizer: '' })
      setShowBulkAchievement(false)
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add achievement')
    } finally {
      setBulkSaving(false)
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Page Header */}
      <div style={customStyles.headerRow}>
        <div>
          <div style={customStyles.headerBadge}>CAMPUS PERFORMANCE ANALYTICS</div>
          <h1 style={s.pageTitle}>Institutional Dashboard</h1>
          <div style={s.pageTitleUnderline} />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowBulkAchievement(true)}
            style={customStyles.bulkBtn}
            disabled={!selectedStudentIds.length}
            title={selectedStudentIds.length ? 'Add one achievement to all students in the current list' : 'No students in this list'}
          >
            + Add Achievement to {selectedStudentIds.length || 0} Students
          </button>
          <a
            href={exportUrl({ year, section })}
            style={customStyles.exportBtn}
            target="_blank"
            rel="noreferrer"
          >
            <span>⬇</span>
            <span>Export {VIEWS.find(v => v.key === view)?.label}</span>
          </a>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div style={customStyles.statsGrid}>
        <div style={customStyles.statCard}>
          <div style={{ ...customStyles.statIcon, background: '#eff6ff', color: '#2563eb' }}>👥</div>
          <div>
            <div style={customStyles.statLabel}>Total Enrolled Students</div>
            <div style={customStyles.statValue}>{stats?.total_students ?? '—'}</div>
            <div style={customStyles.statSub}>Across selected criteria</div>
          </div>
        </div>

        <div style={customStyles.statCard}>
          <div style={{ ...customStyles.statIcon, background: '#ecfdf5', color: '#059669' }}>🏆</div>
          <div>
            <div style={customStyles.statLabel}>Active Participants</div>
            <div style={{ ...customStyles.statValue, color: '#059669' }}>{stats?.total_participants ?? '—'}</div>
            <div style={customStyles.statSub}>
              <span style={customStyles.rateBadge}>{participationRate}% Rate</span> of cohort
            </div>
          </div>
        </div>

        <div style={customStyles.statCard}>
          <div style={{ ...customStyles.statIcon, background: '#fef2f2', color: '#dc2626' }}>⚠️</div>
          <div>
            <div style={customStyles.statLabel}>Non-Participants</div>
            <div style={{ ...customStyles.statValue, color: '#dc2626' }}>{stats?.total_non_participants ?? '—'}</div>
            <div style={customStyles.statSub}>Targeted for reminders</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={s.card}>
        {/* Filter Bar */}
        <div style={customStyles.filterRow}>
          <div style={customStyles.filterInputs}>
            <select style={s.select} value={year} onChange={e => setYear(e.target.value)}>
              <option value="">All Academic Years</option>
              {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
            </select>

            <select style={s.select} value={section} onChange={e => setSection(e.target.value)}>
              <option value="">All Sections</option>
              {SECTIONS.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
            </select>
          </div>

          {/* View toggle segmented buttons */}
          <div style={customStyles.viewSegment}>
            {VIEWS.map(v => {
              const active = view === v.key
              return (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  style={{
                    ...customStyles.segmentBtn,
                    ...(active ? customStyles.segmentBtnActive : {}),
                  }}
                >
                  {v.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* List Content */}
        {loading && (
          <div style={s.emptyState}>
            <p>Loading analytics data...</p>
          </div>
        )}

        {!loading && list.length === 0 && (
          <div style={s.emptyState}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
            No students found matching the selected criteria.
          </div>
        )}

        {!loading && list.length > 0 && (
          <div style={customStyles.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, width: 60 }}>#</th>
                  <th style={s.th}>Student Scholar</th>
                  <th style={s.th}>Roll Number</th>
                  <th style={{ ...s.th, width: 90 }}>Section</th>
                  <th style={{ ...s.th, width: 90 }}>Year</th>
                  <th style={s.th}>Last / Top Event</th>
                  {view !== 'non_participants' && <th style={{ ...s.th, textAlign: 'center' }}>Total Wins</th>}
                </tr>
              </thead>
              <tbody>
                {list.map((p, i) => (
                  <tr key={p.id || i} style={customStyles.tableRow}>
                    <td style={{ ...s.td, fontWeight: 700, color: '#64748b' }}>
                      {view === 'top' && i < 3 ? (
                        <span style={customStyles.topRankMedal}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        i + 1
                      )}
                    </td>
                    <td style={{ ...s.td, fontWeight: 700, color: '#0f172a' }}>
                      {p.name}
                    </td>
                    <td style={s.td}>
                      <span style={customStyles.rollChip}>{p.roll_no}</span>
                    </td>
                    <td style={s.td}>{p.section || '—'}</td>
                    <td style={s.td}>{p.year || '—'}</td>
                    <td style={{ ...s.td, color: '#475569' }}>{p.event_name || '—'}</td>
                    {view !== 'non_participants' && (
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <span style={s.badge('#d97706')}>
                          {p.achievement_count} wins
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showBulkAchievement && (
        <div style={modalStyles.backdrop} onClick={() => setShowBulkAchievement(false)}>
          <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={modalStyles.title}>Add Achievement to {selectedStudentIds.length} students</h3>
            <input
              style={modalStyles.input}
              placeholder="Event name"
              value={bulkForm.event_name}
              onChange={e => setBulkForm({ ...bulkForm, event_name: e.target.value })}
            />
            <select
              style={modalStyles.input}
              value={bulkForm.event_type}
              onChange={e => setBulkForm({ ...bulkForm, event_type: e.target.value })}
            >
              <option value="Technical">Technical</option>
              <option value="Non-Technical">Non-Technical</option>
              <option value="Sports">Sports</option>
              <option value="Cultural">Cultural</option>
              <option value="Other">Other</option>
            </select>
            <select
              style={modalStyles.input}
              value={bulkForm.prize_type}
              onChange={e => setBulkForm({ ...bulkForm, prize_type: e.target.value })}
            >
              <option value="1st Prize">1st Prize</option>
              <option value="2nd Prize">2nd Prize</option>
              <option value="3rd Prize">3rd Prize</option>
              <option value="Participation">Participation</option>
            </select>
            <input
              style={modalStyles.input}
              type="date"
              value={bulkForm.event_date}
              onChange={e => setBulkForm({ ...bulkForm, event_date: e.target.value })}
            />
            <input
              style={modalStyles.input}
              placeholder="Organizer / host college"
              value={bulkForm.organizer}
              onChange={e => setBulkForm({ ...bulkForm, organizer: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={modalStyles.primaryBtn} onClick={handleBulkAdd} disabled={bulkSaving}>
                {bulkSaving ? 'Saving...' : `Add to ${selectedStudentIds.length} Students`}
              </button>
              <button style={modalStyles.ghostBtn} onClick={() => setShowBulkAchievement(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const customStyles = {
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
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
  bulkBtn: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #c7d2fe',
    background: '#eef2ff',
    color: '#3730a3',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  exportBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#334155',
    fontWeight: 700,
    fontSize: 13,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: '#ffffff',
    borderRadius: 16,
    padding: '22px 24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    flexShrink: 0,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 30,
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.025em',
    lineHeight: 1.1,
  },
  statSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  rateBadge: {
    color: '#059669',
    fontWeight: 700,
    background: '#ecfdf5',
    padding: '2px 6px',
    borderRadius: 4,
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  filterInputs: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  viewSegment: {
    display: 'flex',
    gap: 4,
    background: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
    border: '1px solid #e2e8f0',
  },
  segmentBtn: {
    padding: '7px 16px',
    border: 'none',
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 600,
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  segmentBtnActive: {
    background: '#ffffff',
    color: '#0f172a',
    fontWeight: 700,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  tableWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  tableRow: {
    transition: 'background 0.15s ease',
  },
  topRankMedal: {
    fontSize: 16,
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
}
