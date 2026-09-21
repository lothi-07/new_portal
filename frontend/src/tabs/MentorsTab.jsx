import { useEffect, useMemo, useState } from 'react'
import { assignMentorToStudents, assignStudentMentor, assignStudentsToSelf, listStaffAccounts, removeStudentMentor, resetAllMentorAssignments, searchStudents } from '../api'
import { shared as sh } from './sharedStyles'

const YEARS = ['I', 'II', 'III', 'IV']
const SECTIONS = ['A', 'B', 'C']

export default function MentorsTab({ isStaff = false }) {
  const [students, setStudents] = useState([])
  const [staff, setStaff] = useState([])
  const [year, setYear] = useState('')
  const [section, setSection] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [startRoll, setStartRoll] = useState('')
  const [endRoll, setEndRoll] = useState('')
  const [bulkMentorId, setBulkMentorId] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [resetSaving, setResetSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const requests = [searchStudents({ year: year || undefined, section: section || undefined })]
      if (!isStaff) requests.push(listStaffAccounts())
      const responses = await Promise.all(requests)
      const studentData = responses[0].data
      const staffData = isStaff ? [] : responses[1].data
      setStudents(studentData)
      setStaff(staffData.filter(user => user.is_active))
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load mentor assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [year, section])

  const mentorCounts = useMemo(() => students.reduce((counts, student) => {
    if (student.mentor_id) counts[student.mentor_id] = (counts[student.mentor_id] || 0) + 1
    return counts
  }, {}), [students])

  const selectedRange = useMemo(() => {
    if (!startRoll || !endRoll) return []
    const startIndex = students.findIndex(student => student.roll_no === startRoll)
    const endIndex = students.findIndex(student => student.roll_no === endRoll)
    if (startIndex < 0 || endIndex < 0) return []
    const first = Math.min(startIndex, endIndex)
    const last = Math.max(startIndex, endIndex)
    return students.slice(first, last + 1)
  }, [students, startRoll, endRoll])

  const assignBulk = async () => {
    if (!selectedRange.length || (!isStaff && !bulkMentorId)) {
      alert(isStaff ? 'Choose a start roll number and end roll number.' : 'Choose a start roll number, end roll number, and mentor.')
      return
    }
    setBulkSaving(true)
    try {
      await (isStaff
        ? assignStudentsToSelf(selectedRange.map(student => student.id))
        : assignMentorToStudents(selectedRange.map(student => student.id), bulkMentorId))
      const mentor = isStaff ? null : staff.find(user => String(user.id) === String(bulkMentorId))
      if (isStaff) {
        await load()
      } else {
        setStudents(current => current.map(student => (
          selectedRange.some(selected => selected.id === student.id)
            ? { ...student, mentor_id: Number(bulkMentorId), mentor_name: mentor?.name, mentor_email: mentor?.email }
            : student
        )))
      }
      alert(`${selectedRange.length} students assigned to ${isStaff ? 'you' : mentor?.name || 'the selected mentor'}.`)
    } catch (err) {
      alert(err.response?.data?.detail || 'Unable to assign mentors in bulk')
    } finally {
      setBulkSaving(false)
    }
  }

  const updateMentor = async (studentId, mentorId) => {
    setSavingId(studentId)
    try {
      const { data } = await assignStudentMentor(studentId, mentorId)
      setStudents(current => current.map(student => (
        student.id === studentId
          ? { ...student, mentor_id: data.mentor_id, mentor_name: data.mentor_name, mentor_email: data.mentor_email }
          : student
      )))
    } catch (err) {
      alert(err.response?.data?.detail || 'Unable to assign mentor')
    } finally {
      setSavingId(null)
    }
  }

  const removeMentor = async (student) => {
    if (!window.confirm(`Remove the mentor assignment for ${student.first_name} ${student.last_name || ''}?`)) return
    setSavingId(student.id)
    try {
      await removeStudentMentor(student.id)
      setStudents(current => current.map(item => (
        item.id === student.id
          ? { ...item, mentor_id: null, mentor_name: null, mentor_email: null }
          : item
      )))
    } catch (err) {
      alert(err.response?.data?.detail || 'Unable to remove mentor assignment')
    } finally {
      setSavingId(null)
    }
  }

  const resetAll = async () => {
    if (!window.confirm('Remove all mentor assignments? This cannot be undone.')) return
    setResetSaving(true)
    try {
      await resetAllMentorAssignments()
      setStudents(current => current.map(student => (
        { ...student, mentor_id: null, mentor_name: null, mentor_email: null }
      )))
      alert('All mentor assignments have been reset.')
    } catch (err) {
      alert(err.response?.data?.detail || 'Unable to reset mentor assignments')
    } finally {
      setResetSaving(false)
    }
  }

  const clearSelectedRange = async () => {
    if (!selectedRange.length) {
      alert('Choose a start roll number and end roll number.')
      return
    }
    if (!window.confirm(`Remove mentor assignments for ${selectedRange.length} selected students?`)) return
    setBulkSaving(true)
    try {
      await assignMentorToStudents(selectedRange.map(student => student.id), null)
      setStudents(current => current.map(student => (
        selectedRange.some(selected => selected.id === student.id)
          ? { ...student, mentor_id: null, mentor_name: null, mentor_email: null }
          : student
      )))
      alert('Selected mentor assignments have been removed.')
    } catch (err) {
      alert(err.response?.data?.detail || 'Unable to remove selected mentor assignments')
    } finally {
      setBulkSaving(false)
    }
  }

  return (
    <div className="mentors-page" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={s.headerRow}>
        <div>
          <div style={s.headerBadge}>{isStaff ? 'STAFF ACCOUNT' : 'ADMINISTRATION'}</div>
          <h1 style={sh.pageTitle}>Assign Student Mentors</h1>
          <div style={sh.pageTitleUnderline} />
          <p style={sh.sectionSub}>{isStaff ? 'Assign students to your own mentor list. One mentor can guide approximately 30 students.' : 'Assign existing faculty accounts to students. One mentor can guide approximately 30 students.'}</p>
        </div>
      </div>

      <div className="mentors-filters" style={s.filters}>
        <select style={s.select} value={year} onChange={e => setYear(e.target.value)}>
          <option value="">All Years</option>
          {YEARS.map(item => <option key={item} value={item}>{item} Year</option>)}
        </select>
        <select style={s.select} value={section} onChange={e => setSection(e.target.value)}>
          <option value="">All Sections</option>
          {SECTIONS.map(item => <option key={item} value={item}>Section {item}</option>)}
        </select>
        <span style={s.count}>{students.length} students</span>
      </div>

      <div className="mentors-bulk-bar" style={s.bulkBar}>
        <strong style={s.bulkTitle}>Bulk assign by roll number</strong>
        <select style={s.bulkSelect} value={startRoll} onChange={e => setStartRoll(e.target.value)}>
          <option value="">From roll number</option>
          {students.map(student => <option key={`start-${student.id}`} value={student.roll_no}>{student.roll_no}</option>)}
        </select>
        <span style={s.toText}>to</span>
        <select style={s.bulkSelect} value={endRoll} onChange={e => setEndRoll(e.target.value)}>
          <option value="">To roll number</option>
          {students.map(student => <option key={`end-${student.id}`} value={student.roll_no}>{student.roll_no}</option>)}
        </select>
        {!isStaff && <select style={s.bulkSelect} value={bulkMentorId} onChange={e => setBulkMentorId(e.target.value)}>
          <option value="">Choose mentor</option>
          {staff.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>}
        <button style={s.assignBtn} onClick={assignBulk} disabled={bulkSaving}>
          {bulkSaving ? 'Assigning...' : isStaff ? `Assign to Me (${selectedRange.length || 0})` : `Assign ${selectedRange.length || ''} Students`}
        </button>
        {!isStaff && <button style={s.clearBtn} onClick={clearSelectedRange} disabled={bulkSaving}>
          {bulkSaving ? 'Removing...' : `Remove Selected (${selectedRange.length || 0})`}
        </button>}
        {!isStaff && <button style={s.resetBtn} onClick={resetAll} disabled={resetSaving}>
          {resetSaving ? 'Resetting...' : 'Reset All Assignments'}
        </button>}
      </div>

      {error && <div style={s.error}>{error}</div>}
      <div className="mentors-card" style={sh.card}>
        {loading ? <div style={sh.emptyState}>Loading students and mentors...</div> : (
          <div style={s.tableWrap}>
            <table style={sh.table}>
              <thead>
                <tr>
                  <th style={sh.th}>Student</th>
                  <th style={sh.th}>Class</th>
                  <th style={sh.th}>{isStaff ? 'Mentor Status' : 'Maintained By (Staff)'}</th>
                  <th style={{ ...sh.th, textAlign: 'center' }}>Mentor Load</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const loadCount = student.mentor_id ? mentorCounts[student.mentor_id] || 0 : 0
                  return (
                    <tr key={student.id}>
                      <td style={sh.td}>
                        <strong>{student.first_name} {student.last_name || ''}</strong>
                        <div style={s.meta}>{student.roll_no} · {student.department || 'Engineering'}</div>
                      </td>
                      <td style={sh.td}>{student.year} Year · {student.section}</td>
                      <td style={sh.td}>
                        {!isStaff ? <div style={s.mentorActions}><div style={s.mentorDetails}>
                          <strong>{student.mentor_name || 'Not assigned'}</strong>
                          {student.mentor_email && <small>{student.mentor_email}</small>}
                        </div><select
                          style={s.mentorSelect}
                          value={student.mentor_id || ''}
                          disabled={savingId === student.id}
                          onChange={e => updateMentor(student.id, e.target.value)}
                        >
                          <option value="">Not assigned</option>
                          {staff.map(user => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}
                        </select>
                          {student.mentor_id && <button type="button" style={s.removeBtn} onClick={() => removeMentor(student)} disabled={savingId === student.id}>
                            {savingId === student.id ? 'Removing...' : 'Remove'}
                          </button>}
                        </div> : (
                          <button type="button" style={s.assignBtn} onClick={() => updateMentor(student.id, '')} disabled={savingId === student.id}>
                            {savingId === student.id ? 'Assigning...' : student.mentor_id ? 'Assigned' : 'Assign to Me'}
                          </button>
                        )}
                      </td>
                      <td style={{ ...sh.td, textAlign: 'center' }}>
                        {student.mentor_id ? (
                          <span style={{ ...s.loadPill, ...(loadCount > 30 ? s.overLimit : {}) }}>
                            {loadCount}/30 students
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!students.length && <div style={sh.emptyState}>No students found for this class filter.</div>}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  headerRow: { marginBottom: 18 },
  headerBadge: { display: 'inline-block', fontSize: 10.5, fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '3px 9px', borderRadius: 6, letterSpacing: '0.06em', marginBottom: 6 },
  filters: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 },
  select: { padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#334155' },
  count: { marginLeft: 'auto', color: '#64748b', fontSize: 13, fontWeight: 700 },
  bulkBar: { display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 18, padding: '14px 16px', borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe' },
  bulkTitle: { color: '#1e3a8a', fontSize: 12.5, marginRight: 4 },
  bulkSelect: { padding: '8px 10px', border: '1px solid #bfdbfe', borderRadius: 7, background: '#fff', color: '#334155', minWidth: 145 },
  toText: { color: '#64748b', fontSize: 12 },
  assignBtn: { padding: '9px 14px', border: 'none', borderRadius: 7, background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  clearBtn: { padding: '9px 14px', border: '1px solid #fdba74', borderRadius: 7, background: '#fff7ed', color: '#c2410c', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  resetBtn: { padding: '9px 14px', border: '1px solid #fecaca', borderRadius: 7, background: '#fff1f2', color: '#b91c1c', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  error: { marginBottom: 16, padding: 12, borderRadius: 8, background: '#fef2f2', color: '#b91c1c' },
  tableWrap: { overflowX: 'auto' },
  meta: { color: '#64748b', fontSize: 11.5, marginTop: 3 },
  mentorSelect: { width: '100%', minWidth: 240, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 7, background: '#fff', color: '#334155' },
  mentorActions: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 360 },
  mentorDetails: { display: 'flex', flexDirection: 'column', minWidth: 125, flex: 1 },
  removeBtn: { padding: '8px 10px', border: '1px solid #fecaca', borderRadius: 7, background: '#fff', color: '#b91c1c', fontWeight: 700, fontSize: 11, cursor: 'pointer' },
  loadPill: { display: 'inline-block', padding: '4px 9px', borderRadius: 999, background: '#ecfdf5', color: '#047857', fontSize: 11, fontWeight: 700 },
  overLimit: { background: '#fef2f2', color: '#b91c1c' },
}
