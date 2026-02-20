'use client'
import { useState } from 'react'

const uid = () => Math.random().toString(36).slice(2, 7)

const EMPTY = {
  experience:     { id:'', role:'', company:'', duration:'', description:'' },
  education:      { id:'', degree:'', field:'', school:'', year:'', gpa:'' },
  certifications: { id:'', name:'', issuer:'', year:'' },
  projects:       { id:'', name:'', description:'' },
  languages:      { id:'', language:'', proficiency:'' },
  awards:         { id:'', name:'', issuer:'', year:'' },
  volunteer:      { id:'', organization:'', role:'', duration:'' },
  interests:      { id:'', interest:'' },
}

const REQUIRED_CHECKS = [
  { key:'name',     label:'Full Name' },
  { key:'email',    label:'Email' },
  { key:'phone',    label:'Phone' },
  { key:'title',    label:'Job Title' },
  { key:'summary',  label:'Profile Summary' },
  { key:'location', label:'Location' },
  { key:'linkedin', label:'LinkedIn URL' },
  { key:'dob',      label:'Date of Birth' },
]

const SECTION_CHECKS = [
  { key:'experience', label:'Work Experience' },
  { key:'education',  label:'Education' },
  { key:'skills',     label:'Skills' },
]

const NAV = [
  { id:'personal',       label:'Personal',       icon:'👤' },
  { id:'summary',        label:'Summary',        icon:'📝' },
  { id:'experience',     label:'Experience',     icon:'💼' },
  { id:'education',      label:'Education',      icon:'🎓' },
  { id:'skills',         label:'Skills',         icon:'⚡' },
  { id:'languages',      label:'Languages',      icon:'🌍' },
  { id:'volunteer',      label:'Volunteer',      icon:'🤝' },
  { id:'certifications', label:'Certifications', icon:'🏅' },
  { id:'projects',       label:'Projects',       icon:'🚀' },
  { id:'interests',      label:'Interests',      icon:'✨' },
  { id:'awards',         label:'Awards',         icon:'🏆' },
  { id:'ats',            label:'ATS Tailor',     icon:'🎯' },
  { id:'cover',          label:'Cover Letter',   icon:'✉️' },
]

function ReadyCVLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#2563EB" fillOpacity="0.12" />
      <rect x="7" y="9"  width="11" height="1.7" rx="0.85" fill="#2563EB" />
      <rect x="7" y="13" width="18" height="1.7" rx="0.85" fill="#2563EB" />
      <rect x="7" y="17" width="14" height="1.7" rx="0.85" fill="#2563EB" />
      <rect x="7" y="21" width="9"  height="1.7" rx="0.85" fill="#2563EB" />
      <circle cx="24" cy="10" r="4" fill="#2563EB" />
      <path d="M22 10l1.5 1.5L26.5 8" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function App() {
  const [file,         setFile]         = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [resume,       setResume]       = useState(null)
  const [activeTab,    setActiveTab]    = useState('personal')
  const [showWarnings, setShowWarnings] = useState(true)
  const [atsLoading,   setAtsLoading]   = useState(false)
  const [atsSuccess,   setAtsSuccess]   = useState(false)
  const [coverLoading, setCoverLoading] = useState(false)
  const [coverLetter,  setCoverLetter]  = useState('')

  // ── Handlers ──────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return alert('Please select a file first!')
    setLoading(true)
    const fd = new FormData()
    fd.append('pdf', file)
    const res  = await fetch('/api/parse', { method:'POST', body:fd })
    const data = await res.json()
    if (data.resumeData) {
      setResume({ linkedin:'', website:'', nationality:'', dob:'', references:'Available upon request', interests:[], volunteer:[], ...data.resumeData })
    } else alert('Error: ' + data.error)
    setLoading(false)
  }

  const handleATS = async () => {
    if (!resume.jobDescription) return alert('Paste a job description first!')
    setAtsLoading(true); setAtsSuccess(false)
    const res  = await fetch('/api/ats', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ resume, jobDescription:resume.jobDescription }) })
    const data = await res.json()
    if (data.updated) { setResume(p => ({ ...p, ...data.updated })); setAtsSuccess(true) }
    else alert('Error: ' + data.error)
    setAtsLoading(false)
  }

  const handleCover = async () => {
    setCoverLoading(true)
    const res  = await fetch('/api/cover', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ resume, jobDescription:resume.jobDescription||'' }) })
    const data = await res.json()
    if (data.letter) setCoverLetter(data.letter)
    else alert('Error: ' + data.error)
    setCoverLoading(false)
  }

  const handleDownload = async () => {
    const html2pdf = (await import('html2pdf.js')).default
    const el  = document.getElementById('resume-preview')
    html2pdf().set({
      margin: 0,
      filename: `${resume.name || 'resume'}-readyCV.pdf`,
      image:    { type:'jpeg', quality:1 },
      html2canvas: { scale:2, useCORS:true, scrollY:0 },
      jsPDF:    { unit:'mm', format:'a4', orientation:'portrait' },
    }).from(el).save()
  }

  // ── State helpers ─────────────────────────────────────────
  const set     = (f,v) => setResume(p => ({ ...p, [f]:v }))
  const setArr  = (s,i,k,v) => setResume(p => { const a=[...(p[s]||[])]; a[i]={...a[i],[k]:v}; return {...p,[s]:a} })
  const addItem = (section) => {
  setResume(p => ({ ...p, [section]: [...(p[section] || []), { ...EMPTY[section], id: uid() }] }))
  setTimeout(() => {
    const formArea = document.getElementById('form-area')
    if (formArea) formArea.scrollTop = formArea.scrollHeight
  }, 50)
}
  const delItem = (s,i) => setResume(p => ({ ...p, [s]:p[s].filter((_,j)=>j!==i) }))
  const setSk   = (i,v) => setResume(p => { const a=[...p.skills]; a[i]=v; return {...p,skills:a} })
  const delSk   = (i)   => setResume(p => ({ ...p, skills:p.skills.filter((_,j)=>j!==i) }))

  const getMissing = () => {
    if (!resume) return []
    const m = []
    REQUIRED_CHECKS.forEach(({key,label}) => { if (!resume[key]||!resume[key].toString().trim()) m.push(label) })
    SECTION_CHECKS.forEach(({key,label})  => { if (!resume[key]||resume[key].length===0) m.push(label) })
    return m
  }

  const completion = () => {
    const total   = REQUIRED_CHECKS.length + SECTION_CHECKS.length
    const missing = getMissing().length
    return Math.round(((total - missing) / total) * 100)
  }

  // ── Upload Screen ─────────────────────────────────────────
  if (!resume) return (
    <div style={U.bg}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Inter',sans-serif; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .upload-card { animation:fadeUp 0.6s ease both; }
        .upload-btn:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(37,99,235,0.35) !important; }
      `}</style>
      <div style={U.card} className="upload-card">
        <ReadyCVLogo size={48} />
        <h1 style={U.title}>readyCV</h1>
        <p style={U.sub}>Upload your LinkedIn PDF export and get a polished, professional resume in seconds.</p>
        <label style={U.fileLabel}>
          {file ? `✓  ${file.name}` : '📎  Choose LinkedIn PDF'}
          <input type="file" accept=".pdf" style={{display:'none'}} onChange={e=>setFile(e.target.files[0])} />
        </label>
        <button onClick={handleUpload} disabled={loading}
          style={{...U.btn, opacity:loading?0.7:1}} className="upload-btn">
          {loading ? '⏳  Generating your resume...' : '✨  Generate Resume'}
        </button>
      </div>
    </div>
  )

  const missing    = getMissing()
  const pct        = completion()

  const tabHasDot = (id) =>
    (id==='personal'   && missing.some(m=>['Full Name','Email','Phone','Job Title','Location','LinkedIn URL','Date of Birth'].includes(m))) ||
    (id==='summary'    && missing.includes('Profile Summary')) ||
    (id==='experience' && missing.includes('Work Experience')) ||
    (id==='education'  && missing.includes('Education')) ||
    (id==='skills'     && missing.includes('Skills'))

  return (
    <div style={E.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Inter',sans-serif; overflow:hidden; }

        .tab-btn:hover  { background:rgba(255,255,255,0.06) !important; }
        .inp:focus      { border-color:#2563eb !important; box-shadow:0 0 0 3px rgba(37,99,235,0.12) !important; transform:scaleX(1.005); }
        .add-btn:hover  { background:rgba(37,99,235,0.18) !important; }
        .dl-btn:hover   { background:rgba(255,255,255,0.12) !important; }
        .ai-btn:hover   { transform:translateY(-1px); box-shadow:0 8px 24px rgba(37,99,235,0.3) !important; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .form-in { animation:fadeUp 0.2s ease both; }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div style={E.left}>

        {/* Header */}
        <div style={E.leftTop}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <ReadyCVLogo size={22} />
            <span style={E.logo}>readyCV</span>
          </div>
          <button onClick={()=>setResume(null)} style={E.newBtn}>← New</button>
        </div>

        {/* Completion bar */}
        <div style={E.completionWrap}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={E.completionLabel}>Resume completeness</span>
            <span style={{...E.completionLabel, color: pct===100?'#10b981':'#f59e0b', fontWeight:600}}>{pct}%</span>
          </div>
          <div style={E.progressBg}>
            <div style={{...E.progressFill, width:`${pct}%`, background: pct===100?'#10b981':'#2563eb'}} />
          </div>
          {missing.length>0 && showWarnings && (
            <div style={E.warnBox}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={E.warnTitle}>Missing fields</span>
                <button onClick={()=>setShowWarnings(false)} style={E.warnX}>✕</button>
              </div>
              <div style={E.warnTags}>
                {missing.map(m=><span key={m} style={E.warnTag}>{m}</span>)}
              </div>
            </div>
          )}
          {pct===100 && <div style={E.completeBox}>✓ Resume is complete</div>}
        </div>

        {/* Tabs */}
        <div style={E.tabs}>
          {NAV.map(({id,label,icon})=>(
            <button key={id} onClick={()=>setActiveTab(id)}
              style={{...E.tab, ...(activeTab===id?E.tabActive:{})}} className="tab-btn">
              <span style={E.tabIcon}>{icon}</span>
              <span style={E.tabLabel}>{label}</span>
              {tabHasDot(id) && <span style={E.tabDot}/>}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={E.formArea} id="form-area" className="form-in" key={activeTab}>

          {activeTab==='personal' && <>
            <Sec title="Personal Information">
              <Inp label="Full Name *"          val={resume.name}        set={v=>set('name',v)}        miss={!resume.name} />
              <Inp label="Job Title *"           val={resume.title}       set={v=>set('title',v)}       miss={!resume.title} />
              <Inp label="Email *"               val={resume.email}       set={v=>set('email',v)}       miss={!resume.email} />
              <Inp label="Phone *"               val={resume.phone}       set={v=>set('phone',v)}       miss={!resume.phone} />
              <Inp label="Location *"            val={resume.location}    set={v=>set('location',v)}    miss={!resume.location} />
              <Inp label="Date of Birth *"       val={resume.dob}         set={v=>set('dob',v)}         miss={!resume.dob}      ph="e.g. 15 March 1998" />
              <Inp label="LinkedIn URL *"        val={resume.linkedin}    set={v=>set('linkedin',v)}    miss={!resume.linkedin} ph="linkedin.com/in/yourname" />
              <Inp label="Website / Portfolio"   val={resume.website}     set={v=>set('website',v)}     ph="yourwebsite.com" />
              <Inp label="Nationality"           val={resume.nationality} set={v=>set('nationality',v)} />
            </Sec>
          </>}

          {activeTab==='summary' && <>
            <Sec title="Profile Summary">
              <p style={E.hint}>2–3 sharp sentences. AI has already shortened it for you.</p>
              <TA val={resume.summary} set={v=>set('summary',v)} rows={6} miss={!resume.summary} />
              <Inp label="References" val={resume.references} set={v=>set('references',v)} />
            </Sec>
          </>}

          {activeTab==='experience' && <>
            <Sec title="Work Experience" onAdd={()=>addItem('experience')}>
              {missing.includes('Work Experience') && <Warn text="Add at least one work experience." />}
              {(resume.experience||[]).map((e,i)=>(
                <Card key={e.id||i} onDel={()=>delItem('experience',i)}>
                  <Inp label="Job Title *" val={e.role}        set={v=>setArr('experience',i,'role',v)}        miss={!e.role} />
                  <Inp label="Company *"   val={e.company}     set={v=>setArr('experience',i,'company',v)}     miss={!e.company} />
                  <Inp label="Duration"    val={e.duration}    set={v=>setArr('experience',i,'duration',v)}    ph="e.g. Jan 2022 – Present" />
                  <TA  label="Description" val={e.description} set={v=>setArr('experience',i,'description',v)} rows={4} />
                </Card>
              ))}
            </Sec>
          </>}

          {activeTab==='education' && <>
            <Sec title="Education" onAdd={()=>addItem('education')}>
              {missing.includes('Education') && <Warn text="Add at least one education entry." />}
              {(resume.education||[]).map((e,i)=>(
                <Card key={e.id||i} onDel={()=>delItem('education',i)}>
                  <Inp label="Degree *"    val={e.degree} set={v=>setArr('education',i,'degree',v)} miss={!e.degree} />
                  <Inp label="Field"       val={e.field}  set={v=>setArr('education',i,'field',v)} />
                  <Inp label="School *"    val={e.school} set={v=>setArr('education',i,'school',v)} miss={!e.school} />
                  <Inp label="Year"        val={e.year}   set={v=>setArr('education',i,'year',v)} />
                  <Inp label="GPA / Grade" val={e.gpa}    set={v=>setArr('education',i,'gpa',v)} ph="e.g. 3.8 / 4.0" />
                </Card>
              ))}
            </Sec>
          </>}

          {activeTab==='skills' && <>
            <Sec title="Skills" onAdd={()=>set('skills',[...(resume.skills||[]),''])}>
              {missing.includes('Skills') && <Warn text="Add at least one skill." />}
              {(resume.skills||[]).map((sk,i)=>(
                <div key={i} style={E.skillRow}>
                  <input style={{...E.inp}} className="inp" value={sk} onChange={e=>setSk(i,e.target.value)} placeholder="e.g. Project Management" />
                  <button style={E.skillDel} onClick={()=>delSk(i)}>✕</button>
                </div>
              ))}
            </Sec>
          </>}

          {activeTab==='languages' && <>
            <Sec title="Languages" onAdd={()=>addItem('languages')}>
              {(resume.languages||[]).map((l,i)=>(
                <Card key={l.id||i} onDel={()=>delItem('languages',i)}>
                  <Inp label="Language"    val={l.language}    set={v=>setArr('languages',i,'language',v)} />
                  <Inp label="Proficiency" val={l.proficiency} set={v=>setArr('languages',i,'proficiency',v)} ph="e.g. Native, Fluent, B2" />
                </Card>
              ))}
            </Sec>
          </>}

          {activeTab==='volunteer' && <>
            <Sec title="Volunteer Work" onAdd={()=>addItem('volunteer')}>
              <p style={E.hint}>Highly valued by universities and NGOs.</p>
              {(resume.volunteer||[]).map((v,i)=>(
                <Card key={v.id||i} onDel={()=>delItem('volunteer',i)}>
                  <Inp label="Organization" val={v.organization} set={vv=>setArr('volunteer',i,'organization',vv)} />
                  <Inp label="Role"         val={v.role}         set={vv=>setArr('volunteer',i,'role',vv)} />
                  <Inp label="Duration"     val={v.duration}     set={vv=>setArr('volunteer',i,'duration',vv)} />
                </Card>
              ))}
            </Sec>
          </>}

          {activeTab==='certifications' && <>
            <Sec title="Certifications" onAdd={()=>addItem('certifications')}>
              {(resume.certifications||[]).map((c,i)=>(
                <Card key={c.id||i} onDel={()=>delItem('certifications',i)}>
                  <Inp label="Name"   val={c.name}   set={v=>setArr('certifications',i,'name',v)} />
                  <Inp label="Issuer" val={c.issuer} set={v=>setArr('certifications',i,'issuer',v)} />
                  <Inp label="Year"   val={c.year}   set={v=>setArr('certifications',i,'year',v)} />
                </Card>
              ))}
            </Sec>
          </>}

          {activeTab==='projects' && <>
            <Sec title="Projects" onAdd={()=>addItem('projects')}>
              {(resume.projects||[]).map((p,i)=>(
                <Card key={p.id||i} onDel={()=>delItem('projects',i)}>
                  <Inp label="Name"        val={p.name}        set={v=>setArr('projects',i,'name',v)} />
                  <TA  label="Description" val={p.description} set={v=>setArr('projects',i,'description',v)} rows={3} />
                </Card>
              ))}
            </Sec>
          </>}

          {activeTab==='interests' && <>
            <Sec title="Hobbies & Interests" onAdd={()=>addItem('interests')}>
              <p style={E.hint}>Shows personality — valued by universities especially.</p>
              {(resume.interests||[]).map((item,i)=>(
                <Card key={item.id||i} onDel={()=>delItem('interests',i)}>
                  <Inp label="Interest" val={item.interest} set={v=>setArr('interests',i,'interest',v)} ph="e.g. Open-source development" />
                </Card>
              ))}
            </Sec>
          </>}

          {activeTab==='awards' && <>
            <Sec title="Awards & Honours" onAdd={()=>addItem('awards')}>
              {(resume.awards||[]).map((a,i)=>(
                <Card key={a.id||i} onDel={()=>delItem('awards',i)}>
                  <Inp label="Award"  val={a.name}   set={v=>setArr('awards',i,'name',v)} />
                  <Inp label="Issuer" val={a.issuer} set={v=>setArr('awards',i,'issuer',v)} />
                  <Inp label="Year"   val={a.year}   set={v=>setArr('awards',i,'year',v)} />
                </Card>
              ))}
            </Sec>
          </>}

          {activeTab==='ats' && <>
            <Sec title="ATS Job Tailoring">
              <p style={E.hint}>Paste the job description. AI will rewrite your summary and experience bullets to match — without inventing facts.</p>
              <TA val={resume.jobDescription||''} set={v=>set('jobDescription',v)} rows={10} ph="Paste job description here..." />
              <button onClick={handleATS} disabled={atsLoading}
                style={{...E.aiBtn, marginTop:10}} className="ai-btn">
                {atsLoading ? '⏳ Tailoring...' : '🎯 Tailor Resume to This Job'}
              </button>
              {atsSuccess && <div style={E.successBox}>✓ Resume tailored! Check Summary and Experience sections.</div>}
            </Sec>
          </>}

          {activeTab==='cover' && <>
            <Sec title="Cover Letter">
              <p style={E.hint}>Tip: fill the ATS Tailor tab first for a more targeted letter.</p>
              <button onClick={handleCover} disabled={coverLoading}
                style={{...E.aiBtn, marginBottom:12}} className="ai-btn">
                {coverLoading ? '⏳ Writing...' : '✉️ Generate Cover Letter'}
              </button>
              {coverLetter && <>
                <TA val={coverLetter} set={v=>setCoverLetter(v)} rows={16} />
                <button style={{...E.aiBtn, background:'#059669', marginTop:8}} className="ai-btn"
                  onClick={()=>{
                    const blob=new Blob([coverLetter],{type:'text/plain'})
                    const url=URL.createObjectURL(blob)
                    const a=document.createElement('a')
                    a.href=url; a.download=`${resume.name||'cover'}-letter.txt`; a.click()
                  }}>
                  ⬇ Download Cover Letter
                </button>
              </>}
            </Sec>
          </>}

        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={E.right}>
        <div style={E.toolbar}>
          <span style={E.toolbarLabel}>Live Preview</span>
          <button onClick={handleDownload} style={E.dlBtn} className="dl-btn">⬇ Download PDF</button>
        </div>

        <div style={E.previewScroll}>
          <div style={E.a4} id="resume-preview">

            {/* Resume sidebar */}
            <div style={R.sidebar}>
              <RSec label="CONTACT">
                {resume.email       && <p style={R.sideText}>{resume.email}</p>}
                {resume.phone       && <p style={R.sideText}>{resume.phone}</p>}
                {resume.location    && <p style={R.sideText}>{resume.location}</p>}
                {resume.linkedin    && <p style={R.sideText}>{resume.linkedin}</p>}
                {resume.website     && <p style={R.sideText}>{resume.website}</p>}
                {resume.nationality && <p style={R.sideText}>{resume.nationality}</p>}
                {resume.dob         && <p style={R.sideText}>Born: {resume.dob}</p>}
              </RSec>

              {(resume.skills||[]).filter(Boolean).length>0 && (
                <RSec label="SKILLS">
                  {resume.skills.filter(Boolean).map((s,i)=><p key={i} style={R.sideText}>· {s}</p>)}
                </RSec>
              )}

              {(resume.languages||[]).length>0 && (
                <RSec label="LANGUAGES">
                  {resume.languages.map((l,i)=>(
                    <div key={i} style={{marginBottom:5}}>
                      <p style={{...R.sideText,fontWeight:600}}>{l.language}</p>
                      {l.proficiency&&<p style={{...R.sideText,fontSize:8.5,color:'#9ca3af'}}>{l.proficiency}</p>}
                    </div>
                  ))}
                </RSec>
              )}

              {(resume.certifications||[]).length>0 && (
                <RSec label="CERTIFICATIONS">
                  {resume.certifications.map((c,i)=>(
                    <div key={i} style={{marginBottom:6}}>
                      <p style={{...R.sideText,fontWeight:600}}>{c.name}</p>
                      {c.issuer&&<p style={{...R.sideText,fontSize:8.5,color:'#9ca3af'}}>{c.issuer}{c.year?` · ${c.year}`:''}</p>}
                    </div>
                  ))}
                </RSec>
              )}

              {(resume.interests||[]).length>0 && (
                <RSec label="INTERESTS">
                  {resume.interests.map((it,i)=><p key={i} style={R.sideText}>· {it.interest}</p>)}
                </RSec>
              )}

              {(resume.awards||[]).length>0 && (
                <RSec label="AWARDS">
                  {resume.awards.map((a,i)=>(
                    <div key={i} style={{marginBottom:5}}>
                      <p style={{...R.sideText,fontWeight:600}}>{a.name}</p>
                      {a.year&&<p style={{...R.sideText,fontSize:8.5,color:'#9ca3af'}}>{a.year}</p>}
                    </div>
                  ))}
                </RSec>
              )}

              {/* Watermark */}
              <div style={R.watermark}>
                <ReadyCVLogo size={10} />
                <span style={R.watermarkText}>readyCV</span>
              </div>
            </div>

            {/* Resume main */}
            <div style={R.main}>
              <div style={R.header}>
                <h1 style={R.name}>{resume.name||'Your Name'}</h1>
                {resume.title&&<p style={R.title}>{resume.title}</p>}
                {resume.email&&<p style={R.contact}>{resume.email}</p>}
              </div>

              <div style={R.body}>
                {resume.summary&&(
                  <RMainSec title="PROFILE">
                    <p style={R.bodyText}>{resume.summary}</p>
                    {resume.references&&<p style={{...R.bodyText,marginTop:5,fontStyle:'italic',color:'#9ca3af'}}>References: {resume.references}</p>}
                  </RMainSec>
                )}

                {(resume.experience||[]).length>0&&(
                  <RMainSec title="EXPERIENCE">
                    {resume.experience.map((e,i)=>(
                      <div key={i} style={R.entry}>
                        <div style={R.entryHead}>
                          <div>
                            <span style={R.entryTitle}>{e.role}</span>
                            {e.company&&<span style={R.entryCompany}> · {e.company}</span>}
                          </div>
                          {e.duration&&<span style={R.entryMeta}>{e.duration}</span>}
                        </div>
                        {e.description&&<p style={R.bodyText}>{e.description}</p>}
                      </div>
                    ))}
                  </RMainSec>
                )}

                {(resume.education||[]).length>0&&(
                  <RMainSec title="EDUCATION">
                    {resume.education.map((e,i)=>(
                      <div key={i} style={R.entry}>
                        <div style={R.entryHead}>
                          <div>
                            <span style={R.entryTitle}>{e.degree}{e.field?` in ${e.field}`:''}</span>
                            {e.school&&<span style={R.entryCompany}> · {e.school}</span>}
                          </div>
                          {e.year&&<span style={R.entryMeta}>{e.year}</span>}
                        </div>
                        {e.gpa&&<p style={{...R.bodyText,color:'#9ca3af'}}>GPA: {e.gpa}</p>}
                      </div>
                    ))}
                  </RMainSec>
                )}

                {(resume.volunteer||[]).length>0&&(
                  <RMainSec title="VOLUNTEER">
                    {resume.volunteer.map((v,i)=>(
                      <div key={i} style={R.entry}>
                        <div style={R.entryHead}>
                          <div>
                            <span style={R.entryTitle}>{v.role}</span>
                            {v.organization&&<span style={R.entryCompany}> · {v.organization}</span>}
                          </div>
                          {v.duration&&<span style={R.entryMeta}>{v.duration}</span>}
                        </div>
                      </div>
                    ))}
                  </RMainSec>
                )}

                {(resume.projects||[]).length>0&&(
                  <RMainSec title="PROJECTS">
                    {resume.projects.map((p,i)=>(
                      <div key={i} style={R.entry}>
                        <span style={R.entryTitle}>{p.name}</span>
                        {p.description&&<p style={R.bodyText}>{p.description}</p>}
                      </div>
                    ))}
                  </RMainSec>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Small components ──────────────────────────────────────────
function Sec({ title, children, onAdd }) {
  return (
    <div style={E.sec}>
      <div style={E.secHead}>
        <h3 style={E.secTitle}>{title}</h3>
        {onAdd&&<button style={E.addBtn} className="add-btn" onClick={onAdd}>+ Add</button>}
      </div>
      {children}
    </div>
  )
}

function Card({ children, onDel }) {
  return (
    <div style={E.card}>
      <button style={E.cardDel} onClick={onDel}>✕ Remove</button>
      {children}
    </div>
  )
}

function Inp({ label, val, set, ph='', miss=false }) {
  return (
    <div style={E.field}>
      {label&&(
        <label style={E.label}>
          {label}
          {miss&&<span style={E.missMark}>● missing</span>}
        </label>
      )}
      <input className="inp"
        style={{...E.inp,...(miss?E.inpMiss:{})}}
        value={val||''} placeholder={ph}
        onChange={e=>set(e.target.value)} />
    </div>
  )
}

function TA({ label, val, set, rows=4, miss=false, ph='' }) {
  return (
    <div style={E.field}>
      {label&&(
        <label style={E.label}>
          {label}
          {miss&&<span style={E.missMark}>● missing</span>}
        </label>
      )}
      <textarea className="inp"
        style={{...E.inp, resize:'vertical', lineHeight:1.65, ...(miss?E.inpMiss:{})}}
        value={val||''} rows={rows} placeholder={ph}
        onChange={e=>set(e.target.value)} />
    </div>
  )
}

function Warn({ text }) {
  return <div style={E.warnBanner}>⚠ {text}</div>
}

function RSec({ label, children }) {
  return (
    <div style={R.sideSection}>
      <div style={R.sideLabel}>{label}</div>
      <div style={R.sideDivider} />
      {children}
    </div>
  )
}

function RMainSec({ title, children }) {
  return (
    <div style={R.section}>
      <div style={R.secTitle}>{title}</div>
      <div style={R.secLine} />
      {children}
    </div>
  )
}

// ── Upload styles ─────────────────────────────────────────────
const U = {
  bg:        { minHeight:'100vh', background:'#0f1b2e', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif" },
  card:      { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, padding:'56px 48px', textAlign:'center', width:440, boxShadow:'0 40px 80px rgba(0,0,0,0.4)' },
  title:     { color:'#f1f5f9', fontSize:28, fontWeight:700, letterSpacing:'-0.02em', margin:'16px 0 10px' },
  sub:       { color:'#64748b', fontSize:14, lineHeight:1.75, margin:'0 0 32px', fontWeight:400 },
  fileLabel: { display:'block', background:'rgba(37,99,235,0.08)', color:'#60a5fa', border:'1px dashed rgba(37,99,235,0.3)', borderRadius:12, padding:'13px 20px', cursor:'pointer', marginBottom:14, fontSize:14, fontWeight:500 },
  btn:       { width:'100%', background:'#2563eb', color:'#fff', border:'none', borderRadius:12, padding:14, fontSize:15, cursor:'pointer', fontWeight:600, transition:'all 0.15s ease-out', boxShadow:'0 4px 16px rgba(37,99,235,0.3)' },
}

// ── Editor styles ─────────────────────────────────────────────
const E = {
  wrap:  { display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter',sans-serif", background:'#f3f4f6' },

  // Left
  left:  { width:380, background:'#0f1b2e', display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', borderRight:'1px solid rgba(255,255,255,0.04)' },
  leftTop: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 18px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)' },
  logo:  { color:'#f1f5f9', fontWeight:700, fontSize:15, letterSpacing:'-0.01em' },
  newBtn:{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', color:'#94a3b8', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:500, transition:'all 0.15s' },

  // Completion
  completionWrap:  { padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)' },
  completionLabel: { fontSize:11, color:'#64748b', fontWeight:500 },
  progressBg:      { height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, marginBottom:10 },
  progressFill:    { height:3, borderRadius:2, transition:'width 0.4s ease, background 0.3s' },
  warnBox:         { background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:8, padding:'10px 11px', marginTop:8 },
  warnTitle:       { fontSize:11, color:'#f59e0b', fontWeight:600 },
  warnX:           { background:'transparent', border:'none', color:'rgba(245,158,11,0.5)', cursor:'pointer', fontSize:13, padding:0 },
  warnTags:        { display:'flex', flexWrap:'wrap', gap:5, marginTop:5 },
  warnTag:         { background:'rgba(245,158,11,0.08)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.15)', borderRadius:4, fontSize:10, padding:'2px 7px', fontWeight:500 },
  completeBox:     { marginTop:8, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, padding:'7px 11px', color:'#10b981', fontSize:11, fontWeight:600 },

  // Tabs
  tabs:     { overflowY:'auto', padding:'6px 8px', borderBottom:'1px solid rgba(255,255,255,0.05)', maxHeight:260 },
  tab:      { display:'flex', alignItems:'center', gap:8, width:'100%', background:'transparent', border:'none', color:'#64748b', borderRadius:8, padding:'9px 10px', cursor:'pointer', fontSize:12, fontWeight:500, position:'relative', transition:'background 0.15s', textAlign:'left', fontFamily:"'Inter',sans-serif" },
  tabActive:{ background:'rgba(37,99,235,0.12)', color:'#60a5fa' },
  tabIcon:  { fontSize:13, flexShrink:0 },
  tabLabel: { flex:1 },
  tabDot:   { width:6, height:6, borderRadius:'50%', background:'#f59e0b', flexShrink:0 },

  // Form
  formArea: { flex:1, overflowY:'auto', padding:'16px 14px' },
  sec:      { marginBottom:4 },
  secHead:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  secTitle: { color:'#e2e8f0', fontSize:13, fontWeight:600, margin:0 },
  addBtn:   { background:'rgba(37,99,235,0.1)', border:'1px solid rgba(37,99,235,0.2)', color:'#60a5fa', borderRadius:7, padding:'4px 10px', cursor:'pointer', fontSize:11, fontWeight:500, transition:'background 0.15s' },
  card:     { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'12px', marginBottom:10 },
  cardDel:  { background:'transparent', border:'none', color:'#ef4444', fontSize:11, cursor:'pointer', padding:0, marginBottom:8, fontWeight:500, fontFamily:"'Inter',sans-serif" },
  field:    { marginBottom:10 },
  label:    { display:'flex', alignItems:'center', gap:6, color:'#475569', fontSize:10, fontWeight:500, marginBottom:4, letterSpacing:'0.04em', textTransform:'uppercase' },
  inp:      { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#e2e8f0', padding:'8px 10px', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' },
  inpMiss:  { borderColor:'rgba(245,158,11,0.5)', background:'rgba(245,158,11,0.04)' },
  missMark: { color:'#f59e0b', fontSize:9, fontWeight:600 },
  warnBanner:{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:7, color:'#f59e0b', fontSize:12, padding:'8px 10px', marginBottom:12, fontWeight:500 },
  hint:     { color:'#475569', fontSize:11, margin:'0 0 10px', lineHeight:1.6, fontWeight:400 },
  skillRow: { display:'flex', gap:8, alignItems:'center', marginBottom:7 },
  skillDel: { background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:15, padding:0, flexShrink:0 },
  aiBtn:    { width:'100%', background:'#2563eb', color:'#fff', border:'none', borderRadius:10, padding:'11px', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s ease-out', boxShadow:'0 4px 14px rgba(37,99,235,0.25)', fontFamily:"'Inter',sans-serif" },
  successBox:{ marginTop:10, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, color:'#10b981', fontSize:12, padding:'8px 10px', fontWeight:600 },

  // Right
  right:        { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  toolbar:      { background:'#0f1b2e', padding:'12px 22px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  toolbarLabel: { color:'#475569', fontSize:12, fontWeight:500 },
  dlBtn:        { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', borderRadius:8, padding:'7px 16px', cursor:'pointer', fontSize:13, fontWeight:600, transition:'background 0.15s', fontFamily:"'Inter',sans-serif" },
  previewScroll:{ flex:1, overflowY:'auto', padding:'32px 24px', display:'flex', justifyContent:'center', background:'#f3f4f6' },
  a4: { background:'#fff', width:794, minHeight:1123, boxShadow:'0 8px 48px rgba(0,0,0,0.12)', display:'flex', flexShrink:0, borderRadius:2 },
}

// ── Resume styles ─────────────────────────────────────────────
const R = {
  sidebar:     { width:218, background:'#fafafa', borderRight:'1px solid #f0f0f0', display:'flex', flexDirection:'column', flexShrink:0 },
  sideSection: { padding:'20px 18px 0' },
  sideLabel:   { fontSize:7.5, fontWeight:700, letterSpacing:'0.16em', color:'#374151', marginBottom:5, fontFamily:"'Inter',sans-serif" },
  sideDivider: { height:1, background:'#e5e7eb', marginBottom:8 },
  sideText:    { fontSize:9.5, color:'#4b5563', margin:'0 0 3px', lineHeight:1.55, wordBreak:'break-word', fontFamily:"'Inter',sans-serif" },
  watermark:   { marginTop:'auto', padding:'12px 16px 10px', display:'flex', alignItems:'center', gap:5, borderTop:'1px solid #f0f0f0' },
  watermarkText:{ fontSize:8, color:'#9ca3af', letterSpacing:'0.08em', fontWeight:600, fontFamily:"'Inter',sans-serif" },

  main:    { flex:1, display:'flex', flexDirection:'column' },
header: { background:'#0f1b2e', padding:'32px 32px 24px' },
  name:    { fontSize:23, fontWeight:700, color:'#ffffff', margin:'0 0 5px', letterSpacing:'-0.02em', fontFamily:"'Inter',sans-serif" },
  title:   { fontSize:12, color:'#93c5fd', margin:'0 0 6px', fontWeight:400, fontFamily:"'Inter',sans-serif" },
  contact: { fontSize:10, color:'#64748b', margin:0, fontFamily:"'Inter',sans-serif" },
 body: { padding:'24px 32px', flex:1, overflow:'hidden' },
  section: { marginBottom:12 },
  secTitle:{ fontSize:8.5, fontWeight:700, letterSpacing:'0.16em', color:'#0f1b2e', marginBottom:4, fontFamily:"'Inter',sans-serif" },
  secLine: { height:1.5, background:'#0f1b2e', marginBottom:10, opacity:0.15 },
  entry:   { marginBottom:8 },
  entryHead:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:3 },
  entryTitle:{ fontSize:11.5, fontWeight:600, color:'#111827', fontFamily:"'Inter',sans-serif" },
  entryCompany:{ fontSize:11, color:'#6b7280', fontFamily:"'Inter',sans-serif" },
  entryMeta:{ fontSize:9.5, color:'#9ca3af', whiteSpace:'nowrap', marginLeft:8, flexShrink:0, fontFamily:"'Inter',sans-serif" },
 bodyText: { fontSize:10.5, color:'#374151', lineHeight:1.7, margin:'4px 0 0', fontFamily:"'Inter',sans-serif" },
}