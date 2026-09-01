import { useState } from 'react'
import { shared as s } from './sharedStyles'
import { importStudents } from '../api'

const YEARS = ['I', 'II', 'III', 'IV']
const SECTIONS = ['A', 'B', 'C']

export default function ImportTab() {
  const [year, setYear] = useState('I')
  const [section, setSection] = useState('A')
  const [studentsFile, setStudentsFile] = useState(null)
  const [photosZip, setPhotosZip] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!studentsFile) return setError('Please choose the student details file (.xlsx)')
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('year', year)
      fd.append('section', section)
      fd.append('students_file', studentsFile)
      if (photosZip) fd.append('photos_zip', photosZip)
      const res = await importStudents(fd)
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Import failed')
    }
    setLoading(false)
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={s.pageTitle}>Import Students</h1>
        <div style={s.pageTitleUnderline} />
      </div>
    <div style={s.card}>
      <p style={s.sectionSub}>
        For adding a whole class at once. Upload the student details Excel and (optionally) a ZIP of
        photos — each photo file must be named exactly as the student's roll number (e.g. ES24AD62.jpg).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14, maxWidth: 500 }}>
        <div>
          <label style={{ fontSize: 12.5, color: '#666', fontWeight: 600, display: 'block', marginBottom: 6 }}>Year</label>
          <select style={{ ...s.select, width: '100%' }} value={year} onChange={e => setYear(e.target.value)}>
            {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12.5, color: '#666', fontWeight: 600, display: 'block', marginBottom: 6 }}>Section</label>
          <select style={{ ...s.select, width: '100%' }} value={section} onChange={e => setSection(e.target.value)}>
            {SECTIONS.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14, maxWidth: 500 }}>
        <label style={{ fontSize: 12.5, color: '#666', fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Student Details File (.xlsx)
        </label>
        <input type="file" accept=".xlsx,.xls" style={s.select} onChange={e => setStudentsFile(e.target.files[0])} />
      </div>

      <div style={{ marginBottom: 20, maxWidth: 500 }}>
        <label style={{ fontSize: 12.5, color: '#666', fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Photos ZIP (optional — filenames must match roll numbers)
        </label>
        <input type="file" accept=".zip" style={s.select} onChange={e => setPhotosZip(e.target.files[0])} />
      </div>

      {error && <div style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <button style={s.btnPrimary} onClick={submit} disabled={loading}>
        {loading ? 'Importing...' : 'Import Students'}
      </button>

      {result && (
        <div style={{
          marginTop: 20, padding: 16, borderRadius: 10, background: '#f3f9f5',
          border: '1px solid #cfe8d9', fontSize: 13.5,
        }}>
          <div style={{ fontWeight: 700, color: '#2E7D5B', marginBottom: 6 }}>Import complete ✓</div>
          <div>New students created: <strong>{result.created}</strong></div>
          <div>Existing students updated: <strong>{result.updated}</strong></div>
          <div>Rows skipped (missing roll no): <strong>{result.skipped_rows}</strong></div>
          <div>Photos matched: <strong>{result.photos_matched}</strong></div>
        </div>
      )}
    </div>
    </div>
  )
}
