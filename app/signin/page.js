'use client'
import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function ParticleCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    const particles = []
    const init = () => {
      particles.length = 0
      for (let i = 0; i < 45; i++) {
        particles.push({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, vx:(Math.random()-.5)*0.25, vy:(Math.random()-.5)*0.25, r:Math.random()*1.2+0.4 })
      }
    }
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      particles.forEach((p,i) => {
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0
        if(p.y<0)p.y=canvas.height; if(p.y>canvas.height)p.y=0
        for(let j=i+1;j<particles.length;j++){
          const q=particles[j],d=Math.hypot(p.x-q.x,p.y-q.y)
          if(d<120){ ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.strokeStyle=`rgba(59,255,125,${((120-d)/120)*0.05})`; ctx.lineWidth=0.5; ctx.stroke() }
        }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fill()
      })
      raf=requestAnimationFrame(draw)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas); resize(); init(); draw()
    return ()=>{ cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}/>
}

export default function SignInPage() {
  const router = useRouter()
  const [mode,    setMode]    = useState('signin')
  const [email,   setEmail]   = useState('')
  const [password,setPass]    = useState('')
  const [name,    setName]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(()=>setMounted(true), 50) }, [])

  const handleCredentials = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    const res = await signIn('credentials', { email, password, name, mode, redirect:false })
    setLoading(false)
    if (res?.error) setError(res.error)
    else router.push('/dashboard')
  }

  const handleGoogle = async () => { setLoading(true); await signIn('google', { callbackUrl:'/dashboard' }) }

  return (
    <div style={{ minHeight:'100vh', background:'#050508', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter', -apple-system, sans-serif", position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .si-inp:focus { border-color: rgba(59,255,125,0.4) !important; box-shadow: 0 0 0 3px rgba(59,255,125,0.08), 0 0 16px rgba(59,255,125,0.06) !important; outline: none; }
        .google-btn:hover { background: #f1f5f9 !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important; }
        .si-submit:hover { transform: translateY(-1px); box-shadow: 0 0 28px rgba(37,99,235,0.5) !important; }
        .si-toggle:hover { color: #93C5FD !important; }
        @media(max-width:480px){ .si-card{width:95vw!important;padding:32px 24px!important;border-radius:20px!important;} }
      `}</style>

      <ParticleCanvas/>

      {/* Radial glow */}
      <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)', width:500, height:500, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(59,255,125,0.025) 0%, transparent 65%)', pointerEvents:'none' }}/>

      {/* Card */}
      <div className="si-card" style={{
        position:'relative', zIndex:1,
        background:'rgba(255,255,255,0.035)', backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
        border:'1px solid rgba(255,255,255,0.08)', borderRadius:24,
        padding:'44px 40px', width:420, display:'flex', flexDirection:'column', alignItems:'center',
        boxShadow:'0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Top accent */}
        <div style={{ position:'absolute', top:0, insetInline:0, height:1, background:'linear-gradient(90deg, transparent, rgba(59,255,125,0.4), transparent)', borderRadius:'24px 24px 0 0' }}/>

        {/* Logo */}
        <div style={{ marginBottom:28 }}>
          <img src="/logo.png" alt="ICVY" style={{ height:36, width:'auto', objectFit:'contain' }}/>
        </div>

        <h1 style={{ color:'#fff', fontSize:22, fontWeight:700, letterSpacing:'-0.025em', margin:'0 0 8px', textAlign:'center' }}>
          {mode==='signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, margin:'0 0 28px', textAlign:'center', lineHeight:1.6 }}>
          {mode==='signin' ? 'Sign in to access your resumes' : 'Start building your perfect resume today'}
        </p>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading} className="google-btn" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, width:'100%', background:'#fff', color:'#1a1a1a', border:'none', borderRadius:12, padding:'12px 20px', fontSize:14, fontWeight:600, cursor:'pointer', transition:'all 0.18s ease', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(0,0,0,0.3)', marginBottom:20 }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, width:'100%', marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }}/>
          <span style={{ color:'rgba(255,255,255,0.2)', fontSize:11, fontWeight:500 }}>or</span>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }}/>
        </div>

        {/* Form */}
        <form onSubmit={handleCredentials} style={{ width:'100%', display:'flex', flexDirection:'column', gap:14 }}>
          {mode==='signup' && (
            <div>
              <label style={{ display:'block', color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:600, marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase' }}>Full Name</label>
              <input className="si-inp" style={inpStyle} type="text" placeholder="John Smith" value={name} onChange={e=>setName(e.target.value)} required/>
            </div>
          )}
          <div>
            <label style={{ display:'block', color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:600, marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase' }}>Email</label>
            <input className="si-inp" style={inpStyle} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>
          <div>
            <label style={{ display:'block', color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:600, marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase' }}>Password</label>
            <input className="si-inp" style={inpStyle} type="password" placeholder="••••••••" value={password} onChange={e=>setPass(e.target.value)} required minLength={6}/>
          </div>

          {error && (
            <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:9, color:'#FCA5A5', fontSize:13, padding:'10px 13px' }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="si-submit" style={{ width:'100%', background:'#2563EB', color:'#fff', border:'none', borderRadius:12, padding:'13px', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.18s ease', fontFamily:'inherit', boxShadow:'0 0 20px rgba(37,99,235,0.35)', marginTop:4, opacity:loading?0.7:1 }}>
            {loading ? '...' : mode==='signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13, marginTop:22, textAlign:'center' }}>
          {mode==='signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={()=>{setMode(mode==='signin'?'signup':'signin');setError('')}} className="si-toggle" style={{ background:'transparent', border:'none', color:'#60A5FA', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', transition:'color 0.15s' }}>
            {mode==='signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

const inpStyle = {
  width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
  borderRadius:10, color:'#fff', padding:'11px 14px', fontSize:14,
  fontFamily:'inherit', transition:'all 0.2s ease',
}