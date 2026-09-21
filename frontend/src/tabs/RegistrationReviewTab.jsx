import { useEffect, useState } from 'react'
import { API_BASE, getRegistrations } from '../api'
import { shared as sh } from './sharedStyles'

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

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Page Header */}
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
                  <th style={{ ...sh.th, textAlign: 'center' }}>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((item, i) => (
                  <tr key={item.id}>
                    <td style={{ ...sh.td, color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ ...sh.td, fontWeight: 700, color: '#0f172a' }}>{item.student_name}</td>
                    <td style={sh.td}>{item.event_title}</td>
                    <td style={{ ...sh.td, textAlign: 'center' }}>
                      <span style={item.verification_status === 'Verified' ? s.verifiedBadge : s.pendingBadge}>
                        {item.verification_status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ ...sh.td, textAlign: 'center' }}>
                      {item.registration_screenshot_path ? (
                        <a
                          href={`${API_BASE}${item.registration_screenshot_path}`}
                          target="_blank"
                          rel="noreferrer"
                          style={s.viewLink}
                        >
                          View ↗
                        </a>
                      ) : (
                        <span style={s.naText}>Not uploaded</span>
                      )}
                    </td>
                    <td style={{ ...sh.td, textAlign: 'center' }}>
                      {item.certificate_upload_path ? (
                        <a
                          href={`${API_BASE}${item.certificate_upload_path}`}
                          target="_blank"
                          rel="noreferrer"
                          style={s.certLink}
                        >
                          View ↗
                        </a>
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
  verifiedBadge: {
    fontSize: 11.5,
    fontWeight: 700,
    color: '#059669',
    background: '#ecfdf5',
    padding: '3px 10px',
    borderRadius: 999,
    border: '1px solid #a7f3d0',
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
}
