'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function ReadyCVLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#2563EB" fillOpacity="0.15" />
      <rect x="7" y="9"  width="11" height="1.7" rx="0.85" fill="#2563EB" />
      <rect x="7" y="13" width="18" height="1.7" rx="0.85" fill="#2563EB" />
      <rect x="7" y="17" width="14" height="1.7" rx="0.85" fill="#2563EB" />
      <rect x="7" y="21" width="9"  height="1.7" rx="0.85" fill="#2563EB" />
      <circle cx="24" cy="10" r="4" fill="#2563EB" />
      <path d="M22 10l1.5 1.5L26.5 8" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function SignInPage() {
  const router   = useRouter()
  const [mode,   setMode]   = useState('signin') // 'signin' | 'signup'
  const [email,  setEmail]  = useState('')
  const [password,setPass]  = useState('')
  const [name,   setName]   = useState('')
  const [error,  setError]  = useState('')
  const [loading,setLoading]= useState(false)

  const handleCredentials = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await signIn('credentials', {
      email, password, name,
      mode,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError(res.error)
    } else {
      router.push('/dashboard')
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div style={S.bg}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .card { animation: fadeUp 0.5s ease both; }
        .inp:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important; outline: none; }
        .google-btn:hover { background: #f1f5f9 !important; transform: translateY(-1px); }
        .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(37,99,235,0.4) !important; }
        .toggle:hover { color: #93c5fd !important; }
      `}</style>

      {/* Background grid pattern */}
      <div style={S.grid}/>

      <div style={S.card} className="card">
        {/* Logo */}
        <div style={S.logoRow}>
          <ReadyCVLogo size={36}/>
          <span style={S.logoText}>readyCV</span>
        </div>

        {/* Heading */}
        <h1 style={S.heading}>
          {mode==='signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={S.sub}>
          {mode==='signin'
            ? 'Sign in to access your resumes'
            : 'Start building your perfect resume today'}
        </p>

        {/* Google button */}
        <button onClick={handleGoogle} disabled={loading} style={S.googleBtn} className="google-btn">
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={S.dividerRow}>
          <div style={S.dividerLine}/>
          <span style={S.dividerText}>or</span>
          <div style={S.dividerLine}/>
        </div>

        {/* Form */}
        <form onSubmit={handleCredentials} style={{width:'100%'}}>
          {mode==='signup' && (
            <div style={S.field}>
              <label style={S.label}>Full Name</label>
              <input className="inp" style={S.inp} type="text" placeholder="John Smith"
                value={name} onChange={e=>setName(e.target.value)} required/>
            </div>
          )}
          <div style={S.field}>
            <label style={S.label}>Email</label>
            <input className="inp" style={S.inp} type="email" placeholder="you@example.com"
              value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>
          <div style={S.field}>
            <label style={S.label}>Password</label>
            <input className="inp" style={S.inp} type="password" placeholder="••••••••"
              value={password} onChange={e=>setPass(e.target.value)} required minLength={6}/>
          </div>

          {error && <div style={S.error}>⚠ {error}</div>}

          <button type="submit" disabled={loading} style={S.submitBtn} className="submit-btn">
            {loading ? '...' : mode==='signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle */}
        <p style={S.toggleText}>
          {mode==='signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={()=>{ setMode(mode==='signin'?'signup':'signin'); setError('') }}
            style={S.toggleBtn} className="toggle">
            {mode==='signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

const S = {
  bg: {
    minHeight: '100vh',
    background: '#080f1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: '44px 40px',
    width: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
    boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28,
  },
  logoText: {
    color: '#f1f5f9', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em',
  },
  heading: {
    color: '#f1f5f9', fontSize: 24, fontWeight: 700,
    letterSpacing: '-0.02em', margin: '0 0 8px', textAlign: 'center',
  },
  sub: {
    color: '#64748b', fontSize: 14, margin: '0 0 28px',
    textAlign: 'center', lineHeight: 1.6,
  },
  googleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, width: '100%', background: '#fff', color: '#1a1a1a',
    border: 'none', borderRadius: 12, padding: '12px 20px',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s ease', fontFamily: "'Inter', sans-serif",
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  dividerRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', margin: '20px 0',
  },
  dividerLine: {
    flex: 1, height: 1, background: 'rgba(255,255,255,0.06)',
  },
  dividerText: {
    color: '#475569', fontSize: 12, fontWeight: 500,
  },
  field: { width: '100%', marginBottom: 14 },
  label: {
    display: 'block', color: '#94a3b8', fontSize: 12,
    fontWeight: 500, marginBottom: 6, letterSpacing: '0.02em',
  },
  inp: {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
    color: '#f1f5f9', padding: '11px 14px', fontSize: 14,
    fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
  },
  error: {
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 8, color: '#fca5a5', fontSize: 13, padding: '10px 12px',
    marginBottom: 14, width: '100%',
  },
  submitBtn: {
    width: '100%', background: '#2563eb', color: '#fff', border: 'none',
    borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s ease',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 16px rgba(37,99,235,0.3)', marginTop: 4,
  },
  toggleText: {
    color: '#475569', fontSize: 13, marginTop: 22, textAlign: 'center',
  },
  toggleBtn: {
    background: 'transparent', border: 'none', color: '#60a5fa',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    fontFamily: "'Inter', sans-serif", transition: 'color 0.15s',
  },
}