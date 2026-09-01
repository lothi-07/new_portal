import { useState, useEffect } from 'react'
import { API_BASE, getStudent, listEventFlyers, uploadStudentPhoto, uploadCertificate, deleteAchievement } from './api'

const EVENT_TYPES = ['Technical', 'Non-Technical', 'Sports', 'Cultural', 'Other']
const PRIZE_TYPES = ['1st Prize', '2nd Prize', '3rd Prize', 'Participation']

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
  })
  const [certificateFile, setCertificateFile] = useState(null)
  const [activeTab, setActiveTab] = useState('details')

  const studentId = session?.student_id ?? session?.id

  const loadStudentPage = async () => {
    if (!studentId && !session?.roll_no) return

    try {
      const studentRes = studentId ? await getStudent(studentId) : { data: { ...profile, first_name: session?.name?.split(' ')[0] || session?.first_name || 'Student' } }
      const flyersRes = await listEventFlyers()

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
    }
  }

  useEffect(() => {
    loadStudentPage()
  }, [session])

  const achievements = Array.isArray(profile?.achievements) ? profile.achievements : []
  const displayName = profile.first_name || session?.name || 'Student'
  const profileInitials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST'
  const profilePhotoUrl = profile.photo_path ? `${API_BASE}${profile.photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1a2469&color=fff&rounded=true`

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
      fd.append('file', certificateFile)
      await uploadCertificate(fd)
      setShowAddAchievement(false)
      setCertificateFile(null)
      setManualForm({ event_name: '', event_type: 'Technical', prize_type: 'Participation', event_date: '', organizer: '' })
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
      fd.append('file', certificateFile)
      await uploadCertificate(fd)
      setShowUploadCertificate(false)
      setCertificateFile(null)
      setManualForm({ event_name: '', event_type: 'Technical', prize_type: 'Participation', event_date: '', organizer: '' })
      await loadStudentPage()
    } catch (error) {
      alert(error.response?.data?.detail || 'Unable to upload certificate')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.pageShell}>
      <div style={styles.pageWrap}>
        <header style={styles.topBar}>
          <div>
            <div style={styles.kicker}>Achievement Portal</div>
            <h1 style={styles.heading}>Welcome, {displayName}</h1>
          </div>
          <button onClick={onLogout} style={styles.logoutButton}>Logout</button>
        </header>

        <section style={styles.profileHeader}>
          <div style={styles.profileCardLarge}>
            <div style={styles.avatarWrap}>
              <img src={profilePhotoUrl} alt="Student profile" style={styles.avatar} onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.nextSibling.style.display = 'flex'; }} />
              <div style={{ ...styles.avatarFallback, display: profile.photo_path ? 'none' : 'flex' }}>{profileInitials}</div>
            </div>

            <div style={styles.profileInfo}>
              <h2 style={styles.profileName}>{displayName}</h2>
              <p style={styles.profileRole}>Student</p>
              <div style={styles.profileMeta}>
                <span>📌 {profile.roll_no}</span>
                <span>🎓 {profile.year}</span>
                <span>🏢 {profile.department}</span>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.dashboardTabs}>
          <div style={styles.tabsNav}>
            {[
              { id: 'details', label: 'Student Details' },
              { id: 'participation', label: 'Participation' },
              { id: 'certificates', label: 'Certificates' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ ...styles.tabBtn, ...(activeTab === tab.id ? styles.tabBtnActive : {}) }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'details' && (
            <div style={styles.tabContent}>
              <div style={styles.detailsGrid}>
                <div style={styles.detailCard}>
                  <label>Roll Number</label>
                  <p>{profile.roll_no}</p>
                </div>
                <div style={styles.detailCard}>
                  <label>Registration Number</label>
                  <p>{profile.reg_no}</p>
                </div>
                <div style={styles.detailCard}>
                  <label>Year</label>
                  <p>{profile.year}</p>
                </div>
                <div style={styles.detailCard}>
                  <label>Section</label>
                  <p>{profile.section}</p>
                </div>
                <div style={styles.detailCard}>
                  <label>Department</label>
                  <p>{profile.department}</p>
                </div>
                <div style={styles.detailCard}>
                  <label>Email</label>
                  <p>{profile.email}</p>
                </div>
                <div style={styles.detailCard}>
                  <label>Mobile</label>
                  <p>{profile.mobile_number}</p>
                </div>
                <div style={styles.detailCard}>
                  <label>Total Achievements</label>
                  <p style={styles.statBig}>{achievements.length}</p>
                </div>
              </div>
            </div>
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
                            onClick={() => setSelectedCertificate(`${API_BASE}${a.certificate_upload_path}`)}
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
              <button
                onClick={() => setShowUploadCertificate(true)}
                style={styles.primaryBtn}
              >
                Upload Certificate
              </button>

              {achievements.filter(a => a.certificate_upload_path).length === 0 ? (
                <div style={styles.emptyState}>No certificates uploaded yet.</div>
              ) : (
                <div style={styles.certificateGrid}>
                  {achievements.filter(a => a.certificate_upload_path).map(a => (
                    <div key={a.id} style={styles.certCard} onClick={() => setSelectedCertificate(`${API_BASE}${a.certificate_upload_path}`)}>
                      <div style={styles.certThumbnail}>📜</div>
                      <p style={styles.certName}>{a.event_name}</p>
                      <p style={styles.certDate}>{a.event_date}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {selectedCertificate && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedCertificate(null)}>
          <div style={styles.certificateModal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setSelectedCertificate(null)}>✕</button>
            {selectedCertificate.endsWith('.pdf') ? (
              <iframe src={selectedCertificate} style={styles.pdfViewer}></iframe>
            ) : (
              <img src={selectedCertificate} alt="Certificate" style={styles.certificateImage} />
            )}
          </div>
        </div>
      )}

      {showAddAchievement && (
        <div style={styles.modalBackdrop} onClick={() => setShowAddAchievement(false)}>
          <div style={styles.formModal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Add Achievement</h3>
            <input style={styles.formInput} placeholder="Event name" value={manualForm.event_name} onChange={e => setManualForm({ ...manualForm, event_name: e.target.value })} />
            <select style={styles.formInput} value={manualForm.event_type} onChange={e => setManualForm({ ...manualForm, event_type: e.target.value })}>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select style={styles.formInput} value={manualForm.prize_type} onChange={e => setManualForm({ ...manualForm, prize_type: e.target.value })}>
              {PRIZE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input style={styles.formInput} type="date" value={manualForm.event_date} onChange={e => setManualForm({ ...manualForm, event_date: e.target.value })} />
            <input style={styles.formInput} placeholder="Organizer" value={manualForm.organizer} onChange={e => setManualForm({ ...manualForm, organizer: e.target.value })} />
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
            <input style={styles.formInput} placeholder="Event name" value={manualForm.event_name} onChange={e => setManualForm({ ...manualForm, event_name: e.target.value })} />
            <select style={styles.formInput} value={manualForm.event_type} onChange={e => setManualForm({ ...manualForm, event_type: e.target.value })}>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select style={styles.formInput} value={manualForm.prize_type} onChange={e => setManualForm({ ...manualForm, prize_type: e.target.value })}>
              {PRIZE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input style={styles.formInput} type="date" value={manualForm.event_date} onChange={e => setManualForm({ ...manualForm, event_date: e.target.value })} />
            <input style={styles.formInput} placeholder="Organizer" value={manualForm.organizer} onChange={e => setManualForm({ ...manualForm, organizer: e.target.value })} />
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

const styles = {
  pageShell: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f3efe7 0%, #e7e2da 38%, #f9f7f4 100%)',
    padding: '36px 20px 60px',
    fontFamily: "'Inter', 'Poppins', sans-serif",
    color: '#161b2d',
  },
  pageWrap: {
    maxWidth: 1220,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    fontWeight: 800,
    color: '#5b647d',
  },
  heading: {
    margin: '10px 0 0',
    fontSize: 'clamp(2rem, 3vw, 3rem)',
    fontWeight: 800,
    letterSpacing: '-0.06em',
    color: '#171c2d',
  },
  logoutButton: {
    padding: '12px 22px',
    border: 'none',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #9c2344, #6d1f4d)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    boxShadow: '0 14px 28px rgba(109,31,77,0.18)',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: 20,
  },
  profileCard: {
    background: 'linear-gradient(135deg, rgba(26,36,105,0.99), rgba(39,53,124,0.92))',
    borderRadius: 24,
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    color: '#fff',
    boxShadow: '0 16px 36px rgba(26,36,105,0.18)',
  },
  avatarWrap: {
    position: 'relative',
    width: 92,
    height: 92,
    flexShrink: 0,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.4)',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.12)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    fontWeight: 800,
    background: 'linear-gradient(135deg, #d4b14e, #f0d88b)',
    color: '#1a2469',
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 999,
    padding: '7px 12px',
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  profileName: {
    margin: '12px 0 10px',
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: '-0.04em',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 600,
    fontSize: 14,
  },
  contactInfo: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    wordBreak: 'break-word',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 16,
  },
  statCard: {
    background: '#fff',
    borderRadius: 18,
    padding: '18px 16px',
    border: '1px solid rgba(26,36,105,0.08)',
    boxShadow: '0 12px 22px rgba(24, 38, 74, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#697490',
    fontWeight: 700,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 800,
    color: '#171c2d',
    lineHeight: 1.3,
  },
  panel: {
    background: '#fffdfb',
    border: '1px solid rgba(26,36,105,0.08)',
    borderRadius: 24,
    padding: '24px 24px 18px',
    boxShadow: '0 18px 36px rgba(22, 24, 31, 0.05)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  sectionEyebrow: {
    margin: 0,
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#7d859d',
    fontWeight: 800,
  },
  sectionTitle: {
    margin: '8px 0 0',
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: '-0.04em',
    color: '#171c2d',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '11px 18px',
    borderRadius: 10,
    background: '#edf1ff',
    color: '#1a2469',
    fontWeight: 700,
    fontSize: 14,
    border: '1px solid rgba(26,36,105,0.12)',
    cursor: 'pointer',
  },
  noticeBox: {
    borderRadius: 12,
    background: '#fff3d2',
    border: '1px solid #f0d889',
    color: '#7c5a00',
    padding: '12px 14px',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 18,
  },
  achievementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  achievementRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    gap: 16,
    alignItems: 'center',
    background: '#f8f9ff',
    border: '1px solid rgba(26,36,105,0.08)',
    borderRadius: 16,
    padding: '14px 16px',
  },
  awardPill: {
    background: 'linear-gradient(135deg, #f7e7b1, #d7ad34)',
    color: '#2a2104',
    fontWeight: 800,
    fontSize: 11,
    padding: '8px 10px',
    borderRadius: 999,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    minWidth: 90,
    textAlign: 'center',
  },
  achievementMain: {
    minWidth: 0,
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
  linkButton: {
    color: '#1a2469',
    fontWeight: 700,
    textDecoration: 'none',
    fontSize: 13,
  },
  mutedTag: {
    color: '#7d5a00',
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: '9px 12px',
    borderRadius: 10,
    border: '1px solid rgba(217, 74, 74, 0.35)',
    background: '#fff',
    color: '#d94a4a',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
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
  flyerSection: {
    background: '#fffdfb',
    border: '1px solid rgba(26,36,105,0.08)',
    borderRadius: 24,
    padding: '24px',
    boxShadow: '0 18px 36px rgba(22, 24, 31, 0.05)',
  },
  sectionHeadingRow: {
    marginBottom: 18,
  },
  flyerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 18,
  },
  flyerCard: {
    background: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    border: '1px solid rgba(26,36,105,0.08)',
    boxShadow: '0 12px 26px rgba(20, 24, 35, 0.04)',
  },
  flyerImage: {
    width: '100%',
    height: 210,
    objectFit: 'cover',
    display: 'block',
    background: '#f3f5fb',
  },
  pdfCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 210,
    textDecoration: 'none',
    color: '#1a2469',
    background: 'linear-gradient(135deg, #f4f5fb, #eef2ff)',
    fontWeight: 800,
    fontSize: 17,
  },
  flyerBody: {
    padding: 16,
  },
  flyerTitle: {
    margin: '0 0 8px',
    fontSize: 20,
    color: '#171c2d',
    fontWeight: 800,
  },
  flyerDescription: {
    margin: '0 0 8px',
    color: '#58637a',
    fontSize: 14,
    lineHeight: 1.5,
  },
  flyerMeta: {
    margin: '5px 0',
    fontSize: 13,
    color: '#4d5b76',
  },
  flyerDeadline: {
    margin: '8px 0 0',
    fontSize: 13,
    color: '#9a6a00',
    fontWeight: 800,
  },
  profileHeader: {
    marginBottom: 24,
  },
  profileCardLarge: {
    background: 'linear-gradient(135deg, #1a2469 0%, #2e4593 100%)',
    borderRadius: 24,
    padding: 28,
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    color: '#fff',
    boxShadow: '0 20px 40px rgba(26,36,105,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  profileInfo: {
    flex: 1,
  },
  profileRole: {
    margin: '0 0 12px',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 600,
  },
  profileMeta: {
    display: 'flex',
    gap: 16,
    fontSize: 15,
    fontWeight: 600,
  },
  dashboardTabs: {
    background: '#fffdfb',
    borderRadius: 24,
    border: '1px solid rgba(26,36,105,0.08)',
    overflow: 'hidden',
    boxShadow: '0 18px 36px rgba(22, 24, 31, 0.05)',
  },
  tabsNav: {
    display: 'flex',
    borderBottom: '2px solid rgba(26,36,105,0.1)',
  },
  tabBtn: {
    flex: 1,
    padding: '18px 16px',
    border: 'none',
    background: 'transparent',
    color: '#697490',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderBottom: '3px solid transparent',
    textAlign: 'center',
  },
  tabBtnActive: {
    color: '#1a2469',
    borderBottomColor: '#f6c55a',
    background: 'rgba(246, 197, 90, 0.08)',
  },
  tabContent: {
    padding: 24,
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
  },
  detailCard: {
    background: '#f8f9ff',
    border: '1px solid rgba(26,36,105,0.08)',
    borderRadius: 16,
    padding: 16,
  },
  detailCardLabel: {
    display: 'block',
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#697490',
    fontWeight: 800,
    marginBottom: 8,
  },
  detailCardValue: {
    fontSize: 18,
    fontWeight: 800,
    color: '#171c2d',
  },
  statBig: {
    fontSize: 28,
    fontWeight: 800,
    color: '#f6c55a',
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
    color: '#1a2469',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
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
  viewBtn: {
    padding: '8px 14px',
    borderRadius: 10,
    border: '1px solid #1a2469',
    background: '#1a2469',
    color: '#fff',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  },
  certificateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 16,
    marginTop: 20,
  },
  certCard: {
    background: '#f8f9ff',
    border: '2px solid rgba(26,36,105,0.12)',
    borderRadius: 16,
    padding: 16,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  certThumbnail: {
    fontSize: 48,
    marginBottom: 12,
  },
  certName: {
    margin: '0 0 4px',
    fontSize: 14,
    fontWeight: 700,
    color: '#171c2d',
  },
  certDate: {
    margin: 0,
    fontSize: 12,
    color: '#697490',
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
  certificateModal: {
    width: '100%',
    maxWidth: 800,
    height: '80vh',
    background: '#fff',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    border: 'none',
    background: 'rgba(0,0,0,0.08)',
    borderRadius: '50%',
    fontSize: 24,
    cursor: 'pointer',
    zIndex: 101,
  },
  pdfViewer: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  certificateImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
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
}

const modalStyles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.42)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    borderRadius: 14,
    padding: 20,
    boxShadow: '0 26px 60px rgba(0,0,0,0.15)',
  },
  title: {
    margin: '0 0 14px',
    fontSize: 24,
    color: '#1d1d1d',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #d8d8d8',
    fontSize: 14,
    marginBottom: 10,
    outline: 'none',
  },
}
