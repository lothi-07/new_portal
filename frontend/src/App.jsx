import { useState, useEffect } from 'react'
import LoginPage from './LoginPage.jsx'
import StudentsTab from './tabs/StudentsTab.jsx'
import DashboardTab from './tabs/DashboardTab.jsx'
import EventSearchTab from './tabs/EventSearchTab.jsx'
import CertificatesTab from './tabs/CertificatesTab.jsx'
import ImportTab from './tabs/ImportTab.jsx'
import NotificationsTab from './tabs/NotificationsTab.jsx'
import EventFlyersTab from './tabs/EventFlyersTab.jsx'
import StaffAccountsTab from './tabs/StaffAccountsTab.jsx'
import StudentView from "./StudentView.jsx";
const NAV_ITEMS = [
  { key: 'students',     label: 'Students',        icon: StudentIcon, adminOnly: true },
  { key: 'dashboard',    label: 'Dashboard',       icon: DashboardIcon, adminOnly: true },
  { key: 'events',       label: 'Student Participation',    icon: SearchIcon, adminOnly: true },
  { key: 'certificates', label: 'Certificates',    icon: CertIcon, adminOnly: true },
  { key: 'flyers',       label: 'Event Flyers',    icon: FlyerIcon },
]

const ADMIN_ITEMS = [
  { key: 'import',       label: 'Import Students', icon: ImportIcon, adminOnly: true },
  { key: 'notifications', label: 'Mail Reminders', icon: MailIcon, adminOnly: true },
  { key: 'staff',        label: 'Staff Accounts',  icon: StaffIcon, adminOnly: true },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('students')
  const [studentProfileTarget, setStudentProfileTarget] = useState(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('session')
    if (saved) setSession(JSON.parse(saved))
  }, [])

  useEffect(() => {
    const handler = (event) => {
      const studentId = event.detail?.studentId
      if (studentId) {
        setStudentProfileTarget(studentId)
        setActiveTab('students')
      }
    }

    window.addEventListener('openStudentProfile', handler)
    return () => window.removeEventListener('openStudentProfile', handler)
  }, [])

  useEffect(() => {
    if (session?.role === 'staff') setActiveTab('flyers')
  }, [session])

  const handleLoggedIn = (data) => {
    const accessToken = data?.access_token || ''
    sessionStorage.setItem('access_token', accessToken)
    sessionStorage.setItem('session', JSON.stringify(data))
    setSession(data)
    setActiveTab(data.role === 'staff' ? 'flyers' : 'students')
  }

  const logout = () => {
    sessionStorage.clear()
    setSession(null)
  }

  if (!session) return <LoginPage onLoggedIn={handleLoggedIn} />
  if (session.role === 'student') {
  return <StudentView session={session} onLogout={logout} />
}
  const isAdmin = session.role !== 'staff'
  const visibleNavItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)
  const visibleAdminItems = ADMIN_ITEMS.filter(item => !item.adminOnly || isAdmin)

  return (
    <div style={s.layout}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.brandLogo}>
            <span style={s.brandLogoText}>ESEC</span>
          </div>
          <div>
            <div style={s.brandName}>Achievement Portal</div>
            <div style={s.brandSub}>ERODE SENGUNTHAR<br />ENGG. COLLEGE</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={s.nav}>
          {visibleNavItems.map(item => {
            const Icon = item.icon
            const active = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                style={{ ...s.navBtn, ...(active ? s.navBtnActive : {}) }}
              >
                <Icon active={active} />
                <span>{item.label}</span>
              </button>
            )
          })}

          {visibleAdminItems.length > 0 && (
            <>
              <div style={s.navSectionLabel}>ADMIN</div>
              {visibleAdminItems.map(item => {
                const Icon = item.icon
                const active = activeTab === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    style={{ ...s.navBtn, ...(active ? s.navBtnActive : {}) }}
                  >
                    <Icon active={active} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </>
          )}
        </nav>

        {/* Logout */}
        <button style={s.logoutBtn} onClick={logout}>
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </aside>

      {/* ── Main ── */}
      <div style={s.mainWrap}>
        {/* Top-right admin badge */}
        <div style={s.topBar}>
          <div style={s.adminBadge}>{session.email?.split('@')[0]?.toUpperCase() || 'ADMIN'}</div>
        </div>

        <main style={s.main}>
          {activeTab === 'students'     && <StudentsTab focusStudentId={studentProfileTarget} />}
          {activeTab === 'dashboard'    && <DashboardTab />}
          {activeTab === 'events'       && <EventSearchTab />}
          {activeTab === 'certificates' && <CertificatesTab />}
          {activeTab === 'import'       && <ImportTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'flyers'       && <EventFlyersTab canManage />}
          {activeTab === 'staff'        && <StaffAccountsTab />}
        </main>
      </div>
    </div>
  )
}

/* ── Styles ── */
const NAVY = '#1a2469'
const NAVY_LIGHT = '#1e2a78'

const s = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', 'Poppins', sans-serif",
    background: '#f0ece2',
  },

  /* Sidebar */
  sidebar: {
    width: 192,
    minWidth: 192,
    background: NAVY,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 20px 0',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 16px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  brandLogo: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    border: '2px solid #c9a227',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandLogoText: {
    fontSize: 10,
    fontWeight: 800,
    color: '#c9a227',
    letterSpacing: 0.5,
  },
  brandName: {
    fontSize: 11.5,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.3,
  },
  brandSub: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.4,
    marginTop: 2,
  },

  /* Nav */
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '4px 10px',
    gap: 2,
    overflowY: 'auto',
  },
  navSectionLabel: {
    fontSize: 9.5,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.2,
    padding: '14px 8px 6px',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 10px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.15s, color 0.15s',
  },
  navBtnActive: {
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    fontWeight: 600,
  },

  /* Logout */
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 18px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: 500,
    marginTop: 8,
    transition: 'color 0.15s',
  },

  /* Main area */
  mainWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#f0ece2',
    minWidth: 0,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '14px 28px 0',
  },
  adminBadge: {
    background: '#fff',
    border: '1.5px solid #e0ddd5',
    borderRadius: 6,
    padding: '5px 14px',
    fontSize: 11.5,
    fontWeight: 700,
    color: '#333',
    letterSpacing: 0.5,
  },
  main: {
    padding: '18px 28px 32px',
    flex: 1,
  },
}

/* ── SVG Icon Components ── */
function StudentIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function DashboardIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function SearchIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function CertIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

function ImportIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function ManageIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function MailIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  )
}

function FlyerIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </svg>
  )
}

function StaffIcon({ active }) {
  return <StudentIcon active={active} />
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
