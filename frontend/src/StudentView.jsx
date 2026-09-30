import { useState, useEffect } from 'react'
import { API_BASE, getStudent, listEventFlyers, getMyRegistrations, uploadStudentPhoto, uploadCertificate, deleteAchievement, photoUrl, publicAssetUrl } from './api'
import StudentDashboardTab from './tabs/StudentDashboardTab'
import CertificateViewer from './components/CertificateViewer'
import StudentODTab from './tabs/StudentODTab'

const EVENT_TYPES = ['Technical', 'Non-Technical', 'Sports', 'Cultural', 'Other']
const PRIZE_TYPES = ['1st Prize', '2nd Prize', '3rd Prize', 'Participation']

const SIDEBAR_ITEMS = [
  { id: 'dashboard', icon: DashboardIcon, label: 'Dashboard & Events' },
  { id: 'od', icon: ODIcon, label: 'OD Form Submission' },
  { id: 'participation', icon: TrophyIcon, label: 'My Achievements' },
  { id: 'certificates', icon: CertIcon, label: 'Verified Certificates' },
]

const TOP_LINES = [
  "Every certificate is one step closer to your dream career 🏆",
  "Small daily wins lead to monumental achievements 🚀",
  "Keep striving — excellence is a persistent habit 🌟",
  "Your achievements shape your professional legacy 💼",
  "Milestones loading... continue your innovation journey!",
]

export default function StudentView({ session, onLogout }) {
  const [profile, setProfile] = useState(() => {
    const fallbackName = session?.name || session?.first_name || 'Student'
    return {
      first_name: fallbackName.split(' ')[0],
      roll_no: session?.roll_no || 'N/A',
      section: session?.section || 'N/A',
      year: session?.year || 'N/A',
      email: session?.email || 'Not on file',
      photo_path: session?.photo_path || '',
      achievements: [],
      mobile_number: session?.mobile_number || 'N/A',
      reg_no: session?.reg_no || 'N/A',
      department: session?.department || 'N/A',
      mentor_id: session?.mentor_id || null,
      mentor_name: session?.mentor_name || '',
      mentor_email: session?.mentor_email || '',
    }
  })
  const [flyers, setFlyers] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [voucherUploaded, setVoucherUploaded] = useState(false)
  const [showAddAchievement, setShowAddAchievement] = useState(false)
  const [showUploadCertificate, setShowUploadCertificate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [manualForm, setManualForm] = useState({
    event_name: '',
    event_type: 'Technical',
    prize_type: 'Participation',
    event_date: '',
    organizer: '',
    college_name: '',
  })
  const [certificateFile, setCertificateFile] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [copiedCertId, setCopiedCertId] = useState(null)
  const [topLine] = useState(() => TOP_LINES[Math.floor(Math.random() * TOP_LINES.length)])

  const certUrl = (path) => publicAssetUrl(path) || ''

  const shareCertToLinkedIn = (cert) => {
    const url = certUrl(cert.certificate_upload_path)
    const shareHost = new URL(url).hostname
    if (['localhost', '127.0.0.1', '::1'].includes(shareHost)) {
      alert('LinkedIn cannot access certificates from localhost. Set VITE_PUBLIC_API_URL to your deployed API URL and restart the frontend.')
      return
    }
    const shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    window.open(shareLink, '_blank', 'noopener,noreferrer')
  }

  const copyPortfolioUrl = async (cert) => {
    const url = certUrl(cert.certificate_upload_path)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedCertId(cert.id)
      setTimeout(() => setCopiedCertId(null), 2000)
    } catch {
      alert('Could not copy the link directly. You can right-click and copy the certificate URL.')
    }
  }

  const studentId = session?.student_id ?? session?.id

  const loadStudentPage = async () => {
    if (!studentId && !session?.roll_no) return

    try {
      const studentRes = studentId
        ? await getStudent(studentId)
        : { data: { ...profile, first_name: session?.name?.split(' ')[0] || session?.first_name || 'Student' } }
      const [flyersRes, registrationsRes] = await Promise.all([listEventFlyers(), getMyRegistrations()])

      const studentData = studentRes?.data || {}
      const mergedProfile = {
        first_name: studentData.first_name || session?.name?.split(' ')[0] || 'Student',
        roll_no: studentData.roll_no || session?.roll_no || 'N/A',
        section: studentData.section || session?.section || 'N/A',
        year: studentData.year || session?.year || 'N/A',
        email: studentData.email || session?.email || 'Not on file',
        photo_path: studentData.photo_path || session?.photo_path || '',
        achievements: Array.isArray(studentData.achievements) ? studentData.achievements : [],
        mobile_number: studentData.mobile_number || session?.mobile_number || 'N/A',
        reg_no: studentData.reg_no || session?.reg_no || 'N/A',
        department: studentData.department || session?.department || 'N/A',
        mentor_id: studentData.mentor_id || session?.mentor_id || null,
        mentor_name: studentData.mentor_name || session?.mentor_name || '',
        mentor_email: studentData.mentor_email || session?.mentor_email || '',
      }

      setProfile(mergedProfile)
      setFlyers(Array.isArray(flyersRes?.data) ? flyersRes.data : [])
      setRegistrations(Array.isArray(registrationsRes?.data) ? registrationsRes.data : [])
    } catch (error) {
      console.error('Failed to load student view:', error)
    }
  }

  useEffect(() => {
    loadStudentPage()
  }, [session])

  useEffect(() => {
    let active = true
    const refreshFlyers = async () => {
      try {
        const response = await listEventFlyers()
        if (active && Array.isArray(response.data)) setFlyers(response.data)
      } catch (error) {
        console.error('Failed to refresh event flyers:', error)
      }
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshFlyers()
    }
    window.addEventListener('focus', refreshFlyers)
    document.addEventListener('visibilitychange', handleVisibility)
    const intervalId = window.setInterval(refreshFlyers, 15000)
    return () => {
      active = false
      window.removeEventListener('focus', refreshFlyers)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const openCertificates = () => setShowUploadCertificate(true)
    window.addEventListener('openStudentCertificates', openCertificates)
    return () => window.removeEventListener('openStudentCertificates', openCertificates)
  }, [])

  const achievements = Array.isArray(profile?.achievements) ? profile.achievements : []
  const displayName = profile.first_name || session?.name || 'Student'
  const profilePhotoUrl = photoUrl(profile.photo_path) || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&rounded=true`

  const handleDeleteAchievement = async (achievementId) => {
    if (!achievementId) return
    if (!window.confirm('Are you sure you want to delete this achievement record?')) return

    try {
      await deleteAchievement(achievementId)
      await loadStudentPage()
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to delete achievement')
    }
  }

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !studentId) return

    setUploadingPhoto(true)
    try {
      const res = await uploadStudentPhoto(studentId, file)
      setProfile(prev => ({ ...prev, photo_path: res.data.photo_path }))
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to update profile photo')
    } finally {
      setUploadingPhoto(false)
      event.target.value = ''
    }
  }

  const handleVoucherUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setVoucherUploaded(true)
    alert('Event voucher uploaded successfully. You may now record your achievement details.')
    event.target.value = ''
  }

  const submitManualAchievement = async () => {
    if (!manualForm.event_name || !certificateFile) {
      return alert('Event name and participation certificate are required')
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('student_id', String(studentId))
      fd.append('event_name', manualForm.event_name)
      fd.append('event_type', manualForm.event_type)
      fd.append('prize_type', manualForm.prize_type)
      fd.append('event_date', manualForm.event_date || '')
      fd.append('organizer', manualForm.organizer || '')
      fd.append('college_name', manualForm.college_name || '')
      if (selectedRegistrationId) fd.append('registration_id', selectedRegistrationId)
      fd.append('file', certificateFile)
      await uploadCertificate(fd)
      setShowAddAchievement(false)
      setCertificateFile(null)
      setSelectedRegistrationId('')
      setManualForm({ event_name: '', event_type: 'Technical', prize_type: 'Participation', event_date: '', organizer: '', college_name: '' })
      await loadStudentPage()
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to save achievement')
    } finally {
      setSaving(false)
    }
  }

  const submitCertificate = async () => {
    if (!manualForm.event_name || !certificateFile) {
      return alert('Event name and certificate file are required')
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('student_id', String(studentId))
      fd.append('event_name', manualForm.event_name)
      fd.append('event_type', manualForm.event_type)
      fd.append('prize_type', manualForm.prize_type)
      fd.append('event_date', manualForm.event_date || '')
      fd.append('organizer', manualForm.organizer || '')
      fd.append('college_name', manualForm.college_name || '')
      if (selectedRegistrationId) fd.append('registration_id', selectedRegistrationId)
      fd.append('file', certificateFile)
      await uploadCertificate(fd)
      setShowUploadCertificate(false)
      setCertificateFile(null)
      setSelectedRegistrationId('')
      setManualForm({ event_name: '', event_type: 'Technical', prize_type: 'Participation', event_date: '', organizer: '', college_name: '' })
      await loadStudentPage()
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to upload certificate')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="student-view" style={styles.pageShell}>
      {/* ── Sidebar ── */}
      <aside className="student-sidebar" style={styles.studentSidebar}>
        {/* Brand */}
        <div style={styles.studentBrand}>
          <div style={styles.brandLogo}>ESEC</div>
          <div>
            <div style={styles.brandTitle}>Student Portal</div>
            <div style={styles.brandCollege}>ERODE SENGUNTHAR</div>
            <div style={styles.brandCollege}>ENGINEERING COLLEGE</div>
          </div>
        </div>

        {/* Student Quick Profile Card */}
        <div style={styles.profileBadgeCard}>
          <label style={styles.avatarLabel} title="Click to change profile picture">
            <img src={profilePhotoUrl} alt={displayName} style={styles.avatarImg} />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            <div style={styles.avatarHoverIcon}>📷</div>
          </label>
          <div style={styles.profileInfo}>
            <div style={styles.profileName} title={displayName}>{displayName}</div>
            <div style={styles.profileRoll}>{profile.roll_no}</div>
            <div style={styles.profileDept}>
              {profile.year} Year • {profile.department !== 'N/A' ? profile.department : 'Engineering'}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="student-nav-stack" style={styles.navStack}>
          <div className="student-nav-header" style={styles.navHeader}>NAVIGATION</div>
          {SIDEBAR_ITEMS.map(({ id, icon: Icon, label }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className="student-nav-item"
                style={{ ...styles.studentNavItem, ...(active ? styles.studentNavActive : {}) }}
              >
                <div style={{ ...styles.navIconBox, ...(active ? styles.navIconBoxActive : {}) }}>
                  <Icon active={active} />
                </div>
                <span className="student-nav-label" style={styles.navItemLabel}>{label}</span>
                {active && <span className="student-nav-active-dot" style={styles.navActiveDot} />}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={styles.sidebarFooter}>
          <button type="button" onClick={onLogout} style={styles.logoutBtn}>
            <LogoutIcon />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="student-page-wrap" style={styles.pageWrap}>
        {/* Top Bar */}
        <header className="student-top-bar" style={styles.topBar}>
          <div className="student-top-greeting" style={styles.topGreeting}>
            <span style={styles.greetingPill}>Campus News</span>
            <span style={styles.topLineText}>{topLine}</span>
          </div>

          <div style={styles.topRight}>
            <div style={styles.userChip}>
              <img src={profilePhotoUrl} alt="" style={styles.chipAvatar} />
              <div style={styles.chipMeta}>
                <span style={styles.chipName}>{displayName}</span>
                <span style={styles.chipRole}>Student</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content Panes */}
        <main className="student-main-content" style={styles.mainContent}>
          {activeTab === 'dashboard' && (
            <StudentDashboardTab
              studentId={studentId}
              profile={profile}
              flyers={flyers}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'od' && <StudentODTab profile={profile} />}

          {activeTab === 'participation' && (
            <div className="student-tab-card" style={styles.tabCardWrap}>
              <div className="student-page-title-bar" style={styles.pageTitleBar}>
                <div>
                  <h1 style={styles.pageTitle}>My Achievements</h1>
                  <p style={styles.pageSub}>Official records of your academic and extracurricular recognitions.</p>
                </div>

                <div className="student-action-row" style={styles.actionRow}>
                  <label style={styles.voucherUploadBtn}>
                    <input type="file" accept="image/*,.pdf" onChange={handleVoucherUpload} style={{ display: 'none' }} />
                    📎 {voucherUploaded ? '✓ Voucher Uploaded' : 'Upload Event Voucher'}
                  </label>
                  <button
                    onClick={() => setShowAddAchievement(true)}
                    disabled={!voucherUploaded}
                    style={{ ...styles.addAchievementBtn, opacity: voucherUploaded ? 1 : 0.6 }}
                  >
                    + Add Achievement Record
                  </button>
                </div>
              </div>

              {!voucherUploaded && (
                <div className="student-voucher-hint" style={styles.voucherHintBox}>
                  <div style={styles.hintIcon}>ℹ️</div>
                  <div>
                    <strong>Verification Rule:</strong> Upload your event confirmation voucher or fee receipt first to unlock manual achievement entry.
                  </div>
                </div>
              )}

              {achievements.length === 0 ? (
                <div className="student-empty-card" style={styles.emptyCard}>
                  <div style={styles.emptyIcon}>🏆</div>
                  <h3 style={styles.emptyHeading}>No Achievements Recorded Yet</h3>
                  <p style={styles.emptyText}>Upload your participation certificate and win prizes to build your college milestone portfolio!</p>
                </div>
              ) : (
                <div className="student-achievement-grid" style={styles.achievementGrid}>
                  {achievements.map((a, idx) => {
                    const prize = a.prize_type || 'Participation'
                    const isWinner = prize.includes('1st') || prize.includes('2nd') || prize.includes('3rd')
                    return (
                      <div key={a.id || idx} style={styles.achievementCard}>
                        <div style={styles.achievementHeader}>
                          <span style={getPrizeBadgeStyle(prize)}>{prize}</span>
                          <span style={styles.eventTypeTag}>{a.event_type || 'General'}</span>
                        </div>

                        <h3 style={styles.achievementTitle}>{a.event_name}</h3>

                        <div style={styles.achievementMeta}>
                          {a.organizer && <div>🏛️ <strong>Organizer:</strong> {a.organizer}</div>}
                          {a.college_name && <div>🎓 <strong>College:</strong> {a.college_name}</div>}
                          {a.event_date && <div>📅 <strong>Date:</strong> {a.event_date}</div>}
                        </div>

                        <div style={styles.achievementFooter}>
                          {a.certificate_upload_path ? (
                            <button
                              onClick={() => setSelectedCertificate({
                                url: certUrl(a.certificate_upload_path),
                                eventName: a.event_name,
                                eventType: a.event_type,
                                prize: a.prize_type,
                                eventDate: a.event_date,
                              })}
                              style={styles.viewCertBtn}
                            >
                              👁️ View Certificate
                            </button>
                          ) : (
                            <span style={styles.noCertText}>No Certificate Attached</span>
                          )}

                          <button
                            onClick={() => handleDeleteAchievement(a.id)}
                            style={styles.deleteBtn}
                            title="Delete this record"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="student-tab-card" style={styles.tabCardWrap}>
              <div style={styles.pageTitleBar}>
                <div>
                  <h1 style={styles.pageTitle}>Verified Certificate Gallery</h1>
                  <p style={styles.pageSub}>Institutional credentials, digital badges, and shareable verified certificates.</p>
                </div>
              </div>

              {achievements.filter(a => a.certificate_upload_path).length === 0 ? (
                <div style={styles.emptyCard}>
                  <div style={styles.emptyIcon}>📜</div>
                  <h3 style={styles.emptyHeading}>No Certificates Uploaded</h3>
                  <p style={styles.emptyText}>Upload event certificates to build your verified academic repository.</p>
                </div>
              ) : (
                <div className="student-cert-grid" style={styles.certGrid}>
                  {achievements.filter(a => a.certificate_upload_path).map(a => (
                    <div key={a.id} style={styles.certCard}>
                      <div
                        style={styles.certImageWrap}
                        onClick={() => setSelectedCertificate({
                          url: certUrl(a.certificate_upload_path),
                          eventName: a.event_name,
                          eventType: a.event_type,
                          prize: a.prize_type,
                          eventDate: a.event_date,
                        })}
                      >
                        <img
                          src={certUrl(a.certificate_upload_path)}
                          alt={a.event_name}
                          style={styles.certThumb}
                        />
                        <div style={styles.certHoverOverlay}>
                          <span>Click to Expand</span>
                        </div>
                      </div>

                      <div style={styles.certCardContent}>
                        <div style={styles.certBadgeRow}>
                          <span style={styles.certVerifiedBadge}>✓ Verified Record</span>
                          <span style={styles.certTypeBadge}>{a.prize_type || 'Award'}</span>
                        </div>
                        <h4 style={styles.certTitle}>{a.event_name}</h4>
                        <p style={styles.certDate}>{a.event_date || 'Milestone Record'}</p>

                        <div className="student-cert-actions" style={styles.certActionList}>
                          <a
                            href={certUrl(a.certificate_upload_path)}
                            target="_blank"
                            rel="noreferrer"
                            download
                            style={styles.certDownloadBtn}
                          >
                            ⬇️ Download
                          </a>
                          <button
                            type="button"
                            style={styles.certShareBtn}
                            onClick={() => shareCertToLinkedIn(a)}
                          >
                            LinkedIn
                          </button>
                          <button
                            type="button"
                            style={styles.certCopyBtn}
                            onClick={() => copyPortfolioUrl(a)}
                          >
                            {copiedCertId === a.id ? '✓ Copied!' : 'Copy Link'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Certificate Fullscreen Viewer Modal ── */}
      {selectedCertificate && (
        <CertificateViewer
          certificateUrl={selectedCertificate.url}
          studentName={profile.first_name}
          eventName={selectedCertificate.eventName}
          eventType={selectedCertificate.eventType}
          prize={selectedCertificate.prize}
          eventDate={selectedCertificate.eventDate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      {/* ── Add Achievement Modal ── */}
      {showAddAchievement && (
        <div style={styles.modalBackdrop} onClick={() => setShowAddAchievement(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalHeading}>Record New Achievement</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowAddAchievement(false)}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <label style={styles.modalLabel}>Link to Registered Event (Optional)</label>
              <select
                style={styles.modalSelect}
                value={selectedRegistrationId}
                onChange={e => {
                  setSelectedRegistrationId(e.target.value)
                  const item = registrations.find(r => String(r.id) === e.target.value)
                  if (item) {
                    setManualForm({
                      ...manualForm,
                      event_name: item.event_title,
                      event_date: item.event_end_date || item.event_date || '',
                    })
                  }
                }}
              >
                <option value="">Choose an event registration</option>
                {registrations.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.event_title} ({item.verification_status || 'Registered'})
                  </option>
                ))}
              </select>

              <label style={styles.modalLabel}>Event Title *</label>
              <input
                style={styles.modalInput}
                placeholder="e.g. National Level Hackathon 2026"
                value={manualForm.event_name}
                onChange={e => setManualForm({ ...manualForm, event_name: e.target.value })}
              />

              <div style={styles.modalGrid2}>
                <div>
                  <label style={styles.modalLabel}>Category</label>
                  <select
                    style={styles.modalSelect}
                    value={manualForm.event_type}
                    onChange={e => setManualForm({ ...manualForm, event_type: e.target.value })}
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.modalLabel}>Prize / Recognition</label>
                  <select
                    style={styles.modalSelect}
                    value={manualForm.prize_type}
                    onChange={e => setManualForm({ ...manualForm, prize_type: e.target.value })}
                  >
                    {PRIZE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div style={styles.modalGrid2}>
                <div>
                  <label style={styles.modalLabel}>Event Date</label>
                  <input
                    style={styles.modalInput}
                    type="date"
                    value={manualForm.event_date}
                    onChange={e => setManualForm({ ...manualForm, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={styles.modalLabel}>Organizing Body</label>
                  <input
                    style={styles.modalInput}
                    placeholder="e.g. Department of CSE"
                    value={manualForm.organizer}
                    onChange={e => setManualForm({ ...manualForm, organizer: e.target.value })}
                  />
                </div>
              </div>

              <label style={styles.modalLabel}>College / Institution</label>
              <input
                style={styles.modalInput}
                placeholder="e.g. PSG Tech / IIT Madras / ESEC"
                value={manualForm.college_name}
                onChange={e => setManualForm({ ...manualForm, college_name: e.target.value })}
              />

              <label style={styles.modalLabel}>Certificate File (Image or PDF) *</label>
              <input
                style={styles.modalFileInput}
                type="file"
                accept="image/*,application/pdf"
                onChange={e => setCertificateFile(e.target.files?.[0] || null)}
              />
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.modalSecondaryBtn}
                onClick={() => { setShowAddAchievement(false); setCertificateFile(null) }}
              >
                Cancel
              </button>
              <button
                style={styles.modalPrimaryBtn}
                onClick={submitManualAchievement}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Achievement Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Certificate Modal ── */}
      {showUploadCertificate && (
        <div style={styles.modalBackdrop} onClick={() => setShowUploadCertificate(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalHeading}>Upload Certificate</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowUploadCertificate(false)}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <label style={styles.modalLabel}>Event Name *</label>
              <input
                style={styles.modalInput}
                placeholder="e.g. Web Development Symposium"
                value={manualForm.event_name}
                onChange={e => setManualForm({ ...manualForm, event_name: e.target.value })}
              />

              <div style={styles.modalGrid2}>
                <div>
                  <label style={styles.modalLabel}>Category</label>
                  <select
                    style={styles.modalSelect}
                    value={manualForm.event_type}
                    onChange={e => setManualForm({ ...manualForm, event_type: e.target.value })}
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.modalLabel}>Recognition</label>
                  <select
                    style={styles.modalSelect}
                    value={manualForm.prize_type}
                    onChange={e => setManualForm({ ...manualForm, prize_type: e.target.value })}
                  >
                    {PRIZE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <label style={styles.modalLabel}>Certificate File *</label>
              <input
                style={styles.modalFileInput}
                type="file"
                accept="image/*,application/pdf"
                onChange={e => setCertificateFile(e.target.files?.[0] || null)}
              />
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.modalSecondaryBtn}
                onClick={() => setShowUploadCertificate(false)}
              >
                Cancel
              </button>
              <button
                style={styles.modalPrimaryBtn}
                onClick={submitCertificate}
                disabled={saving}
              >
                {saving ? 'Uploading...' : 'Upload & Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getPrizeBadgeStyle(prize = '') {
  if (prize.includes('1st')) {
    return {
      background: '#fef3c7',
      color: '#b45309',
      border: '1px solid #fde68a',
      borderRadius: 999,
      padding: '4px 12px',
      fontWeight: 800,
      fontSize: 11.5,
    }
  }
  if (prize.includes('2nd')) {
    return {
      background: '#f1f5f9',
      color: '#475569',
      border: '1px solid #cbd5e1',
      borderRadius: 999,
      padding: '4px 12px',
      fontWeight: 800,
      fontSize: 11.5,
    }
  }
  if (prize.includes('3rd')) {
    return {
      background: '#ffedd5',
      color: '#c2410c',
      border: '1px solid #fed7aa',
      borderRadius: 999,
      padding: '4px 12px',
      fontWeight: 800,
      fontSize: 11.5,
    }
  }
  return {
    background: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
    borderRadius: 999,
    padding: '4px 12px',
    fontWeight: 800,
    fontSize: 11.5,
  }
}

/* ── Modern Styles ── */
const styles = {
  pageShell: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc',
    color: '#0f172a',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },

  /* Sidebar */
  studentSidebar: {
    width: 256,
    minWidth: 256,
    background: '#0f172a',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    zIndex: 20,
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
  },
  studentBrand: {
    padding: '22px 18px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  brandLogo: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    letterSpacing: 0.5,
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.01em',
  },
  brandCollege: {
    fontSize: 8.5,
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.04em',
    marginTop: 2,
  },

  /* Profile Badge Card */
  profileBadgeCard: {
    margin: '16px 14px 8px',
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  avatarLabel: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer',
    flexShrink: 0,
    border: '1.5px solid rgba(37, 99, 235, 0.5)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarHoverIcon: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    opacity: 0,
    transition: 'opacity 0.15s ease',
    ':hover': { opacity: 1 },
  },
  profileInfo: {
    minWidth: 0,
    flex: 1,
  },
  profileName: {
    fontSize: 13.5,
    fontWeight: 700,
    color: '#ffffff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  profileRoll: {
    fontSize: 11,
    fontWeight: 700,
    color: '#38bdf8',
    letterSpacing: '0.04em',
    marginTop: 2,
  },
  profileDept: {
    fontSize: 9.5,
    color: '#94a3b8',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  /* Nav Stack */
  navStack: {
    flex: 1,
    padding: '12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    overflowY: 'auto',
  },
  navHeader: {
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: '0.08em',
    padding: '12px 10px 6px',
  },
  studentNavItem: {
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
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    position: 'relative',
  },
  studentNavActive: {
    background: 'rgba(37, 99, 235, 0.18)',
    color: '#60a5fa',
    fontWeight: 600,
    border: '1px solid rgba(59, 130, 246, 0.25)',
  },
  navIconBox: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    flexShrink: 0,
  },
  navIconBoxActive: {
    color: '#60a5fa',
  },
  navItemLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  navActiveDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#38bdf8',
    boxShadow: '0 0 8px #38bdf8',
  },

  /* Sidebar Footer */
  sidebarFooter: {
    padding: '14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(0, 0, 0, 0.15)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '9px 14px',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  /* Page Wrap & Top Bar */
  pageWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  topBar: {
    height: 64,
    padding: '0 32px',
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  },
  topGreeting: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 13,
  },
  greetingPill: {
    background: '#fef3c7',
    color: '#b45309',
    fontSize: 10.5,
    fontWeight: 800,
    padding: '3px 10px',
    borderRadius: 999,
    border: '1px solid #fde68a',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  topLineText: {
    color: '#475569',
    fontWeight: 600,
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  quickUploadBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 10px 4px 6px',
    borderRadius: 999,
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
  },
  chipAvatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  chipMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  chipName: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0f172a',
    lineHeight: 1.1,
  },
  chipRole: {
    fontSize: 9.5,
    fontWeight: 600,
    color: '#64748b',
  },

  /* Main Content */
  mainContent: {
    flex: 1,
    padding: '24px 32px 48px',
  },
  tabCardWrap: {
    maxWidth: 1240,
    margin: '0 auto',
  },

  /* Section Title Bar */
  pageTitleBar: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  pageSub: {
    fontSize: 13.5,
    color: '#64748b',
    marginTop: 4,
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  voucherUploadBtn: {
    padding: '9px 18px',
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    background: '#ffffff',
    color: '#334155',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  addAchievementBtn: {
    padding: '9px 20px',
    borderRadius: 9,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.28)',
  },
  voucherHintBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 12,
    padding: '12px 18px',
    marginBottom: 20,
    fontSize: 13,
    color: '#92400e',
  },
  hintIcon: {
    fontSize: 18,
    flexShrink: 0,
  },

  /* Empty State */
  emptyCard: {
    background: '#ffffff',
    border: '1.5px dashed #cbd5e1',
    borderRadius: 18,
    padding: '60px 24px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 6px',
  },
  emptyText: {
    fontSize: 13.5,
    color: '#64748b',
    maxWidth: 420,
    margin: '0 auto',
  },

  /* Achievement Cards Grid */
  achievementGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 18,
  },
  achievementCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '20px',
    boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  achievementHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTypeTag: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    background: '#f1f5f9',
    padding: '3px 8px',
    borderRadius: 6,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    lineHeight: 1.35,
  },
  achievementMeta: {
    fontSize: 12.5,
    color: '#475569',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    lineHeight: 1.4,
  },
  achievementFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTop: '1px solid #f1f5f9',
    marginTop: 'auto',
  },
  viewCertBtn: {
    padding: '7px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  noCertText: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  deleteBtn: {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #fecaca',
    background: '#fff5f5',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: 13,
  },

  /* Certificate Grid */
  certGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
  },
  certCard: {
    background: '#ffffff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 14px -2px rgba(15, 23, 42, 0.06)',
    display: 'flex',
    flexDirection: 'column',
  },
  certImageWrap: {
    position: 'relative',
    height: 160,
    background: '#0f172a',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  certThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.2s ease',
  },
  certHoverOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: 700,
    opacity: 0,
    transition: 'opacity 0.2s ease',
  },
  certCardContent: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  certBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  certVerifiedBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#059669',
    background: '#ecfdf5',
    padding: '2px 8px',
    borderRadius: 6,
    border: '1px solid #a7f3d0',
  },
  certTypeBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#b45309',
    background: '#fef3c7',
    padding: '2px 8px',
    borderRadius: 6,
  },
  certTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.3,
  },
  certDate: {
    margin: 0,
    fontSize: 12,
    color: '#64748b',
  },
  certActionList: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 6,
    marginTop: 10,
    paddingTop: 12,
    borderTop: '1px solid #f1f5f9',
  },
  certDownloadBtn: {
    padding: '7px 4px',
    borderRadius: 7,
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    color: '#334155',
    fontSize: 11.5,
    fontWeight: 700,
    textAlign: 'center',
    textDecoration: 'none',
  },
  certShareBtn: {
    padding: '7px 4px',
    borderRadius: 7,
    border: '1px solid #0077b5',
    background: '#0077b5',
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  certCopyBtn: {
    padding: '7px 4px',
    borderRadius: 7,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#2563eb',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
  },

  /* Modals */
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    background: '#ffffff',
    borderRadius: 20,
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    animation: 'scaleUp 0.2s ease',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#f8fafc',
  },
  modalHeading: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: '#0f172a',
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: 18,
    color: '#64748b',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxHeight: '75vh',
    overflowY: 'auto',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
    marginBottom: -4,
  },
  modalInput: {
    padding: '10px 14px',
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    fontSize: 13.5,
    color: '#0f172a',
    boxSizing: 'border-box',
    width: '100%',
  },
  modalSelect: {
    padding: '10px 14px',
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    fontSize: 13.5,
    color: '#0f172a',
    background: '#ffffff',
    boxSizing: 'border-box',
    width: '100%',
  },
  modalFileInput: {
    padding: '8px 10px',
    borderRadius: 9,
    border: '1.5px dashed #cbd5e1',
    background: '#f8fafc',
    fontSize: 12.5,
    color: '#475569',
  },
  modalGrid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    background: '#f8fafc',
  },
  modalSecondaryBtn: {
    padding: '9px 18px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  modalPrimaryBtn: {
    padding: '9px 22px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
  },
}

/* ── SVG Icons ── */
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

function TrophyIcon({ active }) {
  const color = active ? '#60a5fa' : 'currentColor'
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
      <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
      <path d="M12 2v10a4 4 0 0 0 4-4V2H8v6a4 4 0 0 0 4 4z" />
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

function ODIcon({ active }) {
  const color = active ? '#60a5fa' : 'currentColor'
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </svg>
  )
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
