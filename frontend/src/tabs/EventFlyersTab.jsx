import { useEffect, useState } from 'react'
import { API_BASE, deleteEventFlyer, listEventFlyers, uploadEventFlyer } from '../api'

export default function EventFlyersTab({ canManage }) {
  const [flyers, setFlyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    event_end_date: '',
    registration_deadline: '',
    organizer: '',
    event_type: 'Technical',
    registration_url: '',
  })
  const [file, setFile] = useState(null)
  const [scanStatus, setScanStatus] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await listEventFlyers()
      setFlyers(res.data || [])
    } catch (e) {
      alert(e.response?.data?.detail || 'Unable to load flyers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const publish = async () => {
    if (!form.title.trim() || !form.event_end_date || !file) {
      return alert('Event title, ending date, and flyer file are required.')
    }
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => data.append(key, value))
    data.append('file', file)

    setUploading(true)
    try {
      await uploadEventFlyer(data)
      setForm({
        title: '',
        description: '',
        event_date: '',
        event_end_date: '',
        registration_deadline: '',
        organizer: '',
        event_type: 'Technical',
        registration_url: '',
      })
      setFile(null)
      setScanStatus('')
      const fileInput = document.getElementById('event-flyer-file')
      if (fileInput) fileInput.value = ''
      await load()
    } catch (e) {
      const detail = e.response?.data?.detail
      const message = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : e.message
      alert(`Unable to upload flyer${message ? `: ${message}` : ''}`)
    } finally {
      setUploading(false)
    }
  }

  const detectRegistrationLink = async (selectedFile) => {
    setFile(selectedFile)
    setScanStatus('')
    if (!selectedFile || selectedFile.type === 'application/pdf') return
    if (!('BarcodeDetector' in window)) {
      setScanStatus('QR auto-detection is not supported in this browser. You can paste the registration link manually.')
      return
    }
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      const codes = await detector.detect(await createImageBitmap(selectedFile))
      const link = codes.find(code => /^https?:\/\//i.test(code.rawValue || ''))?.rawValue
      if (link) {
        setForm(current => ({ ...current, registration_url: link }))
        setScanStatus('✓ Registration link automatically extracted from flyer QR code!')
      } else {
        setScanStatus('No URL detected in flyer QR code. Paste the link manually if available.')
      }
    } catch {
      setScanStatus('Could not scan QR code. Paste the link manually if needed.')
    }
  }

  const remove = async (id) => {
    if (!confirm('Remove this event notice?')) return
    try {
      await deleteEventFlyer(id)
      await load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Unable to remove flyer')
    }
  }

  return (
    <div style={s.wrap}>
      {/* Page Header */}
      <div style={s.header}>
        <div style={s.badge}>CAMPUS EVENT NOTICEBOARD</div>
        <h1 style={s.title}>Academic Event Notices & Flyers</h1>
        <p style={s.subtitle}>Explore upcoming inter-college symposiums, hackathons, workshops, and sports events.</p>
      </div>

      {/* Publish Form for Faculty / Admin */}
      {canManage && (
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <div>
              <h2 style={s.formTitle}>Publish New Event Notice</h2>
              <p style={s.formSub}>Post an academic circular or event brochure with optional QR code registration.</p>
            </div>
            <span style={s.staffPill}>Staff Access</span>
          </div>

          <div style={s.formGrid}>
            <div>
              <label style={s.label}>Event Title *</label>
              <input
                style={s.input}
                placeholder="e.g. InnovateX - National Hackathon 2026"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label style={s.label}>Organizing Body / Department</label>
              <input
                style={s.input}
                placeholder="e.g. Dept of Computer Science & Engg."
                value={form.organizer}
                onChange={e => setForm({ ...form, organizer: e.target.value })}
              />
            </div>

            <div>
              <label style={s.label}>Registration URL</label>
              <input
                style={s.input}
                type="url"
                placeholder="https://forms.gle/... (or auto-detected from QR)"
                value={form.registration_url}
                onChange={e => setForm({ ...form, registration_url: e.target.value })}
              />
            </div>

            <div>
              <label style={s.label}>Event Category</label>
              <select
                style={s.select}
                value={form.event_type}
                onChange={e => setForm({ ...form, event_type: e.target.value })}
              >
                <option>Technical</option>
                <option>Non-Technical</option>
                <option>Sports</option>
                <option>Cultural</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label style={s.label}>Event Start Date</label>
              <input
                style={s.input}
                type="date"
                value={form.event_date}
                onChange={e => setForm({ ...form, event_date: e.target.value })}
              />
            </div>

            <div>
              <label style={s.label}>Event End Date *</label>
              <input
                style={s.input}
                type="date"
                value={form.event_end_date}
                onChange={e => setForm({ ...form, event_end_date: e.target.value })}
              />
            </div>

            <div>
              <label style={s.label}>Registration Deadline</label>
              <input
                style={s.input}
                type="date"
                value={form.registration_deadline}
                onChange={e => setForm({ ...form, registration_deadline: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={s.label}>Description / Eligibility Guidelines</label>
            <textarea
              style={s.textarea}
              placeholder="Provide event details, team size, venue, registration fees, or rules..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={s.uploadRow}>
            <div style={s.fileBox}>
              <label style={s.fileLabel}>Brochure / Poster File (Image or PDF) *</label>
              <input
                id="event-flyer-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                style={s.fileInput}
                onChange={e => detectRegistrationLink(e.target.files[0])}
              />
            </div>

            <button style={s.publishBtn} onClick={publish} disabled={uploading}>
              {uploading ? 'Publishing Notice...' : '🚀 Publish Event Notice'}
            </button>
          </div>

          {scanStatus && (
            <div style={s.scanStatusBox}>
              {scanStatus}
            </div>
          )}
        </div>
      )}

      {/* Flyers Grid */}
      {loading ? (
        <div style={s.empty}>
          <p>Loading event notices...</p>
        </div>
      ) : flyers.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📢</div>
          <h3>No Event Flyers Published Yet</h3>
          <p>Faculty members can upload new event posters and guidelines using the form above.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {flyers.map(flyer => (
            <article key={flyer.id} style={s.card}>
              <div style={s.mediaWrap}>
                {flyer.flyer_content_type === 'application/pdf' ? (
                  <a
                    href={`${API_BASE}${flyer.flyer_path}`}
                    target="_blank"
                    rel="noreferrer"
                    style={s.pdf}
                  >
                    <span>📄</span>
                    <strong>View PDF Brochure</strong>
                  </a>
                ) : (
                  <img
                    src={`${API_BASE}${flyer.flyer_path}`}
                    alt={`${flyer.title} flyer`}
                    style={s.image}
                  />
                )}
                <span style={s.categoryTag}>{flyer.event_type || 'Academic'}</span>
              </div>

              <div style={s.body}>
                <h2 style={s.cardTitle}>{flyer.title}</h2>

                {flyer.description && (
                  <p style={s.description}>{flyer.description}</p>
                )}

                <div style={s.metaGroup}>
                  {flyer.organizer && (
                    <div style={s.metaItem}>🏛️ <strong>Organizer:</strong> {flyer.organizer}</div>
                  )}
                  {flyer.event_date && (
                    <div style={s.metaItem}>
                      📅 <strong>Date:</strong> {flyer.event_date}
                      {flyer.event_end_date ? ` to ${flyer.event_end_date}` : ''}
                    </div>
                  )}
                  {flyer.registration_deadline && (
                    <div style={s.deadline}>
                      ⏰ <strong>Register By:</strong> {flyer.registration_deadline}
                    </div>
                  )}
                </div>

                <div style={s.cardActions}>
                  {flyer.registration_url && (
                    <a
                      href={flyer.registration_url}
                      target="_blank"
                      rel="noreferrer"
                      style={s.registrationLink}
                    >
                      Open Registration ↗
                    </a>
                  )}
                  {canManage && (
                    <button style={s.deleteBtn} onClick={() => remove(flyer.id)}>
                      Remove Notice
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { animation: 'fadeIn 0.3s ease' },
  header: { marginBottom: 24 },
  badge: {
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
  title: { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' },
  subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: 13.5 },

  formCard: {
    background: '#ffffff',
    borderRadius: 18,
    padding: '24px 28px',
    marginBottom: 28,
    boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
    border: '1px solid #e2e8f0',
  },
  formHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  formTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' },
  formSub: { margin: '4px 0 0', fontSize: 13, color: '#64748b' },
  staffPill: {
    fontSize: 11,
    fontWeight: 800,
    color: '#b45309',
    background: '#fef3c7',
    padding: '3px 10px',
    borderRadius: 999,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    padding: '10px 14px',
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    fontSize: 13,
    boxSizing: 'border-box',
    width: '100%',
    color: '#0f172a',
    background: '#ffffff',
    outline: 'none',
  },
  select: {
    padding: '10px 14px',
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    fontSize: 13,
    boxSizing: 'border-box',
    width: '100%',
    color: '#0f172a',
    background: '#ffffff',
    outline: 'none',
  },
  textarea: {
    padding: '10px 14px',
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    fontSize: 13,
    boxSizing: 'border-box',
    width: '100%',
    minHeight: 70,
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
  },
  uploadRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  fileBox: {
    flex: 1,
    minWidth: 260,
  },
  fileLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 6,
  },
  fileInput: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1.5px dashed #cbd5e1',
    background: '#f8fafc',
    fontSize: 12.5,
    width: '100%',
    boxSizing: 'border-box',
  },
  publishBtn: {
    padding: '11px 24px',
    border: 'none',
    borderRadius: 9,
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 13.5,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
  },
  scanStatusBox: {
    marginTop: 12,
    padding: '10px 14px',
    borderRadius: 8,
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1d4ed8',
    fontSize: 12.5,
    fontWeight: 600,
  },

  /* Grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
  },
  card: {
    background: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 14px -2px rgba(15, 23, 42, 0.05)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
  },
  mediaWrap: {
    position: 'relative',
    height: 180,
    background: '#0f172a',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  pdf: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: '#0f172a',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: 13,
  },
  categoryTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 6,
  },
  body: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
  },
  cardTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.35,
  },
  description: {
    margin: 0,
    color: '#64748b',
    fontSize: 13,
    lineHeight: 1.5,
  },
  metaGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 12.5,
    color: '#475569',
  },
  metaItem: {
    lineHeight: 1.4,
  },
  deadline: {
    color: '#b45309',
    fontWeight: 700,
    background: '#fef3c7',
    padding: '3px 8px',
    borderRadius: 6,
    width: 'fit-content',
    marginTop: 4,
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 'auto',
    paddingTop: 12,
    borderTop: '1px solid #f1f5f9',
  },
  registrationLink: {
    padding: '7px 14px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 12,
    textDecoration: 'none',
  },
  deleteBtn: {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid #fecaca',
    background: '#ffffff',
    color: '#dc2626',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  empty: {
    padding: 60,
    textAlign: 'center',
    color: '#94a3b8',
    background: '#ffffff',
    borderRadius: 16,
    border: '1.5px dashed #cbd5e1',
  },
}
