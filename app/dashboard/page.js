'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const TEMPLATE_LABELS = { sidebar:'Sidebar', executive:'Executive', heritage:'Heritage' }
const REQUIRED_KEYS   = ['name','email','phone','title','summary','location','linkedin','dob']
const REQUIRED_ARRS   = ['experience','education','skills']

function calcCompletion(data) {
  if (!data) return 0
  const total   = REQUIRED_KEYS.length + REQUIRED_ARRS.length
  const present = [
    ...REQUIRED_KEYS.map(k => data[k]&&data[k].toString().trim() ? 1 : 0),
    ...REQUIRED_ARRS.map(k => data[k]&&data[k].length>0 ? 1 : 0),
  ].reduce((a,b)=>a+b,0)
  return Math.round((present/total)*100)
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const normalized = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z'
  const diff  = Date.now() - new Date(normalized).getTime()
  const mins  = Math.floor(diff/60000)
  const hours = Math.floor(diff/3600000)
  const days  = Math.floor(diff/86400000)
  if (mins<1)   return 'Just now'
  if (mins<60)  return `${mins}m ago`
  if (hours<24) return `${hours}h ago`
  if (days<7)   return `${days}d ago`
  return new Date(normalized).toLocaleDateString('en-US',{month:'short',day:'numeric'})
}

function CompletionRing({ pct }) {
  const r = 15, circ = 2 * Math.PI * r
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => { const t = setTimeout(()=>setDisplayed(pct), 200); return ()=>clearTimeout(t) }, [pct])
  const dash  = (displayed/100) * circ
  const color = pct===100 ? '#3BFF7D' : pct>=60 ? '#F59E0B' : '#EF4444'
  return (
    <svg width="38" height="38" viewBox="0 0 38 38">
      <circle cx="19" cy="19" r={r} fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
      <circle cx="19" cy="19" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 19 19)" style={{transition:'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)'}}
        filter={pct===100 ? `drop-shadow(0 0 4px ${color})` : undefined}/>
      <text x="19" y="23" textAnchor="middle" fill={color} fontSize="8.5" fontWeight="700" fontFamily="Inter,sans-serif">{pct}%</text>
    </svg>
  )
}

function InlineRename({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  const inputRef = useRef(null)
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  const save = () => {
    setEditing(false)
    if (val.trim() && val.trim() !== value) onSave(val.trim())
    else setVal(value)
  }
  if (editing) return (
    <input ref={inputRef} value={val} onChange={e=>setVal(e.target.value)}
      onBlur={save} onKeyDown={e=>{ if(e.key==='Enter') save(); if(e.key==='Escape'){ setVal(value); setEditing(false) } }}
      style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(59,255,125,0.35)', borderRadius:7, color:'#f1f5f9', fontSize:13, fontWeight:600, padding:'3px 8px', width:'100%', outline:'none', fontFamily:'inherit', boxShadow:'0 0 0 3px rgba(59,255,125,0.08)' }}/>
  )
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', minWidth:0 }} onClick={()=>setEditing(true)} title="Rename">
      <span style={{ color:'#e2e8f0', fontWeight:600, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{value}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, opacity:0.3 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  )
}

function Stars({ rating }) {
  const color = rating >= 4 ? '#F59E0B' : rating >= 3 ? '#FB923C' : '#EF4444'
  return (
    <span style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= Math.floor(rating) ? color : 'rgba(255,255,255,0.1)'}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      ))}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// PREMIUM AI ORB — liquid energy core animation
// ─────────────────────────────────────────────────────────────
function AIOrb() {
  const canvasRef = useRef(null)
  const mouseRef  = useRef({ x: 0.5, y: 0.5, inside: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const SIZE = 340
    canvas.width  = SIZE
    canvas.height = SIZE
    const cx = SIZE / 2
    const cy = SIZE / 2

    // Mouse tracking (relative 0–1)
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top)  / r.height,
        inside: true,
      }
    }
    const onLeave = () => { mouseRef.current = { x:0.5, y:0.5, inside:false } }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    let raf

    const draw = (t) => {
      ctx.clearRect(0, 0, SIZE, SIZE)

      const ms    = mouseRef.current
      const hover = ms.inside ? 1 : 0
      // Smooth tilt toward cursor: max ±14px offset
      const tiltX = (ms.x - 0.5) * 14
      const tiltY = (ms.y - 0.5) * 14

      // Breathe: very slow sine, 0.96→1.04, hover inflates slightly
      const breathe = 1 + 0.04 * Math.sin(t * 0.00055) + hover * 0.03

      // ── 1. Far background ambient glow (bleeds into bg) ──────
      const ambR = 148 * breathe
      const amb  = ctx.createRadialGradient(cx + tiltX*0.2, cy + tiltY*0.2, 10, cx, cy, ambR)
      amb.addColorStop(0,   'rgba(0,200,100,0.09)')
      amb.addColorStop(0.45,'rgba(80,20,200,0.07)')
      amb.addColorStop(0.75,'rgba(255,60,160,0.04)')
      amb.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.beginPath(); ctx.arc(cx, cy, ambR, 0, Math.PI*2)
      ctx.fillStyle = amb; ctx.fill()

      // ── 2. Outer halo ring ────────────────────────────────────
      const haloR = 106 * breathe
      const halo  = ctx.createRadialGradient(cx + tiltX, cy + tiltY, haloR*0.55, cx + tiltX, cy + tiltY, haloR)
      halo.addColorStop(0,   'rgba(0,0,0,0)')
      halo.addColorStop(0.55,'rgba(0,230,110,0.07)')
      halo.addColorStop(0.78,'rgba(100,40,255,0.10)')
      halo.addColorStop(0.9, 'rgba(255,60,160,0.06)')
      halo.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.beginPath(); ctx.arc(cx + tiltX, cy + tiltY, haloR, 0, Math.PI*2)
      ctx.fillStyle = halo; ctx.fill()

      // ── 3. Core orb body ─────────────────────────────────────
      const orbR  = 74 * breathe
      const hiX   = cx + tiltX - orbR * 0.3
      const hiY   = cy + tiltY - orbR * 0.35
      const core  = ctx.createRadialGradient(hiX, hiY, orbR*0.04, cx + tiltX, cy + tiltY, orbR)
      core.addColorStop(0,    'rgba(210,255,230,0.96)')  // bright white-green centre
      core.addColorStop(0.12, 'rgba(0,240,130,0.90)')
      core.addColorStop(0.32, 'rgba(0,190,100,0.80)')
      core.addColorStop(0.54, 'rgba(60,20,200,0.60)')
      core.addColorStop(0.74, 'rgba(30,5,120,0.38)')
      core.addColorStop(0.90, 'rgba(5,0,40,0.18)')
      core.addColorStop(1,    'rgba(0,0,0,0)')
      ctx.beginPath(); ctx.arc(cx + tiltX, cy + tiltY, orbR, 0, Math.PI*2)
      ctx.fillStyle = core; ctx.fill()

      // ── 4. Energy ribbons — 3 independent streams ────────────
      const streams = [
        // [speed, amplitude, phaseOffset, r,g,b, alpha]
        [0.00080, 24, 0.00,    0, 255, 140, 0.60],  // neon green
        [0.00055, 20, 2.09,  255,  60, 190, 0.42],  // neon pink
        [0.00100, 16, 4.19,   60, 200, 255, 0.34],  // cyan‑blue
        [0.00065, 13, 1.05,  255, 140,  40, 0.30],  // soft orange
      ]

      streams.forEach(([spd, amp, phOff, rr, gg, bb, baseAlpha]) => {
        const angle = t * spd + phOff
        const count = 7

        for (let i = 0; i < count; i++) {
          const frac   = i / count
          const a      = angle + frac * Math.PI * 2

          // Radii oscillate slowly — gives fluid feel
          const r1 = (20 + amp * 0.45) * Math.abs(Math.sin(t * 0.00070 + i * 1.2))
          const r2 = (46 + amp)        * (0.75 + 0.25 * Math.cos(t * 0.00055 + i * 0.85))

          const x1 = cx + tiltX + r1 * Math.cos(a)
          const y1 = cy + tiltY + r1 * Math.sin(a)
          const x2 = cx + tiltX + r2 * Math.cos(a + 0.55)
          const y2 = cy + tiltY + r2 * Math.sin(a + 0.55)

          // Curved control point drifts gently
          const cpR = (r1 + r2) * 0.5
          const cpA = a + 0.27
          const drift = Math.sin(t * 0.00120 + i * 0.7) * 9
          const cpx   = cx + tiltX + cpR * Math.cos(cpA) + drift
          const cpy   = cy + tiltY + cpR * Math.sin(cpA) + drift

          const lg = ctx.createLinearGradient(x1, y1, x2, y2)
          const alpha = (baseAlpha + hover * 0.15) * (0.65 + 0.35 * Math.sin(t * 0.00130 + i * 0.6))
          lg.addColorStop(0, `rgba(${rr},${gg},${bb},${alpha.toFixed(3)})`)
          lg.addColorStop(1, `rgba(${rr},${gg},${bb},0)`)

          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.quadraticCurveTo(cpx, cpy, x2, y2)
          ctx.strokeStyle = lg
          ctx.lineWidth   = 1.6 + 0.8 * Math.sin(t * 0.00180 + i * 0.9)
          ctx.lineCap     = 'round'
          ctx.stroke()
        }
      })

      // ── 5. Pulse rings — two concentric, staggered ───────────
      const pulseSpeed = 0.00072
      const p1 = ((t * pulseSpeed) % 1)
      const p2 = ((t * pulseSpeed + 0.5) % 1)

      ;[[p1,'rgba(0,255,140,'], [p2,'rgba(160,60,255,']].forEach(([p, col]) => {
        const pr = orbR * 0.38 + p * orbR * 0.88
        const pa = (0.38 * (1 - p)) * (1 + hover * 0.4)
        ctx.beginPath()
        ctx.arc(cx + tiltX, cy + tiltY, pr, 0, Math.PI*2)
        ctx.strokeStyle = `${col}${pa.toFixed(3)})`
        ctx.lineWidth = 1.2
        ctx.stroke()
      })

      // ── 6. Specular highlight ─────────────────────────────────
      const specX = cx + tiltX - orbR * 0.28
      const specY = cy + tiltY - orbR * 0.32
      const spec  = ctx.createRadialGradient(specX, specY, 1, specX + 4, specY + 4, orbR * 0.42)
      spec.addColorStop(0, 'rgba(255,255,255,0.62)')
      spec.addColorStop(0.5,'rgba(255,255,255,0.14)')
      spec.addColorStop(1,  'rgba(255,255,255,0)')
      // Clip to orb shape
      ctx.save()
      ctx.beginPath(); ctx.arc(cx + tiltX, cy + tiltY, orbR, 0, Math.PI*2); ctx.clip()
      ctx.fillStyle = spec; ctx.fillRect(0, 0, SIZE, SIZE)
      ctx.restore()

      // ── 7. Hover brightness bloom ─────────────────────────────
      if (hover > 0) {
        const bloom = ctx.createRadialGradient(cx + tiltX, cy + tiltY, 0, cx + tiltX, cy + tiltY, orbR * 1.1)
        bloom.addColorStop(0,  `rgba(0,255,140,${(0.10 * hover).toFixed(3)})`)
        bloom.addColorStop(0.6,`rgba(0,255,140,${(0.04 * hover).toFixed(3)})`)
        bloom.addColorStop(1,  'rgba(0,0,0,0)')
        ctx.beginPath(); ctx.arc(cx + tiltX, cy + tiltY, orbR * 1.1, 0, Math.PI*2)
        ctx.fillStyle = bloom; ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={340}
      height={340}
      style={{
        width: 230,
        height: 230,
        display: 'block',
        margin: '0 auto',
        cursor: 'none',
        // subtle drop‑shadow so orb bleeds into dark sheet bg
        filter: 'drop-shadow(0 0 32px rgba(0,220,110,0.28)) drop-shadow(0 0 64px rgba(80,20,200,0.16))',
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// AI ANALYSIS PANEL — glass liquid sheet + orb loading state
// ─────────────────────────────────────────────────────────────
function AnalysisPanel({ resumeData, onClose }) {
  const [phase,   setPhase]   = useState('loading')
  const [score,   setScore]   = useState(null)
  const [visible, setVisible] = useState(false)
  const [typeIdx, setTypeIdx] = useState(0)

  const THINKING = [
    'Analyzing your experience…',
    'Evaluating impact statements…',
    'Scanning ATS compatibility…',
    'Reviewing skill alignment…',
    'Generating recommendations…',
  ]

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const run = async () => {
      try {
        const res  = await fetch('/api/score', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ resume: resumeData }) })
        const data = await res.json()
        if (data.error) { setPhase('error'); return }
        setScore(data); setPhase('done')
      } catch { setPhase('error') }
    }
    run()
  }, [])

  useEffect(() => {
    if (phase !== 'loading') return
    const t = setInterval(() => setTypeIdx(i => (i+1) % THINKING.length), 2200)
    return () => clearInterval(t)
  }, [phase])

  const close = () => { setVisible(false); setTimeout(onClose, 380) }
  const sColor = s => s==='strong'?'#3BFF7D':s==='needs-work'?'#F59E0B':'#EF4444'
  const sLabel = s => s==='strong'?'Strong':s==='needs-work'?'Needs Work':'Missing'

  return (
    <>
      {/* Dim backdrop */}
      <div onClick={close} style={{
        position:'fixed', inset:0, zIndex:200,
        background:'rgba(0,0,0,0.72)',
        backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
      }}/>

      {/* Glass liquid sheet */}
      <div style={{
        position:'fixed', left:0, right:0, bottom:0, zIndex:201,
        // ── glass liquid ──
        background: 'rgba(4,5,14,0.38)',
        backdropFilter: 'blur(60px) saturate(180%)',
        WebkitBackdropFilter: 'blur(60px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.20)',
        borderRadius: '28px 28px 0 0',
        maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 -32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.16)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.45s cubic-bezier(0.32,0.72,0,1)',
      }}>
        {/* Specular top line */}
        <div style={{ position:'absolute', top:0, left:'6%', right:'6%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06) 12%,rgba(255,255,255,0.44) 40%,rgba(255,255,255,0.55) 50%,rgba(255,255,255,0.44) 60%,rgba(255,255,255,0.06) 88%,transparent)', borderRadius:'28px 28px 0 0', pointerEvents:'none' }}/>
        {/* Noise texture */}
        <div style={{ position:'absolute', inset:0, borderRadius:'28px 28px 0 0', pointerEvents:'none', opacity:0.45, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }}/>

        {/* Pill handle */}
        <div style={{ width:40, height:4, background:'rgba(255,255,255,0.14)', borderRadius:4, margin:'16px auto 0' }}/>

        <div style={{ maxWidth:760, margin:'0 auto', padding:'24px 32px 56px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,rgba(59,255,125,0.15),rgba(139,92,246,0.15))', border:'1px solid rgba(59,255,125,0.22)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#3BFF7D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <p style={{ color:'#f1f5f9', fontWeight:700, fontSize:15, margin:0 }}>AI Resume Analysis</p>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, margin:0, marginTop:2 }}>Powered by Groq · Llama 3.3</p>
              </div>
            </div>
            <button onClick={close} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, width:34, height:34, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', flexShrink:0 }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.10)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* ── LOADING — Premium AI Orb ── */}
          {phase === 'loading' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 0 28px', gap:12 }}>
              <AIOrb />
              <div style={{ textAlign:'center', marginTop:4 }}>
                <p key={typeIdx} style={{ color:'#f1f5f9', fontWeight:600, fontSize:14, margin:'0 0 6px', animation:'orbTextIn 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
                  {THINKING[typeIdx]}
                </p>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12, margin:0 }}>Deep-reading your resume with AI…</p>
              </div>
              <style>{`@keyframes orbTextIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}`}</style>
            </div>
          )}

          {/* ── ERROR ── */}
          {phase === 'error' && (
            <div style={{ textAlign:'center', padding:'64px 0' }}>
              <p style={{ color:'#F87171', fontSize:14 }}>Analysis failed. Please try again.</p>
            </div>
          )}

          {/* ── RESULTS ── */}
          {phase === 'done' && score && (
            <>
              {/* Score row */}
              <div style={{
                background:'rgba(255,255,255,0.04)',
                backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
                border:'1px solid rgba(255,255,255,0.09)',
                borderTop:'1px solid rgba(255,255,255,0.16)',
                borderRadius:16, padding:'18px 22px', marginBottom:16,
                display:'flex', alignItems:'center', gap:20, flexWrap:'wrap',
                boxShadow:'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}>
                <Stars rating={score.stars}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:'#f1f5f9', fontWeight:700, fontSize:18, margin:'0 0 3px', letterSpacing:'-0.02em' }}>{score.label}</p>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, margin:0, lineHeight:1.5 }}>{score.headline}</p>
                </div>
                <div style={{ background:'rgba(59,255,125,0.07)', border:'1px solid rgba(59,255,125,0.2)', borderRadius:12, padding:'10px 18px', textAlign:'center', flexShrink:0 }}>
                  <p style={{ color:'#3BFF7D', fontWeight:800, fontSize:22, margin:0, letterSpacing:'-0.02em', textShadow:'0 0 20px rgba(59,255,125,0.5)' }}>{score.stars}/5</p>
                  <p style={{ color:'rgba(255,255,255,0.3)', fontSize:9, margin:0, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:2 }}>SCORE</p>
                </div>
              </div>

              {/* Section cards */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(score.sections||[]).map((sec,i) => (
                  <div key={i} style={{
                    background:'rgba(255,255,255,0.025)',
                    backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                    border:'1px solid rgba(255,255,255,0.07)',
                    borderTop:'1px solid rgba(255,255,255,0.12)',
                    borderLeft:`3px solid ${sColor(sec.status)}`,
                    borderRadius:14, padding:'16px 18px',
                    boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ color:'#f1f5f9', fontWeight:600, fontSize:14 }}>{sec.title}</span>
                      <span style={{ background:`${sColor(sec.status)}18`, color:sColor(sec.status), fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:6, letterSpacing:'0.06em', textTransform:'uppercase', border:`1px solid ${sColor(sec.status)}28` }}>
                        {sLabel(sec.status)}
                      </span>
                    </div>
                    {sec.title === 'Quick Wins'
                      ? <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {sec.body.split('|').map((tip,j)=>(
                            <div key={j} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                              <span style={{ color:'#3BFF7D', fontWeight:700, fontSize:11, marginTop:2, flexShrink:0 }}>{j+1}.</span>
                              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, lineHeight:1.65, margin:0 }}>{tip.trim()}</p>
                            </div>
                          ))}
                        </div>
                      : <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, lineHeight:1.7, margin:0 }}>{sec.body}</p>
                    }
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────
function EmptyState({ onCreate }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 24px', textAlign:'center' }}>
      <div style={{ width:72, height:72, borderRadius:20, background:'rgba(59,255,125,0.06)', border:'1px solid rgba(59,255,125,0.15)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" stroke="rgba(59,255,125,0.6)" strokeWidth="1.8"/><path d="M9 7h6M9 11h6M9 15h4" stroke="rgba(59,255,125,0.6)" strokeWidth="1.8" strokeLinecap="round"/><circle cx="17" cy="6" r="3" fill="rgba(59,255,125,0.2)" stroke="#3BFF7D" strokeWidth="1.5"/><path d="M15.5 6l1 1 2-2" stroke="#3BFF7D" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <h2 style={{ color:'#f1f5f9', fontSize:22, fontWeight:700, margin:'0 0 10px', letterSpacing:'-0.02em' }}>No resumes yet</h2>
      <p style={{ color:'rgba(255,255,255,0.3)', fontSize:14, lineHeight:1.8, margin:'0 0 36px', maxWidth:400 }}>
        Upload your LinkedIn PDF and we'll turn it into a polished,<br/>professional resume in seconds — completely AI-powered.
      </p>
      <button onClick={onCreate} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#3BFF7D', color:'#050508', border:'none', borderRadius:12, padding:'14px 32px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 28px rgba(59,255,125,0.35)', transition:'all 0.2s ease', marginBottom:36 }}
        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 0 40px rgba(59,255,125,0.5)'}}
        onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 0 28px rgba(59,255,125,0.35)'}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        Create your first resume
      </button>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px 28px', justifyContent:'center' }}>
        {['AI-powered extraction','3 premium templates','ATS job tailoring','Cover letter generator'].map(f=>(
          <div key={f} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 6l3 3 7-7" stroke="#3BFF7D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data:session, status } = useSession()
  const router = useRouter()

  const [resumes,        setResumes]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [deleting,       setDeleting]       = useState(null)
  const [downloading,    setDownloading]    = useState(null)
  const [analysisResume, setAnalysisResume] = useState(null)
  const [hoveredCard,    setHoveredCard]    = useState(null)

  const blobRef = useRef(null)

  // ── Blob hues (same system as the rest of the app) ──────────
  useEffect(() => {
    const canvas = blobRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let BW, BH, raf
    const resize = () => { BW = canvas.width = window.innerWidth; BH = canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    const blobs = [
      {bx:-0.08,by:-0.05,ox:0.04,oy:0.03,sp:0.0008,op:0,   r:0.68,c:[28,95,255],  a:0.55},
      {bx:-0.02,by:0.60, ox:0.03,oy:0.05,sp:0.0006,op:1.2,  r:0.44,c:[0,195,145], a:0.48},
      {bx:1.06, by:-0.04,ox:0.04,oy:0.04,sp:0.0007,op:0.7,  r:0.65,c:[130,15,245],a:0.55},
      {bx:1.02, by:0.55, ox:0.03,oy:0.06,sp:0.0010,op:3.1,  r:0.42,c:[90,0,210],  a:0.42},
      {bx:0.48, by:-0.10,ox:0.07,oy:0.03,sp:0.0007,op:4.2,  r:0.32,c:[50,130,255],a:0.28},
    ]
    const draw = () => {
      ctx.clearRect(0,0,BW,BH); ctx.fillStyle='#04060c'; ctx.fillRect(0,0,BW,BH)
      blobs.forEach(b => {
        b.op += b.sp
        const bcx=(b.bx+Math.sin(b.op)*b.ox)*BW
        const bcy=(b.by+Math.cos(b.op*0.77)*b.oy)*BH
        const rad =b.r*Math.max(BW,BH)
        const g   =ctx.createRadialGradient(bcx,bcy,0,bcx,bcy,rad)
        const [r,gr,bv]=b.c
        g.addColorStop(0,`rgba(${r},${gr},${bv},${b.a})`)
        g.addColorStop(0.35,`rgba(${r},${gr},${bv},${(b.a*0.4).toFixed(3)})`)
        g.addColorStop(1,`rgba(${r},${gr},${bv},0)`)
        ctx.globalCompositeOperation='screen'
        ctx.beginPath(); ctx.arc(bcx,bcy,rad,0,Math.PI*2)
        ctx.fillStyle=g; ctx.fill()
      })
      ctx.globalCompositeOperation='multiply'
      const ink=ctx.createRadialGradient(BW*.5,BH*.5,0,BW*.5,BH*.5,BW*.65)
      ink.addColorStop(0,'rgba(4,5,16,0.82)')
      ink.addColorStop(0.5,'rgba(4,5,16,0.45)')
      ink.addColorStop(1,'rgba(4,5,16,0)')
      ctx.fillStyle=ink; ctx.fillRect(0,0,BW,BH)
      ctx.fillStyle='rgba(3,4,12,0.35)'; ctx.fillRect(0,0,BW,BH)
      ctx.globalCompositeOperation='source-over'
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf) }
  }, [])

  useEffect(()=>{ if(status==='unauthenticated') router.push('/signin') },[status])
  useEffect(()=>{ if(session?.user?.email) fetchResumes() },[session])

  const fetchResumes = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('resumes').select('*').eq('user_email', session.user.email).order('updated_at',{ascending:false})
    if (!error) setResumes(data||[])
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this resume? This cannot be undone.')) return
    setDeleting(id)
    await supabase.from('resumes').delete().eq('id',id)
    setResumes(r=>r.filter(x=>x.id!==id))
    setDeleting(null)
  }

  const handleEdit   = (resume) => { sessionStorage.setItem('editResume', JSON.stringify(resume)); router.push('/app') }

  const handleDownload = async (resume) => {
    setDownloading(resume.id)
    try {
      const res = await fetch('/api/download',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ resume:resume.data, template:resume.template, accentColor:resume.accent_color }) })
      if (!res.ok) { alert('Download failed'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href=url; a.download=`${resume.data?.name||'resume'}-icvy.pdf`; a.click()
      URL.revokeObjectURL(url)
      await supabase.from('resumes').update({ last_downloaded:new Date().toISOString() }).eq('id',resume.id)
      setResumes(r=>r.map(x=>x.id===resume.id?{...x,last_downloaded:new Date().toISOString()}:x))
    } catch { alert('Download failed') }
    setDownloading(null)
  }

  const handleRename = async (resume, newName) => {
    const updatedData = { ...resume.data, name: newName }
    await supabase.from('resumes').update({ data:updatedData, updated_at:new Date().toISOString() }).eq('id',resume.id)
    setResumes(r=>r.map(x=>x.id===resume.id?{...x,data:updatedData}:x))
  }

  const handleShare = async (resume) => {
    if (resume.is_public && resume.share_id) {
      await navigator.clipboard.writeText(`${window.location.origin}/share/${resume.share_id}`)
      alert('Link copied!'); return
    }
    const shareId = Math.random().toString(36).slice(2,10)
    await supabase.from('resumes').update({ is_public:true, share_id:shareId }).eq('id', resume.id)
    setResumes(r=>r.map(x=>x.id===resume.id?{...x,is_public:true,share_id:shareId}:x))
    await navigator.clipboard.writeText(`${window.location.origin}/share/${shareId}`)
    alert('Share link copied!')
  }

  // ── loading screen ──────────────────────────────────────────
  if (status==='loading'||loading) return (
    <div style={{ minHeight:'100vh', background:'#04060c', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif" }}>
      <canvas ref={blobRef} style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        <div style={{ width:40, height:40, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'#3BFF7D', animation:'spin 1s linear infinite' }}/>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13 }}>Loading your workspace…</p>
      </div>
    </div>
  )

  const totalDownloads = resumes.filter(r=>r.last_downloaded).length
  const lastEdited     = resumes.length ? resumes[0].updated_at : null
  const avgCompletion  = resumes.length ? Math.round(resumes.reduce((a,r)=>a+calcCompletion(r.data),0)/resumes.length) : 0
  const completeCount  = resumes.filter(r=>calcCompletion(r.data)===100).length

  const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  return (
    <div style={{ minHeight:'100vh', background:'#04060c', fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif", color:'#fff' }}>

      {analysisResume && <AnalysisPanel resumeData={analysisResume} onClose={()=>setAnalysisResume(null)}/>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Inter',sans-serif;background:#04060c;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .card-appear{animation:fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px;}
        @media(max-width:900px){.resume-grid{grid-template-columns:1fr 1fr!important;}}
        @media(max-width:560px){.resume-grid{grid-template-columns:1fr!important;}.dash-stats{flex-direction:column!important;gap:12px!important;padding:16px!important;}.nav-name{display:none!important;}}
      `}</style>

      {/* ── Blob hues ── */}
      <canvas ref={blobRef} style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}/>
      {/* ── Grain ── */}
      <div style={{ position:'fixed', inset:0, zIndex:1, pointerEvents:'none', opacity:0.4, backgroundImage:GRAIN }}/>

      {/* ── Nav — glass liquid ── */}
      <nav style={{
        position:'sticky', top:0, zIndex:50, height:56,
        background:'rgba(4,6,12,0.55)',
        backdropFilter:'blur(52px) saturate(180%)',
        WebkitBackdropFilter:'blur(52px) saturate(180%)',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        display:'flex', alignItems:'center', padding:'0 28px', justifyContent:'space-between',
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.12) 20%,rgba(255,255,255,0.32) 50%,rgba(255,255,255,0.12) 80%,transparent)', pointerEvents:'none' }}/>
        <img src="/logo.png" alt="ICVY" style={{ height:28, objectFit:'contain', position:'relative', zIndex:1 }}/>
        <div style={{ display:'flex', alignItems:'center', gap:8, position:'relative', zIndex:1 }}>
          <button onClick={()=>router.push('/profile')}
            style={{ background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:9, padding:'6px 10px', borderRadius:9, transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            {session?.user?.image
              ? <img src={session.user.image} alt="avatar" style={{ width:28, height:28, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.1)', objectFit:'cover' }}/>
              : <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#3BFF7D,#00C853)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#050508', flexShrink:0 }}>
                  {(session?.user?.name||session?.user?.email||'?')[0].toUpperCase()}
                </div>
            }
            <span className="nav-name" style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>{session?.user?.name||session?.user?.email}</span>
          </button>
          <button onClick={()=>signOut({callbackUrl:'/signin'})}
            style={{ display:'inline-flex', alignItems:'center', gap:6, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'6px 14px', color:'rgba(255,255,255,0.35)', fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit' }}
            onMouseEnter={e=>{e.currentTarget.style.color='rgba(255,255,255,0.75)';e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}}
            onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.35)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth:1140, margin:'0 auto', padding:'44px 28px 80px', position:'relative', zIndex:2 }}>

        {/* ── Page header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28, flexWrap:'wrap', gap:14 }}>
          <div>
            <h1 style={{ color:'#fff', fontSize:26, fontWeight:800, letterSpacing:'-0.03em', marginBottom:4 }}>My Resumes</h1>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:14 }}>Manage, edit and download all your resumes</p>
          </div>
          <button onClick={()=>router.push('/app')}
            style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#3BFF7D', color:'#050508', border:'none', borderRadius:10, padding:'11px 22px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 20px rgba(59,255,125,0.3)', transition:'all 0.2s ease', whiteSpace:'nowrap' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 0 28px rgba(59,255,125,0.5)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 0 20px rgba(59,255,125,0.3)'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
            New Resume
          </button>
        </div>

        {/* ── Stats row — glass liquid ── */}
        {resumes.length > 0 && (
          <div className="dash-stats" style={{
            display:'flex', position:'relative', overflow:'hidden',
            background:'rgba(6,8,20,0.40)',
            backdropFilter:'blur(52px) saturate(180%)',
            WebkitBackdropFilter:'blur(52px) saturate(180%)',
            border:'1px solid rgba(255,255,255,0.08)',
            borderTop:'1px solid rgba(255,255,255,0.18)',
            borderRadius:16, padding:'18px 32px', marginBottom:36,
            boxShadow:'0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)',
          }}>
            {/* specular */}
            <div style={{ position:'absolute', top:0, left:'6%', right:'6%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06) 12%,rgba(255,255,255,0.34) 50%,rgba(255,255,255,0.06) 88%,transparent)', pointerEvents:'none' }}/>
            {/* noise */}
            <div style={{ position:'absolute', inset:0, borderRadius:16, pointerEvents:'none', opacity:0.4, backgroundImage:GRAIN }}/>
            {[
              { num:resumes.length,          label:resumes.length===1?'Resume':'Resumes' },
              { num:avgCompletion+'%',        label:'Avg. completion' },
              { num:lastEdited ? timeAgo(lastEdited) : '—', label:'Last edited' },
              { num:completeCount,            label:'Complete' },
              { num:totalDownloads,           label:'Downloaded' },
            ].map((s,i,arr) => (
              <div key={i} style={{ display:'flex', alignItems:'center', flex:1, minWidth:0, position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flex:1 }}>
                  <span style={{ color:'#fff', fontWeight:800, fontSize:20, letterSpacing:'-0.025em' }}>{s.num}</span>
                  <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11, fontWeight:500, textAlign:'center', whiteSpace:'nowrap' }}>{s.label}</span>
                </div>
                {i < arr.length-1 && <div style={{ width:1, height:32, background:'rgba(255,255,255,0.06)', flexShrink:0 }}/>}
              </div>
            ))}
          </div>
        )}

        {resumes.length === 0 && <EmptyState onCreate={()=>router.push('/app')}/>}

        {resumes.length > 0 && (
          <div className="resume-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>

            {/* ── New resume card ── */}
            <div className="card-appear" onClick={()=>router.push('/app')}
              style={{
                background:'rgba(59,255,125,0.025)',
                backdropFilter:'blur(32px) saturate(160%)', WebkitBackdropFilter:'blur(32px) saturate(160%)',
                border:'2px dashed rgba(59,255,125,0.15)',
                borderRadius:18, minHeight:280,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                cursor:'pointer', transition:'all 0.25s ease', gap:10,
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(59,255,125,0.38)';e.currentTarget.style.background='rgba(59,255,125,0.045)';e.currentTarget.style.transform='translateY(-4px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(59,255,125,0.15)';e.currentTarget.style.background='rgba(59,255,125,0.025)';e.currentTarget.style.transform='none'}}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(59,255,125,0.07)', border:'1px solid rgba(59,255,125,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#3BFF7D" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <p style={{ color:'#3BFF7D', fontWeight:600, fontSize:13, margin:0 }}>New Resume</p>
              <p style={{ color:'rgba(255,255,255,0.2)', fontSize:11, margin:0 }}>Upload LinkedIn PDF</p>
            </div>

            {/* ── Resume cards ── */}
            {resumes.map((r,idx) => {
              const pct     = calcCompletion(r.data)
              const isHover = hoveredCard === r.id
              return (
                <div key={r.id} className="card-appear"
                  style={{
                    animationDelay:`${idx*60}ms`, position:'relative',
                    // ── glass liquid ──
                    background: isHover ? 'rgba(8,10,24,0.55)' : 'rgba(6,8,20,0.32)',
                    backdropFilter:'blur(52px) saturate(180%)',
                    WebkitBackdropFilter:'blur(52px) saturate(180%)',
                    border:`1px solid ${isHover ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.08)'}`,
                    borderTop:`1px solid ${isHover ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.16)'}`,
                    borderRadius:18, overflow:'hidden',
                    transition:'all 0.28s cubic-bezier(0.16,1,0.3,1)',
                    transform: isHover ? 'translateY(-6px)' : 'none',
                    boxShadow: isHover
                      ? '0 28px 72px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.18)'
                      : '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={()=>setHoveredCard(r.id)}
                  onMouseLeave={()=>setHoveredCard(null)}>

                  {/* specular line on card top */}
                  <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06) 15%,rgba(255,255,255,0.30) 50%,rgba(255,255,255,0.06) 85%,transparent)', pointerEvents:'none', zIndex:3 }}/>

                  {/* ── Thumbnail ── */}
                  <div style={{ position:'relative', height:200, overflow:'hidden', background:'rgba(6,8,20,0.8)' }}>
                    <img src={`/templates/${r.template||'sidebar'}.png`} alt={TEMPLATE_LABELS[r.template]||'Resume'}
                      style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center', display:'block' }}/>
                    {r.accent_color && r.template!=='heritage' && <div style={{ position:'absolute', inset:0, background:r.accent_color, mixBlendMode:'hue', opacity:0.22, pointerEvents:'none' }}/>}

                    <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', color:'rgba(255,255,255,0.8)', fontSize:9, fontWeight:700, padding:'3px 9px', borderRadius:6, letterSpacing:'0.08em', textTransform:'uppercase', border:'1px solid rgba(255,255,255,0.1)' }}>
                      {TEMPLATE_LABELS[r.template]||r.template}
                    </div>
                    <div style={{ position:'absolute', top:8, right:8 }}><CompletionRing pct={pct}/></div>

                    {/* hover action overlay */}
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(4,6,12,0.97) 0%, rgba(4,6,12,0.6) 55%, transparent 100%)', opacity:isHover?1:0, transition:'opacity 0.25s ease', display:'flex', alignItems:'flex-end', padding:12, gap:6 }}>
                      {[
                        { label:'Edit',   danger:false, onClick:(e)=>{e.stopPropagation();handleEdit(r)} },
                        { label:downloading===r.id?'…':'PDF', danger:false, onClick:(e)=>{e.stopPropagation();handleDownload(r)} },
                        { label:'Share',  danger:false, onClick:(e)=>{e.stopPropagation();handleShare(r)} },
                        { label:deleting===r.id?'…':'Delete', danger:true, onClick:(e)=>{e.stopPropagation();handleDelete(r.id)} },
                      ].map(btn => (
                        <button key={btn.label} onClick={btn.onClick}
                          style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 4px', fontSize:11, fontWeight:600,
                            background: btn.danger?'rgba(239,68,68,0.12)':'rgba(255,255,255,0.09)',
                            border:`1px solid ${btn.danger?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.12)'}`,
                            borderRadius:9, color:btn.danger?'#FCA5A5':'#fff', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                          onMouseEnter={e=>e.currentTarget.style.background=btn.danger?'rgba(239,68,68,0.22)':'rgba(255,255,255,0.16)'}
                          onMouseLeave={e=>e.currentTarget.style.background=btn.danger?'rgba(239,68,68,0.12)':'rgba(255,255,255,0.09)'}>
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Card body ── */}
                  <div style={{ padding:'13px 14px 15px', position:'relative', zIndex:1 }}>
                    <InlineRename value={r.data?.name||'Untitled Resume'} onSave={n=>handleRename(r,n)}/>
                    <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12, margin:'3px 0 8px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.data?.title||'—'}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ color:'rgba(255,255,255,0.22)', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        {timeAgo(r.updated_at)}
                      </span>
                      {r.last_downloaded && (
                        <span style={{ color:'rgba(255,255,255,0.22)', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          {timeAgo(r.last_downloaded)}
                        </span>
                      )}
                    </div>
                    <button onClick={()=>setAnalysisResume(r.data)}
                      style={{ width:'100%', background:'linear-gradient(135deg,rgba(59,255,125,0.06),rgba(139,92,246,0.06))', border:'1px solid rgba(139,92,246,0.18)', borderTop:'1px solid rgba(139,92,246,0.28)', borderRadius:9, padding:'9px 0', cursor:'pointer', fontSize:12, fontWeight:600, color:'#A78BFA', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.2s',
                        boxShadow:'inset 0 1px 0 rgba(139,92,246,0.12)'
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(59,255,125,0.10),rgba(139,92,246,0.10))';e.currentTarget.style.borderColor='rgba(139,92,246,0.32)'}}
                      onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(59,255,125,0.06),rgba(139,92,246,0.06))';e.currentTarget.style.borderColor='rgba(139,92,246,0.18)'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      AI Analysis
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}