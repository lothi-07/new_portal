import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { login, signup, googleLogin, studentLogin } from './api'

export default function LoginPage({ onLoggedIn }) {
  const [loginType, setLoginType] = useState('staff') // 'staff' | 'student'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [rollNo, setRollNo] = useState('')
  const [mobile, setMobile] = useState('')

  // Welcome screen state for student login
  const [studentName, setStudentName] = useState('')
  const [studentData, setStudentData] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login({ email, password })
      onLoggedIn({ role: 'staff', ...res.data })
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    }
    setLoading(false)
  }

  const submitStudentLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await studentLogin(rollNo.trim().toUpperCase(), mobile)
      // Show welcome screen instead of immediately going to dashboard
      setStudentName(res.data.name || res.data.first_name || 'Student')
      setStudentData({ role: 'student', ...res.data })
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    }
    setLoading(false)
  }

  const handleStudentWelcomeComplete = () => {
    if (studentData) {
      onLoggedIn(studentData)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')
    try {
      const res = await googleLogin(credentialResponse.credential)
      onLoggedIn({ role: 'staff', ...res.data })
    } catch (err) {
      setError(err.response?.data?.detail || 'Google login failed')
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoCircle}>
            <span style={s.logoText}>ESEC</span>
          </div>
        </div>

        {/* Title */}
        <h1 style={s.title}>Achievement Portal</h1>
        <div style={s.titleUnderline} />
        <p style={s.subtitle}>ERODE SENGUNTHAR ENGINEERING COLLEGE</p>

        {/* Staff / Student toggle */}
        <div style={s.roleToggleRow}>
          <button
            type="button"
            onClick={() => { setLoginType('staff'); setError('') }}
            style={{ ...s.roleToggleBtn, ...(loginType === 'staff' ? s.roleToggleBtnActive : {}) }}
          >Staff</button>
          <button
            type="button"
            onClick={() => { setLoginType('student'); setError('') }}
            style={{ ...s.roleToggleBtn, ...(loginType === 'student' ? s.roleToggleBtnActive : {}) }}
          >Student</button>
        </div>

        {loginType === 'staff' && (
          <>
            {/* Google Sign In */}
            <div style={s.googleWrap}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed')}
                  width="280"
                />
              </div>
            </div>

            {/* Divider */}
            <div style={s.dividerRow}>
              <div style={s.dividerLine} />
              <span style={s.dividerText}>or continue with email</span>
              <div style={s.dividerLine} />
            </div>

            {/* Form */}
            <form onSubmit={submit}>
              <label style={s.label}>Email</label>
              <input
                style={s.input}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <label style={s.label}>Password</label>
              <input
                style={s.input}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />

              {error && <div style={s.error}>{error}</div>}

              <button style={s.loginBtn} disabled={loading}>
                {loading ? 'Signing in…' : 'Login'}
              </button>
            </form>
          </>
        )}

        {loginType === 'student' && !studentName && (
          <form onSubmit={submitStudentLogin}>
            <label style={s.label}>Roll Number</label>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. ES24AD62"
              value={rollNo}
              onChange={e => setRollNo(e.target.value)}
              required
            />

            <label style={s.label}>Mobile Number</label>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. Enter your mobile number"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              required
            />

            {error && <div style={s.error}>{error}</div>}

            <button style={s.loginBtn} disabled={loading}>
              {loading ? 'Signing in…' : 'View My Profile'}
            </button>
          </form>
        )}

        {loginType === 'student' && studentName && (
          <div style={s.welcomeScreen}>
            <div style={s.welcomeContent}>
              <p style={s.welcomeGreeting}>Welcome,</p>
              <h2 style={s.welcomeName}>{studentName}</h2>
              <p style={s.welcomeSubtext}>Ready to view your achievements?</p>
              <button
                style={s.welcomeBtn}
                onClick={handleStudentWelcomeComplete}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: "linear-gradient(rgba(17, 24, 39, 0.35), rgba(17, 24, 39, 0.45)), url('https://t4.ftcdn.net/jpg/16/78/99/01/360_F_1678990199_RyqypFwKeVPmYZjfecz4nLAn1Hv2t6IM.jpg') center/cover no-repeat",
    fontFamily: "'Inter', 'Poppins', sans-serif",
  },
  card: {
    background: 'rgba(38, 37, 134, 0.68)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: 24,
    padding: '40px 44px',
    width: 380,
    boxShadow: '0 25px 60px rgba(10, 6, 22, 0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
    animation: 'fadeIn 0.5s ease',
    transform: 'perspective(1000px) rotateX(1deg)',
    transition: 'transform 0.4s ease, box-shadow 0.4s ease',
  },
  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 18,
    transform: 'translateZ(20px)',
  },
  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: '50%',
    border: '2.5px solid #f6c55a',
    background: 'rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 20px -5px rgba(246,197,90,0.4)',
  },
  logoText: {
    fontWeight: 800,
    fontSize: 13,
    color: '#f6c55a',
    letterSpacing: 0.5,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 800,
    color: '#f2f6ff',
    marginBottom: 8,
    transform: 'translateZ(10px)',
  },
  titleUnderline: {
    width: 40,
    height: 2.5,
    background: '#f6c55a',
    borderRadius: 2,
    margin: '0 auto 12px',
    boxShadow: '0 2px 4px rgba(246, 197, 90, 0.5)',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 10.5,
    fontWeight: 600,
    color: '#e5ebff',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  roleToggleRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 9,
    padding: 4,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  roleToggleBtn: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    background: 'transparent',
    borderRadius: 7,
    fontWeight: 700,
    fontSize: 12.5,
    color: '#dbe2f2',
  },
  roleToggleBtnActive: {
    background: 'rgba(255,255,255,0.92)',
    color: '#1a2469',
    boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
  },
  googleWrap: {
    marginBottom: 18,
    transform: 'translateZ(15px)',
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'rgba(0,0,0,0.1)',
  },
  dividerText: {
    fontSize: 11.5,
    color: '#dfe8ff',
    whiteSpace: 'nowrap',
    fontWeight: 600,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#edf3ff',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 13px',
    marginBottom: 16,
    borderRadius: 10,
    border: '1.5px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 13.5,
    outline: 'none',
    transition: 'all 0.2s ease',
    display: 'block',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)',
  },
  loginBtn: {
    width: '100%',
    padding: '12px 0',
    background: 'linear-gradient(135deg, #f6c55a, #d9a836)',
    color: '#171c2d',
    border: 'none',
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 14.5,
    marginTop: 4,
    letterSpacing: 0.3,
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    boxShadow: '0 10px 18px rgba(246, 197, 90, 0.28)',
  },
  error: {
    color: '#ffd7d7',
    fontSize: 12.5,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 600,
    background: 'rgba(150, 30, 30, 0.32)',
    padding: 6,
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  welcomeScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  welcomeContent: {
    textAlign: 'center',
  },
  welcomeGreeting: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    margin: 0,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  welcomeName: {
    fontSize: 48,
    fontWeight: 800,
    color: '#fff',
    margin: '16px 0',
    letterSpacing: '-0.02em',
  },
  welcomeSubtext: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    margin: '12px 0 28px',
    fontWeight: 500,
  },
  welcomeBtn: {
    padding: '14px 40px',
    background: 'linear-gradient(135deg, #f6c55a, #d9a836)',
    color: '#171c2d',
    border: 'none',
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 16,
    cursor: 'pointer',
    letterSpacing: 0.3,
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    boxShadow: '0 12px 24px rgba(246, 197, 90, 0.3)',
  },
}