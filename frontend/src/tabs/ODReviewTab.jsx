import { useEffect, useState } from 'react'
import { API_BASE, getODSubmissions, reviewODSubmission } from '../api'
import { shared as sh } from './sharedStyles'

export default function ODReviewTab() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setItems((await getODSubmissions()).data || [])
      setError('')
    } catch (e) {
      setError(e.response?.data?.detail || 'Unable to load OD submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const decide = async (id, approved) => {
    try {
      await reviewODSubmission(id, approved)
      setSelected(null)
      await load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Unable to update OD status')
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={s.headerRow}>
        <div>
          <div style={s.badge}>STUDENT OD REQUESTS</div>
          <h1 style={sh.pageTitle}>OD Form Submissions</h1>
          <div style={sh.pageTitleUnderline} />
        </div>
        <button style={sh.btnGhost} onClick={load}>↻ Refresh</button>
      </div>
      <div style={sh.card}>
        <div style={s.sectionHeader}>
          <div>
            <div style={sh.sectionTitle}>On-Duty Requests</div>
            <p style={sh.sectionSub}>Review the details submitted by students and approve or reject each request.</p>
          </div>
          <div style={s.count}>{items.length} submissions</div>
        </div>
        {loading && <div style={sh.emptyState}>Loading OD submissions...</div>}
        {error && <div style={s.error}>{error}</div>}
        {!loading && !error && items.length === 0 && <div style={sh.emptyState}>No OD submissions yet.</div>}
        {!loading && !error && items.length > 0 && (
          <div style={s.tableWrap}>
            <table style={sh.table}>
              <thead><tr>
                <th style={sh.th}>#</th><th style={sh.th}>Student</th><th style={sh.th}>Register No.</th>
                <th style={sh.th}>OD Date</th><th style={sh.th}>Purpose</th>
                <th style={sh.th}>Status</th><th style={sh.th}>Action</th>
              </tr></thead>
              <tbody>{items.map((item, index) => (
                <tr key={item.id}>
                  <td style={sh.td}>{index + 1}</td>
                  <td style={{ ...sh.td, fontWeight: 700 }}>{item.student_name}</td>
                  <td style={sh.td}>{item.register_number}</td>
                  <td style={sh.td}>{item.od_date} ({item.total_days} day{item.total_days === 1 ? '' : 's'})</td>
                  <td style={sh.td}>{item.purpose}</td>
                  <td style={sh.td}><span style={item.status === 'approved' ? s.approved : item.status === 'rejected' ? s.rejected : s.pending}>{item.status}</span></td>
                  <td style={sh.td}>
                    <div style={s.actions}>
                      <button style={s.view} onClick={() => setSelected(item)}>View</button>
                      {item.status !== 'approved' && <button style={s.approve} onClick={() => decide(item.id, true)}>Approve</button>}
                      {item.status !== 'rejected' && <button style={s.reject} onClick={() => decide(item.id, false)}>Reject</button>}
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      {selected && (
        <div style={s.backdrop} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}><h2 style={s.modalTitle}>OD Submission Details</h2><button style={s.close} onClick={() => setSelected(null)}>✕</button></div>
            <div style={s.details}>
              <div><b>Student Name:</b> {selected.student_name}</div>
              <div><b>Register Number:</b> {selected.register_number}</div>
              <div><b>Department:</b> {selected.department || '—'}</div>
              <div><b>Year & Section:</b> {selected.year_section || '—'}</div>
              <div><b>OD Date:</b> {selected.od_date}</div>
              <div><b>Total Days:</b> {selected.total_days}</div>
              <div><b>Student Mobile:</b> {selected.student_mobile || '—'}</div>
              <div><b>Parent Mobile:</b> {selected.parent_mobile || '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><b>Purpose:</b> {selected.purpose}</div>
            </div>
            {selected.document_path && <a style={s.document} href={`${API_BASE}${selected.document_path}`} target="_blank" rel="noreferrer">View uploaded OD document ↗</a>}
            <div style={s.modalActions}>
              {selected.status !== 'approved' && <button style={s.approve} onClick={() => decide(selected.id, true)}>Approve</button>}
              {selected.status !== 'rejected' && <button style={s.reject} onClick={() => decide(selected.id, false)}>Reject</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
  badge: { display: 'inline-block', fontSize: 10.5, fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '3px 9px', borderRadius: 6, marginBottom: 6 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 },
  count: { background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 },
  tableWrap: { border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'auto' },
  actions: { display: 'flex', gap: 5, flexWrap: 'wrap' },
  view: { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' },
  approve: { border: '1px solid #86efac', background: '#dcfce7', color: '#166534', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontWeight: 700 },
  reject: { border: '1px solid #fca5a5', background: '#fee2e2', color: '#991b1b', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontWeight: 700 },
  approved: { color: '#166534', background: '#dcfce7', padding: '3px 9px', borderRadius: 999, fontWeight: 700 },
  rejected: { color: '#991b1b', background: '#fee2e2', padding: '3px 9px', borderRadius: 999, fontWeight: 700 },
  pending: { color: '#92400e', background: '#fef3c7', padding: '3px 9px', borderRadius: 999, fontWeight: 700 },
  error: { padding: 12, color: '#b91c1c', background: '#fef2f2', borderRadius: 8 },
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 },
  modal: { width: 'min(700px, 94vw)', background: '#fff', borderRadius: 16, padding: 22 },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { margin: 0, fontSize: 20, color: '#0f172a' },
  close: { border: 0, background: '#f1f5f9', borderRadius: 8, padding: 8, cursor: 'pointer' },
  details: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, color: '#334155', fontSize: 14, lineHeight: 1.5 },
  document: { display: 'inline-block', marginTop: 18, color: '#2563eb', fontWeight: 700 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 },
}
