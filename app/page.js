'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const features = [
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#3BFF7D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, color:'#3BFF7D', bg:'rgba(59,255,125,0.07)', border:'rgba(59,255,125,0.15)', title:'Instant AI Extraction', desc:'Upload your LinkedIn PDF and AI instantly parses every detail — name, roles, education, skills, languages — into a clean structure.' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="9" height="18" rx="2" stroke="#60A5FA" strokeWidth="1.8"/><rect x="13" y="3" width="9" height="18" rx="2" stroke="#60A5FA" strokeWidth="1.8"/></svg>, color:'#60A5FA', bg:'rgba(96,165,250,0.07)', border:'rgba(96,165,250,0.15)', title:'Live Split Editor', desc:'Edit any field on the left and watch your A4 resume update in real time on the right. WYSIWYG, always.' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#3BFF7D" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="#3BFF7D" strokeWidth="1.8" strokeLinecap="round"/></svg>, color:'#3BFF7D', bg:'rgba(59,255,125,0.07)', border:'rgba(59,255,125,0.15)', title:'ATS Job Tailoring', desc:'Paste a job description. AI rewrites your resume keywords to match it — without inventing a single false fact.' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, color:'#A78BFA', bg:'rgba(167,139,250,0.07)', border:'rgba(167,139,250,0.15)', title:'Cover Letter AI', desc:'One click generates a tailored, human-sounding cover letter. Edit and download as a text file instantly.' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="#FCD34D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="#FCD34D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, color:'#FCD34D', bg:'rgba(252,211,77,0.07)', border:'rgba(252,211,77,0.15)', title:'Smart Completeness', desc:'Real-time warnings flag every missing field — LinkedIn URL, date of birth, GPA — before you apply.' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 12v5c3 3 9 3 12 0v-5" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, color:'#34D399', bg:'rgba(52,211,153,0.07)', border:'rgba(52,211,153,0.15)', title:'University Ready', desc:'Includes nationality, DOB, volunteer work, references, and languages — fields universities actually require.' },
]

const steps = [
  { num:'01', title:'Export from LinkedIn', body:'Go to your LinkedIn profile, click More, then Save to PDF. Takes about 30 seconds. No special format required — just the standard export.', tag:'LinkedIn Export' },
  { num:'02', title:'Upload & AI Extracts', body:'Drop your PDF into ICVY. Our AI reads every line — job titles, dates, education, skills, languages — and structures everything perfectly.', tag:'AI Processing' },
  { num:'03', title:'Edit & Tailor', body:'Refine any detail in the live editor. Add missing fields, paste a job description for ATS tailoring, generate a cover letter with one click.', tag:'Smart Editor' },
  { num:'04', title:'Download & Apply', body:'Export a polished A4 resume as PDF. Apply with confidence knowing your resume is complete, formatted, and optimized.', tag:'Ready to Apply' },
]

const reviews = [
  { name:'Asel Nurlanovna',  role:'Marketing Graduate · Almaty',        init:'AN', text:'Had a job-ready resume in under 3 minutes. The ATS tailoring helped me get callbacks I thought were impossible.' },
  { name:'James Okonkwo',    role:'Software Engineer · Lagos',           init:'JO', text:'The cover letter generator alone is worth it. I used to spend hours per application. Landed my first international role.' },
  { name:'Priya Sharma',     role:'MBA Applicant · Mumbai',              init:'PS', text:'The missing fields feature is brilliant. It flagged my LinkedIn URL and DOB. Got into my first choice university.' },
  { name:'Damir Xolnazarov', role:'International Relations · Tashkent', init:'DX', text:'Finally a tool that understands what universities want. The volunteer and languages sections are things other builders ignore.' },
  { name:'Léa Fontaine',     role:'UX Designer · Paris',                init:'LF', text:'Clean, fast, and the resume looks great. I tried Kickresume and Resume.io — ICVY beats them for simplicity.' },
  { name:'Carlos Mendez',    role:'Business Analyst · Mexico City',      init:'CM', text:'The live preview is a game changer. You see exactly what your resume looks like as you type.' },
]

// ── Sticky Scroll Steps ─────────────────────────────────────
function StepsSection() {
  const [active, setActive] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onScroll = () => {
      const rect = container.getBoundingClientRect()
      const total = container.offsetHeight - window.innerHeight
      const scrolled = -rect.top
      const pct = Math.max(0, Math.min(1, scrolled / total))
      setActive(Math.min(steps.length - 1, Math.floor(pct * steps.length)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={containerRef} style={{ height:`${steps.length * 100}vh`, position:'relative' }}>
      <div style={{ position:'sticky', top:0, height:'100vh', display:'flex', alignItems:'center', overflow:'hidden' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 48px', width:'100%', display:'flex', gap:100, alignItems:'center' }}>

          {/* Left — step list */}
          <div style={{ display:'flex', flexDirection:'column', position:'relative', flexShrink:0, gap:0 }}>
            {/* Track */}
            <div style={{ position:'absolute', left:22, top:28, bottom:28, width:1, background:'rgba(255,255,255,0.05)' }}>
              <div style={{ width:'100%', background:'linear-gradient(to bottom,#3BFF7D,#60A5FA)', transition:'height 0.5s cubic-bezier(0.16,1,0.3,1)', height:`${(active/(steps.length-1))*100}%`, boxShadow:'0 0 8px rgba(59,255,125,0.4)' }}/>
            </div>

            {steps.map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:18, padding:'18px 0', position:'relative' }}>
                {/* Circle */}
                <div style={{
                  width:44, height:44, borderRadius:'50%', flexShrink:0, zIndex:1,
                  border:`1.5px solid ${i===active ? 'rgba(59,255,125,0.5)' : 'rgba(255,255,255,0.06)'}`,
                  background: i===active ? 'rgba(59,255,125,0.1)' : 'rgba(10,14,26,1)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.45s cubic-bezier(0.16,1,0.3,1)',
                  boxShadow: i===active ? '0 0 0 4px rgba(59,255,125,0.07), 0 0 20px rgba(59,255,125,0.15)' : 'none',
                }}>
                  {i < active
                    ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#3BFF7D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.04em', color: i===active ? '#3BFF7D' : 'rgba(255,255,255,0.2)', fontFamily:"'SF Mono','Fira Code',monospace" }}>{s.num}</span>
                  }
                </div>
                <span style={{ fontSize:14, fontWeight: i===active ? 600 : 400, color: i===active ? '#fff' : 'rgba(255,255,255,0.22)', transition:'all 0.35s', letterSpacing:'-0.01em', whiteSpace:'nowrap' }}>{s.title}</span>
              </div>
            ))}
          </div>

          {/* Right — content */}
          <div style={{ flex:1, position:'relative', height:320 }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                position:'absolute', inset:0,
                opacity: i===active ? 1 : 0,
                transform: i===active ? 'translateY(0) scale(1)' : i < active ? 'translateY(-28px) scale(0.96)' : 'translateY(28px) scale(0.96)',
                transition:'all 0.55s cubic-bezier(0.16,1,0.3,1)',
                pointerEvents: i===active ? 'auto' : 'none',
                display:'flex', flexDirection:'column', justifyContent:'center',
              }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(59,255,125,0.06)', border:'1px solid rgba(59,255,125,0.18)', borderRadius:100, padding:'5px 16px', marginBottom:28, width:'fit-content' }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#3BFF7D', boxShadow:'0 0 6px #3BFF7D' }}/>
                  <span style={{ fontSize:11, fontWeight:600, color:'#3BFF7D', letterSpacing:'0.1em', textTransform:'uppercase' }}>{s.tag}</span>
                </div>
                <h3 style={{ fontSize:'clamp(32px,4vw,52px)', fontWeight:800, color:'#fff', letterSpacing:'-0.03em', lineHeight:1.1, margin:'0 0 22px' }}>{s.title}</h3>
                <p style={{ fontSize:17, color:'rgba(255,255,255,0.4)', lineHeight:1.8, maxWidth:480, margin:'0 0 36px' }}>{s.body}</p>
                {/* Step counter */}
                <div style={{ display:'flex', gap:6 }}>
                  {steps.map((_,j) => (
                    <div key={j} style={{ height:2, borderRadius:2, transition:'all 0.4s ease', background: j===active ? '#3BFF7D' : 'rgba(255,255,255,0.08)', width: j===active ? 24 : 8 }}/>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Review Card ─────────────────────────────────────────────
function ReviewCard({ r }) {
  return (
    <div style={{ width:300, flexShrink:0, margin:'0 8px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'22px' }}>
      <div style={{ display:'flex', gap:2, marginBottom:14 }}>
        {[1,2,3,4,5].map(i=>(
          <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        ))}
      </div>
      <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.42)', lineHeight:1.8, fontStyle:'italic', marginBottom:18 }}>"{r.text}"</p>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,rgba(59,255,125,0.15),rgba(37,99,235,0.2))', border:'1px solid rgba(59,255,125,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#3BFF7D', flexShrink:0 }}>{r.init}</div>
        <div>
          <p style={{ fontSize:12, fontWeight:600, color:'#fff', margin:0 }}>{r.name}</p>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)', margin:'2px 0 0' }}>{r.role}</p>
        </div>
      </div>
    </div>
  )
}

// ── Main Landing ─────────────────────────────────────────────
export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive:true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ background:'#070a14', color:'#fff', fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif", overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;} html{scroll-behavior:smooth;} a{text-decoration:none;color:inherit;}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes gradTxt{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes pulse{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.15)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .hero-badge{animation:fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both;}
        .hero-title{animation:fadeUp 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both;}
        .hero-sub{animation:fadeUp 0.7s 0.18s cubic-bezier(0.16,1,0.3,1) both;}
        .hero-btns{animation:fadeUp 0.7s 0.24s cubic-bezier(0.16,1,0.3,1) both;}
        .hero-mock{animation:fadeUp 0.9s 0.15s cubic-bezier(0.16,1,0.3,1) both;}
        .mock-float{animation:float 8s ease-in-out infinite;}
        .grad-word{background:linear-gradient(135deg,#60A5FA 0%,#818CF8 40%,#A78BFA 70%,#C084FC 100%);background-size:200%;animation:gradTxt 5s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .nav-pill{transition:background 0.3s,box-shadow 0.3s;}
        .nav-link:hover{color:rgba(255,255,255,0.9)!important;}
        .feat-card{transition:all 0.3s cubic-bezier(0.16,1,0.3,1);}
        .feat-card:hover{transform:translateY(-4px)!important;border-color:rgba(255,255,255,0.11)!important;background:rgba(255,255,255,0.04)!important;}
        .btn-primary{transition:all 0.22s cubic-bezier(0.16,1,0.3,1);}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(59,255,125,0.45),0 0 80px rgba(59,255,125,0.12)!important;}
        .btn-ghost:hover{background:rgba(255,255,255,0.08)!important;color:#fff!important;border-color:rgba(255,255,255,0.14)!important;}
        .mq{display:flex;width:max-content;animation:marquee 36s linear infinite;}
        .mq:hover{animation-play-state:paused;}
        .mq2{display:flex;width:max-content;animation:marquee 28s linear infinite reverse;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}
        @media(max-width:900px){.hi{flex-direction:column!important;padding:80px 24px 60px!important;gap:48px!important;}.hr{display:none!important;}.fg{grid-template-columns:1fr 1fr!important;}.nc{display:none!important;}}
        @media(max-width:600px){.fg{grid-template-columns:1fr!important;}.ht{font-size:38px!important;}}
      `}</style>

      {/* Background blobs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-8%', left:'-4%', width:800, height:800, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(37,99,235,0.14) 0%,transparent 60%)' }}/>
        <div style={{ position:'absolute', top:'25%', right:'-8%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(124,58,237,0.1) 0%,transparent 60%)' }}/>
        <div style={{ position:'absolute', bottom:0, left:'25%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(16,185,129,0.05) 0%,transparent 60%)' }}/>
      </div>

      {/* ── NAV ── */}
      <div style={{ position:'fixed', top:20, left:0, right:0, zIndex:100, display:'flex', justifyContent:'center', padding:'0 24px' }}>
        <div className="nav-pill" style={{ display:'flex', alignItems:'center', gap:6, background:scrolled?'rgba(10,12,22,0.92)':'rgba(10,12,22,0.75)', backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:100, padding:'6px 8px 6px 20px', boxShadow:scrolled?'0 8px 40px rgba(0,0,0,0.55)':'0 4px 24px rgba(0,0,0,0.3)', transition:'all 0.3s' }}>
          <img src="/logo.png" alt="ICVY" style={{ height:26, objectFit:'contain', marginRight:10 }}/>
          <div className="nc" style={{ display:'flex', gap:2 }}>
            {[['#features','Features'],['#how','How it works'],['#reviews','Reviews']].map(([href,label])=>(
              <a key={href} href={href} className="nav-link" style={{ fontSize:14, fontWeight:500, color:'rgba(255,255,255,0.42)', padding:'8px 14px', borderRadius:8, transition:'color 0.15s' }}>{label}</a>
            ))}
          </div>
          <Link href="/signin" className="nav-link" style={{ fontSize:14, fontWeight:500, color:'rgba(255,255,255,0.35)', padding:'8px 14px', borderRadius:8, transition:'color 0.15s' }}>Sign in</Link>
          <Link href="/app" className="btn-primary" style={{ background:'#3BFF7D', color:'#050a14', padding:'9px 22px', borderRadius:100, fontSize:13, fontWeight:700, letterSpacing:'-0.01em', boxShadow:'0 0 20px rgba(59,255,125,0.3)', display:'inline-flex', alignItems:'center', gap:6 }}>
            Get Started
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </div>

      {/* ── HERO ── */}
      <section style={{ position:'relative', zIndex:1, minHeight:'100vh', paddingTop:100 }}>
        <div className="hi" style={{ maxWidth:1100, margin:'0 auto', padding:'80px 48px', display:'flex', alignItems:'center', gap:72 }}>
          <div style={{ flex:'1 1 480px', display:'flex', flexDirection:'column', gap:28 }}>
            <div className="hero-badge" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:100, padding:'7px 16px', width:'fit-content' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#3BFF7D', boxShadow:'0 0 8px #3BFF7D', animation:'pulse 2.5s ease infinite', flexShrink:0 }}/>
              <span style={{ fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.45)', letterSpacing:'0.01em' }}>AI-Powered · Free · No account required</span>
            </div>
            <h1 className="hero-title ht" style={{ fontSize:'clamp(44px,5.5vw,72px)', fontWeight:800, lineHeight:1.05, letterSpacing:'-0.04em', color:'#fff' }}>
              Your Resume,<br/><span className="grad-word">Built by AI.</span>
            </h1>
            <p className="hero-sub" style={{ fontSize:18, color:'rgba(255,255,255,0.4)', lineHeight:1.8, maxWidth:460 }}>
              Transform a LinkedIn export into a polished, ATS-optimized resume. Live editor, job tailoring, cover letter — all in one place.
            </p>
            <div className="hero-btns" style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <Link href="/app" className="btn-primary" style={{ display:'inline-flex', alignItems:'center', gap:10, background:'#3BFF7D', color:'#050a14', padding:'15px 32px', borderRadius:14, fontSize:15, fontWeight:700, letterSpacing:'-0.02em', boxShadow:'0 0 28px rgba(59,255,125,0.35)' }}>
                Build My Resume
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <a href="#how" className="btn-ghost" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 28px', borderRadius:14, fontSize:14, fontWeight:500, color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', transition:'all 0.2s' }}>See how it works</a>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.18)', fontWeight:400 }}>Trusted by 2,400+ job seekers and university applicants worldwide</p>
          </div>

          {/* Mock editor */}
          <div className="hr" style={{ flex:'1 1 400px', display:'flex', justifyContent:'center' }}>
            <div className="hero-mock" style={{ width:'100%', maxWidth:480 }}>
              <div className="mock-float" style={{ background:'rgba(12,15,28,0.95)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, overflow:'hidden', boxShadow:'0 0 60px rgba(37,99,235,0.1),0 40px 80px rgba(0,0,0,0.6)' }}>
                <div style={{ height:40, background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', padding:'0 14px', gap:6 }}>
                  {['#FF5F57','#FEBC2E','#28C840'].map((c,i)=><div key={i} style={{ width:10,height:10,borderRadius:'50%',background:c }}/>)}
                  <div style={{ flex:1, height:18, background:'rgba(255,255,255,0.04)', borderRadius:5, margin:'0 12px' }}/>
                </div>
                <div style={{ display:'flex', height:300 }}>
                  <div style={{ width:140, borderRight:'1px solid rgba(255,255,255,0.05)', padding:'10px 0' }}>
                    <div style={{ padding:'4px 12px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)', marginBottom:4 }}>
                      <img src="/logo.png" alt="ICVY" style={{ height:12, opacity:0.4 }}/>
                    </div>
                    {['Personal','Summary','Experience','Education','Skills','Languages'].map((t,i)=>(
                      <div key={t} style={{ padding:'7px 12px', fontSize:9.5, color:i===2?'#3BFF7D':'rgba(255,255,255,0.2)', background:i===2?'rgba(59,255,125,0.06)':'transparent', borderLeft:i===2?'2px solid #3BFF7D':'2px solid transparent' }}>{t}</div>
                    ))}
                  </div>
                  <div style={{ flex:1, background:'#1a1f36', padding:10, display:'flex', justifyContent:'center' }}>
                    <div style={{ width:'100%', background:'#fff', borderRadius:3, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
                      <div style={{ background:'#0f1b2e', padding:'14px 12px 10px' }}>
                        <div style={{ width:80, height:9, background:'rgba(255,255,255,0.9)', borderRadius:2, marginBottom:5 }}/>
                        <div style={{ width:110, height:6, background:'rgba(255,255,255,0.3)', borderRadius:2, marginBottom:3 }}/>
                        <div style={{ width:85, height:5, background:'rgba(255,255,255,0.18)', borderRadius:2 }}/>
                      </div>
                      <div style={{ padding:'10px 12px' }}>
                        {[[42,5,'#0f1b2e'],[100,3,'#e5e7eb'],[90,3,'#e5e7eb'],[75,3,'#e5e7eb'],[42,5,'#0f1b2e'],[100,3,'#e5e7eb'],[82,3,'#e5e7eb']].map(([w,h,c],i)=>(
                          <div key={i} style={{ width:`${w}%`,height:h,background:c,borderRadius:1.5,marginBottom:5 }}/>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p style={{ textAlign:'center', marginTop:14, fontSize:11, color:'rgba(255,255,255,0.18)', letterSpacing:'0.04em' }}>Live preview · updates as you type</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ position:'relative', zIndex:1, padding:'120px 48px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ marginBottom:64 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:24, height:2, background:'#3BFF7D', borderRadius:2 }}/>
              <span style={{ fontSize:11, fontWeight:700, color:'#3BFF7D', letterSpacing:'0.14em', textTransform:'uppercase' }}>Features</span>
            </div>
            <h2 style={{ fontSize:'clamp(30px,4vw,52px)', fontWeight:800, letterSpacing:'-0.035em', lineHeight:1.1, color:'#fff', maxWidth:560 }}>Everything you need.<br/>Nothing you don't.</h2>
          </div>
          <div className="fg" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {features.map((f,i)=>(
              <div key={i} className="feat-card" style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'28px 24px', cursor:'default' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:f.bg, border:`1px solid ${f.border}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:9, letterSpacing:'-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.35)', lineHeight:1.8, margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — sticky scroll steps ── */}
      <section id="how" style={{ position:'relative', zIndex:1, background:'rgba(255,255,255,0.008)', borderTop:'1px solid rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'100px 48px 60px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:24, height:2, background:'#60A5FA', borderRadius:2 }}/>
            <span style={{ fontSize:11, fontWeight:700, color:'#60A5FA', letterSpacing:'0.14em', textTransform:'uppercase' }}>How it works</span>
          </div>
          <h2 style={{ fontSize:'clamp(30px,4vw,52px)', fontWeight:800, letterSpacing:'-0.035em', lineHeight:1.1, color:'#fff' }}>Four steps.<br/>Under three minutes.</h2>
        </div>
        <StepsSection/>
        <div style={{ height:80 }}/>
      </section>

      {/* ── REVIEWS ── */}
      <section id="reviews" style={{ position:'relative', zIndex:1, padding:'120px 0', overflow:'hidden' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 48px', marginBottom:56 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:24, height:2, background:'#A78BFA', borderRadius:2 }}/>
            <span style={{ fontSize:11, fontWeight:700, color:'#A78BFA', letterSpacing:'0.14em', textTransform:'uppercase' }}>Reviews</span>
          </div>
          <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-0.035em', color:'#fff' }}>Loved by people who got hired.</h2>
        </div>
        <div style={{ overflow:'hidden', marginBottom:12 }}>
          <div className="mq">{[...reviews,...reviews].map((r,i)=><ReviewCard key={i} r={r}/>)}</div>
        </div>
        <div style={{ overflow:'hidden' }}>
          <div className="mq2">{[...reviews.slice().reverse(),...reviews.slice().reverse()].map((r,i)=><ReviewCard key={i} r={r}/>)}</div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position:'relative', zIndex:1, padding:'120px 48px' }}>
        <div style={{ maxWidth:760, margin:'0 auto', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:28, padding:'72px 48px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 0%, rgba(59,255,125,0.04) 0%, transparent 60%)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:0, insetInline:0, height:1, background:'linear-gradient(90deg, transparent, rgba(59,255,125,0.3), transparent)' }}/>
          <div style={{ position:'relative', zIndex:1 }}>
            <img src="/logo.png" alt="ICVY" style={{ height:40, objectFit:'contain', marginBottom:24 }}/>
            <h2 style={{ fontSize:'clamp(28px,4vw,46px)', fontWeight:800, letterSpacing:'-0.035em', color:'#fff', marginBottom:14 }}>Build your next opportunity.</h2>
            <p style={{ fontSize:15, color:'rgba(255,255,255,0.36)', marginBottom:36, lineHeight:1.7 }}>No account. No credit card. Upload your LinkedIn PDF and go.</p>
            <Link href="/app" className="btn-primary" style={{ display:'inline-flex', alignItems:'center', gap:10, background:'#3BFF7D', color:'#050a14', padding:'16px 40px', borderRadius:14, fontSize:15, fontWeight:700, letterSpacing:'-0.02em', boxShadow:'0 0 32px rgba(59,255,125,0.38)' }}>
              Build My Resume
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position:'relative', zIndex:1, borderTop:'1px solid rgba(255,255,255,0.05)', padding:'28px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <img src="/logo.png" alt="ICVY" style={{ height:22, objectFit:'contain' }}/>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.18)' }}>© 2026 ICVY · Built to get you hired.</p>
      </footer>
    </div>
  )
}