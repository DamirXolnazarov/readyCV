'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

function ReadyCVLogo({ size = 24 }) {
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

function CompletionRing({ pct }) {
  const r    = 15
  const circ = 2 * Math.PI * r
  const dash = (pct/100) * circ
  const color = pct===100 ? '#10b981' : pct>=60 ? '#f59e0b' : '#ef4444'
  return (
    <svg width="38" height="38" viewBox="0 0 38 38">
      <circle cx="19" cy="19" r={r} fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
      <circle cx="19" cy="19" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 19 19)" style={{transition:'stroke-dasharray 0.5s ease'}}/>
      <text x="19" y="23" textAnchor="middle" fill={color} fontSize="9" fontWeight="700"
        fontFamily="Inter,sans-serif">{pct}%</text>
    </svg>
  )
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  // Supabase returns timestamps without Z — force UTC parsing
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

// ── Inline rename component ──────────────────────────────────
function InlineRename({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val,     setVal]     = useState(value)
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const save = () => {
    setEditing(false)
    if (val.trim() && val.trim() !== value) onSave(val.trim())
    else setVal(value)
  }

  if (editing) return (
    <input
      ref={inputRef}
      value={val}
      onChange={e=>setVal(e.target.value)}
      onBlur={save}
      onKeyDown={e=>{ if(e.key==='Enter') save(); if(e.key==='Escape'){ setVal(value); setEditing(false) } }}
      style={{
        background:'rgba(255,255,255,0.08)',border:'1px solid rgba(37,99,235,0.4)',
        borderRadius:6,color:'#f1f5f9',fontSize:13,fontWeight:600,
        padding:'3px 8px',width:'100%',outline:'none',fontFamily:"'Inter',sans-serif",
      }}
    />
  )

  return (
    <div style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',minWidth:0}}
      onClick={()=>setEditing(true)} title="Click to rename">
      <span style={{color:'#e2e8f0',fontWeight:600,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
        {value}
      </span>
      <span style={{color:'#475569',fontSize:10,flexShrink:0}}>✏</span>
    </div>
  )
}

// ── Empty state illustration ─────────────────────────────────
function EmptyIllustration() {
  return (
    <svg width="180" height="160" viewBox="0 0 180 160" fill="none">
      {/* Desk surface */}
      <rect x="10" y="130" width="160" height="6" rx="3" fill="rgba(37,99,235,0.08)"/>
      {/* Main document */}
      <rect x="55" y="30" width="70" height="95" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
      {/* Doc header block */}
      <rect x="63" y="40" width="30" height="7" rx="3.5" fill="rgba(37,99,235,0.5)"/>
      <rect x="63" y="51" width="20" height="4" rx="2" fill="rgba(255,255,255,0.15)"/>
      {/* Doc lines */}
      {[62,69,76,83,90,97,104,111].map((y,i)=>(
        <rect key={i} x="63" y={y} width={[50,40,45,35,48,30,42,25][i]} height="3" rx="1.5"
          fill={`rgba(255,255,255,${0.06+i*0.01})`}/>
      ))}
      {/* Floating doc behind */}
      <rect x="35" y="50" width="55" height="75" rx="7" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1"
        transform="rotate(-8 62 87)"/>
      {/* Floating doc front */}
      <rect x="95" y="50" width="55" height="75" rx="7" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1"
        transform="rotate(8 122 87)"/>
      {/* Sparkle */}
      <circle cx="148" cy="28" r="3" fill="#2563eb" opacity="0.8"/>
      <circle cx="30"  cy="55" r="2" fill="#2563eb" opacity="0.5"/>
      <circle cx="155" cy="80" r="1.5" fill="#60a5fa" opacity="0.6"/>
      {/* Check badge */}
      <circle cx="110" cy="38" r="11" fill="#2563eb"/>
      <path d="M104.5 38l3.5 3.5L116 33" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Star display ─────────────────────────────────────────────
function Stars({ rating }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) stars.push('full')
    else if (i === Math.ceil(rating) && rating % 1 >= 0.5) stars.push('half')
    else stars.push('empty')
  }
  const color = rating >= 4 ? '#f59e0b' : rating >= 3 ? '#fb923c' : '#ef4444'
  return (
    <span style={{display:'flex',gap:2}}>
      {stars.map((s,i) => (
        <span key={i} style={{color: s==='empty' ? 'rgba(255,255,255,0.15)' : color, fontSize:16}}>
          {s==='half' ? '⯨' : '★'}
        </span>
      ))}
    </span>
  )
}

// ── Gemini-style AI Analysis Panel ──────────────────────────
function AnalysisPanel({ resumeData, onClose }) {
  const [phase,  setPhase]  = useState('loading') // loading | done | error
  const [score,  setScore]  = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true))
    // Fetch
    const run = async () => {
      try {
        const res  = await fetch('/api/score', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ resume: resumeData }),
        })
        const data = await res.json()
        if (data.error) { setPhase('error'); return }
        setScore(data)
        setPhase('done')
      } catch(e) { setPhase('error') }
    }
    run()
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 350)
  }

  const statusColor = (s) => s==='strong' ? '#10b981' : s==='needs-work' ? '#f59e0b' : '#ef4444'
  const statusLabel = (s) => s==='strong' ? 'Strong' : s==='needs-work' ? 'Needs Work' : 'Missing'

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',zIndex:200,transition:'opacity 0.35s',opacity:visible?1:0}}/>

      {/* Panel */}
      <div style={{
        position:'fixed',left:0,right:0,bottom:0,zIndex:201,
        background:'#080f1a',
        borderTop:'1px solid rgba(255,255,255,0.08)',
        borderRadius:'24px 24px 0 0',
        maxHeight:'85vh',overflowY:'auto',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition:'transform 0.45s cubic-bezier(0.32,0.72,0,1)',
        boxShadow:'0 -40px 100px rgba(0,0,0,0.8)',
      }}>
        {/* Animated gradient rays */}
        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#2563eb,#7c3aed,#ec4899,#2563eb)',backgroundSize:'200% 100%',animation:'rayMove 3s linear infinite',borderRadius:'24px 24px 0 0'}}/>
        <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:120,background:'radial-gradient(ellipse at 50% 0%,rgba(124,58,237,0.12),transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:0,left:'30%',right:'30%',height:80,background:'radial-gradient(ellipse at 50% 0%,rgba(37,99,235,0.1),transparent 70%)',pointerEvents:'none'}}/>

        <style>{`
          @keyframes rayMove { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
          .sec-card { animation: fadeUp 0.4s ease both; }
        `}</style>

        <div style={{maxWidth:740,margin:'0 auto',padding:'32px 32px 48px'}}>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#2563eb,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>✦</div>
              <div>
                <p style={{color:'#f1f5f9',fontWeight:700,fontSize:16,margin:0}}>AI Resume Analysis</p>
                <p style={{color:'#475569',fontSize:12,margin:0}}>Powered by readyCV</p>
              </div>
            </div>
            <button onClick={handleClose} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,width:32,height:32,cursor:'pointer',color:'#94a3b8',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          </div>

          {/* Loading state */}
          {phase==='loading' && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'48px 0',gap:20}}>
              <div style={{position:'relative',width:64,height:64}}>
                <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'2px solid rgba(37,99,235,0.2)'}}/>
                <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'2px solid transparent',borderTopColor:'#2563eb',animation:'spin 1s linear infinite'}}/>
                <div style={{position:'absolute',inset:6,borderRadius:'50%',border:'2px solid transparent',borderTopColor:'#7c3aed',animation:'spin 0.7s linear infinite reverse'}}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>✦</div>
              </div>
              <div style={{textAlign:'center'}}>
                <p style={{color:'#f1f5f9',fontWeight:600,fontSize:15,margin:'0 0 6px'}}>Analyzing your resume...</p>
                <p style={{color:'#475569',fontSize:13,margin:0}}>Reading experience, skills, and completeness</p>
              </div>
              {/* Shimmer bars */}
              <div style={{width:'100%',maxWidth:480,display:'flex',flexDirection:'column',gap:10,marginTop:8}}>
                {[100,80,90,70].map((w,i)=>(
                  <div key={i} style={{height:10,borderRadius:5,background:`rgba(255,255,255,0.04)`,width:`${w}%`,animation:`pulse 1.5s ease ${i*0.2}s infinite`}}/>
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {phase==='error' && (
            <div style={{textAlign:'center',padding:'48px 0'}}>
              <p style={{color:'#f87171',fontSize:15}}>⚠ Analysis failed. Please try again.</p>
            </div>
          )}

          {/* Results */}
          {phase==='done' && score && (
            <>
              {/* Score bar */}
              <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'20px 24px',marginBottom:24,display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
                <Stars rating={score.stars}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{color:'#f1f5f9',fontWeight:700,fontSize:18,margin:'0 0 2px',letterSpacing:'-0.02em'}}>{score.label}</p>
                  <p style={{color:'#94a3b8',fontSize:13,margin:0,lineHeight:1.5}}>{score.headline}</p>
                </div>
                <div style={{background:'linear-gradient(135deg,rgba(37,99,235,0.15),rgba(124,58,237,0.15))',border:'1px solid rgba(37,99,235,0.2)',borderRadius:12,padding:'8px 16px',textAlign:'center',flexShrink:0}}>
                  <p style={{color:'#60a5fa',fontWeight:700,fontSize:22,margin:0,letterSpacing:'-0.02em'}}>{score.stars}/5</p>
                  <p style={{color:'#475569',fontSize:10,margin:0,fontWeight:500}}>SCORE</p>
                </div>
              </div>

              {/* Section cards */}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {(score.sections||[]).map((sec, i) => (
                  <div key={i} className="sec-card" style={{animationDelay:`${i*0.08}s`,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:'18px 20px',borderLeft:`3px solid ${statusColor(sec.status)}`}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:16}}>{sec.icon}</span>
                        <span style={{color:'#f1f5f9',fontWeight:600,fontSize:14}}>{sec.title}</span>
                      </div>
                      <span style={{background:`${statusColor(sec.status)}18`,color:statusColor(sec.status),fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:6,letterSpacing:'0.05em'}}>
                        {statusLabel(sec.status)}
                      </span>
                    </div>
                    {sec.title === 'Quick Wins'
                      ? <div style={{display:'flex',flexDirection:'column',gap:7}}>
                          {sec.body.split('|').map((tip,j)=>(
                            <div key={j} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                              <span style={{color:'#2563eb',fontWeight:700,fontSize:12,marginTop:1,flexShrink:0}}>{j+1}.</span>
                              <p style={{color:'#94a3b8',fontSize:13,lineHeight:1.6,margin:0}}>{tip.trim()}</p>
                            </div>
                          ))}
                        </div>
                      : <p style={{color:'#94a3b8',fontSize:13,lineHeight:1.7,margin:0}}>{sec.body}</p>
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

export default function Dashboard() {
  const { data:session, status } = useSession()
  const router = useRouter()
  const [resumes,     setResumes]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [deleting,    setDeleting]    = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [analysisResume, setAnalysisResume] = useState(null)

  useEffect(()=>{ if(status==='unauthenticated') router.push('/signin') },[status])
  useEffect(()=>{ if(session?.user?.email) fetchResumes() },[session])

  const fetchResumes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('resumes').select('*')
      .eq('user_email', session.user.email)
      .order('updated_at',{ascending:false})
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

  const handleEdit = (resume) => {
    sessionStorage.setItem('editResume', JSON.stringify(resume))
    router.push('/app')
  }

  const handleDownload = async (resume) => {
    setDownloading(resume.id)
    try {
      const res = await fetch('/api/download',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ resume:resume.data, template:resume.template, accentColor:resume.accent_color }),
      })
      if (!res.ok) { alert('Download failed'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href=url; a.download=`${resume.data?.name||'resume'}-readyCV.pdf`; a.click()
      URL.revokeObjectURL(url)
      // Save download timestamp
      await supabase.from('resumes').update({ last_downloaded:new Date().toISOString() }).eq('id',resume.id)
      setResumes(r=>r.map(x=>x.id===resume.id?{...x,last_downloaded:new Date().toISOString()}:x))
    } catch(e) { alert('Download failed') }
    setDownloading(null)
  }

  const handleRename = async (resume, newName) => {
    const updatedData = { ...resume.data, name: newName }
    await supabase.from('resumes').update({ data:updatedData, updated_at:new Date().toISOString() }).eq('id',resume.id)
    setResumes(r=>r.map(x=>x.id===resume.id?{...x,data:updatedData}:x))
  }

  const handleShare = async (resume) => {
    if (resume.is_public && resume.share_id) {
      const url = `${window.location.origin}/share/${resume.share_id}`
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
      return
    }
    const shareId = Math.random().toString(36).slice(2, 10)
    await supabase.from('resumes').update({ is_public:true, share_id:shareId }).eq('id', resume.id)
    setResumes(r=>r.map(x=>x.id===resume.id?{...x,is_public:true,share_id:shareId}:x))
    const url = `${window.location.origin}/share/${shareId}`
    await navigator.clipboard.writeText(url)
    alert('Share link copied to clipboard! Anyone with this link can view your resume.')
  }

  if (status==='loading'||loading) return (
    <div style={{minHeight:'100vh',background:'#080f1a',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Inter',sans-serif"}}>
      <div style={{color:'#475569',fontSize:14}}>Loading...</div>
    </div>
  )

  const totalDownloads  = resumes.filter(r=>r.last_downloaded).length
  const lastEdited      = resumes.length ? resumes[0].updated_at : null
  const avgCompletion   = resumes.length ? Math.round(resumes.reduce((a,r)=>a+calcCompletion(r.data),0)/resumes.length) : 0

  return (
    <div style={D.bg}>
      {/* Analysis panel */}
      {analysisResume && <AnalysisPanel resumeData={analysisResume} onClose={()=>setAnalysisResume(null)}/>}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Inter',sans-serif;background:#080f1a;}
        .resume-card{transition:all 0.22s ease;}
        .resume-card:hover{transform:translateY(-6px)!important;border-color:rgba(255,255,255,0.14)!important;box-shadow:0 28px 72px rgba(0,0,0,0.65)!important;}
        .resume-card:hover .card-overlay{opacity:1!important;}
        .new-card:hover{border-color:rgba(37,99,235,0.5)!important;background:rgba(37,99,235,0.07)!important;transform:translateY(-6px);}
        .action-btn:hover{background:rgba(255,255,255,0.18)!important;}
        .del-btn:hover{background:rgba(239,68,68,0.22)!important;color:#fca5a5!important;}
        .sign-out:hover{color:#f1f5f9!important;}
        .create-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(37,99,235,0.45)!important;}
        .empty-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(37,99,235,0.45)!important;}
        ::-webkit-scrollbar{width:4px;}
        @media(max-width:768px){
          .dash-nav{padding:12px 16px!important;}
          .dash-main{padding:24px 16px 24px!important;}
          .dash-grid{grid-template-columns:1fr 1fr!important;gap:14px!important;}
          .dash-header{flex-direction:column!important;align-items:flex-start!important;gap:14px!important;}
          .stats-bar{padding:14px 16px!important;gap:0!important;overflow-x:auto!important;}
          .page-title{font-size:20px!important;}
        }
        @media(max-width:480px){
          .dash-grid{grid-template-columns:1fr!important;}
        }
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px;}
      `}</style>

      {/* ── Navbar ── */}
      <nav style={D.nav} className="dash-nav">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <ReadyCVLogo size={26}/>
          <span style={D.navLogo}>readyCV</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <button onClick={()=>router.push('/profile')} style={{background:'transparent',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:8,padding:'4px 8px',borderRadius:8,transition:'background 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            {session?.user?.image
              ? <img src={session.user.image} alt="avatar" style={{width:30,height:30,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.1)',objectFit:'cover'}}/>
              : <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#2563eb,#1e40af)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>
                  {(session?.user?.name||session?.user?.email||'?')[0].toUpperCase()}
                </div>
            }
            <span style={{color:'#64748b',fontSize:13,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {session?.user?.name||session?.user?.email}
            </span>
          </button>
          <button onClick={()=>signOut({callbackUrl:'/signin'})} style={D.signOutBtn} className="sign-out">
            Sign out
          </button>
        </div>
      </nav>

      <main style={D.main} className="dash-main">

        {/* ── Page header ── */}
        <div style={D.pageHeader} className="dash-header">
          <div>
            <h1 style={D.pageTitle} className="page-title">My Resumes</h1>
            <p style={D.pageSub}>Manage, edit and download all your resumes</p>
          </div>
          <button onClick={()=>router.push('/app')} style={D.createBtn} className="create-btn">
            + New Resume
          </button>
        </div>

        {/* ── Stats bar (only when resumes exist) ── */}
        {resumes.length>0 && (
          <div style={D.statsBar} className="stats-bar">
            {[
              { num: resumes.length,   label: resumes.length===1?'Resume':'Resumes' },
              { num: avgCompletion+'%',label: 'Avg. completion' },
              { num: lastEdited ? timeAgo(lastEdited) : '—', label:'Last edited' },
              { num: resumes.filter(r=>calcCompletion(r.data)===100).length, label:'Complete' },
              { num: totalDownloads,   label:'Downloaded' },
            ].map((s,i,arr)=>(
              <div key={i} style={{display:'flex',alignItems:'center',flex:1}}>
                <div style={D.statItem}>
                  <span style={D.statNum}>{s.num}</span>
                  <span style={D.statLabel}>{s.label}</span>
                </div>
                {i<arr.length-1&&<div style={D.statDivider}/>}
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {resumes.length===0 && !loading && (
          <div style={D.emptyWrap}>
            <EmptyIllustration/>
            <h2 style={D.emptyTitle}>No resumes yet</h2>
            <p style={D.emptySub}>
              Upload your LinkedIn PDF and we'll turn it into a polished,<br/>
              professional resume in seconds — completely AI-powered.
            </p>
            <button onClick={()=>router.push('/app')} style={D.emptyBtn} className="empty-btn">
              ✨ Create your first resume
            </button>
            <div style={D.featureRow}>
              {['AI-powered extraction','3 premium templates','ATS job tailoring','Cover letter generator'].map(f=>(
                <div key={f} style={D.featureItem}>
                  <span style={{color:'#2563eb'}}>✓</span>
                  <span style={{color:'#475569',fontSize:13}}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Resume grid ── */}
        {resumes.length>0 && (
          <div style={D.grid} className="dash-grid">

            {/* New card */}
            <div style={D.newCard} className="new-card" onClick={()=>router.push('/app')}>
              <div style={D.newPlus}>+</div>
              <p style={D.newLabel}>New Resume</p>
              <p style={D.newSub}>Upload LinkedIn PDF</p>
            </div>

            {resumes.map(r=>{
              const pct = calcCompletion(r.data)
              return (
                <div key={r.id} style={D.card} className="resume-card">

                  {/* ── Thumbnail ── */}
                  <div style={D.thumbWrap}>
                    <img
                      src={`/templates/${r.template||'sidebar'}.png`}
                      alt={TEMPLATE_LABELS[r.template]||'Resume'}
                      style={D.thumbImg}
                    />
                    {/* Accent color tint */}
                    {r.accent_color && r.template!=='heritage' && (
                      <div style={{position:'absolute',inset:0,background:r.accent_color,mixBlendMode:'hue',opacity:0.25,pointerEvents:'none'}}/>
                    )}
                    {/* Template badge */}
                    <div style={D.tplBadge}>{TEMPLATE_LABELS[r.template]||r.template}</div>
                    {/* Completion ring */}
                    <div style={D.ringBadge}><CompletionRing pct={pct}/></div>
                    {/* Hover overlay */}
                    <div style={D.overlay} className="card-overlay">
                      <button onClick={()=>handleEdit(r)} style={D.overlayBtn} className="action-btn">✏️ Edit</button>
                      <button onClick={()=>handleDownload(r)} disabled={downloading===r.id} style={D.overlayBtn} className="action-btn">
                        {downloading===r.id?'⏳':'⬇'} PDF
                      </button>
                      <button onClick={()=>handleDelete(r.id)} disabled={deleting===r.id}
                        style={{...D.overlayBtn,...D.delBtn}} className="del-btn">
                        {deleting===r.id?'⏳':'🗑'} Delete
                      </button>
                    </div>
                  </div>

                  {/* ── Card body ── */}
                  <div style={D.cardBody}>
                    <InlineRename
                      value={r.data?.name||'Untitled Resume'}
                      onSave={newName=>handleRename(r,newName)}
                    />
                    <p style={D.cardRole}>{r.data?.title||'—'}</p>
                    <div style={D.cardMeta}>
                      <span style={D.cardTime}>✎ {timeAgo(r.updated_at)}</span>
                      {r.last_downloaded && (
                        <span style={D.cardDownloaded}>⬇ {timeAgo(r.last_downloaded)}</span>
                      )}
                    </div>
                    <button
                      onClick={()=>setAnalysisResume(r.data)}
                      style={{marginTop:12,width:'100%',background:'linear-gradient(135deg,rgba(37,99,235,0.08),rgba(124,58,237,0.08))',border:'1px solid rgba(37,99,235,0.2)',borderRadius:8,padding:'8px 0',cursor:'pointer',fontSize:12,fontWeight:600,color:'#60a5fa',fontFamily:"'Inter',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all 0.2s'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(37,99,235,0.15),rgba(124,58,237,0.15))';e.currentTarget.style.borderColor='rgba(37,99,235,0.4)'}}
                      onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(37,99,235,0.08),rgba(124,58,237,0.08))';e.currentTarget.style.borderColor='rgba(37,99,235,0.2)'}}>
                      ✦ AI Analysis
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

const D = {
  bg:          {minHeight:'100vh',background:'#080f1a',fontFamily:"'Inter',sans-serif"},

  nav:         {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 40px',borderBottom:'1px solid rgba(255,255,255,0.05)',background:'rgba(8,15,26,0.9)',backdropFilter:'blur(16px)',position:'sticky',top:0,zIndex:10},
  navLogo:     {color:'#f1f5f9',fontWeight:700,fontSize:17,letterSpacing:'-0.02em'},
  signOutBtn:  {background:'transparent',border:'none',color:'#475569',cursor:'pointer',fontSize:13,fontFamily:"'Inter',sans-serif",transition:'color 0.15s'},

  main:        {maxWidth:1100,margin:'0 auto',padding:'44px 32px'},
  pageHeader:  {display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:28},
  pageTitle:   {color:'#f1f5f9',fontSize:26,fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 4px'},
  pageSub:     {color:'#475569',fontSize:14},
  createBtn:   {background:'#2563eb',color:'#fff',border:'none',borderRadius:10,padding:'11px 22px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif",boxShadow:'0 4px 16px rgba(37,99,235,0.3)',transition:'all 0.15s',whiteSpace:'nowrap'},

  statsBar:    {display:'flex',alignItems:'center',background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:'18px 32px',marginBottom:36},
  statItem:    {display:'flex',flexDirection:'column',alignItems:'center',gap:3,flex:1},
  statNum:     {color:'#f1f5f9',fontWeight:700,fontSize:20,letterSpacing:'-0.02em'},
  statLabel:   {color:'#475569',fontSize:11,fontWeight:500,textAlign:'center'},
  statDivider: {width:1,height:32,background:'rgba(255,255,255,0.06)',margin:'0 4px'},

  emptyWrap:   {display:'flex',flexDirection:'column',alignItems:'center',padding:'72px 24px',textAlign:'center'},
  emptyTitle:  {color:'#f1f5f9',fontSize:22,fontWeight:700,margin:'24px 0 10px',letterSpacing:'-0.02em'},
  emptySub:    {color:'#475569',fontSize:14,lineHeight:1.8,margin:'0 0 32px'},
  emptyBtn:    {background:'#2563eb',color:'#fff',border:'none',borderRadius:12,padding:'14px 36px',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif",boxShadow:'0 4px 20px rgba(37,99,235,0.35)',marginBottom:36,transition:'all 0.15s'},
  featureRow:  {display:'flex',flexWrap:'wrap',gap:'10px 32px',justifyContent:'center'},
  featureItem: {display:'flex',alignItems:'center',gap:7},

  grid:        {display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:22},

  newCard:     {background:'rgba(37,99,235,0.03)',border:'2px dashed rgba(37,99,235,0.18)',borderRadius:16,minHeight:290,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.2s ease',gap:10},
  newPlus:     {fontSize:32,color:'#2563eb',fontWeight:200,lineHeight:1},
  newLabel:    {color:'#60a5fa',fontWeight:600,fontSize:14,margin:0},
  newSub:      {color:'#334155',fontSize:12,margin:0},

  card:        {background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,0.35)'},
  thumbWrap:   {position:'relative',height:210,overflow:'hidden',background:'#0d1420'},
  thumbImg:    {width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center',display:'block'},
  tplBadge:    {position:'absolute',top:10,left:10,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(8px)',color:'rgba(255,255,255,0.9)',fontSize:10,fontWeight:600,padding:'3px 9px',borderRadius:6,letterSpacing:'0.06em',textTransform:'uppercase'},
  ringBadge:   {position:'absolute',top:8,right:8},
  overlay:     {position:'absolute',inset:0,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:0,transition:'opacity 0.2s ease'},
  overlayBtn:  {background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',color:'#f1f5f9',borderRadius:8,padding:'8px 14px',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all 0.15s',whiteSpace:'nowrap'},
  delBtn:      {background:'rgba(239,68,68,0.1)',borderColor:'rgba(239,68,68,0.25)',color:'#fca5a5'},

  cardBody:    {padding:'13px 15px 15px'},
  cardRole:    {color:'#475569',fontSize:12,margin:'3px 0 8px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'},
  cardMeta:    {display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'},
  cardTime:    {color:'#334155',fontSize:11},
  cardDownloaded:{color:'#334155',fontSize:11},
}