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

// ── AI Analysis Panel ─────────────────────────────────────────
function AnalysisPanel({ resumeData, onClose }) {
  const [phase,   setPhase]   = useState('loading')
  const [score,   setScore]   = useState(null)
  const [visible, setVisible] = useState(false)
  const [typeIdx, setTypeIdx] = useState(0)
  const canvasRef = useRef(null)

  const THINKING = ['Analyzing your experience...','Evaluating impact statements...','Scanning ATS compatibility...','Reviewing skill alignment...','Generating recommendations...']

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

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      vx: (Math.random()-.5)*0.35, vy: (Math.random()-.5)*0.35,
      r: Math.random()*2+1, phase: Math.random()*Math.PI*2,
      color: Math.random() > 0.3 ? '59,255,125' : '139,92,246',
    }))
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      particles.forEach((p,i) => {
        p.x+=p.vx; p.y+=p.vy; p.phase+=0.02
        if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0
        if(p.y<0)p.y=canvas.height; if(p.y>canvas.height)p.y=0
        const o = 0.2 + Math.sin(p.phase)*0.2
        for(let j=i+1;j<particles.length;j++){
          const q=particles[j],d=Math.hypot(p.x-q.x,p.y-q.y)
          if(d<100){ ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.strokeStyle=`rgba(59,255,125,${((100-d)/100)*0.12})`; ctx.lineWidth=0.6; ctx.stroke() }
        }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(${p.color},${o})`; ctx.fill()
      })
      raf=requestAnimationFrame(draw)
    }
    draw()
    return ()=>cancelAnimationFrame(raf)
  }, [])

  const close = () => { setVisible(false); setTimeout(onClose, 380) }
  const sColor = s => s==='strong'?'#3BFF7D':s==='needs-work'?'#F59E0B':'#EF4444'
  const sLabel = s => s==='strong'?'Strong':s==='needs-work'?'Needs Work':'Missing'

  return (
    <>
      <div onClick={close} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', zIndex:200, opacity:visible?1:0, transition:'opacity 0.35s ease' }}/>
      <div style={{
        position:'fixed', left:0, right:0, bottom:0, zIndex:201,
        background:'rgba(8,11,20,0.98)', backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
        borderTop:'1px solid rgba(255,255,255,0.07)', borderRadius:'28px 28px 0 0',
        maxHeight:'88vh', overflowY:'auto',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.45s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '0 -40px 100px rgba(0,0,0,0.8)',
      }}>
        <div style={{ position:'absolute', top:0, insetInline:0, height:1, background:'linear-gradient(90deg, transparent, #3BFF7D, #8B5CF6, #3BFF7D, transparent)' }}/>
        <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:100, background:'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents:'none' }}/>

        <div style={{ width:40, height:4, background:'rgba(255,255,255,0.12)', borderRadius:4, margin:'16px auto 0' }}/>

        <div style={{ maxWidth:760, margin:'0 auto', padding:'24px 32px 56px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,rgba(59,255,125,0.15),rgba(139,92,246,0.15))', border:'1px solid rgba(59,255,125,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#3BFF7D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <p style={{ color:'#f1f5f9', fontWeight:700, fontSize:15, margin:0 }}>AI Resume Analysis</p>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, margin:0, marginTop:2 }}>Powered by Groq · Llama 3.3</p>
              </div>
            </div>
            <button onClick={close} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, width:34, height:34, cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          {phase==='loading' && (
            <div style={{ position:'relative', minHeight:320, borderRadius:16, overflow:'hidden', background:'rgba(255,255,255,0.015)', border:'1px solid rgba(255,255,255,0.05)' }}>
              <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}/>
              <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:320, gap:24 }}>
                <div style={{ position:'relative', width:64, height:64 }}>
                  <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.06)' }}/>
                  <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'#3BFF7D', animation:'spin 1.1s linear infinite' }}/>
                  <div style={{ position:'absolute', inset:8, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'#8B5CF6', animation:'spin 0.75s linear infinite reverse' }}/>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#3BFF7D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <p key={typeIdx} style={{ color:'#f1f5f9', fontWeight:600, fontSize:14, margin:'0 0 6px' }}>{THINKING[typeIdx]}</p>
                  <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>Reading your resume with AI...</p>
                </div>
              </div>
            </div>
          )}

          {phase==='error' && (
            <div style={{ textAlign:'center', padding:'64px 0' }}>
              <p style={{ color:'#F87171', fontSize:14 }}>Analysis failed. Please try again.</p>
            </div>
          )}

          {phase==='done' && score && (
            <>
              <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'20px 24px', marginBottom:20, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
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
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(score.sections||[]).map((sec,i) => (
                  <div key={i} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderLeft:`3px solid ${sColor(sec.status)}`, borderRadius:14, padding:'18px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ color:'#f1f5f9', fontWeight:600, fontSize:14 }}>{sec.title}</span>
                      <span style={{ background:`${sColor(sec.status)}15`, color:sColor(sec.status), fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:6, letterSpacing:'0.06em', textTransform:'uppercase', border:`1px solid ${sColor(sec.status)}25` }}>
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

// ── Empty State ───────────────────────────────────────────────
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

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const { data:session, status } = useSession()
  const router = useRouter()
  const [resumes,        setResumes]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [deleting,       setDeleting]       = useState(null)
  const [downloading,    setDownloading]    = useState(null)
  const [analysisResume, setAnalysisResume] = useState(null)
  const [hoveredCard,    setHoveredCard]    = useState(null)

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

  const handleEdit = (resume) => { sessionStorage.setItem('editResume', JSON.stringify(resume)); router.push('/app') }

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

  if (status==='loading'||loading) return (
    <div style={{ minHeight:'100vh', background:'#070a14', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        <div style={{ width:40, height:40, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'#3BFF7D', animation:'spin 1s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13 }}>Loading your workspace...</p>
      </div>
    </div>
  )

  const totalDownloads  = resumes.filter(r=>r.last_downloaded).length
  const lastEdited      = resumes.length ? resumes[0].updated_at : null
  const avgCompletion   = resumes.length ? Math.round(resumes.reduce((a,r)=>a+calcCompletion(r.data),0)/resumes.length) : 0
  const completeCount   = resumes.filter(r=>calcCompletion(r.data)===100).length

  return (
    <div style={{ minHeight:'100vh', background:'#070a14', fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif", color:'#fff' }}>
      {analysisResume && <AnalysisPanel resumeData={analysisResume} onClose={()=>setAnalysisResume(null)}/>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Inter',sans-serif;background:#070a14;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .card-appear{animation:fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px;}
        @media(max-width:900px){.resume-grid{grid-template-columns:1fr 1fr!important;}}
        @media(max-width:560px){.resume-grid{grid-template-columns:1fr!important;}.dash-stats{flex-direction:column!important;gap:12px!important;padding:16px!important;}.nav-name{display:none!important;}}
      `}</style>

      {/* Background blobs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-10%', left:'-5%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(37,99,235,0.08) 0%,transparent 60%)' }}/>
        <div style={{ position:'absolute', bottom:0, right:0, width:500, height:500, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(124,58,237,0.06) 0%,transparent 60%)' }}/>
      </div>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:50, height:56, background:'rgba(7,10,20,0.88)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', padding:'0 28px', justifyContent:'space-between' }}>
        <img src="/logo.png" alt="ICVY" style={{ height:28, objectFit:'contain' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={()=>router.push('/profile')} style={{ background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:9, padding:'6px 10px', borderRadius:9, transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            {session?.user?.image
              ? <img src={session.user.image} alt="avatar" style={{ width:28, height:28, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.1)', objectFit:'cover' }}/>
              : <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#3BFF7D,#00C853)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#050508', flexShrink:0 }}>
                  {(session?.user?.name||session?.user?.email||'?')[0].toUpperCase()}
                </div>
            }
            <span className="nav-name" style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>{session?.user?.name||session?.user?.email}</span>
          </button>
          <button onClick={()=>signOut({callbackUrl:'/signin'})} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'6px 14px', color:'rgba(255,255,255,0.35)', fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit' }}
            onMouseEnter={e=>{e.currentTarget.style.color='rgba(255,255,255,0.75)';e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}}
            onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.35)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}}>
            Sign out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth:1140, margin:'0 auto', padding:'44px 28px 80px', position:'relative', zIndex:1 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28, flexWrap:'wrap', gap:14 }}>
          <div>
            <h1 style={{ color:'#fff', fontSize:26, fontWeight:800, letterSpacing:'-0.03em', marginBottom:4 }}>My Resumes</h1>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:14 }}>Manage, edit and download all your resumes</p>
          </div>
          <button onClick={()=>router.push('/app')} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#3BFF7D', color:'#050508', border:'none', borderRadius:10, padding:'11px 22px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 20px rgba(59,255,125,0.3)', transition:'all 0.2s ease', whiteSpace:'nowrap' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 0 28px rgba(59,255,125,0.5)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 0 20px rgba(59,255,125,0.3)'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
            New Resume
          </button>
        </div>

        {/* Stats */}
        {resumes.length > 0 && (
          <div className="dash-stats" style={{ display:'flex', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'18px 32px', marginBottom:36 }}>
            {[
              { num:resumes.length, label:resumes.length===1?'Resume':'Resumes' },
              { num:avgCompletion+'%', label:'Avg. completion' },
              { num:lastEdited ? timeAgo(lastEdited) : '—', label:'Last edited' },
              { num:completeCount, label:'Complete' },
              { num:totalDownloads, label:'Downloaded' },
            ].map((s,i,arr) => (
              <div key={i} style={{ display:'flex', alignItems:'center', flex:1, minWidth:0 }}>
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

            {/* New card */}
            <div className="card-appear" onClick={()=>router.push('/app')} style={{ background:'rgba(59,255,125,0.02)', border:'2px dashed rgba(59,255,125,0.14)', borderRadius:18, minHeight:280, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.25s ease', gap:10 }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(59,255,125,0.38)';e.currentTarget.style.background='rgba(59,255,125,0.04)';e.currentTarget.style.transform='translateY(-4px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(59,255,125,0.14)';e.currentTarget.style.background='rgba(59,255,125,0.02)';e.currentTarget.style.transform='none'}}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(59,255,125,0.07)', border:'1px solid rgba(59,255,125,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#3BFF7D" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <p style={{ color:'#3BFF7D', fontWeight:600, fontSize:13, margin:0 }}>New Resume</p>
              <p style={{ color:'rgba(255,255,255,0.2)', fontSize:11, margin:0 }}>Upload LinkedIn PDF</p>
            </div>

            {resumes.map((r,idx) => {
              const pct     = calcCompletion(r.data)
              const isHover = hoveredCard === r.id
              return (
                <div key={r.id} className="card-appear" style={{ animationDelay:`${idx*60}ms`, position:'relative', background:'rgba(255,255,255,0.025)', border:`1px solid ${isHover ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.07)'}`, borderRadius:18, overflow:'hidden', transition:'all 0.28s cubic-bezier(0.16,1,0.3,1)', transform:isHover ? 'translateY(-6px)' : 'none', boxShadow:isHover ? '0 24px 72px rgba(0,0,0,0.55)' : '0 4px 24px rgba(0,0,0,0.3)' }}
                  onMouseEnter={()=>setHoveredCard(r.id)} onMouseLeave={()=>setHoveredCard(null)}>

                  {/* Thumbnail */}
                  <div style={{ position:'relative', height:200, overflow:'hidden', background:'#0d1420' }}>
                    <img src={`/templates/${r.template||'sidebar'}.png`} alt={TEMPLATE_LABELS[r.template]||'Resume'} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center', display:'block' }}/>
                    {r.accent_color && r.template!=='heritage' && <div style={{ position:'absolute', inset:0, background:r.accent_color, mixBlendMode:'hue', opacity:0.22, pointerEvents:'none' }}/>}
                    <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', color:'rgba(255,255,255,0.8)', fontSize:9, fontWeight:700, padding:'3px 9px', borderRadius:6, letterSpacing:'0.08em', textTransform:'uppercase', border:'1px solid rgba(255,255,255,0.1)' }}>
                      {TEMPLATE_LABELS[r.template]||r.template}
                    </div>
                    <div style={{ position:'absolute', top:8, right:8 }}><CompletionRing pct={pct}/></div>

                    {/* Hover overlay */}
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(7,10,20,0.97) 0%, rgba(7,10,20,0.6) 55%, transparent 100%)', opacity:isHover?1:0, transition:'opacity 0.25s ease', display:'flex', alignItems:'flex-end', padding:12, gap:6 }}>
                      {[
                        { label:'Edit', icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, onClick:(e)=>{e.stopPropagation();handleEdit(r)}, danger:false },
                        { label:downloading===r.id?'..':'PDF',  icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, onClick:(e)=>{e.stopPropagation();handleDownload(r)}, danger:false },
                        { label:'Share', icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>, onClick:(e)=>{e.stopPropagation();handleShare(r)}, danger:false },
                        { label:deleting===r.id?'..':'Delete', icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, onClick:(e)=>{e.stopPropagation();handleDelete(r.id)}, danger:true },
                      ].map(btn => (
                        <button key={btn.label} onClick={btn.onClick} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 4px', fontSize:11, fontWeight:600, background:btn.danger?'rgba(239,68,68,0.12)':'rgba(255,255,255,0.09)', border:`1px solid ${btn.danger?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.12)'}`, borderRadius:9, color:btn.danger?'#FCA5A5':'#fff', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                          onMouseEnter={e=>e.currentTarget.style.background=btn.danger?'rgba(239,68,68,0.22)':'rgba(255,255,255,0.16)'}
                          onMouseLeave={e=>e.currentTarget.style.background=btn.danger?'rgba(239,68,68,0.12)':'rgba(255,255,255,0.09)'}>
                          {btn.icon}
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding:'13px 14px 15px' }}>
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
                    <button onClick={()=>setAnalysisResume(r.data)} style={{ width:'100%', background:'linear-gradient(135deg,rgba(59,255,125,0.05),rgba(139,92,246,0.05))', border:'1px solid rgba(139,92,246,0.16)', borderRadius:9, padding:'9px 0', cursor:'pointer', fontSize:12, fontWeight:600, color:'#A78BFA', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.2s' }}
                      onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(59,255,125,0.09),rgba(139,92,246,0.09))';e.currentTarget.style.borderColor='rgba(139,92,246,0.28)'}}
                      onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(59,255,125,0.05),rgba(139,92,246,0.05))';e.currentTarget.style.borderColor='rgba(139,92,246,0.16)'}}>
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