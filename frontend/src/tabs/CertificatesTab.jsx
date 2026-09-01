import { useState } from 'react'
import { shared as s } from './sharedStyles'
import { getEligibleStudents, generateCertificateFor, API_BASE } from '../api'

const YEARS = ['I', 'II', 'III', 'IV']

export default function CertificatesTab() {
  const [year, setYear] = useState('I')
  const [minAch, setMinAch] = useState(1)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState({})
  const [outputs, setOutputs] = useState({})
  const [searched, setSearched] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await getEligibleStudents({ year, min_achievements: minAch })
    setStudents(res.data)
    setSearched(true)
    setLoading(false)
  }

  const generate = async (id) => {
    setGenerating(g => ({ ...g, [id]: true }))
    try {
      const res = await generateCertificateFor(id)
      setOutputs(o => ({ ...o, [id]: res.data.output_path }))
    } catch (e) {
      alert(e.response?.data?.detail || 'Generation failed')
    }
    setGenerating(g => ({ ...g, [id]: false }))
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={s.pageTitle}>Certificates</h1>
        <div style={s.pageTitleUnderline} />
      </div>
      <div style={s.card}>
        <p style={s.sectionSub}>Find students meeting a minimum achievement count, then generate their certificates.</p>

      <div style={s.filterBar}>
        <select style={s.select} value={year} onChange={e => setYear(e.target.value)}>
          {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
        </select>
        <label style={{ fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
          Minimum Achievements:
          <input
            type="number" min="0" style={{ ...s.select, width: 70 }}
            value={minAch} onChange={e => setMinAch(Number(e.target.value))}
          />
        </label>
        <button style={s.btnPrimary} onClick={load}>{loading ? 'Loading...' : 'Find Students'}</button>
      </div>

      {searched && students.length === 0 && <div style={s.emptyState}>No students match this criteria.</div>}
      {students.length > 0 && (
        <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #eee' }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>#</th>
              <th style={s.th}>Name</th>
              <th style={s.th}>Roll No</th>
              <th style={s.th}>Section</th>
              <th style={s.th}>Achievements</th>
              <th style={s.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((st, i) => (
              <tr key={st.id}>
                <td style={s.td}>{i + 1}</td>
                <td style={{ ...s.td, fontWeight: 600 }}>{st.name}</td>
                <td style={s.td}>{st.roll_no}</td>
                <td style={s.td}>{st.section}</td>
                <td style={s.td}><span style={s.badge('#d4a017')}>{st.achievement_count}</span></td>
                <td style={s.td}>
                  {outputs[st.id] ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={`${API_BASE}${outputs[st.id]}`} target="_blank" rel="noreferrer" style={{ ...s.btnSmall, background: '#2E7D5B', color: '#fff', textDecoration: 'none' }}>View</a>
                      <a href={`${API_BASE}${outputs[st.id]}`} download style={{ ...s.btnSmall, background: '#4B3F72', color: '#fff', textDecoration: 'none' }}>Download</a>
                    </div>
                  ) : (
                    <button style={{ ...s.btnSmall, background: '#d4a017', color: '#fff' }} onClick={() => generate(st.id)} disabled={generating[st.id]}>
                      {generating[st.id] ? 'Generating...' : 'Generate'}
                    </button>
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
