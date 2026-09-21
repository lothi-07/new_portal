import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { login, signup, googleLogin, studentLogin } from './api'

export default function LoginPage({ onLoggedIn }) {
  const [loginType, setLoginType] = useState('student') // 'staff' | 'student'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [signupName, setSignupName] = useState('')

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
      onLoggedIn(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please verify your email and password.')
    } finally {
      setLoading(false)
    }
  }

  const submitSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signup({ name: signupName, email, password })
      onLoggedIn(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create staff account. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  const submitStudentLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await studentLogin(rollNo.trim().toUpperCase(), mobile.trim())
      setStudentName(res.data.name || res.data.first_name || 'Student')
      setStudentData({ role: 'student', ...res.data })
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your Roll Number and registered Mobile Number.')
    } finally {
      setLoading(false)
    }
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
      onLoggedIn(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Google authentication failed.')
    }
  }

  // ── Student Welcome Celebratory Screen ──
  if (loginType === 'student' && studentName) {
    return (
      <div style={s.welcomePage}>
        <div style={s.welcomeCard}>
          <div style={s.welcomeBadge}>
            <span style={s.welcomeBadgeIcon}>✓</span>
            <span>Identity Verified</span>
          </div>

          <div style={s.trophyWrap}>
            <div style={s.trophyGlow} />
            <div style={s.trophyIcon}>🏆</div>
          </div>

          <div style={s.welcomeEyebrow}>Welcome to ESEC Achievement Portal</div>
          <h1 style={s.welcomeStudentName}>{studentName}</h1>
          <p style={s.welcomeSubtext}>
            Your academic records, participation history, and official certificates are synchronized and ready.
          </p>

          <div style={s.welcomeMetaRow}>
            <div style={s.welcomeMetaItem}>
              <span style={s.welcomeMetaLabel}>Roll No</span>
              <strong style={s.welcomeMetaValue}>{studentData?.roll_no || rollNo.toUpperCase()}</strong>
            </div>
            <div style={s.welcomeMetaDivider} />
            <div style={s.welcomeMetaItem}>
              <span style={s.welcomeMetaLabel}>Section</span>
              <strong style={s.welcomeMetaValue}>{studentData?.year || '—'} Year / {studentData?.section || '—'}</strong>
            </div>
            <div style={s.welcomeMetaDivider} />
            <div style={s.welcomeMetaItem}>
              <span style={s.welcomeMetaLabel}>Status</span>
              <strong style={{ ...s.welcomeMetaValue, color: '#10b981' }}>Active Scholar</strong>
            </div>
          </div>

          <button style={s.welcomeEnterBtn} onClick={handleStudentWelcomeComplete}>
            <span>Enter Your Dashboard</span>
            <span style={s.btnArrow}>→</span>
          </button>

          <div style={s.welcomeFooterText}>
            ERODE SENGUNTHAR ENGINEERING COLLEGE (AUTONOMOUS)
          </div>
        </div>
      </div>
    )
  }

  // ── Main Split-Screen Login ──
  return (
    <div style={s.page}>
      {/* Top institution banner */}
      <header style={s.header}>
        <div style={s.headerBrand}>
          <div style={s.headerLogo}>ESEC</div>
          <div>
            <div style={s.headerTitle}>ERODE SENGUNTHAR ENGINEERING COLLEGE</div>
            <div style={s.headerSubtitle}>Autonomous Institution • Affiliated to Anna University • Approved by AICTE</div>
          </div>
        </div>
        <div style={s.headerRightTag}>
          <span style={s.tagDot} />
          Student Achievement & Records Portal
        </div>
      </header>

      {/* Main Login Grid */}
      <main style={s.mainGrid}>
        {/* Left: Showcase & Value Prop */}
        <section style={s.showcaseSection}>
          <div style={s.showcasePill}>
            <span style={s.pillStar}>★</span>
            <span>Official Campus Milestone Tracker</span>
          </div>

          <h1 style={s.showcaseHeading}>
            Every milestone <br />
            <span style={s.highlightHeading}>has a legacy.</span>
          </h1>

          <p style={s.showcaseDesc}>
            A centralized, trusted platform to archive student participation in symposiums, hackathons, sports, paper presentations, and co-curricular achievements.
          </p>

          <div style={s.featureGrid}>
            <div style={s.featureCard}>
              <div style={s.featureIcon}>📜</div>
              <div>
                <h4 style={s.featureTitle}>Digital Certificates</h4>
                <p style={s.featureText}>Instant automated certificate generation with verifiable records.</p>
              </div>
            </div>

            <div style={s.featureCard}>
              <div style={s.featureIcon}>⚡</div>
              <div>
                <h4 style={s.featureTitle}>Event Flyers & QR Scan</h4>
                <p style={s.featureText}>Discover upcoming intra & inter-collegiate academic competitions.</p>
              </div>
            </div>

            <div style={s.featureCard}>
              <div style={s.featureIcon}>🏅</div>
              <div>
                <h4 style={s.featureTitle}>Prestige Leaderboard</h4>
                <p style={s.featureText}>Earn XP points, unlock milestone badges, and inspire peers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Modern Form Card */}
        <section style={s.formSection}>
          <div style={s.loginCard}>
            <div style={s.cardHeader}>
              <div style={s.cardBadge}>
                {loginType === 'student' ? 'STUDENT ACCESS' : showSignup ? 'STAFF REGISTRATION' : 'STAFF ACCESS'}
              </div>
              <h2 style={s.cardHeading}>
                {loginType === 'student' ? 'Student Sign In' : showSignup ? 'Create Staff Account' : 'Staff Sign In'}
              </h2>
              <p style={s.cardDesc}>
                {loginType === 'student'
                  ? 'Enter your institutional Roll Number and registered Mobile Number.'
                  : showSignup
                  ? 'Register with your college email to manage events and student records.'
                  : 'Access the administrative and event management panel.'}
              </p>
            </div>

            {/* Role Switcher */}
            <div style={s.roleSwitcher}>
              <button
                type="button"
                onClick={() => { setLoginType('student'); setShowSignup(false); setError('') }}
                style={{ ...s.roleBtn, ...(loginType === 'student' ? s.roleBtnActive : {}) }}
              >
                🎓 Student Portal
              </button>
              <button
                type="button"
                onClick={() => { setLoginType('staff'); setShowSignup(false); setError('') }}
                style={{ ...s.roleBtn, ...(loginType === 'staff' ? s.roleBtnActive : {}) }}
              >
                💼 Faculty & Admin
              </button>
            </div>

            {/* Form Area */}
            {loginType === 'student' ? (
              <form onSubmit={submitStudentLogin} style={s.form}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Roll Number</label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="e.g. 21CS045"
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value)}
                    required
                  />
                </div>

                <div style={s.inputGroup}>
                  <label style={s.label}>Registered Mobile Number</label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    required
                  />
                </div>

                {error && <div style={s.errorAlert}>{error}</div>}

                <button type="submit" style={s.submitBtn} disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign in to Student Portal →'}
                </button>
              </form>
            ) : (
              <div>
                {!showSignup && (
                  <>
                    <div style={s.googleWrapper}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google sign in failed')}
                        theme="outline"
                        size="large"
                        width="100%"
                      />
                    </div>
                    <div style={s.divider}>
                      <div style={s.dividerLine} />
                      <span style={s.dividerText}>OR SIGN IN WITH PASSWORD</span>
                      <div style={s.dividerLine} />
                    </div>
                  </>
                )}

                <form onSubmit={showSignup ? submitSignup : submit} style={s.form}>
                  {showSignup && (
                    <div style={s.inputGroup}>
                      <label style={s.label}>Full Name</label>
                      <input
                        style={s.input}
                        type="text"
                        placeholder="Dr. / Prof. / Mr. Name"
                        value={signupName}
                        onChange={e => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div style={s.inputGroup}>
                    <label style={s.label}>Campus Email Address</label>
                    <input
                      style={s.input}
                      type="email"
                      placeholder="faculty@esec.ac.in"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div style={s.inputGroup}>
                    <label style={s.label}>Password</label>
                    <input
                      style={s.input}
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>

                  {error && <div style={s.errorAlert}>{error}</div>}

                  <button type="submit" style={s.submitBtn} disabled={loading}>
                    {loading
                      ? (showSignup ? 'Creating Account...' : 'Authenticating...')
                      : (showSignup ? 'Create Staff Account →' : 'Sign in to Admin Portal →')}
                  </button>
                </form>

                <div style={s.cardFooter}>
                  {showSignup ? (
                    <p style={s.footerText}>
                      Already have an account?{' '}
                      <button
                        type="button"
                        style={s.toggleLink}
                        onClick={() => { setShowSignup(false); setError('') }}
                      >
                        Sign In
                      </button>
                    </p>
                  ) : (
                    <p style={s.footerText}>
                      Need a new staff account?{' '}
                      <button
                        type="button"
                        style={s.toggleLink}
                        onClick={() => { setEmail(''); setPassword(''); setSignupName(''); setShowSignup(true); setError('') }}
                      >
                        Register
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

/* ── Modern Styles ── */
const s = {
  page: {
    minHeight: '100vh',
    background: '#0b132b',
    backgroundImage: `
      radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.18) 0%, transparent 40%),
      radial-gradient(circle at 90% 80%, rgba(245, 158, 11, 0.12) 0%, transparent 40%),
      linear-gradient(180deg, #0b132b 0%, #0f172a 100%)
    `,
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  header: {
    height: 76,
    padding: '0 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(10px)',
  },
  headerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  headerLogo: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 0.5,
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.04em',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  headerRightTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
    padding: '6px 14px',
    fontSize: 11.5,
    color: '#93c5fd',
    fontWeight: 600,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#38bdf8',
    boxShadow: '0 0 8px #38bdf8',
  },

  /* Main Grid */
  mainGrid: {
    flex: 1,
    maxWidth: 1240,
    width: '100%',
    margin: '0 auto',
    padding: '40px 28px 60px',
    display: 'grid',
    gridTemplateColumns: '1.15fr 460px',
    gap: 56,
    alignItems: 'center',
  },

  /* Left Showcase */
  showcaseSection: {
    paddingRight: 10,
  },
  showcasePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    borderRadius: 999,
    background: 'rgba(37, 99, 235, 0.15)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 24,
  },
  pillStar: {
    color: '#fbbf24',
    fontSize: 13,
  },
  showcaseHeading: {
    fontSize: 'clamp(2.5rem, 4.5vw, 3.8rem)',
    fontWeight: 800,
    color: '#ffffff',
    lineHeight: 1.12,
    letterSpacing: '-0.03em',
    margin: '0 0 20px',
  },
  highlightHeading: {
    background: 'linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  showcaseDesc: {
    fontSize: 15.5,
    color: '#94a3b8',
    lineHeight: 1.7,
    maxWidth: 540,
    margin: '0 0 36px',
  },
  featureGrid: {
    display: 'grid',
    gap: 14,
    maxWidth: 520,
  },
  featureCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '14px 18px',
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'transform 0.2s ease, background 0.2s ease',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'rgba(37, 99, 235, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
  },
  featureTitle: {
    margin: '0 0 2px',
    fontSize: 14,
    fontWeight: 700,
    color: '#f8fafc',
  },
  featureText: {
    margin: 0,
    fontSize: 12.5,
    color: '#94a3b8',
    lineHeight: 1.4,
  },

  /* Right Form Section */
  formSection: {
    display: 'flex',
    justifyContent: 'center',
  },
  loginCard: {
    width: '100%',
    background: '#ffffff',
    color: '#0f172a',
    borderRadius: 22,
    padding: '34px 32px',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardBadge: {
    display: 'inline-block',
    fontSize: 10.5,
    fontWeight: 800,
    color: '#2563eb',
    background: '#eff6ff',
    padding: '4px 10px',
    borderRadius: 6,
    letterSpacing: '0.06em',
    marginBottom: 8,
  },
  cardHeading: {
    fontSize: 22,
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    margin: '0 0 6px',
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 1.45,
    margin: 0,
  },

  /* Role Switcher */
  roleSwitcher: {
    display: 'flex',
    gap: 6,
    background: '#f1f5f9',
    padding: 4,
    borderRadius: 10,
    marginBottom: 22,
    border: '1px solid #e2e8f0',
  },
  roleBtn: {
    flex: 1,
    padding: '9px 0',
    border: 'none',
    background: 'transparent',
    borderRadius: 8,
    color: '#64748b',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  roleBtnActive: {
    background: '#ffffff',
    color: '#0f172a',
    fontWeight: 700,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
  },

  /* Form */
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12.5,
    fontWeight: 700,
    color: '#334155',
  },
  input: {
    padding: '11px 14px',
    borderRadius: 10,
    border: '1.5px solid #cbd5e1',
    background: '#f8fafc',
    color: '#0f172a',
    fontSize: 13.5,
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  submitBtn: {
    marginTop: 4,
    padding: '12px 18px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  errorAlert: {
    padding: '10px 14px',
    borderRadius: 8,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: 12.5,
    fontWeight: 600,
    textAlign: 'center',
  },
  googleWrapper: {
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'center',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '18px 0',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#e2e8f0',
  },
  dividerText: {
    fontSize: 10.5,
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.06em',
  },
  cardFooter: {
    marginTop: 18,
    textAlign: 'center',
  },
  footerText: {
    margin: 0,
    fontSize: 12.5,
    color: '#64748b',
  },
  toggleLink: {
    background: 'transparent',
    border: 'none',
    color: '#2563eb',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 'inherit',
    padding: 0,
    textDecoration: 'underline',
  },

  /* Welcome Screen */
  welcomePage: {
    minHeight: '100vh',
    background: '#0b132b',
    backgroundImage: `
      radial-gradient(circle at 50% 30%, rgba(37, 99, 235, 0.25) 0%, transparent 60%),
      radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.15) 0%, transparent 50%),
      linear-gradient(180deg, #0b132b 0%, #0f172a 100%)
    `,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  welcomeCard: {
    width: '100%',
    maxWidth: 580,
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 28,
    padding: '44px 40px',
    boxShadow: '0 30px 70px rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
    animation: 'scaleUp 0.3s ease',
  },
  welcomeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: 999,
    padding: '6px 16px',
    color: '#34d399',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.04em',
    marginBottom: 24,
  },
  welcomeBadgeIcon: {
    fontWeight: 900,
  },
  trophyWrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  trophyGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
    animation: 'pulseGlow 3s infinite ease-in-out',
  },
  trophyIcon: {
    fontSize: 54,
    position: 'relative',
    zIndex: 2,
  },
  welcomeEyebrow: {
    fontSize: 12,
    fontWeight: 700,
    color: '#93c5fd',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  welcomeStudentName: {
    fontSize: 'clamp(2rem, 4vw, 2.8rem)',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.025em',
    margin: '0 0 14px',
  },
  welcomeSubtext: {
    fontSize: 14.5,
    color: '#94a3b8',
    lineHeight: 1.6,
    maxWidth: 440,
    margin: '0 auto 28px',
  },
  welcomeMetaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: '14px 20px',
    marginBottom: 30,
  },
  welcomeMetaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  welcomeMetaLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  welcomeMetaValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#f8fafc',
  },
  welcomeMetaDivider: {
    width: 1,
    height: 28,
    background: 'rgba(255, 255, 255, 0.1)',
  },
  welcomeEnterBtn: {
    width: '100%',
    padding: '14px 24px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.01em',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  btnArrow: {
    fontSize: 18,
    fontWeight: 700,
    transition: 'transform 0.15s ease',
  },
  welcomeFooterText: {
    marginTop: 22,
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: '0.1em',
  },
}