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
import StaffDashboardTab from './tabs/StaffDashboardTab.jsx'
import StudentView from "./StudentView.jsx"
import RegistrationReviewTab from './tabs/RegistrationReviewTab.jsx'
import MentorsTab from './tabs/MentorsTab.jsx'
import ODReviewTab from './tabs/ODReviewTab.jsx'

const NAV_ITEMS = [
  { key: 'staff-dashboard', label: 'Dashboard', icon: DashboardIcon, staffOnly: true },
  { key: 'mentors',         label: 'Assign Mentors', icon: StaffIcon, staffOnly: true },
  { key: 'students',     label: 'Students Directory', icon: StudentIcon, adminOnly: true },
  { key: 'dashboard',    label: 'Analytics Dashboard', icon: DashboardIcon, adminOnly: true },
  { key: 'events',       label: 'Student Participation', icon: SearchIcon, adminOnly: true },
  { key: 'registrations', label: 'Event Registrations', icon: ClipboardIcon },
  { key: 'od-submissions', label: 'OD Form Submissions', icon: ClipboardIcon },
  { key: 'certificates', label: 'Certificate Generator', icon: CertIcon, adminOnly: true },
  { key: 'flyers',       label: 'Academic Event Flyers', icon: FlyerIcon },
]

const ADMIN_ITEMS = [
  { key: 'import',       label: 'Bulk Import Students', icon: ImportIcon, adminOnly: true },
  { key: 'notifications', label: 'Mail Reminders', icon: MailIcon, adminOnly: true },
  { key: 'staff',        label: 'Staff Accounts',  icon: StaffIcon, adminOnly: true },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('students')
  const [studentProfileTarget, setStudentProfileTarget] = useState(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('session')
    if (saved) {
      try {
        setSession(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse session', e)
      }
    }
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

  const isAdmin = session.role === 'admin'
  const visibleNavItems = NAV_ITEMS.filter(item => (!item.adminOnly || isAdmin) && (!item.staffOnly || !isAdmin))
  const visibleAdminItems = ADMIN_ITEMS.filter(item => !item.adminOnly || isAdmin)

  const activeItem = [...NAV_ITEMS, ...ADMIN_ITEMS].find(i => i.key === activeTab)
  const activeLabel = activeItem?.label || 'Portal'
  const userInitial = (session.email?.[0] || 'A').toUpperCase()
  const displayRole = isAdmin ? 'ADMINISTRATOR' : 'STAFF MEMBER'

  return (
    <div className="app-layout" style={s.layout}>
      {/* ── Sidebar ── */}
      <aside className="sidebar" style={s.sidebar}>
        {/* Brand Header */}
        <div className="brand" style={s.brand}>
          <div style={s.brandLogo}>
            <span style={s.brandLogoText}>ESEC</span>
          </div>
          <div className="brand-details" style={s.brandDetails}>
            <div style={s.brandName}>Achievement Portal</div>
            <div style={s.brandSub}>ERODE SENGUNTHAR ENGG. COLLEGE</div>
            <div style={s.brandTag}>Autonomous Institution</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="nav" style={s.nav}>
          <div style={s.navSectionLabel}>MAIN MENU</div>
          {visibleNavItems.map(item => {
            const Icon = item.icon
            const active = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className="nav-btn"
                style={{ ...s.navBtn, ...(active ? s.navBtnActive : {}) }}
              >
                <div style={{ ...s.iconWrap, ...(active ? s.iconWrapActive : {}) }}>
                  <Icon active={active} />
                </div>
                <span className="nav-label" style={s.navLabel}>{item.label}</span>
                {active && <div className="active-dot" style={s.activeDot} />}
              </button>
            )
          })}

          {visibleAdminItems.length > 0 && (
            <>
              <div style={s.navSectionLabel}>ADMINISTRATION</div>
              {visibleAdminItems.map(item => {
                const Icon = item.icon
                const active = activeTab === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className="nav-btn"
                    style={{ ...s.navBtn, ...(active ? s.navBtnActive : {}) }}
                  >
                    <div style={{ ...s.iconWrap, ...(active ? s.iconWrapActive : {}) }}>
                      <Icon active={active} />
                    </div>
                    <span className="nav-label" style={s.navLabel}>{item.label}</span>
                    {active && <div className="active-dot" style={s.activeDot} />}
                  </button>
                )
              })}
            </>
          )}
        </nav>

        {/* Sidebar Footer / User Quick Info */}
        <div className="sidebar-footer" style={s.sidebarFooter}>
          <div className="sidebar-user-chip" style={s.sidebarUserChip}>
            <div style={s.sidebarAvatar}>{userInitial}</div>
            <div className="sidebar-user-info" style={s.sidebarUserInfo}>
              <div style={s.sidebarUserEmail} title={session.email || 'User'}>
                {session.email ? session.email.split('@')[0] : 'Admin'}
              </div>
              <div style={s.sidebarUserRole}>{displayRole}</div>
            </div>
          </div>
          <button className="logout-btn" style={s.logoutBtn} onClick={logout} title="Sign out of portal">
            <LogoutIcon />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <div style={s.mainWrap}>
        {/* Top Navbar */}
        <header className="top-bar" style={s.topBar}>
          <div style={s.breadcrumb}>
            <span className="breadcrumb-muted" style={s.breadcrumbMuted}>Management Portal</span>
            <span className="breadcrumb-slash" style={s.breadcrumbSlash}>/</span>
            <span style={s.breadcrumbActive}>{activeLabel}</span>
          </div>

          <div style={s.topRightActions}>
            <div style={s.userBadge}>
              <span style={s.statusIndicator} />
              <span style={s.userRoleText}>{displayRole}</span>
              <span className="user-email-text" style={s.userEmailText}>{session.email || 'admin@esec.ac.in'}</span>
            </div>
            <button className="header-logout-btn" style={s.headerLogoutBtn} onClick={logout}>
              Sign out
            </button>
          </div>
        </header>

        {/* Main Content Pane */}
        <main className="main" style={s.main}>
          <div style={s.contentWrapper}>
            {activeTab === 'staff-dashboard' && <StaffDashboardTab />}
            {activeTab === 'students'     && <StudentsTab focusStudentId={studentProfileTarget} />}
            {activeTab === 'dashboard'    && <DashboardTab />}
            {activeTab === 'events'       && <EventSearchTab />}
            {activeTab === 'registrations' && <RegistrationReviewTab />}
            {activeTab === 'od-submissions' && <ODReviewTab />}
            {activeTab === 'certificates' && <CertificatesTab />}
            {activeTab === 'import'       && <ImportTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'flyers'       && <EventFlyersTab canManage />}
            {activeTab === 'staff'        && <StaffAccountsTab />}
            {activeTab === 'mentors'      && <MentorsTab isStaff={session.role === 'staff'} />}
          </div>
        </main>
      </div>
    </div>
  )
}

/* ── Modern Design Styles ── */
const s = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc',
    color: '#0f172a',
  },

  /* Sidebar */
  sidebar: {
    width: 256,
    minWidth: 256,
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
    zIndex: 20,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '22px 18px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    border: '1.5px solid rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
  },
  brandLogoText: {
    fontSize: 12,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: 1,
  },
  brandDetails: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  brandName: {
    fontSize: 13.5,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.01em',
    lineHeight: 1.25,
  },
  brandSub: {
    fontSize: 8.5,
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: '0.04em',
    marginTop: 3,
  },
  brandTag: {
    fontSize: 8,
    fontWeight: 600,
    color: '#fbbf24',
    letterSpacing: '0.02em',
    marginTop: 2,
  },

  /* Nav */
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 12px',
    gap: 3,
    overflowY: 'auto',
  },
  navSectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: '0.08em',
    padding: '14px 10px 6px',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.15s ease',
    position: 'relative',
    cursor: 'pointer',
  },
  navBtnActive: {
    background: 'rgba(37, 99, 235, 0.18)',
    color: '#60a5fa',
    fontWeight: 600,
    border: '1px solid rgba(59, 130, 246, 0.25)',
  },
  iconWrap: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    flexShrink: 0,
  },
  iconWrapActive: {
    color: '#60a5fa',
  },
  navLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#38bdf8',
    boxShadow: '0 0 8px #38bdf8',
  },

  /* Sidebar Footer */
  sidebarFooter: {
    padding: '16px 14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sidebarUserChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  sidebarAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sidebarUserInfo: {
    minWidth: 0,
    flex: 1,
  },
  sidebarUserEmail: {
    fontSize: 12.5,
    fontWeight: 600,
    color: '#f8fafc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sidebarUserRole: {
    fontSize: 9.5,
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.04em',
    marginTop: 1,
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  /* Main Workspace */
  mainWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#f8fafc',
    minWidth: 0,
  },
  topBar: {
    height: 64,
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13.5,
  },
  breadcrumbMuted: {
    color: '#64748b',
    fontWeight: 500,
  },
  breadcrumbSlash: {
    color: '#cbd5e1',
    fontWeight: 600,
  },
  breadcrumbActive: {
    color: '#0f172a',
    fontWeight: 700,
  },
  topRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#f1f5f9',
    padding: '6px 14px',
    borderRadius: 999,
    border: '1px solid #e2e8f0',
    fontSize: 12,
  },
  statusIndicator: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 6px #10b981',
  },
  userRoleText: {
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '0.02em',
  },
  userEmailText: {
    color: '#64748b',
    fontWeight: 500,
  },
  headerLogoutBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  main: {
    flex: 1,
    padding: '28px 32px 48px',
    minWidth: 0,
  },
  contentWrapper: {
    maxWidth: 1320,
    margin: '0 auto',
    width: '100%',
  },
}

/* ── Refined SVG Icons ── */
function StudentIcon({ active }) {
  const color = active ? '#60a5fa' : 'currentColor'
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function DashboardIcon({ active }) {
  const color = active ? '#60a5fa' : 'currentColor'
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function SearchIcon({ active }) {
  const color = active ? '#60a5fa' : 'currentColor'
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function CertIcon({ active }) {
  const color = active ? '#60a5fa' : 'currentColor'
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

function ImportIcon({ active }) {
  const color = active ? '#60a5fa' : 'currentColor'
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function MailIcon({ active }) {
  const color = active ? '#60a5fa' : 'currentColor'
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  )
}

function FlyerIcon({ active }) {
  const color = active ? '#60a5fa' : 'currentColor'
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </svg>
  )
}

function ClipboardIcon({ active }) {
  const color = active ? '#60a5fa' : 'currentColor'
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

function StaffIcon({ active }) {
  return <StudentIcon active={active} />
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
