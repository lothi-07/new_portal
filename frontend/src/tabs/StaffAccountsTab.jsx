import { useEffect, useState } from 'react'
import { listStaffAccounts } from '../api'
import { shared as sh } from './sharedStyles'

export default function StaffAccountsTab() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listStaffAccounts()
      .then(({ data }) => setStaff(data))
      .catch(e => setError(e.response?.data?.detail || 'Unable to load staff accounts'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Page Header */}
      <div style={s.headerRow}>
        <div>
          <div style={s.headerBadge}>ADMINISTRATION</div>
          <h1 style={sh.pageTitle}>Staff Accounts</h1>
          <div style={sh.pageTitleUnderline} />
        </div>
      </div>

      <div style={sh.card}>
        <div style={s.sectionHeader}>
          <div>
            <div style={sh.sectionTitle}>Registered Faculty & Staff</div>
            <p style={sh.sectionSub}>All staff members who have accounts in this portal.</p>
          </div>
          <div style={s.countPill}>{staff.length} accounts</div>
        </div>

        {loading && <div style={sh.emptyState}>Loading staff accounts...</div>}
        {error && (
          <div style={s.errorBox}>{error}</div>
        )}

        {!loading && !error && staff.length === 0 && (
          <div style={sh.emptyState}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
            No staff accounts have been registered yet.
          </div>
        )}

        {!loading && !error && staff.length > 0 && (
          <div style={s.tableWrap}>
            <table style={sh.table}>
              <thead>
                <tr>
                  <th style={sh.th}>#</th>
                  <th style={sh.th}>Full Name</th>
                  <th style={sh.th}>Email Address</th>
                  <th style={{ ...sh.th, textAlign: 'center' }}>Account Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((user, i) => (
                  <tr key={user.id}>
                    <td style={{ ...sh.td, color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ ...sh.td, fontWeight: 700, color: '#0f172a' }}>
                      <div style={s.staffNameRow}>
                        <div style={s.staffAvatar}>{(user.name?.[0] || '?').toUpperCase()}</div>
                        {user.name || 'Unknown'}
                      </div>
                    </td>
                    <td style={sh.td}>{user.email}</td>
                    <td style={{ ...sh.td, textAlign: 'center' }}>
                      {user.is_active ? (
                        <span style={s.activeBadge}>● Active</span>
                      ) : (
                        <span style={s.inactiveBadge}>○ Inactive</span>
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
  staffNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  staffAvatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activeBadge: {
    fontSize: 11.5,
    fontWeight: 700,
    color: '#059669',
    background: '#ecfdf5',
    padding: '3px 10px',
    borderRadius: 999,
    border: '1px solid #a7f3d0',
  },
  inactiveBadge: {
    fontSize: 11.5,
    fontWeight: 700,
    color: '#94a3b8',
    background: '#f8fafc',
    padding: '3px 10px',
    borderRadius: 999,
    border: '1px solid #e2e8f0',
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
