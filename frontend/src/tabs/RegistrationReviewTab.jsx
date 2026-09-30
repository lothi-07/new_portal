import { useEffect, useState } from 'react'
import { API_BASE, getRegistrations } from '../api'
import { shared as sh } from './sharedStyles'

export default function RegistrationReviewTab() {
  const [registrations, setRegistrations] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try { setRegistrations((await getRegistrations()).data) }
    catch (e) { setError(e.response?.data?.detail || 'Unable to load registrations') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={s.headerRow}>
        <div>
          <div style={s.headerBadge}>STUDENT SUBMISSIONS</div>
          <h1 style={sh.pageTitle}>Event Registrations</h1>
          <div style={sh.pageTitleUnderline} />
        </div>
        <button style={sh.btnGhost} onClick={load}>↻ Refresh</button>
      </div>

      <div style={sh.card}>
        <div style={s.sectionHeader}>
          <div>
            <div style={sh.sectionTitle}>Submitted Registrations</div>
            <p style={sh.sectionSub}>
              Student event registrations with uploaded screenshots and certificates.
            </p>
          </div>
          <div style={s.countPill}>{registrations.length} submissions</div>
        </div>

        {loading && <div style={sh.emptyState}>Loading registrations...</div>}
        {error && <div style={s.errorBox}>{error}</div>}

        {!loading && !error && registrations.length === 0 && (
          <div style={sh.emptyState}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            No registrations submitted yet.
          </div>
        )}

        {!loading && !error && registrations.length > 0 && (
          <div style={s.tableWrap}>
            <table style={sh.table}>
              <thead>
                <tr>
                  <th style={sh.th}>#</th>
                  <th style={sh.th}>Student Name</th>
                  <th style={sh.th}>Event Name</th>
                  <th style={{ ...sh.th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...sh.th, textAlign: 'center' }}>Registration Proof</th>
                  <th style={{ ...sh.th, textAlign: 'center' }}>Details</th>
                  <th style={{ ...sh.th, textAlign: 'center' }}>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((item, i) => (
                  <tr key={item.id}>
                    <td style={{ ...sh.td, color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ ...sh.td, fontWeight: 700, color: '#0f172a' }}>
                      {item.full_name || item.student_name || '—'}
                    </td>
                    <td style={sh.td}>{item.event_title}</td>
                    <td style={{ ...sh.td, textAlign: 'center' }}>
                      <span style={
                        item.verification_status === 'approved' ? s.approvedBadge :
                        item.verification_status === 'rejected' ? s.rejectedBadge :
                        s.pendingBadge
                      }>
                        {item.verification_status ? item.verification_status : 'pending'}
                      </span>
                    </td>
                    <td style={{ ...sh.td, textAlign: 'center' }}>
                      {item.registration_screenshot_path ? (
                        <a href={`${API_BASE}${item.registration_screenshot_path}`} target="_blank" rel="noreferrer" style={s.viewLink}>View ↗</a>
                      ) : (
                        <span style={s.naText}>Not uploaded</span>
                      )}
                    </td>
                    <td style={{ ...sh.td, textAlign: 'center' }}>
                      <button type="button" style={s.viewBtn} onClick={() => setSelected(item)}>View</button>
                    </td>
                    <td style={{ ...sh.td, textAlign: 'center' }}>
                      {item.certificate_upload_path ? (
                        <a href={`${API_BASE}${item.certificate_upload_path}`} target="_blank" rel="noreferrer" style={s.certLink}>View ↗</a>
                      ) : (
                        <span style={s.naText}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div style={s.modalBackdrop} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Submission Details</h3>
              <button type="button" style={s.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={s.detailGrid}>
              <div><strong>Student:</strong> {selected.full_name || selected.student_name || '—'}</div>
              <div><strong>Email:</strong> {selected.email || '—'}</div>
              <div><strong>Roll No:</strong> {selected.roll_no || '—'}</div>
              <div><strong>Phone:</strong> {selected.phone || '—'}</div>
              <div><strong>Year:</strong> {selected.year || '—'}</div>
              <div><strong>Department:</strong> {selected.department || '—'}</div>
              <div><strong>Section:</strong> {selected.section || '—'}</div>
              <div><strong>Event:</strong> {selected.event_title || '—'}</div>
            </div>

            {selected.registration_screenshot_path && (
              <div style={s.previewBox}>
                <img src={`${API_BASE}${selected.registration_screenshot_path}`} alt="registration proof" style={s.previewImage} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 12,
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
  sectionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  countPill: {
    fontSize: 12,
    fontWeight: 700,
    background: '#f1f5f9',
    color: '#475569',
    padding: '4px 12px',
    borderRadius: 999,
    flexShrink: 0,
  },
  tableWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  approvedBadge: {
    fontSize: 11.5,
    fontWeight: 700,
    color: '#059669',
    background: '#ecfdf5',
    padding: '3px 10px',
    borderRadius: 999,
    border: '1px solid #a7f3d0',
  },
  rejectedBadge: {
    fontSize: 11.5,
    fontWeight: 700,
    color: '#dc2626',
    background: '#fee2e2',
    padding: '3px 10px',
    borderRadius: 999,
    border: '1px solid #fca5a5',
  },
  pendingBadge: {
    fontSize: 11.5,
    fontWeight: 700,
    color: '#b45309',
    background: '#fef3c7',
    padding: '3px 10px',
    borderRadius: 999,
    border: '1px solid #fde68a',
  },
  actionWrap: {
    display: 'flex',
    gap: 6,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  viewBtn: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1d4ed8',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 6,
    padding: '4px 8px',
    cursor: 'pointer',
  },
  approveBtn: {
    fontSize: 11,
    fontWeight: 700,
    color: '#166534',
    background: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: 6,
    padding: '4px 8px',
    cursor: 'pointer',
  },
  rejectBtn: {
    fontSize: 11,
    fontWeight: 700,
    color: '#991b1b',
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    borderRadius: 6,
    padding: '4px 8px',
    cursor: 'pointer',
  },
  viewLink: {
    fontSize: 12,
    fontWeight: 700,
    color: '#2563eb',
    textDecoration: 'none',
    background: '#eff6ff',
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid #bfdbfe',
  },
  certLink: {
    fontSize: 12,
    fontWeight: 700,
    color: '#059669',
    textDecoration: 'none',
    background: '#ecfdf5',
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid #a7f3d0',
  },
  naText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  errorBox: {
    padding: '12px 16px',
    borderRadius: 8,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: 13,
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 50,
  },
  modal: {
    width: 'min(760px, 92vw)',
    maxHeight: '88vh',
    overflowY: 'auto',
    background: '#ffffff',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.2)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  modalTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: 20,
    fontWeight: 800,
  },
  closeBtn: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 8,
    width: 32,
    height: 32,
    fontSize: 18,
    cursor: 'pointer',
    color: '#334155',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px 16px',
    color: '#0f172a',
    fontSize: 13,
    lineHeight: 1.6,
    marginBottom: 14,
  },
  previewBox: {
    marginTop: 10,
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    padding: 12,
    display: 'flex',
    justifyContent: 'center',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: 340,
    borderRadius: 12,
    objectFit: 'contain',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
}
