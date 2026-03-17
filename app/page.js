'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ─── data ─────────────────────────────────────────────────────
const features = [
  { color:'#4f8fff', bg:'rgba(79,143,255,0.08)',  border:'rgba(79,143,255,0.18)',  title:'AI Extraction',     desc:'Upload your LinkedIn PDF and AI instantly parses every detail — name, roles, education, skills, languages — into a clean structure.' },
  { color:'#3bff7d', bg:'rgba(59,255,125,0.07)',  border:'rgba(59,255,125,0.16)',  title:'Live Split Editor', desc:'Edit any field on the left and watch your A4 resume update in real time on the right. WYSIWYG, always.' },
  { color:'#a78bfa', bg:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.18)', title:'ATS Job Tailoring', desc:'Paste a job description. AI rewrites your resume keywords to match it — without inventing a single false fact.' },
  { color:'#c084fc', bg:'rgba(192,132,252,0.07)', border:'rgba(192,132,252,0.16)', title:'Cover Letter AI',   desc:'One click generates a tailored, human-sounding cover letter. Edit and download as a text file instantly.' },
  { color:'#fbbf24', bg:'rgba(251,191,36,0.07)',  border:'rgba(251,191,36,0.16)',  title:'Smart Completeness',desc:'Real-time warnings flag every missing field — LinkedIn URL, date of birth, GPA — before you apply.' },
  { color:'#34d399', bg:'rgba(52,211,153,0.07)',  border:'rgba(52,211,153,0.16)',  title:'University Ready', desc:'Includes nationality, DOB, volunteer work, references, and languages — fields universities actually require.' },
]
const steps = [
  { num:'01', title:'Export from LinkedIn', body:'Go to your LinkedIn profile, click More, then Save to PDF. Takes about 30 seconds. No special format required.',                                    tag:'LinkedIn Export', color:'#4f8fff' },
  { num:'02', title:'Upload & AI Extracts', body:'Drop your PDF into ICVY. Our AI reads every line — job titles, dates, education, skills, languages — and structures everything perfectly.',         tag:'AI Processing',  color:'#3bff7d' },
  { num:'03', title:'Edit & Tailor',        body:'Refine any detail in the live editor. Add missing fields, paste a job description for ATS tailoring, generate a cover letter with one click.',     tag:'Smart Editor',   color:'#a78bfa' },
  { num:'04', title:'Download & Apply',     body:'Export a polished A4 resume as PDF. Apply with confidence knowing your resume is complete, formatted, and optimized.',                              tag:'Ready to Apply', color:'#fbbf24' },
]
const reviews = [
  { name:'Asel Nurlanovna',  role:'Marketing Graduate · Almaty',    init:'AN', text:'Had a job-ready resume in under 3 minutes. The ATS tailoring helped me get callbacks I thought were impossible.' },
  { name:'James Okonkwo',    role:'Software Engineer · Lagos',       init:'JO', text:'The cover letter generator alone is worth it. I used to spend hours per application. Landed my first international role.' },
  { name:'Priya Sharma',     role:'MBA Applicant · Mumbai',          init:'PS', text:'The missing fields feature is brilliant. It flagged my LinkedIn URL and DOB. Got into my first choice university.' },
  { name:'Damir Xolnazarov', role:"Int'l Relations · Tashkent",     init:'DX', text:"Finally a tool that understands what universities want. The volunteer and languages sections are things other builders ignore." },
  { name:'Léa Fontaine',     role:'UX Designer · Paris',            init:'LF', text:'Clean, fast, and the resume looks great. I tried Kickresume and Resume.io — ICVY beats them for simplicity.' },
  { name:'Carlos Mendez',    role:'Business Analyst · Mexico City', init:'CM', text:'The live preview is a game changer. You see exactly what your resume looks like as you type.' },
]

// ─── design tokens ────────────────────────────────────────────
const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`
const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`
const SPEC  = 'linear-gradient(90deg,transparent,rgba(255,255,255,0.05) 15%,rgba(255,255,255,0.32) 40%,rgba(255,255,255,0.44) 50%,rgba(255,255,255,0.32) 60%,rgba(255,255,255,0.05) 85%,transparent)'

// exact .ai-panel glass from the reference html
const G = {
  position:'relative', overflow:'hidden',
  background:'rgba(6,8,18,0.22)',
  backdropFilter:'blur(48px) saturate(160%)',
  WebkitBackdropFilter:'blur(48px) saturate(160%)',
  borderTop:   '1px solid rgba(255,255,255,0.20)',
  borderLeft:  '1px solid rgba(255,255,255,0.09)',
  borderRight: '1px solid rgba(255,255,255,0.06)',
  borderBottom:'1px solid rgba(255,255,255,0.04)',
  boxShadow:'0 0 80px rgba(0,0,0,0.5),0 30px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.16)',
}

// specular line + noise texture — no sheen gradient (that caused the white bands)
function GlassLayers() {
  return <>
    <div style={{ position:'absolute',top:0,left:'8%',right:'8%',height:1,background:SPEC,zIndex:30,pointerEvents:'none' }}/>
    <div style={{ position:'absolute',inset:0,pointerEvents:'none',zIndex:2,opacity:0.5,backgroundImage:NOISE }}/>
  </>
}

// ─── blob canvas — exact reference draw loop ──────────────────
function BlobCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const x = c.getContext('2d')
    let BW, BH
    const resize = () => { BW = c.width = window.innerWidth; BH = c.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    const blobs = [
      {bx:-0.08,by:-0.05,ox:0.04,oy:0.03,sp:0.0008,op:0,   r:0.68,c:[28,95,255], a:0.58},
      {bx:-0.02,by:0.60, ox:0.03,oy:0.05,sp:0.0006,op:1.2,  r:0.44,c:[0,195,145],a:0.50},
      {bx:1.06, by:-0.04,ox:0.04,oy:0.04,sp:0.0007,op:0.7,  r:0.65,c:[130,15,245],a:0.60},
      {bx:1.02, by:0.55, ox:0.03,oy:0.06,sp:0.0010,op:3.1,  r:0.42,c:[90,0,210],  a:0.44},
      {bx:0.48, by:-0.10,ox:0.07,oy:0.03,sp:0.0007,op:4.2,  r:0.32,c:[50,130,255],a:0.30},
    ]
    let raf
    const draw = () => {
      x.clearRect(0,0,BW,BH); x.fillStyle='#04060c'; x.fillRect(0,0,BW,BH)
      blobs.forEach(b => {
        b.op += b.sp
        const cx=(b.bx+Math.sin(b.op)*b.ox)*BW, cy=(b.by+Math.cos(b.op*0.77)*b.oy)*BH, rad=b.r*Math.max(BW,BH)
        const g=x.createRadialGradient(cx,cy,0,cx,cy,rad)
        const[r,gr,bv]=b.c
        g.addColorStop(0,`rgba(${r},${gr},${bv},${b.a})`)
        g.addColorStop(0.35,`rgba(${r},${gr},${bv},${(b.a*0.4).toFixed(3)})`)
        g.addColorStop(1,`rgba(${r},${gr},${bv},0)`)
        x.globalCompositeOperation='screen'; x.beginPath(); x.arc(cx,cy,rad,0,Math.PI*2); x.fillStyle=g; x.fill()
      })
      x.globalCompositeOperation='multiply'
      const ink=x.createRadialGradient(BW*.5,BH*.5,0,BW*.5,BH*.5,BW*.65)
      ink.addColorStop(0,'rgba(4,5,16,0.82)'); ink.addColorStop(0.5,'rgba(4,5,16,0.45)'); ink.addColorStop(1,'rgba(4,5,16,0)')
      x.fillStyle=ink; x.fillRect(0,0,BW,BH)
      x.fillStyle='rgba(3,4,12,0.35)'; x.fillRect(0,0,BW,BH)
      x.globalCompositeOperation='source-over'
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position:'fixed',inset:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none' }}/>
}

// ─── nav ──────────────────────────────────────────────────────
function Nav() {
  return (
    <div style={{ position:'fixed',top:18,left:0,right:0,zIndex:100,display:'flex',justifyContent:'center',padding:'0 24px' }}>
      <div style={{ ...G,borderRadius:100,display:'flex',alignItems:'center' }}>
        <GlassLayers/>
        <div style={{ position:'relative',zIndex:20,display:'flex',alignItems:'center',gap:6,padding:'6px 8px 6px 22px' }}>
          <img src="/logo.png" alt="ICVY" style={{ height:26,objectFit:'contain',marginRight:10 }}/>
          <div className="nc" style={{ display:'flex',gap:2 }}>
            {[['#features','Features'],['#how','How it works'],['#reviews','Reviews']].map(([href,label])=>(
              <a key={href} href={href} style={{ fontSize:13,fontWeight:500,color:'rgba(255,255,255,0.45)',padding:'8px 14px',borderRadius:8,transition:'color 0.15s' }}
                 onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.9)'}
                 onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.45)'}>{label}</a>
            ))}
          </div>
          <Link href="/signin" style={{ fontSize:13,fontWeight:500,color:'rgba(255,255,255,0.36)',padding:'8px 14px',borderRadius:8,transition:'color 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.75)'}
                onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.36)'}>Sign in</Link>
          <Link href="/app" className="gbtn" style={{ display:'inline-flex',alignItems:'center',gap:5,background:'linear-gradient(135deg,#3bff7d,#1ed4a0)',color:'#031a0d',padding:'9px 20px',borderRadius:100,fontSize:13,fontWeight:800,boxShadow:'0 0 44px rgba(59,255,125,0.50),0 0 90px rgba(59,255,125,0.18),inset 0 1px 0 rgba(255,255,255,0.35)',transition:'all 0.25s cubic-bezier(0.16,1,0.3,1)',whiteSpace:'nowrap' }}>Get Started</Link>
        </div>
      </div>
    </div>
  )
}

// ─── review card ──────────────────────────────────────────────
function ReviewCard({ r }) {
  return (
    <div style={{ ...G,width:300,flexShrink:0,margin:'0 8px',borderRadius:20,padding:'22px' }}>
      <GlassLayers/>
      <div style={{ position:'relative',zIndex:20 }}>
        <div style={{ display:'flex',gap:3,marginBottom:12 }}>
          {[1,2,3,4,5].map(i=><div key={i} style={{ width:10,height:10,borderRadius:3,background:'#fbbf24',opacity:0.9 }}/>)}
        </div>
        <p style={{ fontSize:13,color:'rgba(255,255,255,0.48)',lineHeight:1.75,fontStyle:'italic',marginBottom:16 }}>"{r.text}"</p>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,rgba(59,255,125,0.15),rgba(79,143,255,0.15))',border:'1px solid rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.7)',flexShrink:0 }}>{r.init}</div>
          <div>
            <p style={{ fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.85)',margin:0 }}>{r.name}</p>
            <p style={{ fontSize:11,color:'rgba(255,255,255,0.26)',margin:'2px 0 0' }}>{r.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── STEP CARD — mouse-tracking glow ─────────────────────────
// Uses RAF + ref so mouse position updates never trigger re-renders.
// The glow overlay is a radial gradient positioned at cursor coords
// inside the card, revealing the card's accent color atmospherically.
function StepCard({ s, index }) {
  const cardRef  = useRef(null)
  const glowRef  = useRef(null)
  const rafRef   = useRef(null)
  const posRef   = useRef({ x: 50, y: 50 })   // % inside card
  const hovRef   = useRef(false)
  const alphaRef = useRef(0)                   // glow opacity 0→1

  useEffect(() => {
    const card = cardRef.current
    const glow = glowRef.current
    if (!card || !glow) return

    const onEnter = () => { hovRef.current = true }
    const onLeave = () => { hovRef.current = false }
    const onMove  = e => {
      const r = card.getBoundingClientRect()
      posRef.current = {
        x: ((e.clientX - r.left) / r.width)  * 100,
        y: ((e.clientY - r.top)  / r.height) * 100,
      }
    }

    // parse hex color once
    const h = s.color.replace('#','')
    const rgb = `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      // lerp alpha smoothly
      const target = hovRef.current ? 1 : 0
      alphaRef.current += (target - alphaRef.current) * 0.08

      const a  = alphaRef.current
      const {x, y} = posRef.current

      // outer card glow (box-shadow)
      card.style.boxShadow = a < 0.01
        ? G.boxShadow
        : `0 0 80px rgba(0,0,0,0.5), 0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 ${48*a}px rgba(${rgb},${0.32*a}), 0 ${10*a}px ${56*a}px rgba(${rgb},${0.22*a})`

      // card lift
      card.style.transform = `translateY(${-6 * a}px)`

      // inner mouse glow overlay
      glow.style.opacity = String(a)
      glow.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(${rgb},0.22) 0%, rgba(${rgb},0.08) 45%, transparent 65%)`

      // border brightens on hover
      card.style.borderTop = `1px solid rgba(${rgb},${0.28 + 0.5 * a})`
    }

    card.addEventListener('mouseenter', onEnter)
    card.addEventListener('mouseleave', onLeave)
    card.addEventListener('mousemove',  onMove)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      card.removeEventListener('mouseenter', onEnter)
      card.removeEventListener('mouseleave', onLeave)
      card.removeEventListener('mousemove',  onMove)
      cancelAnimationFrame(rafRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={cardRef} style={{
      ...G,
      borderRadius: 20,
      padding: '30px 24px 26px',
      borderTop: `1px solid ${s.color}44`,
      transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
      willChange: 'transform, box-shadow',
      cursor: 'default',
    }}>
      <GlassLayers/>

      {/* mouse-tracking glow overlay — sits above glass layers, below content */}
      <div ref={glowRef} style={{
        position: 'absolute', inset: 0, borderRadius: 20,
        opacity: 0, pointerEvents: 'none', zIndex: 5,
        transition: 'opacity 0.1s',
      }}/>

      {/* content */}
      <div style={{ position:'relative', zIndex: 20 }}>

        {/* number badge */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${s.color}12`,
          border: `1.5px solid ${s.color}44`,
          boxShadow: `0 0 20px ${s.color}18`,
        }}>
          <span style={{ fontSize:15, fontWeight:800, fontFamily:"'SF Mono','Fira Code',monospace", color:s.color }}>{s.num}</span>
        </div>

        {/* tag pill */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:`${s.color}0e`, border:`1px solid ${s.color}22`, borderRadius:100, padding:'4px 11px', marginBottom:14 }}>
          <div style={{ width:4, height:4, borderRadius:'50%', background:s.color, boxShadow:`0 0 5px ${s.color}` }}/>
          <span style={{ fontSize:9.5, fontWeight:700, color:s.color, letterSpacing:'0.1em', textTransform:'uppercase' }}>{s.tag}</span>
        </div>

        {/* title */}
        <h3 style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.92)', letterSpacing:'-0.025em', lineHeight:1.3, marginBottom:10 }}>{s.title}</h3>

        {/* body */}
        <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.33)', lineHeight:1.72, margin:0 }}>{s.body}</p>

      </div>
    </div>
  )
}

// ─── STEPS ────────────────────────────────────────────────────
function StepsSection() {
  return (
    <div style={{ padding:'0 72px 80px' }}>
      <div style={{ position:'relative' }}>



        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, position:'relative', zIndex:1 }}>
          {steps.map((s,i) => <StepCard key={i} s={s} index={i}/>)}
        </div>

      </div>
    </div>
  )
}
// ─── page ─────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div style={{ background:'#04060c',color:'#fff',fontFamily:"'Figtree',-apple-system,sans-serif",overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;} a{text-decoration:none;color:inherit;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px;}

        @keyframes fadeUp  {from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes gradTxt {0%,100%{background-position:0%}50%{background-position:100%}}
        @keyframes marquee {from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes pulse   {0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
        @keyframes floatY  {0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes aiScan  {0%{transform:scaleX(0);opacity:0}10%{opacity:1}50%{transform:scaleX(1);opacity:1}90%{opacity:1}100%{transform:scaleX(0);opacity:0}}
        @keyframes stepIn  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

        .hbadge{animation:fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both;}
        .htitle {animation:fadeUp 0.7s 0.10s cubic-bezier(0.16,1,0.3,1) both;}
        .hsub   {animation:fadeUp 0.7s 0.18s cubic-bezier(0.16,1,0.3,1) both;}
        .hbtns  {animation:fadeUp 0.7s 0.24s cubic-bezier(0.16,1,0.3,1) both;}
        .hmock  {animation:fadeUp 0.9s 0.15s cubic-bezier(0.16,1,0.3,1) both;}
        .hmock-inner{animation:floatY 6s ease-in-out infinite;}
        .grad-word{background:linear-gradient(135deg,#60a5fa 0%,#818cf8 40%,#a78bfa 70%,#c084fc 100%);background-size:200%;animation:gradTxt 5s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .ai-scan-line{position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#3bff7d,transparent);animation:aiScan 3.5s ease-in-out infinite;transform-origin:left;}
        .fc{transition:transform 0.3s cubic-bezier(0.16,1,0.3,1)!important;}
        .fc:hover{transform:translateY(-4px)!important;}
        .step-card{transition:transform 0.3s cubic-bezier(0.16,1,0.3,1),box-shadow 0.3s!important;}
        .step-card:hover{transform:translateY(-5px)!important;box-shadow:0 0 80px rgba(0,0,0,0.6),0 30px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.2)!important;}
        .gbtn:hover{transform:translateY(-2px)!important;box-shadow:0 0 64px rgba(59,255,125,0.70)!important;}
        .sbtn:hover{background:rgba(255,255,255,0.08)!important;color:rgba(255,255,255,0.85)!important;}
        .mq {display:flex;width:max-content;animation:marquee 38s linear infinite;}
        .mq:hover{animation-play-state:paused;}
        .mq2{display:flex;width:max-content;animation:marquee 30s linear infinite reverse;}

        @media(max-width:900px){
          .hi {flex-direction:column!important;padding:80px 24px 60px!important;gap:48px!important;}
          .hmr{display:none!important;}
          .fg {grid-template-columns:1fr 1fr!important;}
          .nc {display:none!important;}
        }
        @media(max-width:600px){.fg{grid-template-columns:1fr!important;}}
      `}</style>

      <BlobCanvas/>
      <div style={{ position:'fixed',inset:0,zIndex:1,pointerEvents:'none',opacity:0.45,backgroundImage:GRAIN }}/>
      <Nav/>

      {/* ── main content glass block ── */}
      <div style={{ position:'relative',zIndex:2,maxWidth:1260,margin:'0 auto',padding:'120px 48px 0' }}>
        <div style={{ ...G, borderRadius:32 }}>
          <GlassLayers/>
          <div style={{ position:'relative',zIndex:20 }}>

            {/* HERO */}
            <div className="hi" style={{ padding:'100px 72px 80px',display:'flex',alignItems:'center',gap:72 }}>
              <div style={{ flex:'1 1 480px',display:'flex',flexDirection:'column',gap:28 }}>
                <div className="hbadge" style={{ display:'inline-flex',alignItems:'center',gap:9,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:100,padding:'7px 18px',width:'fit-content' }}>
                  <span style={{ width:6,height:6,borderRadius:'50%',background:'#3bff7d',boxShadow:'0 0 8px #3bff7d',animation:'pulse 2.5s ease infinite',flexShrink:0 }}/>
                  <span style={{ fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.5)',letterSpacing:'0.03em' }}>AI-Powered · Free · No account required</span>
                </div>
                <h1 className="htitle" style={{ fontSize:'clamp(42px,5.5vw,70px)',fontWeight:900,lineHeight:1.05,letterSpacing:'-0.04em',color:'#fff' }}>
                  Your Resume,<br/><span className="grad-word">Built by AI.</span>
                </h1>
                <p className="hsub" style={{ fontSize:17,color:'rgba(255,255,255,0.38)',lineHeight:1.8,maxWidth:460 }}>
                  Transform a LinkedIn export into a polished, ATS-optimized resume. Live editor, job tailoring, cover letter — all in one place.
                </p>
                <div className="hbtns" style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
                  <Link href="/app" className="gbtn" style={{ display:'inline-flex',alignItems:'center',gap:10,background:'linear-gradient(135deg,#3bff7d,#1ed4a0)',color:'#031a0d',padding:'16px 32px',borderRadius:14,fontSize:15,fontWeight:800,letterSpacing:'-0.02em',boxShadow:'0 0 44px rgba(59,255,125,0.50),0 0 90px rgba(59,255,125,0.18),inset 0 1px 0 rgba(255,255,255,0.35)',transition:'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
                    Build My Resume
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>
                  <a href="#how" className="sbtn" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'16px 28px',borderRadius:14,fontSize:14,fontWeight:500,color:'rgba(255,255,255,0.45)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',transition:'all 0.2s' }}>See how it works</a>
                </div>
                <p style={{ fontSize:12,color:'rgba(255,255,255,0.16)' }}>Trusted by 2,400+ job seekers and university applicants worldwide</p>
              </div>
              <div className="hmr hmock" style={{ flex:'1 1 400px',display:'flex',justifyContent:'center' }}>
                <div className="hmock-inner" style={{ width:'100%',maxWidth:460 }}>
                  <div style={{ ...G,borderRadius:18 }}>
                    <GlassLayers/>
                    <div className="ai-scan-line"/>
                    <div style={{ position:'relative',zIndex:20 }}>
                      <div style={{ height:38,background:'rgba(0,0,0,0.4)',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',padding:'0 14px',gap:6 }}>
                        {['#FF5F57','#FEBC2E','#28C840'].map((c,i)=><div key={i} style={{ width:9,height:9,borderRadius:'50%',background:c,opacity:0.85 }}/>)}
                        <div style={{ flex:1,height:16,background:'rgba(255,255,255,0.04)',borderRadius:4,margin:'0 12px' }}/>
                      </div>
                      <div style={{ display:'flex',height:290 }}>
                        <div style={{ width:136,borderRight:'1px solid rgba(255,255,255,0.05)',padding:'10px 0' }}>
                          <div style={{ padding:'4px 12px 10px',borderBottom:'1px solid rgba(255,255,255,0.04)',marginBottom:4 }}>
                            <img src="/logo.png" alt="ICVY" style={{ height:11,opacity:0.35 }}/>
                          </div>
                          {['Personal','Summary','Experience','Education','Skills','Languages'].map((t,i)=>(
                            <div key={t} style={{ padding:'7px 12px',fontSize:9,color:i===2?'#3bff7d':'rgba(255,255,255,0.2)',background:i===2?'rgba(59,255,125,0.05)':'transparent',borderLeft:i===2?'2px solid #3bff7d':'2px solid transparent' }}>{t}</div>
                          ))}
                        </div>
                        <div style={{ flex:1,background:'rgba(8,10,22,0.85)',padding:10,display:'flex',justifyContent:'center' }}>
                          <div style={{ width:'100%',background:'#fff',borderRadius:3,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
                            <div style={{ background:'#0f1b2e',padding:'14px 12px 10px' }}>
                              <div style={{ width:80,height:9,background:'rgba(255,255,255,0.9)',borderRadius:2,marginBottom:5 }}/>
                              <div style={{ width:110,height:6,background:'rgba(255,255,255,0.3)',borderRadius:2,marginBottom:3 }}/>
                              <div style={{ width:85,height:5,background:'rgba(255,255,255,0.18)',borderRadius:2 }}/>
                            </div>
                            <div style={{ padding:'10px 12px' }}>
                              {[[42,5,'#0f1b2e'],[100,3,'#e5e7eb'],[90,3,'#e5e7eb'],[75,3,'#e5e7eb'],[42,5,'#0f1b2e'],[100,3,'#e5e7eb'],[82,3,'#e5e7eb']].map(([w,h,col],idx)=>(
                                <div key={idx} style={{ width:`${w}%`,height:h,background:col,borderRadius:1.5,marginBottom:5 }}/>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p style={{ textAlign:'center',marginTop:12,fontSize:11,color:'rgba(255,255,255,0.16)',letterSpacing:'0.04em' }}>Live preview · updates as you type</p>
                </div>
              </div>
            </div>

            {/* FEATURES */}
            <div id="features" style={{ borderTop:'1px solid rgba(255,255,255,0.05)',padding:'80px 72px' }}>
              <div style={{ marginBottom:56 }}>
                <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
                  <div style={{ width:20,height:2,borderRadius:1,background:'#3bff7d',opacity:0.7 }}/>
                  <span style={{ fontSize:11,fontWeight:700,color:'rgba(59,255,125,0.7)',letterSpacing:'0.18em',textTransform:'uppercase' }}>Features</span>
                </div>
                <h2 style={{ fontSize:'clamp(26px,3.8vw,48px)',fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.08,color:'#fff',maxWidth:520 }}>Everything you need.<br/>Nothing you don't.</h2>
              </div>
              <div className="fg" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14 }}>
                {features.map((f,i)=>(
                  <div key={i} className="fc" style={{ ...G,borderRadius:20,padding:'24px 20px' }}>
                    <GlassLayers/>
                    <div style={{ position:'relative',zIndex:20 }}>
                      <div style={{ width:38,height:38,borderRadius:10,background:f.bg,border:`1px solid ${f.border}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14 }}>
                        <div style={{ width:13,height:13,borderRadius:3,background:f.color,boxShadow:`0 0 8px ${f.color}88` }}/>
                      </div>
                      <h3 style={{ fontSize:13.5,fontWeight:700,color:'rgba(255,255,255,0.9)',marginBottom:8 }}>{f.title}</h3>
                      <p style={{ fontSize:12.5,color:'rgba(255,255,255,0.33)',lineHeight:1.75,margin:0 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HOW IT WORKS heading only — StepsSection is OUTSIDE the glass card */}
            <div id="how" style={{ borderTop:'1px solid rgba(255,255,255,0.05)',padding:'80px 72px 40px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
                <div style={{ width:20,height:2,borderRadius:1,background:'#4f8fff',opacity:0.7 }}/>
                <span style={{ fontSize:11,fontWeight:700,color:'rgba(79,143,255,0.7)',letterSpacing:'0.18em',textTransform:'uppercase' }}>How it works</span>
              </div>
              <h2 style={{ fontSize:'clamp(26px,3.8vw,48px)',fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.08,color:'#fff' }}>Four steps.<br/>Under three minutes.</h2>
            </div>
            <StepsSection/>

          </div>
        </div>{/* /glass card */}
      </div>


      {/* ── rest of page ── */}
      <div style={{ position:'relative',zIndex:2,maxWidth:1260,margin:'0 auto',padding:'0 48px' }}>

        {/* REVIEWS */}
        <div id="reviews" style={{ padding:'100px 0',overflow:'hidden' }}>
          <div style={{ padding:'0 24px',marginBottom:48 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
              <div style={{ width:20,height:2,borderRadius:1,background:'#a78bfa',opacity:0.7 }}/>
              <span style={{ fontSize:11,fontWeight:700,color:'rgba(167,139,250,0.7)',letterSpacing:'0.18em',textTransform:'uppercase' }}>Reviews</span>
            </div>
            <h2 style={{ fontSize:'clamp(24px,3.8vw,44px)',fontWeight:900,letterSpacing:'-0.04em',color:'#fff' }}>Loved by people who got hired.</h2>
          </div>
          <div style={{ overflow:'hidden',marginBottom:12 }}>
            <div className="mq">{[...reviews,...reviews].map((r,i)=><ReviewCard key={i} r={r}/>)}</div>
          </div>
          <div style={{ overflow:'hidden' }}>
            <div className="mq2">{[...reviews.slice().reverse(),...reviews.slice().reverse()].map((r,i)=><ReviewCard key={i} r={r}/>)}</div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding:'0 0 120px' }}>
          <div style={{ ...G,borderRadius:28,padding:'72px 56px',textAlign:'center' }}>
            <GlassLayers/>
            <div style={{ position:'relative',zIndex:20 }}>
              <img src="/logo.png" alt="ICVY" style={{ height:38,objectFit:'contain',marginBottom:24 }}/>
              <h2 style={{ fontSize:'clamp(24px,3.8vw,44px)',fontWeight:900,letterSpacing:'-0.04em',color:'#fff',marginBottom:12 }}>Build your next opportunity.</h2>
              <p style={{ fontSize:15,color:'rgba(255,255,255,0.34)',marginBottom:36,lineHeight:1.7 }}>No account. No credit card. Upload your LinkedIn PDF and go.</p>
              <Link href="/app" className="gbtn" style={{ display:'inline-flex',alignItems:'center',gap:10,background:'linear-gradient(135deg,#3bff7d,#1ed4a0)',color:'#031a0d',padding:'16px 40px',borderRadius:14,fontSize:15,fontWeight:800,boxShadow:'0 0 44px rgba(59,255,125,0.50),0 0 90px rgba(59,255,125,0.18),inset 0 1px 0 rgba(255,255,255,0.35)',transition:'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
                Build My Resume
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </div>
        </div>

      </div>

      <footer style={{ position:'relative',zIndex:2,borderTop:'1px solid rgba(255,255,255,0.04)',padding:'22px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
        <img src="/logo.png" alt="ICVY" style={{ height:20,objectFit:'contain',opacity:0.6 }}/>
        <p style={{ fontSize:11,color:'rgba(255,255,255,0.15)' }}>© 2026 ICVY · Built to get you hired.</p>
      </footer>
    </div>
  )
}