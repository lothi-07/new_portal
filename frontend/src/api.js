import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_URL })

// Attach auth token to every request automatically, if present
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ---- Auth ----
export const signup = (data) => api.post('/auth/signup', data)
export const login = (data) => api.post('/auth/login', data)
export const googleLogin = (credential) => api.post('/auth/google', { credential })
export const createStaffAccount = (data) => api.post('/auth/staff', data)

// ---- Students ----
export const searchStudents = (params) => api.get('/students/', { params })
export const getStudent = (id) => api.get(`/students/${id}`)
export const createStudent = (data) => api.post('/students/', data)
export const updateStudent = (id, data) => api.put(`/students/${id}`, data)
export const deleteStudent = (id) => api.delete(`/students/${id}`)
export const uploadStudentPhoto = (id, file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post(`/students/${id}/upload-photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const exportStudentsUrl = (params) => `${API_URL}/students/export?${new URLSearchParams(params)}`
export const exportSingleStudentUrl = (id) => `${API_URL}/students/${id}/export`

// ---- Achievements ----
export const listAchievements = (params) => api.get('/achievements/', { params })
export const createAchievement = (data) => api.post('/achievements/', data)
export const uploadCertificate = (formData) =>
  api.post('/achievements/upload-certificate', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteAchievement = (id) => api.delete(`/achievements/${id}`)
export const generateOutput = (achievementId) => api.post(`/achievements/${achievementId}/generate-output`)

// ---- Dashboard ----
export const getDashboardStats = (params) => api.get('/dashboard/stats', { params })
export const exportTopPerformersUrl = (params) => `${API_URL}/dashboard/export/top-performers?${new URLSearchParams(params)}`
export const exportParticipantsUrl = (params) => `${API_URL}/dashboard/export/participants?${new URLSearchParams(params)}`
export const exportNonParticipantsUrl = (params) => `${API_URL}/dashboard/export/non-participants?${new URLSearchParams(params)}`

// ---- Event search ----
export const searchEvents = (params) => api.get('/events/search', { params })
export const exportEventSearchUrl = (params) => `${API_URL}/events/search/export?${new URLSearchParams(params)}`

// ---- Certificates ----
export const getEligibleStudents = (params) => api.get('/certificates/eligible', { params })
export const generateCertificateFor = (studentId) => api.post(`/certificates/generate/${studentId}`)

// ---- Achievement reminders ----
export const getStudentsBelowTarget = (params) => api.get('/notifications/below-target', { params })
export const sendAchievementReminders = (params) =>
  api.post('/notifications/achievement-reminders', null, { params })

// ---- Event flyers ----
export const listEventFlyers = () => api.get('/event-flyers/')
export const uploadEventFlyer = (formData) =>
  api.post('/event-flyers/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteEventFlyer = (id) => api.delete(`/event-flyers/${id}`)

// ---- Import ----
export const importStudents = (formData) =>
  api.post('/import/students', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const API_BASE = API_URL
export const photoUrl = (photoPath) => {
  if (!photoPath) return null
  if (/^https?:\/\//i.test(photoPath)) return photoPath
  if (photoPath.startsWith('/static/')) return `${API_BASE}${photoPath}`
  const normalizedPath = photoPath.replaceAll('\\', '/')
  const marker = '/static/photos/'
  const filename = normalizedPath.includes(marker)
    ? normalizedPath.split(marker).pop()
    : normalizedPath.split('/').pop()
  return filename ? `${API_BASE}/static/photos/${filename}` : null
}
export default api
export const deleteStudentsByClass = (year, section) =>
  api.delete('/students/bulk/by-class', { params: { year, section } })
export const studentLogin = (roll_no, mobile) => api.post('/auth/student-login', { roll_no, mobile})