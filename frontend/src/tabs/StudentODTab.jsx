import { useEffect, useState } from 'react'
import { API_BASE, createODSubmission, getMyODSubmissions } from '../api'

const emptyForm = (profile) => ({
  register_number: profile?.reg_no && profile.reg_no !== 'N/A' ? profile.reg_no : profile?.roll_no || '',
  department: profile?.department && profile.department !== 'N/A' ? profile.department : '',
  year_section: `${profile?.year && profile.year !== 'N/A' ? profile.year : ''} ${profile?.section && profile.section !== 'N/A' ? profile.section : ''}`.trim(),
  od_date: '',
  total_days: '1',
  student_mobile: profile?.mobile_number && profile.mobile_number !== 'N/A' ? profile.mobile_number : '',
  parent_mobile: '',
  purpose: '',
  document: null,
})

export default function StudentODTab({ profile }) {
  const [form, setForm] = useState(() => emptyForm(profile))
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const { data } = await getMyODSubmissions()
      setSubmissions(Array.isArray(data) ? data : [])
      setError('')
    } catch (e) {
      setError(e.response?.data?.detail || 'Unable to load your OD submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSubmissions() }, [])

  const updateForm = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!form.register_number.trim() || !form.od_date || !form.purpose.trim()) {
      setError('Register number, OD date, and purpose are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createODSubmission(form)
      setForm(emptyForm(profile))
      await loadSubmissions()
      alert('OD form submitted successfully. It is now waiting for admin review.')
    } catch (e) {
      setError(e.response?.data?.detail || 'Unable to submit OD form')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="student-od-page">
      <header className="student-od-header">
        <div>
          <span className="student-od-eyebrow">STUDENT REQUEST</span>
          <h1>On-Duty (OD) Form</h1>
          <p>Submit your request here and track its approval status.</p>
        </div>
      </header>

      <section className="student-od-card">
        <h2>Submit an OD Request</h2>
        <p className="student-od-help">Fill in the details from your On-Duty application. Fields marked * are required.</p>
        <form className="student-od-form" onSubmit={submit}>
          <label>
            Register Number *
            <input required value={form.register_number} onChange={e => updateForm('register_number', e.target.value)} />
          </label>
          <label>
            Department
            <input value={form.department} onChange={e => updateForm('department', e.target.value)} />
          </label>
          <label>
            Year & Section
            <input value={form.year_section} onChange={e => updateForm('year_section', e.target.value)} />
          </label>
          <label>
            OD Date *
            <input type="date" required value={form.od_date} onChange={e => updateForm('od_date', e.target.value)} />
          </label>
          <label>
            Total Number of Days *
            <input type="number" min="1" required value={form.total_days} onChange={e => updateForm('total_days', e.target.value)} />
          </label>
          <label>
            Student Mobile Number
            <input type="tel" value={form.student_mobile} onChange={e => updateForm('student_mobile', e.target.value)} />
          </label>
          <label>
            Parent Mobile Number
            <input type="tel" value={form.parent_mobile} onChange={e => updateForm('parent_mobile', e.target.value)} />
          </label>
          <label className="student-od-full-width">
            Purpose of On-Duty *
            <textarea required rows="4" value={form.purpose} onChange={e => updateForm('purpose', e.target.value)} />
          </label>
          <label className="student-od-full-width">
            Upload signed OD form (optional)
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => updateForm('document', e.target.files?.[0] || null)} />
          </label>
          {error && <div className="student-od-error student-od-full-width" role="alert">{error}</div>}
          <button className="student-od-submit student-od-full-width" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit OD Form'}
          </button>
        </form>
      </section>

      <section className="student-od-card">
        <div className="student-od-submissions-heading">
          <div>
            <h2>My OD Submissions</h2>
            <p className="student-od-help">Your submitted requests and admin decisions appear here.</p>
          </div>
          <span className="student-od-count">{submissions.length} total</span>
        </div>
        {loading ? <p className="student-od-empty">Loading your submissions...</p> : null}
        {!loading && !error && submissions.length === 0 ? (
          <p className="student-od-empty">You have not submitted an OD request yet.</p>
        ) : null}
        {!loading && submissions.length > 0 && (
          <div className="student-od-list">
            {submissions.map(item => (
              <article className="student-od-submission" key={item.id}>
                <div className="student-od-submission-top">
                  <div>
                    <h3>{item.purpose}</h3>
                    <p>{item.od_date} · {item.total_days} day{item.total_days === 1 ? '' : 's'}</p>
                  </div>
                  <span className={`student-od-status student-od-status-${item.status}`}>{item.status}</span>
                </div>
                <p><strong>Register No:</strong> {item.register_number} · {item.department || 'Department not provided'} · {item.year_section || 'Year/section not provided'}</p>
                {item.rejection_reason && <p className="student-od-rejection"><strong>Admin note:</strong> {item.rejection_reason}</p>}
                {item.document_path && (
                  <a href={`${API_BASE}${item.document_path}`} target="_blank" rel="noreferrer">View submitted OD form ↗</a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
