import { useState, useEffect } from 'react'
import {
  searchStudents, getStudent, createStudent, deleteStudent, uploadStudentPhoto,
  createAchievement, uploadCertificate, generateOutput, deleteAchievement,
  exportStudentsUrl, exportSingleStudentUrl, API_BASE, deleteStudentsByClass,
  listEventFlyers, photoUrl,
} from '../api'

const DEPTS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'AI & DS', 'IT']
const YEARS = ['I', 'II', 'III', 'IV']
const SECTIONS = ['A', 'B', 'C']
const EVENT_TYPES = ['Technical', 'Non-Technical', 'Sports', 'Cultural', 'Other']
const PRIZE_TYPES = ['1st Prize', '2nd Prize', '3rd Prize', 'Participation']

export default function StudentsTab({ focusStudentId = null }) {
  const [dept, setDept] = useState('')
  const [year, setYear] = useState('')
  const [section, setSection] = useState('')
  const [name, setName] = useState('')
  const [students, setStudents] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAddAchievement, setShowAddAchievement] = useState(false)
  const [showUploadCert, setShowUploadCert] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'profile'
  const [deletingClass, setDeletingClass] = useState(false)

  const runSearch = async () => {
    setLoading(true)
    try {
      const params = {}
      if (dept) params.department = dept
      if (year) params.year = year
      if (section) params.section = section
      if (name) params.name = name
      const res = await searchStudents(params)
      setStudents(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { runSearch() }, [])

  useEffect(() => {
    if (focusStudentId) {
      openStudent(focusStudentId)
    }
  }, [focusStudentId])

  const openStudent = async (id) => {
    const res = await getStudent(id)
    setSelected(res.data)
    setViewMode('profile')
  }

  const refreshSelected = async () => {
    if (selected) {
      const res = await getStudent(selected.id)
      setSelected(res.data)
    }
  }

  const backToTable = () => {
    setViewMode('table')
    setSelected(null)
  }

  const deleteClass = async () => {
    if (!year || !section.trim()) {
      alert('Choose both a year and section before deleting students in bulk.')
      return
    }

    const normalizedSection = section.trim().toUpperCase()
    const confirmed = confirm(
      `Delete every ${year} Year, Section ${normalizedSection} student and all of their achievements? This cannot be undone.`
    )
    if (!confirmed) return

    setDeletingClass(true)
    try {
      const response = await deleteStudentsByClass(year, normalizedSection)
      alert(response.data.message)
      await runSearch()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to delete students')
    } finally {
      setDeletingClass(false)
    }
  }

  return (
    <div style={s.wrap}>
      {viewMode === 'table' ? (
        <>
          {/* Page Title */}
          <div style={s.pageHeader}>
            <h1 style={s.pageTitle}>Students Directory</h1>
            <div style={s.pageTitleUnderline} />
          </div>

          {/* Filter Bar */}
          <div style={s.filterBar}>
            <div style={s.selectWrap}>
              <select style={s.select} value={dept} onChange={e => setDept(e.target.value)}>
                <option value="">All Departments</option>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronIcon />
            </div>

            <div style={s.selectWrap}>
              <select style={s.select} value={year} onChange={e => setYear(e.target.value)}>
                <option value="">All Years</option>
                {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
              </select>
              <ChevronIcon />
            </div>

            <input
              style={s.sectionInput}
              placeholder="Section"
              value={section}
              onChange={e => setSection(e.target.value)}
            />

            <input
              style={s.searchInput}
              placeholder="Search name / roll no"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runSearch()}
            />

            <button style={s.filterBtn} onClick={runSearch}>Filter</button>

            <a
              href={exportStudentsUrl({ year, section })}
              style={s.exportBtn}
            >
              Export CSV
            </a>

            <button style={s.addBtn} onClick={() => setShowAddStudent(true)}>+ Add Student</button>
            <button
              style={{ ...s.bulkDeleteBtn, opacity: deletingClass ? 0.7 : 1 }}
              onClick={deleteClass}
              disabled={deletingClass}
              title="Deletes every student in the selected year and section"
            >
              {deletingClass ? 'Deleting...' : 'Delete Class'}
            </button>
          </div>

          {/* Table */}
          <div style={s.tableCard}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>PHOTO</th>
                  <th style={s.th}>NAME</th>
                  <th style={s.th}>ROLL NO</th>
                  <th style={s.th}>DEPT</th>
                  <th style={s.th}>YEAR</th>
                  <th style={s.th}>SECTION</th>
                  <th style={s.th}>EMAIL</th>
                  <th style={s.th}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                      Loading students…
                    </td>
                  </tr>
                )}
                {!loading && students.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '60px 0', color: '#bbb', fontSize: 14 }}>
                      No students found. Try adjusting your filters.
                    </td>
                  </tr>
                )}
                {!loading && students.map(st => {
                  const studentPhotoUrl = photoUrl(st.photo_path)
                  return (
                    <tr key={st.id} style={s.tr} onClick={() => openStudent(st.id)}>
                      <td style={s.td}>
                        <div style={s.avatarWrap}>
                          {studentPhotoUrl
                            ? <img src={studentPhotoUrl} alt="" style={s.avatar} />
                            : <div style={s.avatarPlaceholder}>{st.first_name?.[0]}{st.last_name?.[0]}</div>
                          }
                        </div>
                      </td>
                      <td style={{ ...s.td, fontWeight: 600, color: '#1a2469' }}>
                        {st.first_name} {st.last_name}
                        {st.achievement_count > 0 && (
                          <span style={s.achieveBadge}>🏆 {st.achievement_count}</span>
                        )}
                      </td>
                      <td style={s.td}>{st.roll_no}</td>
                      <td style={s.td}>{st.department || 'AI & DS'}</td>
                      <td style={s.td}>{st.year}</td>
                      <td style={s.td}>{st.section}</td>
                      <td style={{ ...s.td, color: '#666', fontSize: 12.5 }}>{st.email || '—'}</td>
                      <td style={s.td} onClick={e => e.stopPropagation()}>
                        <button
                          style={s.viewBtn}
                          onClick={() => openStudent(st.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Profile View */
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button style={s.backBtn} onClick={backToTable}>← Back</button>
            <h1 style={s.pageTitle}>Student Profile</h1>
          </div>

          <div style={s.profileCard}>
            {selected && (
              <StudentProfile
                student={selected}
                onAddAchievement={() => setShowAddAchievement(true)}
                onUploadCert={() => setShowUploadCert(true)}
                onGenerate={async (achId) => { await generateOutput(achId); await refreshSelected() }}
                onDeleteAchievement={async (achId) => { await deleteAchievement(achId); await refreshSelected() }}
                onPhotoUpload={async (file) => { await uploadStudentPhoto(selected.id, file); await refreshSelected(); runSearch() }}
                onDeleteStudent={async () => {
                  if (confirm('Delete this student and all their achievements?')) {
                    await deleteStudent(selected.id)
                    backToTable()
                    runSearch()
                  }
                }}
              />
            )}
          </div>
        </>
      )}

      {showAddAchievement && selected && (
        <AddAchievementModal
          studentId={selected.id}
          onClose={() => setShowAddAchievement(false)}
          onCreated={async () => { setShowAddAchievement(false); await refreshSelected() }}
        />
      )}
      {showUploadCert && selected && (
        <UploadCertificateModal
          studentId={selected.id}
          onClose={() => setShowUploadCert(false)}
          onCreated={async () => { setShowUploadCert(false); await refreshSelected() }}
        />
      )}
      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onCreated={async () => { setShowAddStudent(false); await runSearch() }}
        />
      )}
    </div>
  )
}

/* ── Student Profile ── */
function StudentProfile({ student, onAddAchievement, onUploadCert, onGenerate, onDeleteAchievement, onPhotoUpload, onDeleteStudent }) {
  const [flyers, setFlyers] = useState([])
  const [previewAchievement, setPreviewAchievement] = useState(null)

  const studentPhotoUrl = photoUrl(student.photo_path)

  useEffect(() => {
    listEventFlyers()
      .then((res) => setFlyers(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setFlyers([]))
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
        <label style={pm.photoLabel}>
          {studentPhotoUrl
            ? <img src={studentPhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 10, color: '#aaa' }}>PHOTO</span>}
          <input type="file" accept="image/*" style={{ display: 'none' }}
                 onChange={e => e.target.files[0] && onPhotoUpload(e.target.files[0])} />
        </label>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: '#1a2469', fontWeight: 700 }}>
            {student.first_name} {student.last_name}
          </h2>
          <p style={{ margin: '5px 0', color: '#666', fontSize: 13.5 }}>
            {student.roll_no}
            {student.reg_no && ` · Reg: ${student.reg_no}`}
            {` · Section ${student.section} · ${student.year} Year`}
          </p>
          <p style={{ margin: 0, color: '#999', fontSize: 12.5 }}>{student.email || 'No email on file'}</p>
        </div>
        <a href={exportSingleStudentUrl(student.id)} style={pm.exportLink}>⬇ Export</a>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button style={pm.btnPrimary} onClick={onAddAchievement}>+ Add Achievement</button>
        <button style={pm.btnGold} onClick={onUploadCert}>📷 Upload Certificate</button>
        <button style={{ ...pm.btnDanger, marginLeft: 'auto' }} onClick={onDeleteStudent}>Delete Student</button>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a2469', marginBottom: 14 }}>
        Achievement History ({student.achievements.length})
      </h3>

      {student.achievements.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb' }}>No achievements recorded yet.</div>
      )}

      {student.achievements.map(a => {
        const hasUploadedCertificate = Boolean(a.certificate_upload_path)
        const hasGeneratedOutput = Boolean(a.output_path)

        return (
          <div key={a.id} style={pm.achRow}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: '#222' }}>{a.event_name}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                {a.event_type} · {a.prize_type} · {a.event_date || 'no date'}
                {a.organizer && ` · ${a.organizer}`}
                {a.source === 'certificate_upload' && (
                  <span style={pm.uploadBadge}>from upload</span>
                )}
              </div>
            </div>
            {hasUploadedCertificate ? (
              <button style={pm.viewLink} onClick={() => setPreviewAchievement(a)}>
                View Certificate
              </button>
            ) : hasGeneratedOutput ? (
              <a href={`${API_BASE}${a.output_path}`} target="_blank" rel="noreferrer" style={pm.viewLink}>
                View {a.output_type}
              </a>
            ) : (
              <button style={pm.genBtn} onClick={() => onGenerate(a.id)}>Generate</button>
            )}
            <button style={pm.delBtn} onClick={() => onDeleteAchievement(a.id)}>Delete</button>
          </div>
        )
      })}

      {previewAchievement && (
        <CertificatePreviewModal
          achievement={previewAchievement}
          flyers={flyers}
          onClose={() => setPreviewAchievement(null)}
        />
      )}
    </div>
  )
}

function CertificatePreviewModal({ achievement, flyers, onClose }) {
  const relatedFlyers = flyers.filter((flyer) => {
    const title = (flyer.title || '').toLowerCase()
    const organizer = (flyer.organizer || '').toLowerCase()
    const eventName = (achievement.event_name || '').toLowerCase()
    const eventOrganizer = (achievement.organizer || '').toLowerCase()
    return title.includes(eventName) || eventName.includes(title) || organizer.includes(eventOrganizer) || eventOrganizer.includes(organizer)
  }).slice(0, 2)

  return (
    <div style={m.backdrop} onClick={onClose}>
      <div style={{ ...m.modal, maxWidth: 760, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={m.title}>{achievement.event_name}</h3>
          <button style={m.btnGhost} onClick={onClose}>Close</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>
              Event Flyer
            </div>
            {relatedFlyers.length > 0 ? (
              relatedFlyers.map((flyer) => (
                <div key={flyer.id} style={{ marginBottom: 10 }}>
                  {flyer.flyer_content_type === 'application/pdf' ? (
                    <a href={`${API_BASE}${flyer.flyer_path}`} target="_blank" rel="noreferrer" style={pm.viewLink}>View Flyer PDF</a>
                  ) : (
                    <img src={`${API_BASE}${flyer.flyer_path}`} alt="Event flyer" style={{ width: '100%', borderRadius: 10, border: '1px solid #ddd', maxHeight: 280, objectFit: 'contain' }} />
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: 16, border: '1px dashed #d9d9d9', borderRadius: 10, color: '#777', textAlign: 'center' }}>
                No event flyer found for this achievement.
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>
              Participation Certificate
            </div>
            {achievement.certificate_upload_path ? (
              achievement.certificate_upload_path.toLowerCase().endsWith('.pdf') ? (
                <a href={`${API_BASE}${achievement.certificate_upload_path}`} target="_blank" rel="noreferrer" style={pm.viewLink}>Open certificate PDF</a>
              ) : (
                <img src={`${API_BASE}${achievement.certificate_upload_path}`} alt="Participation certificate" style={{ width: '100%', borderRadius: 10, border: '1px solid #ddd', maxHeight: 280, objectFit: 'contain' }} />
              )
            ) : (
              <div style={{ padding: 16, border: '1px dashed #d9d9d9', borderRadius: 10, color: '#777', textAlign: 'center' }}>
                No certificate uploaded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Modals ── */
function AddAchievementModal({ studentId, onClose, onCreated }) {
  const [form, setForm] = useState({ event_name: '', event_type: 'Technical', prize_type: '1st Prize', event_date: '', organizer: '' })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.event_name) return alert('Event name is required')
    setSaving(true)
    try { await createAchievement({ student_id: studentId, ...form }); onCreated() }
    catch (e) { alert(e.response?.data?.detail || 'Failed to save') }
    setSaving(false)
  }

  return (
    <div style={m.backdrop} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()}>
        <h3 style={m.title}>Add Achievement</h3>
        <input style={m.input} placeholder="Event name" value={form.event_name}
               onChange={e => setForm({ ...form, event_name: e.target.value })} />
        <select style={m.input} value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select style={m.input} value={form.prize_type} onChange={e => setForm({ ...form, prize_type: e.target.value })}>
          {PRIZE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input style={m.input} type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
        <input style={m.input} placeholder="Organizer / host college" value={form.organizer}
               onChange={e => setForm({ ...form, organizer: e.target.value })} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={m.btnPrimary} onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button style={m.btnGhost} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function UploadCertificateModal({ studentId, onClose, onCreated }) {
  const [form, setForm] = useState({ event_name: '', event_type: 'Technical', prize_type: '1st Prize', event_date: '', organizer: '' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.event_name || !file) return alert('Event name and certificate photo required')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('student_id', studentId)
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('file', file)
      await uploadCertificate(fd)
      onCreated()
    } catch (e) { alert(e.response?.data?.detail || 'Upload failed') }
    setSaving(false)
  }

  return (
    <div style={m.backdrop} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()}>
        <h3 style={m.title}>Upload Certificate Photo</h3>
        <p style={{ fontSize: 12.5, color: '#888', marginBottom: 16 }}>This automatically creates an achievement record.</p>
        <input style={m.input} placeholder="Event name" value={form.event_name}
               onChange={e => setForm({ ...form, event_name: e.target.value })} />
        <select style={m.input} value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select style={m.input} value={form.prize_type} onChange={e => setForm({ ...form, prize_type: e.target.value })}>
          {PRIZE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input style={m.input} type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
        <input style={m.input} placeholder="Organizer / host college" value={form.organizer}
               onChange={e => setForm({ ...form, organizer: e.target.value })} />
        <input style={m.input} type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={m.btnPrimary} onClick={submit} disabled={saving}>{saving ? 'Uploading...' : 'Upload & Save'}</button>
          <button style={m.btnGhost} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function AddStudentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    roll_no: '',
    first_name: '',
    last_name: '',
    email: '',
    mobile_number: '',
    department: 'AI & DS',
    year: 'I',
    section: 'A',
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.roll_no || !form.first_name) return alert('Roll number and first name required')
    setSaving(true)
    try {
      const payload = { ...form, department: form.department || 'AI & DS' }
      const createdRes = await createStudent(payload)
      const studentId = createdRes?.data?.id ?? createdRes?.id
      if (photoFile && studentId) {
        await uploadStudentPhoto(studentId, photoFile)
      }
      onCreated()
    } catch (e) {
      const detail = e.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map(item => item.msg).join(', ')
        : detail
      alert(message || 'Failed to add student')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={m.backdrop} onClick={onClose}>
      <div style={m.modal} onClick={e => e.stopPropagation()}>
        <h3 style={m.title}>Add Student</h3>
        <input style={m.input} placeholder="Roll No (e.g. ES24AD62)" value={form.roll_no}
               onChange={e => setForm({ ...form, roll_no: e.target.value })} />
        <input style={m.input} placeholder="First name" value={form.first_name}
               onChange={e => setForm({ ...form, first_name: e.target.value })} />
        <input style={m.input} placeholder="Last name" value={form.last_name}
               onChange={e => setForm({ ...form, last_name: e.target.value })} />
        <input style={m.input} placeholder="Email" value={form.email}
               onChange={e => setForm({ ...form, email: e.target.value })} />
        <input style={m.input} placeholder="Mobile" value={form.mobile_number}
               onChange={e => setForm({ ...form, mobile_number: e.target.value })} />
        <select style={m.input} value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
          {DEPTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </select>
        <select style={m.input} value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
          {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
        </select>
        <select style={m.input} value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
          {SECTIONS.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
        </select>

        <div style={{ margin: '8px 0 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px dashed #b5b5c5',
            borderRadius: 8,
            background: '#fafbff',
            color: '#49566f',
            fontSize: 12.5,
            cursor: 'pointer',
            textAlign: 'center',
          }}>
            {photoFile ? photoFile.name : 'Upload student photo'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={m.btnPrimary} onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Add Student'}</button>
          <button style={m.btnGhost} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ── Styles ── */
const NAVY = '#0f172a'
const PRIMARY = '#2563eb'
const GOLD = '#d97706'
const GREEN = '#059669'
const DANGER = '#dc2626'

const s = {
  wrap: { animation: 'fadeIn 0.3s ease' },

  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.02em' },
  pageTitleUnderline: { width: 44, height: 4, background: 'linear-gradient(90deg, #2563eb, #38bdf8)', borderRadius: 4, marginTop: 8 },

  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  selectWrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  },
  select: {
    appearance: 'none',
    WebkitAppearance: 'none',
    padding: '9px 34px 9px 14px',
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    background: '#ffffff',
    fontSize: 13,
    fontWeight: 500,
    color: '#1e293b',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  sectionInput: {
    padding: '9px 12px',
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    background: '#ffffff',
    fontSize: 13,
    color: '#1e293b',
    outline: 'none',
    width: 110,
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  searchInput: {
    padding: '9px 16px',
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    background: '#ffffff',
    fontSize: 13,
    color: '#1e293b',
    outline: 'none',
    flex: 1,
    minWidth: 200,
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  filterBtn: {
    padding: '9px 20px',
    borderRadius: 9,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
  },
  exportBtn: {
    padding: '9px 18px',
    borderRadius: 9,
    border: '1px solid #a7f3d0',
    background: '#ecfdf5',
    color: '#059669',
    fontSize: 13,
    fontWeight: 700,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  addBtn: {
    padding: '9px 18px',
    borderRadius: 9,
    border: 'none',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 700,
    marginLeft: 'auto',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
  },
  bulkDeleteBtn: {
    padding: '9px 16px',
    borderRadius: 9,
    border: '1px solid #fecaca',
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },

  tableCard: {
    background: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
    border: '1px solid #e2e8f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    background: NAVY,
    color: '#f8fafc',
    fontWeight: 700,
    fontSize: 11.5,
    textAlign: 'left',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: 13.5,
    color: '#334155',
    verticalAlign: 'middle',
  },
  avatarWrap: {
    width: 38,
    height: 38,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    objectFit: 'cover',
    border: '1.5px solid #cbd5e1',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: '#eff6ff',
    color: PRIMARY,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 800,
    border: '1.5px solid #bfdbfe',
  },
  achieveBadge: {
    marginLeft: 8,
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11.5,
    background: '#fef3c7',
    color: '#b45309',
    fontWeight: 800,
    border: '1px solid #fde68a',
  },
  viewBtn: {
    padding: '6px 14px',
    borderRadius: 7,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },

  profileCard: {
    background: '#ffffff',
    borderRadius: 18,
    padding: 32,
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
  },
  backBtn: {
    padding: '8px 18px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
}

/* Profile styles */
const pm = {
  photoLabel: {
    width: 96,
    height: 96,
    borderRadius: 16,
    background: '#f8fafc',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #3b82f6',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
  },
  exportLink: {
    padding: '9px 18px',
    borderRadius: 9,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#334155',
    fontSize: 13,
    fontWeight: 700,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  btnPrimary: {
    padding: '9px 20px',
    borderRadius: 9,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
  },
  btnGold: {
    padding: '9px 20px',
    borderRadius: 9,
    border: 'none',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
  },
  btnDanger: {
    padding: '9px 18px',
    borderRadius: 9,
    border: '1px solid #fecaca',
    background: '#fef2f2',
    color: '#dc2626',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  achRow: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '14px 18px',
    marginBottom: 10,
    gap: 14,
    background: '#f8fafc',
  },
  uploadBadge: {
    display: 'inline-block',
    marginLeft: 8,
    padding: '3px 9px',
    borderRadius: 999,
    fontSize: 11,
    background: '#eff6ff',
    color: '#1d4ed8',
    fontWeight: 700,
  },
  viewLink: {
    padding: '7px 14px',
    borderRadius: 7,
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 700,
  },
  genBtn: {
    padding: '7px 14px',
    borderRadius: 7,
    border: 'none',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  delBtn: {
    padding: '7px 12px',
    borderRadius: 7,
    border: '1px solid #fecaca',
    background: '#ffffff',
    color: '#dc2626',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
}

/* Modal styles */
const m = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 20,
  },
  modal: {
    background: '#ffffff',
    borderRadius: 18,
    padding: 30,
    width: 480,
    maxHeight: '88vh',
    overflowY: 'auto',
    animation: 'scaleUp 0.2s ease',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #e2e8f0',
  },
  title: {
    marginTop: 0,
    marginBottom: 20,
    fontSize: 18,
    fontWeight: 800,
    color: NAVY,
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '11px 14px',
    marginBottom: 14,
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    boxSizing: 'border-box',
    fontSize: 13.5,
    outline: 'none',
    color: '#0f172a',
  },
  btnPrimary: {
    padding: '10px 22px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
  },
  btnGhost: {
    padding: '10px 20px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
}

/* Chevron icon for select */
function ChevronIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', right: 10, pointerEvents: 'none' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
