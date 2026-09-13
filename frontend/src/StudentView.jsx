import { useState, useEffect } from 'react'
import { API_BASE, getStudent, listEventFlyers, getMyRegistrations, uploadStudentPhoto, uploadCertificate, deleteAchievement, photoUrl } from './api'
import StudentDashboardTab from './tabs/StudentDashboardTab'
import CertificateViewer from './components/CertificateViewer'
import StudentLeaderboardTab from './tabs/StudentLeaderboardTab'

const EVENT_TYPES = ['Technical', 'Non-Technical', 'Sports', 'Cultural', 'Other']
const PRIZE_TYPES = ['1st Prize', '2nd Prize', '3rd Prize', 'Participation']

const SIDEBAR_ITEMS = [
  { id: 'dashboard', icon: '▦', label: 'DASHBOARD' },
  { id: 'participation', icon: '♕', label: 'MY ACHIEVEMENTS' },
  { id: 'certificates', icon: '▤', label: 'CERTIFICATES' },
]

const TOP_LINES = [
  "Every certificate is one step closer to legendary 🏆",
  "Small wins today, big trophies tomorrow 🚀",
  "You're closer to #1 than you think 😉",
  "Keep going — your future self is already proud 🌟",
  "Achievements loading... don't stop now!",
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
  const [selectedVoucher, setSelectedVoucher] = useState(null)
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

  const certUrl = (path) => (path?.startsWith('http') ? path : `${API_BASE}${path}`)

  const shareCertToLinkedIn = (cert) => {
    const url = certUrl(cert.certificate_upload_path)
    const shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    window.open(shareLink, '_blank', 'noopener,noreferrer')
  }

  const copyPortfolioUrl = async (cert) => {
    const url = certUrl(cert.certificate_upload_path)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedCertId(cert.id)
      setTimeout(() => setCopiedCertId(null), 1800)
    } catch (error) {
      alert('Could not copy the link. Long-press or right-click the certificate to copy its URL instead.')
    }
  }

  const studentId = session?.student_id ?? session?.id

  const loadStudentPage = async () => {
    if (!studentId && !session?.roll_no) return

    try {
      const studentRes = studentId ? await getStudent(studentId) : { data: { ...profile, first_name: session?.name?.split(' ')[0] || session?.first_name || 'Student' } }
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
      }

      setProfile(mergedProfile)
      setFlyers(Array.isArray(flyersRes?.data) ? flyersRes.data : [])
      setRegistrations(Array.isArray(registrationsRes?.data) ? registrationsRes.data : [])
    } catch (error) {
      console.error('Failed to load student view:', error)
      setProfile({
        first_name: session?.name?.split(' ')[0] || session?.first_name || 'Student',
        roll_no: session?.roll_no || 'N/A',
        section: session?.section || 'N/A',
        year: session?.year || 'N/A',
        email: session?.email || 'Not on file',
        photo_path: session?.photo_path || '',
        achievements: [],
      })
      setFlyers([])
      setRegistrations([])
    }
  }

  useEffect(() => {
    loadStudentPage()
  }, [session])

  useEffect(() => {
    const openCertificates = () => setShowUploadCertificate(true)
    window.addEventListener('openStudentCertificates', openCertificates)
    return () => window.removeEventListener('openStudentCertificates', openCertificates)
  }, [])

  const achievements = Array.isArray(profile?.achievements) ? profile.achievements : []
  const displayName = profile.first_name || session?.name || 'Student'
  const profileInitials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST'
  const profilePhotoUrl = photoUrl(profile.photo_path) || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1a2469&color=fff&rounded=true`

  const handleDeleteAchievement = async (achievementId) => {
    if (!achievementId) return
    if (!window.confirm('Delete this achievement?')) return

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
      alert(error.response?.data?.detail || 'Unable to upload photo')
    } finally {
      setUploadingPhoto(false)
      event.target.value = ''
    }
  }

  const handleVoucherUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setVoucherUploaded(true)
    alert('Event voucher uploaded. You can now add your achievement.')
    event.target.value = ''
  }

  const submitManualAchievement = async () => {
    if (!manualForm.event_name || !certificateFile) return alert('Event name and participation certificate are required')
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
    if (!manualForm.event_name || !certificateFile) return alert('Event name and certificate image are required')
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
    <div style={styles.pageShell}>
      <aside style={styles.studentSidebar}>
        <div style={styles.studentBrand}><strong>Achievement<br />Portal</strong></div>
        {SIDEBAR_ITEMS.map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            style={{ ...styles.studentNavItem, ...(activeTab === id ? styles.studentNavActive : {}) }}
          >
            <span style={styles.studentNavIcon}>{icon}</span><span>{label}</span>
          </button>
        ))}
        <button type="button" onClick={onLogout} style={styles.studentNavItem}><span style={styles.studentNavIcon}>↪</span><span>LOGOUT</span></button>
      </aside>
      <div style={styles.pageWrap}>
        <header style={styles.topBar}>
          <div style={styles.topBrand}><span style={styles.topBrandMark}>[A]</span><strong>{topLine}</strong></div>
          <button  style={styles.topActions} ><span style={styles.topAvatar}>{displayName.charAt(0).toUpperCase()}</span><strong>{displayName}</strong></button>
        </header>

        <section style={styles.dashboardTabs}>
          {activeTab === 'dashboard' && (
            <div style={styles.tabContent}>
              <StudentDashboardTab studentId={studentId} profile={profile} flyers={flyers} onNavigateTab={setActiveTab} />
            </div>
          )}
          {activeTab === 'leaderboard' && (
            <div style={styles.tabContent}><StudentLeaderboardTab studentId={studentId} /></div>
          )}

          {activeTab === 'participation' && (
            <div style={styles.tabContent}>
              <div style={styles.actionRow}>
                <label style={styles.uploadBtn}>
                  <input type="file" accept="image/*,.pdf" onChange={handleVoucherUpload} style={{ display: 'none' }} />
                  Upload Event Voucher
                </label>
                <button
                  onClick={() => setShowAddAchievement(true)}
                  disabled={!voucherUploaded}
                  style={{ ...styles.primaryBtn, opacity: voucherUploaded ? 1 : 0.5 }}
                >
                  Add Achievement
                </button>
              </div>

              {!voucherUploaded && (
                <div style={styles.warningBox}>
                  Upload your event voucher first to unlock achievement entry.
                </div>
              )}

              {achievements.length === 0 ? (
                <div style={styles.emptyState}>No achievements recorded yet. Start adding your participation!</div>
              ) : (
                <div style={styles.achievementList}>
                  {achievements.map(a => (
                    <div key={a.id || `${a.event_name}-${a.event_date}`} style={styles.achievementCard}>
                      <div style={styles.awardBadge}>{a.prize_type || 'Participation'}</div>
                      <div style={styles.achievementInfo}>
                        <h4 style={styles.achievementTitle}>{a.event_name}</h4>
                        <p style={styles.achievementMeta}>
                          {a.event_type} • {a.organizer} • {a.event_date}
                        </p>
                      </div>
                      <div style={styles.achievementActions}>
                        {a.certificate_upload_path && (
                          <button 
                            onClick={() => setSelectedCertificate({
                              url: `${API_BASE}${a.certificate_upload_path}`,
                              eventName: a.event_name,
                              eventType: a.event_type,
                              prize: a.prize_type,
                              eventDate: a.event_date
                            })}
                            style={styles.viewBtn}
                          >
                            View Certificate
                          </button>
                        )}
                        <button onClick={() => handleDeleteAchievement(a.id)} style={styles.deleteBtn}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div style={styles.tabContent}>
              <div style={styles.certPageHeader}>
                <h2 style={styles.certPageTitle}>My Verified Certificate Gallery</h2>
              </div>

              {achievements.filter(a => a.certificate_upload_path).length === 0 ? (
                <div style={styles.emptyState}>No certificates uploaded yet.</div>
              ) : (
                <div style={styles.certificateGrid}>
                  {achievements.filter(a => a.certificate_upload_path).map(a => (
                    <div key={a.id} style={styles.certCard}>
                      <img
                        src={certUrl(a.certificate_upload_path)}
                        alt={a.event_name}
                        style={styles.certImage}
                        onClick={() => setSelectedCertificate({
                          url: certUrl(a.certificate_upload_path),
                          eventName: a.event_name,
                          eventType: a.event_type,
                          prize: a.prize_type,
                          eventDate: a.event_date
                        })}
                      />
                      <div style={styles.certCardBody}>
                        <p style={styles.certName}>{a.event_name}</p>
                        <small style={styles.certVerified}>✓ Verified</small>
                        <a href={certUrl(a.certificate_upload_path)} target="_blank" rel="noreferrer" download style={styles.certActionBtn}>Download PDF</a>
                        <button type="button" style={styles.certActionBtn} onClick={() => shareCertToLinkedIn(a)}>Share to LinkedIn</button>
                        <button type="button" style={styles.certActionBtn} onClick={() => copyPortfolioUrl(a)}>
                          {copiedCertId === a.id ? 'Link copied!' : 'Generate Portfolio URL'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

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

      {showAddAchievement && (
        <div style={styles.modalBackdrop} onClick={() => setShowAddAchievement(false)}>
          <div style={styles.formModal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Add Achievement</h3>
            <select style={styles.formInput} value={selectedRegistrationId} onChange={e => { setSelectedRegistrationId(e.target.value); const item = registrations.find(r => String(r.id) === e.target.value); if (item) setManualForm({ ...manualForm, event_name: item.event_title, event_date: item.event_end_date || item.event_date || '' }) }}><option value="">Link to a registered event (optional)</option>{registrations.map(item => <option key={item.id} value={item.id}>{item.event_title} - {item.verification_status}</option>)}</select>
            <input style={styles.formInput} placeholder="Event name" value={manualForm.event_name} onChange={e => setManualForm({ ...manualForm, event_name: e.target.value })} />
            <select style={styles.formInput} value={manualForm.event_type} onChange={e => setManualForm({ ...manualForm, event_type: e.target.value })}>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select style={styles.formInput} value={manualForm.prize_type} onChange={e => setManualForm({ ...manualForm, prize_type: e.target.value })}>
              {PRIZE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input style={styles.formInput} type="date" value={manualForm.event_date} onChange={e => setManualForm({ ...manualForm, event_date: e.target.value })} />
            <input style={styles.formInput} placeholder="Organizer" value={manualForm.organizer} onChange={e => setManualForm({ ...manualForm, organizer: e.target.value })} />
            <input style={styles.formInput} placeholder="Participating college" value={manualForm.college_name} onChange={e => setManualForm({ ...manualForm, college_name: e.target.value })} />
            <input style={styles.formInput} type="file" accept="image/*,.pdf" onChange={e => setCertificateFile(e.target.files?.[0] || null)} />
            <div style={styles.formActions}>
              <button style={styles.primaryBtn} onClick={submitManualAchievement} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button style={styles.secondaryBtn} onClick={() => { setShowAddAchievement(false); setCertificateFile(null) }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showUploadCertificate && (
        <div style={styles.modalBackdrop} onClick={() => setShowUploadCertificate(false)}>
          <div style={styles.formModal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Upload Certificate</h3>
            <select style={styles.formInput} value={selectedRegistrationId} onChange={e => { setSelectedRegistrationId(e.target.value); const item = registrations.find(r => String(r.id) === e.target.value); if (item) setManualForm({ ...manualForm, event_name: item.event_title, event_date: item.event_end_date || item.event_date || '' }) }}><option value="">Link to a registered event (optional)</option>{registrations.map(item => <option key={item.id} value={item.id}>{item.event_title} - {item.verification_status}</option>)}</select>
            <input style={styles.formInput} placeholder="Event name" value={manualForm.event_name} onChange={e => setManualForm({ ...manualForm, event_name: e.target.value })} />
            <select style={styles.formInput} value={manualForm.event_type} onChange={e => setManualForm({ ...manualForm, event_type: e.target.value })}>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select style={styles.formInput} value={manualForm.prize_type} onChange={e => setManualForm({ ...manualForm, prize_type: e.target.value })}>
              {PRIZE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input style={styles.formInput} type="date" value={manualForm.event_date} onChange={e => setManualForm({ ...manualForm, event_date: e.target.value })} />
            <input style={styles.formInput} placeholder="Organizer" value={manualForm.organizer} onChange={e => setManualForm({ ...manualForm, organizer: e.target.value })} />
            <input style={styles.formInput} placeholder="Participating college" value={manualForm.college_name} onChange={e => setManualForm({ ...manualForm, college_name: e.target.value })} />
            <input style={styles.formInput} type="file" accept="image/*" onChange={e => setCertificateFile(e.target.files?.[0] || null)} />
            <div style={styles.formActions}>
              <button style={styles.primaryBtn} onClick={submitCertificate} disabled={saving}>{saving ? 'Uploading...' : 'Upload'}</button>
              <button style={styles.secondaryBtn} onClick={() => setShowUploadCertificate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SettingsField({ label, value }) {
  return (
    <div style={styles.settingsField}>
      <span style={styles.settingsFieldLabel}>{label}</span>
      <strong style={styles.settingsFieldValue}>{value}</strong>
    </div>
  )
}

const styles = {
  pageShell: {
    minHeight: '100vh',
    display: 'flex',
    background: '#edf4fb',
    fontFamily: "'Inter', 'Poppins', sans-serif",
    color: '#161b2d',
  },
  studentSidebar: { width: 84, minWidth: 84, minHeight: '100vh', background: '#071126', color: '#c9d3e8', display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '12px 0', gap: 4 },
  studentBrand: { height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#fff', fontSize: 9, lineHeight: 1.1, textAlign: 'left', marginBottom: 14 },
  studentBrandMark: { color: '#5453e8', fontSize: 20, fontWeight: 900 },
  studentNavItem: { minHeight: 62, border: 0, borderLeft: '3px solid transparent', background: 'transparent', color: '#c1cade', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 8, letterSpacing: '.04em', cursor: 'pointer' },
  studentNavActive: { borderLeftColor: '#4b50ee', background: 'rgba(67,76,210,.22)', color: '#fff' },
  studentNavIcon: { fontSize: 19, lineHeight: 1, color: '#d8e2f3' },
  pageWrap: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  topBar: {
    height: 54,
    padding: '0 24px',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottom: '1px solid #dce5ef',
  },
  topBrand: { display: 'flex', alignItems: 'center', gap: 7, color: '#202331', fontSize: 15, flex: 1, minWidth: 0 },
  topBrandMark: { color: '#4d50c9', fontSize: 20, fontWeight: 900, flexShrink: 0 },
  topActions: { display: 'flex', alignItems: 'center', gap: 9, color: '#5b6576', fontSize: 12, border: 0, background: 'transparent', cursor: 'pointer' },
  topAvatar: { width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#759d65', color: '#fff', fontWeight: 800 },
  dashboardTabs: {
    flex: 1,
    background: '#edf4fb',
    overflow: 'hidden',
  },
  tabContent: {
    padding: 22,
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  warningBox: {
    borderRadius: 14,
    background: '#fff3d2',
    border: '1px solid #f0d889',
    color: '#7c5a00',
    padding: '14px 16px',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 20,
  },
  emptyState: {
    background: '#f5f6fb',
    border: '1px dashed rgba(26,36,105,0.18)',
    borderRadius: 16,
    padding: '22px 18px',
    color: '#48506d',
    fontWeight: 600,
    textAlign: 'center',
  },
  achievementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  achievementCard: {
    background: '#f8f9ff',
    border: '1px solid rgba(26,36,105,0.08)',
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  awardBadge: {
    background: 'linear-gradient(135deg, #f7e7b1, #d7ad34)',
    color: '#2a2104',
    fontWeight: 800,
    fontSize: 12,
    padding: '10px 12px',
    borderRadius: 999,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    minWidth: 110,
    textAlign: 'center',
    flexShrink: 0,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#171c2d',
    marginBottom: 4,
  },
  achievementMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    fontSize: 13,
    color: '#5a647d',
    fontWeight: 600,
  },
  achievementActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  viewBtn: {
    padding: '8px 14px',
    borderRadius: 10,
    border: '1px solid #215b70',
    background: '#215b70',
    color: '#fff',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '9px 12px',
    borderRadius: 10,
    border: '1px solid rgba(217, 74, 74, 0.35)',
    background: '#fff',
    color: '#d94a4a',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  certPageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  certPageTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: '#171c2d',
  },
  certificateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 18,
  },
  certCard: {
    background: '#fff',
    border: '1px solid rgba(26,36,105,0.1)',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 8px 20px rgba(20,36,60,0.05)',
  },
  certImage: {
    width: '100%',
    height: 140,
    objectFit: 'cover',
    display: 'block',
    background: '#eceffa',
    cursor: 'pointer',
  },
  certCardBody: {
    padding: 14,
    display: 'grid',
    gap: 8,
  },
  certName: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: '#171c2d',
  },
  certVerified: {
    color: '#2d9a72',
    fontWeight: 700,
    fontSize: 12,
    marginBottom: 4,
  },
  certActionBtn: {
    display: 'block',
    textAlign: 'center',
    padding: '9px 10px',
    border: '1px solid #dce4ed',
    borderRadius: 8,
    background: '#fff',
    color: '#3f49a7',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  uploadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 20px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #f6c55a, #d9a836)',
    color: '#171c2d',
    fontWeight: 800,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(246, 197, 90, 0.25)',
  },
  primaryBtn: {
    padding: '12px 24px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #f6c55a, #d9a836)',
    color: '#171c2d',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(246, 197, 90, 0.25)',
  },
  secondaryBtn: {
    padding: '12px 24px',
    borderRadius: 12,
    border: '2px solid #dbe2f2',
    background: '#fff',
    color: '#215b70',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 20,
  },
  formModal: {
    width: '100%',
    maxWidth: 480,
    background: '#fff',
    borderRadius: 20,
    padding: 28,
    boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
  },
  modalTitle: {
    margin: '0 0 20px',
    fontSize: 24,
    fontWeight: 800,
    color: '#171c2d',
  },
  formInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid rgba(26,36,105,0.12)',
    fontSize: 14,
    marginBottom: 12,
    outline: 'none',
    background: '#f8f9ff',
  },
  formActions: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
  },
  settingsCard: {
    background: '#fff',
    border: '1px solid rgba(26,36,105,0.08)',
    borderRadius: 18,
    padding: 24,
    maxWidth: 560,
  },
  settingsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  settingsAvatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #dce4ed',
  },
  settingsName: {
    margin: 0,
    fontSize: 19,
    color: '#171c2d',
  },
  settingsSub: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#697490',
  },
  settingsUploadBtn: {
    display: 'inline-block',
    padding: '9px 16px',
    borderRadius: 8,
    border: '1px solid #dce4ed',
    background: '#f8f9ff',
    color: '#3f49a7',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    marginBottom: 20,
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
    gap: 14,
    marginBottom: 22,
  },
  settingsField: {
    display: 'grid',
    gap: 4,
  },
  settingsFieldLabel: {
    fontSize: 11,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#8891a8',
    fontWeight: 700,
  },
  settingsFieldValue: {
    fontSize: 14,
    color: '#171c2d',
  },
  settingsLogout: {
    padding: '10px 18px',
    borderRadius: 10,
    border: '1px solid rgba(217, 74, 74, 0.35)',
    background: '#fff',
    color: '#d94a4a',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
}
