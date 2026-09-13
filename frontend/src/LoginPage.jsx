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
      setError(err.response?.data?.detail || 'Invalid credentials')
    }

    setLoading(false)
  }

  const submitSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signup({ name: signupName, email, password })
      onLoggedIn(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create account')
    } finally {
      setLoading(false)
    }
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
      onLoggedIn(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Google login failed')
    }
  }

  if (loginType === 'student' && studentName) {
    return (
      <div style={s.welcomePage}>
        <header style={s.welcomeHeader}>
          <Brand light />
          <button type="button" style={s.signOutBtn} onClick={() => { setStudentName(''); setStudentData(null) }}>
            Sign out
          </button>
        </header>
        <main style={s.welcomeMain}>
          <p style={s.welcomeEyebrow}>Identity verified - You&apos;re in</p>
          <h1 style={s.welcomeTitle}>Welcome <span>{studentName}</span></h1>
          <p style={s.welcomeSubtextNew}>Your achievement trail is ready. Continue to<br />your personal campus noticeboard.</p>
          <button style={s.welcomeBtnNew} onClick={handleStudentWelcomeComplete}>Enter dashboard &nbsp; -&gt;</button>
          <div style={s.welcomeFooter}>ESEC STUDENT PORTAL</div>
        </main>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <header style={s.header}><Brand /><span style={s.headerHint}>Your achievements, beautifully organized</span></header>
      <main style={s.loginLayout}>
        <section style={s.intro}>
          <div style={s.introPill}>* &nbsp; Your achievements, beautifully organized</div>
          <h1 style={s.introTitle}>Every milestone<br />has a story.</h1>
          <p style={s.introText}>Keep your student profile, participation history, certificates, and campus opportunities together in one trusted noticeboard.</p>
        </section>

        <section style={s.loginCard}>
        <p style={s.cardEyebrow}>{loginType === 'student' ? 'Student sign in' : showSignup ? 'Staff registration' : 'Staff sign in'}</p>
        <h2 style={s.cardTitle}>{showSignup ? 'Create your account' : 'Welcome back'}</h2>
        <p style={s.cardSubtitle}>{showSignup ? 'Create a staff account to manage event flyers and view the top students.' : 'Use your campus details to enter the portal.'}</p>
          <div style={s.loginRoleToggleRow}>
            <button type="button" onClick={() => { setLoginType('student'); setShowSignup(false); setError('') }} style={{ ...s.loginRoleToggleBtn, ...(loginType === 'student' ? s.loginRoleToggleBtnActive : {}) }}>Student</button>
            <button type="button" onClick={() => { setLoginType('staff'); setShowSignup(false); setError('') }} style={{ ...s.loginRoleToggleBtn, ...(loginType === 'staff' ? s.loginRoleToggleBtnActive : {}) }}>Staff</button>
          </div>

          {loginType === 'staff' ? (
            <>
              {!showSignup && <><div style={s.loginGoogleWrap}><GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google login failed')} width="280" /></div>
              <div style={s.loginDividerRow}><div style={s.loginDividerLine} /><span style={s.loginDividerText}>OR CONTINUE WITH</span><div style={s.loginDividerLine} /></div></>}
              <form onSubmit={showSignup ? submitSignup : submit}>
                {showSignup && <><label style={s.loginLabel}>Your name</label><input style={s.loginInput} type="text" value={signupName} onChange={e => setSignupName(e.target.value)} required /></>}
                <label style={s.loginLabel}>Campus email</label><input style={s.loginInput} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <label style={s.loginLabel}>Password</label><input style={s.loginInput} type="password" value={password} onChange={e => setPassword(e.target.value)} minLength="6" required />
                {error && <div style={s.loginError}>{error}</div>}
                <button style={s.loginSubmit} disabled={loading}>{loading ? (showSignup ? 'Creating...' : 'Signing in...') : (showSignup ? 'Create staff account  ->' : 'Sign in to portal  ->')}</button>
              </form>
              {showSignup && <button type="button" style={s.accountLink} onClick={() => { setShowSignup(false); setError('') }}>Already have an account? Sign in</button>}
            </>
          ) : (
            <form onSubmit={submitStudentLogin}>
              <label style={s.loginLabel}>Roll number</label>
              <input style={s.loginInput} type="text" placeholder="e.g. ES24AD62" value={rollNo} onChange={e => setRollNo(e.target.value)} required />
              <label style={s.loginLabel}>Mobile number</label>
              <input style={s.loginInput} type="text" placeholder="Enter your mobile number" value={mobile} onChange={e => setMobile(e.target.value)} required />
              {error && <div style={s.loginError}>{error}</div>}
              <button style={s.loginSubmit} disabled={loading}>{loading ? 'Signing in...' : 'Sign in to portal  ->'}</button>
            </form>
          )}
          {loginType === 'staff' && !showSignup && <p style={s.cardFoot}>New staff member? <button type="button" style={s.accountLink} onClick={() => { setEmail(''); setPassword(''); setSignupName(''); setShowSignup(true); setError('') }}>Create an account</button></p>}
        </section>
      </main>
    </div>
  )
}

function Brand({ light = false }) {
  return (
    <div style={light ? s.welcomeBrand : s.brand}>
      <div style={light ? s.welcomeLogoCircle : s.loginLogoCircle}>ES</div>
      <div>
        <div style={light ? s.welcomeBrandName : s.brandName}>Achievement Portal</div>
        <div style={light ? s.welcomeBrandSub : s.brandSub}>ERODE SENGUNTHAR ENGINEERING COLLEGE</div>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    background: 'linear-gradient(135deg, #f7f0df 0%, #fffaf0 55%, #f5ead8 100%)',
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
    color: '#063e4b',
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
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 94, padding: '0 max(28px, calc((100% - 1240px) / 2))',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e6dece',
    background: 'rgba(255, 250, 237, 0.82)', zIndex: 2,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12 },
  welcomeBrand: { display: 'flex', alignItems: 'center', gap: 12, color: '#fff' },
  brandName: { color: '#0d4d5d', fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 18, fontWeight: 700 },
  welcomeBrandName: { color: '#fff', fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 18, fontWeight: 700 },
  brandSub: { color: '#0d4d5d', fontSize: 9, letterSpacing: '0.2em', marginTop: 4 },
  welcomeBrandSub: { color: '#d9f3f7', fontSize: 9, letterSpacing: '0.2em', marginTop: 4 },
  headerHint: { color: '#78949a', fontSize: 12 },
  loginLayout: { width: '100%', maxWidth: 1240, margin: '94px auto 0', padding: '70px 28px', display: 'grid', gridTemplateColumns: '1fr 440px', gap: 80, alignItems: 'center' },
  intro: { paddingBottom: 22 },
  introPill: { display: 'inline-block', padding: '7px 14px', borderRadius: 999, color: '#0d4d5d', background: 'rgba(13, 77, 93, 0.08)', fontSize: 11, fontWeight: 700 },
  introTitle: { margin: '32px 0 22px', color: '#0d4d5d', fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 'clamp(3rem, 6vw, 5rem)', lineHeight: 0.98, letterSpacing: '-0.06em' },
  introText: { maxWidth: 520, color: '#52727a', fontSize: 16, lineHeight: 1.75 },
  introPoints: { display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 34, color: '#39727a', fontSize: 12 },
  loginCard: { width: '100%', padding: 32, borderRadius: 24, background: '#fffdf8', border: '1px solid #e4dccd', boxShadow: '0 18px 45px rgba(23,62,62,0.11)' },
  cardEyebrow: { margin: 0, color: '#0d4d5d', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 },
  cardTitle: { margin: '12px 0 8px', color: '#0d4d5d', fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 30 },
  cardSubtitle: { margin: 0, color: '#78949a', fontSize: 13, lineHeight: 1.5 },
  loginLogoCircle: { width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 15, background: '#0d4d5d', color: '#fff', fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 17, fontWeight: 800 },
  welcomeLogoCircle: { width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#0d4d5d', color: '#fff', fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 17, fontWeight: 800 },
  loginRoleToggleRow: { margin: '22px 0', padding: 4, display: 'flex', gap: 4, borderRadius: 10, background: '#f4efe4' },
  loginRoleToggleBtn: { flex: 1, padding: '9px 0', border: 0, borderRadius: 7, background: 'transparent', color: '#78949a', fontSize: 12, fontWeight: 700 },
  loginRoleToggleBtnActive: { background: '#0d4d5d', color: '#fff' },
  loginGoogleWrap: { display: 'flex', justifyContent: 'center', margin: '18px 0' },
  loginDividerRow: { display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0', color: '#a3b4b5' },
  loginDividerLine: { flex: 1, height: 1, background: '#e0e4dc' },
  loginDividerText: { fontSize: 9, letterSpacing: '0.15em', whiteSpace: 'nowrap' },
  loginLabel: { display: 'block', margin: '0 0 7px', color: '#426770', fontSize: 11, fontWeight: 700 },
  loginInput: { width: '100%', padding: '13px 14px', marginBottom: 16, border: '1px solid #dce2d9', borderRadius: 10, background: '#fffefa', color: '#0d4d5d', fontSize: 13, outline: 'none' },
  loginSubmit: { width: '100%', padding: '13px 16px', border: 0, borderRadius: 10, background: '#0d4d5d', color: '#fff', fontSize: 13, fontWeight: 700 },
  loginError: { marginBottom: 12, padding: 8, borderRadius: 8, color: '#a33d3d', background: '#fff0ed', fontSize: 12, textAlign: 'center' },
  cardFoot: { margin: '20px 0 0', color: '#78949a', fontSize: 11, textAlign: 'center' },
  accountLink: { border: 0, padding: 0, background: 'transparent', color: '#0d6878', fontWeight: 700, cursor: 'pointer', fontSize: 'inherit' },
  'cardFoot span': { color: '#0d4d5d', fontWeight: 700 },
  welcomePage: { minHeight: '100vh', color: '#fff', background: 'linear-gradient(135deg, #0d4d5d 0%, #0f5b67 100%)' },
  welcomeHeader: { height: 94, padding: '0 max(28px, calc((100% - 1240px) / 2))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  signOutBtn: { padding: '9px 18px', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999, background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 600 },
  welcomeMain: { minHeight: 'calc(100vh - 94px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px 20px 70px' },
  checkCircle: { width: 72, height: 72, display: 'grid', placeItems: 'center', marginBottom: 28, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, background: '#0b5b69', color: '#fff', fontSize: 36, fontWeight: 700 },
  welcomeEyebrow: { margin: 0, color: '#d7f3f7', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700 },
  welcomeTitle: { margin: '26px 0 22px', color: '#fff', fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 'clamp(4rem, 9vw, 12rem)', lineHeight: 0.88, letterSpacing: '-0.06em' },
  'welcomeTitle span': { display: 'inline-block', padding: '0.02em 0.22em', borderRadius: 14, background: '#0c5f7e', color: '#fff', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' },
  welcomeSubtextNew: { margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.9 },
  welcomeBtnNew: { marginTop: 34, padding: '14px 28px', border: 0, borderRadius: 999, background: '#f5f1ea', color: '#0d4d5d', fontSize: 13, fontWeight: 700 },
  welcomeFooter: { position: 'absolute', bottom: 48, color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: '0.35em' },
}