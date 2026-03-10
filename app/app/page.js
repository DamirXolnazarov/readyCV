'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

// ── Tab config ────────────────────────────────────────────────
const TABS = [
  { id:'personal',   label:'Personal',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id:'experience', label:'Experience', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id:'education',  label:'Education',  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id:'skills',     label:'Skills',     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id:'style',      label:'Style',      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M20.188 10.934c.2.617.312 1.3.312 1.966 0 .666-.112 1.35-.312 1.966m-16.376 0A9.956 9.956 0 0 1 3.5 12.9a9.956 9.956 0 0 1 .312-1.966m3.024-4.91a9.978 9.978 0 0 1 2.828-1.632m6.672 0a9.978 9.978 0 0 1 2.828 1.632m-12.328 12.984a9.978 9.978 0 0 0 2.828 1.632m6.672 0a9.978 9.978 0 0 0 2.828-1.632" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
]

const ACCENT_COLORS = ['#2563EB','#0F172A','#7C3AED','#DC2626','#059669','#D97706','#DB2777','#0891B2']
const TEMPLATES = [
  { id:'sidebar',    label:'Sidebar',    desc:'Two-column with sidebar' },
  { id:'executive',  label:'Executive',  desc:'Clean single-column' },
  { id:'heritage',   label:'Heritage',   desc:'Classic traditional' },
]

// ── Input components ──────────────────────────────────────────
const inp = {
  width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)',
  borderRadius:10, color:'#f1f5f9', padding:'11px 14px', fontSize:13.5,
  fontFamily:'inherit', outline:'none', transition:'all 0.18s ease',
}
const inpFocus = { borderColor:'rgba(59,255,125,0.4)', boxShadow:'0 0 0 3px rgba(59,255,125,0.08)' }

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:7 }}>{label}</label>
      {hint && <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginBottom:8, lineHeight:1.5 }}>{hint}</p>}
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type='text', multiline=false, rows=3 }) {
  const [focused, setFocused] = useState(false)
  const style = { ...inp, ...(focused ? inpFocus : {}), ...(multiline ? { resize:'vertical', minHeight:rows*40 } : {}) }
  const props = { value:value||'', onChange:e=>onChange(e.target.value), placeholder, onFocus:()=>setFocused(true), onBlur:()=>setFocused(false), style }
  return multiline ? <textarea {...props}/> : <input type={type} {...props}/>
}

function Row({ children, gap=12 }) {
  return <div style={{ display:'grid', gridTemplateColumns:`repeat(${children.length},1fr)`, gap }}>{children}</div>
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({ title, onAdd, addLabel='Add' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
      <h3 style={{ color:'#f1f5f9', fontWeight:700, fontSize:15, letterSpacing:'-0.01em' }}>{title}</h3>
      {onAdd && (
        <button onClick={onAdd} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(59,255,125,0.08)', border:'1px solid rgba(59,255,125,0.2)', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:600, color:'#3BFF7D', cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(59,255,125,0.14)';e.currentTarget.style.borderColor='rgba(59,255,125,0.35)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(59,255,125,0.08)';e.currentTarget.style.borderColor='rgba(59,255,125,0.2)'}}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          {addLabel}
        </button>
      )}
    </div>
  )
}

// ── Entry card ────────────────────────────────────────────────
function EntryCard({ onRemove, children }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'20px 20px 16px', marginBottom:14, position:'relative' }}>
      <button onClick={onRemove} style={{ position:'absolute', top:12, right:12, width:26, height:26, borderRadius:6, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', color:'rgba(239,68,68,0.7)', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.18)';e.currentTarget.style.color='#FCA5A5'}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.08)';e.currentTarget.style.color='rgba(239,68,68,0.7)'}}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
      {children}
    </div>
  )
}

// ── Live CV Preview ───────────────────────────────────────────
function CVPreview({ data, accentColor, template }) {
  const ac = accentColor || '#2563EB'
  const r = data || {}

  return (
    <div style={{ width:'100%', height:'100%', overflowY:'auto', background:'#1a1f2e', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'24px 20px' }}>
      <style>{`
        .cv-preview::-webkit-scrollbar{width:4px;}
        .cv-preview::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
      `}</style>
      {/* A4 Paper */}
      <div style={{ width:'100%', maxWidth:560, background:'#fff', borderRadius:4, boxShadow:'0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.15)', fontFamily:"'Inter', sans-serif", fontSize:11, color:'#1a1a1a', overflow:'hidden', minHeight:700 }}>
        
        {/* Header band */}
        <div style={{ background:ac, padding:'24px 28px 20px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
            {r.photo && <img src={r.photo} alt="photo" style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(255,255,255,0.3)', flexShrink:0 }}/>}
            <div style={{ flex:1, minWidth:0 }}>
              <h1 style={{ fontSize:20, fontWeight:700, color:'#fff', margin:'0 0 3px', letterSpacing:'-0.02em', lineHeight:1.2 }}>{r.name || 'Your Name'}</h1>
              {r.title && <p style={{ fontSize:12, color:'rgba(255,255,255,0.72)', margin:'0 0 10px' }}>{r.title}</p>}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 14px' }}>
                {r.email    && <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.65)' }}>{r.email}</span>}
                {r.phone    && <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.65)' }}>{r.phone}</span>}
                {r.location && <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.65)' }}>{r.location}</span>}
                {r.linkedin && <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.65)' }}>{r.linkedin}</span>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:'18px 28px' }}>
          {/* Summary */}
          {r.summary && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', color:ac, textTransform:'uppercase', marginBottom:6, paddingBottom:4, borderBottom:`1.5px solid ${ac}22` }}>Profile</div>
              <p style={{ fontSize:10.5, color:'#374151', lineHeight:1.7 }}>{r.summary}</p>
            </div>
          )}

          {/* Experience */}
          {(r.experience||[]).length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', color:ac, textTransform:'uppercase', marginBottom:8, paddingBottom:4, borderBottom:`1.5px solid ${ac}22` }}>Experience</div>
              {r.experience.map((e,i) => (
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <p style={{ fontWeight:600, fontSize:11, color:'#111', margin:'0 0 1px' }}>{e.role}</p>
                      <p style={{ fontSize:10, color:'#6b7280', margin:0 }}>{e.company}</p>
                    </div>
                    {e.duration && <span style={{ fontSize:9, color:'#9ca3af', whiteSpace:'nowrap', marginLeft:8 }}>{e.duration}</span>}
                  </div>
                  {e.description && <p style={{ fontSize:10, color:'#4b5563', lineHeight:1.6, marginTop:4 }}>{e.description}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {(r.education||[]).length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', color:ac, textTransform:'uppercase', marginBottom:8, paddingBottom:4, borderBottom:`1.5px solid ${ac}22` }}>Education</div>
              {r.education.map((e,i) => (
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ fontWeight:600, fontSize:11, color:'#111', margin:'0 0 1px' }}>{e.school}</p>
                      {e.degree && <p style={{ fontSize:10, color:'#6b7280', margin:0 }}>{e.degree}{e.field?` in ${e.field}`:''}</p>}
                    </div>
                    {e.year && <span style={{ fontSize:9, color:'#9ca3af' }}>{e.year}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {(r.skills||[]).filter(Boolean).length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', color:ac, textTransform:'uppercase', marginBottom:8, paddingBottom:4, borderBottom:`1.5px solid ${ac}22` }}>Skills</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {r.skills.filter(Boolean).map((s,i) => (
                  <span key={i} style={{ background:`${ac}12`, border:`1px solid ${ac}25`, color:ac, borderRadius:4, padding:'2px 7px', fontSize:9.5, fontWeight:500 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {(r.languages||[]).length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', color:ac, textTransform:'uppercase', marginBottom:6, paddingBottom:4, borderBottom:`1.5px solid ${ac}22` }}>Languages</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 16px' }}>
                {r.languages.map((l,i) => (
                  <span key={i} style={{ fontSize:10, color:'#374151' }}><strong>{l.language}</strong>{l.proficiency?` — ${l.proficiency}`:''}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const { data:session, status } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('personal')
  const [data, setData] = useState({
    name:'', title:'', email:'', phone:'', location:'', linkedin:'', dob:'', nationality:'',
    summary:'', photo:null,
    experience:[], education:[], skills:[], languages:[],
    certifications:[], volunteer:[], projects:[], interests:[], awards:[],
  })
  const [accentColor, setAccentColor] = useState('#2563EB')
  const [template, setTemplate] = useState('sidebar')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [showCover, setShowCover] = useState(false)
  const [jobDesc, setJobDesc] = useState('')
  const [editId, setEditId] = useState(null)
  const fileRef = useRef(null)
  const pdfRef  = useRef(null)

  // Load from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('editResume')
    if (saved) {
      try {
        const r = JSON.parse(saved)
        setEditId(r.id)
        setData(r.data || {})
        setAccentColor(r.accent_color || '#2563EB')
        setTemplate(r.template || 'sidebar')
        sessionStorage.removeItem('editResume')
      } catch {}
    }
  }, [])

  const upd = (key, val) => setData(d => ({ ...d, [key]: val }))
  const updList = (key, idx, field, val) => setData(d => {
    const arr = [...(d[key]||[])]
    arr[idx] = { ...arr[idx], [field]: val }
    return { ...d, [key]: arr }
  })
  const addItem = (key, template) => setData(d => ({ ...d, [key]: [...(d[key]||[]), template] }))
  const removeItem = (key, idx) => setData(d => ({ ...d, [key]: d[key].filter((_,i)=>i!==idx) }))

  // Save
  const handleSave = async () => {
    if (!session?.user?.email) { router.push('/signin'); return }
    setSaving(true)
    const payload = { user_email:session.user.email, data, template, accent_color:accentColor, updated_at:new Date().toISOString() }
    if (editId) {
      await supabase.from('resumes').update(payload).eq('id', editId)
    } else {
      const { data:row } = await supabase.from('resumes').insert(payload).select().single()
      if (row) setEditId(row.id)
    }
    setSaving(false)
    setSaveMsg('Saved')
    setTimeout(() => setSaveMsg(''), 2500)
  }

  // PDF upload
  const handlePdfUpload = async (file) => {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/extract', { method:'POST', body:fd })
      const extracted = await res.json()
      if (extracted && !extracted.error) setData(d => ({ ...d, ...extracted }))
    } catch {}
    setUploading(false)
  }

  // Download PDF
  const handleDownload = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/download', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ resume:data, template, accentColor }) })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${data.name||'resume'}-icvy.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch {}
    setSaving(false)
  }

  if (status==='loading') return (
    <div style={{ minHeight:'100vh', background:'#070a14', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'#3BFF7D', animation:'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // ── Render tabs content ───────────────────────────────────
  const renderTab = () => {
    switch(activeTab) {

      case 'personal': return (
        <div>
          {/* Photo upload */}
          <Field label="Profile Photo">
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:8 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:data.photo?'transparent':'rgba(255,255,255,0.04)', border:'2px solid rgba(255,255,255,0.1)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {data.photo
                  ? <img src={data.photo} alt="photo" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/><path d="M21 15l-5-5L5 21" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>upd('photo',ev.target.result); r.readAsDataURL(f) }}/>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <button onClick={()=>fileRef.current?.click()} style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:9, padding:'8px 16px', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Upload Photo
                </button>
                {data.photo && <button onClick={()=>upd('photo',null)} style={{ fontSize:11, color:'rgba(239,68,68,0.6)', background:'none', border:'none', cursor:'pointer', padding:0, textAlign:'left', fontFamily:'inherit' }}>Remove photo</button>}
              </div>
            </div>
          </Field>

          <Row>
            <Field label="Full Name"><TextInput value={data.name} onChange={v=>upd('name',v)} placeholder="John Smith"/></Field>
            <Field label="Job Title"><TextInput value={data.title} onChange={v=>upd('title',v)} placeholder="Product Designer"/></Field>
          </Row>
          <Row>
            <Field label="Email"><TextInput value={data.email} onChange={v=>upd('email',v)} placeholder="you@example.com" type="email"/></Field>
            <Field label="Phone"><TextInput value={data.phone} onChange={v=>upd('phone',v)} placeholder="+1 234 567 8900"/></Field>
          </Row>
          <Row>
            <Field label="Location"><TextInput value={data.location} onChange={v=>upd('location',v)} placeholder="New York, NY"/></Field>
            <Field label="LinkedIn"><TextInput value={data.linkedin} onChange={v=>upd('linkedin',v)} placeholder="linkedin.com/in/yourname"/></Field>
          </Row>
          <Row>
            <Field label="Date of Birth"><TextInput value={data.dob} onChange={v=>upd('dob',v)} placeholder="Jan 1, 1995"/></Field>
            <Field label="Nationality"><TextInput value={data.nationality} onChange={v=>upd('nationality',v)} placeholder="American"/></Field>
          </Row>
          <Field label="Professional Summary" hint="2–4 sentences summarising your career, skills, and what you bring.">
            <TextInput value={data.summary} onChange={v=>upd('summary',v)} placeholder="Experienced product designer with 6+ years..." multiline rows={4}/>
          </Field>

          {/* AI Upload */}
          <div style={{ marginTop:8, background:'rgba(59,255,125,0.04)', border:'1px solid rgba(59,255,125,0.15)', borderRadius:14, padding:'18px 20px' }}>
            <p style={{ fontSize:12, fontWeight:600, color:'#3BFF7D', marginBottom:4 }}>LinkedIn PDF Import</p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:14, lineHeight:1.6 }}>Upload your LinkedIn PDF and AI will fill in all fields automatically.</p>
            <input ref={pdfRef} type="file" accept=".pdf" style={{ display:'none' }} onChange={e=>handlePdfUpload(e.target.files[0])}/>
            <button onClick={()=>pdfRef.current?.click()} disabled={uploading} style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(59,255,125,0.12)', border:'1px solid rgba(59,255,125,0.25)', borderRadius:9, padding:'9px 18px', fontSize:12, fontWeight:700, color:'#3BFF7D', cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s' }}>
              {uploading
                ? <><div style={{ width:12, height:12, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'#3BFF7D', animation:'spin 1s linear infinite' }}/> Extracting...</>
                : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> Import from LinkedIn PDF</>
              }
            </button>
          </div>
        </div>
      )

      case 'experience': return (
        <div>
          <SectionHeader title="Work Experience" onAdd={()=>addItem('experience',{role:'',company:'',duration:'',description:''})} addLabel="Add Position"/>
          {(data.experience||[]).length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.2)', fontSize:13 }}>No experience added yet. Click "Add Position" to start.</div>
          )}
          {(data.experience||[]).map((e,i) => (
            <EntryCard key={i} onRemove={()=>removeItem('experience',i)}>
              <Row>
                <Field label="Job Title"><TextInput value={e.role} onChange={v=>updList('experience',i,'role',v)} placeholder="Product Manager"/></Field>
                <Field label="Company"><TextInput value={e.company} onChange={v=>updList('experience',i,'company',v)} placeholder="Acme Inc."/></Field>
              </Row>
              <Field label="Duration"><TextInput value={e.duration} onChange={v=>updList('experience',i,'duration',v)} placeholder="Jan 2022 – Present"/></Field>
              <Field label="Description" hint="Key achievements and responsibilities.">
                <TextInput value={e.description} onChange={v=>updList('experience',i,'description',v)} placeholder="Led a team of 5 engineers..." multiline rows={3}/>
              </Field>
            </EntryCard>
          ))}

          {/* ATS Tailor */}
          <div style={{ marginTop:12, background:'rgba(96,165,250,0.04)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:14, padding:'18px 20px' }}>
            <p style={{ fontSize:12, fontWeight:600, color:'#60A5FA', marginBottom:4 }}>ATS Job Tailoring</p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:12, lineHeight:1.6 }}>Paste a job description to align your resume keywords.</p>
            <textarea value={jobDesc} onChange={e=>setJobDesc(e.target.value)} placeholder="Paste job description here..." style={{ ...inp, resize:'vertical', minHeight:80, marginBottom:12 }}/>
            <button disabled={!jobDesc.trim()} style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(96,165,250,0.12)', border:'1px solid rgba(96,165,250,0.25)', borderRadius:9, padding:'9px 18px', fontSize:12, fontWeight:700, color:'#60A5FA', cursor:'pointer', fontFamily:'inherit', opacity:!jobDesc.trim()?0.5:1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Tailor with AI
            </button>
          </div>
        </div>
      )

      case 'education': return (
        <div>
          <SectionHeader title="Education" onAdd={()=>addItem('education',{school:'',degree:'',field:'',year:'',gpa:''})} addLabel="Add Education"/>
          {(data.education||[]).length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.2)', fontSize:13 }}>No education added. Click "Add Education" to start.</div>
          )}
          {(data.education||[]).map((e,i) => (
            <EntryCard key={i} onRemove={()=>removeItem('education',i)}>
              <Field label="School / University"><TextInput value={e.school} onChange={v=>updList('education',i,'school',v)} placeholder="Harvard University"/></Field>
              <Row>
                <Field label="Degree"><TextInput value={e.degree} onChange={v=>updList('education',i,'degree',v)} placeholder="Bachelor of Science"/></Field>
                <Field label="Field of Study"><TextInput value={e.field} onChange={v=>updList('education',i,'field',v)} placeholder="Computer Science"/></Field>
              </Row>
              <Row>
                <Field label="Year"><TextInput value={e.year} onChange={v=>updList('education',i,'year',v)} placeholder="2020 – 2024"/></Field>
                <Field label="GPA (optional)"><TextInput value={e.gpa} onChange={v=>updList('education',i,'gpa',v)} placeholder="3.9 / 4.0"/></Field>
              </Row>
            </EntryCard>
          ))}

          <div style={{ marginTop:12 }}>
            <SectionHeader title="Languages" onAdd={()=>addItem('languages',{language:'',proficiency:''})} addLabel="Add Language"/>
            {(data.languages||[]).map((l,i) => (
              <EntryCard key={i} onRemove={()=>removeItem('languages',i)}>
                <Row>
                  <Field label="Language"><TextInput value={l.language} onChange={v=>updList('languages',i,'language',v)} placeholder="French"/></Field>
                  <Field label="Proficiency"><TextInput value={l.proficiency} onChange={v=>updList('languages',i,'proficiency',v)} placeholder="Native / Fluent / B2"/></Field>
                </Row>
              </EntryCard>
            ))}
          </div>
        </div>
      )

      case 'skills': return (
        <div>
          <SectionHeader title="Skills" onAdd={()=>addItem('skills','')} addLabel="Add Skill"/>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
            {(data.skills||[]).map((s,i) => (
              <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(59,255,125,0.06)', border:'1px solid rgba(59,255,125,0.18)', borderRadius:8, padding:'4px 4px 4px 12px' }}>
                <input value={s} onChange={e=>{ const arr=[...(data.skills||[])]; arr[i]=e.target.value; upd('skills',arr) }} placeholder="e.g. Python" style={{ background:'transparent', border:'none', color:'#3BFF7D', fontSize:12, fontWeight:500, outline:'none', width:Math.max(60, (s||'').length*8+20), fontFamily:'inherit' }}/>
                <button onClick={()=>removeItem('skills',i)} style={{ width:20, height:20, borderRadius:5, background:'rgba(255,255,255,0.05)', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </button>
              </div>
            ))}
            <button onClick={()=>addItem('skills','')} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.04)', border:'1px dashed rgba(255,255,255,0.12)', borderRadius:8, padding:'5px 14px', fontSize:12, color:'rgba(255,255,255,0.35)', cursor:'pointer', fontFamily:'inherit' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Add skill
            </button>
          </div>

          <div style={{ marginTop:12 }}>
            <SectionHeader title="Certifications" onAdd={()=>addItem('certifications',{name:'',issuer:'',year:''})} addLabel="Add"/>
            {(data.certifications||[]).map((c,i) => (
              <EntryCard key={i} onRemove={()=>removeItem('certifications',i)}>
                <Field label="Certification Name"><TextInput value={c.name} onChange={v=>updList('certifications',i,'name',v)} placeholder="AWS Solutions Architect"/></Field>
                <Row>
                  <Field label="Issuer"><TextInput value={c.issuer} onChange={v=>updList('certifications',i,'issuer',v)} placeholder="Amazon Web Services"/></Field>
                  <Field label="Year"><TextInput value={c.year} onChange={v=>updList('certifications',i,'year',v)} placeholder="2023"/></Field>
                </Row>
              </EntryCard>
            ))}
          </div>

          {/* Cover letter */}
          <div style={{ marginTop:12, background:'rgba(167,139,250,0.04)', border:'1px solid rgba(167,139,250,0.15)', borderRadius:14, padding:'18px 20px' }}>
            <p style={{ fontSize:12, fontWeight:600, color:'#A78BFA', marginBottom:4 }}>AI Cover Letter</p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:14, lineHeight:1.6 }}>Generate a tailored cover letter based on your resume in one click.</p>
            {coverLetter
              ? <div>
                  <textarea value={coverLetter} onChange={e=>setCoverLetter(e.target.value)} style={{ ...inp, resize:'vertical', minHeight:160, marginBottom:12, fontSize:12 }}/>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>{ const a=document.createElement('a'); const blob=new Blob([coverLetter],{type:'text/plain'}); a.href=URL.createObjectURL(blob); a.download='cover-letter.txt'; a.click() }} style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(167,139,250,0.12)', border:'1px solid rgba(167,139,250,0.25)', borderRadius:9, padding:'8px 16px', fontSize:12, fontWeight:600, color:'#A78BFA', cursor:'pointer', fontFamily:'inherit' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Download
                    </button>
                    <button onClick={()=>setCoverLetter('')} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'8px 14px', fontSize:12, color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit' }}>Regenerate</button>
                  </div>
                </div>
              : <button disabled={generating} onClick={async()=>{ setGenerating(true); try{ const res=await fetch('/api/cover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resume:data,jobDesc})}); const d=await res.json(); if(d.letter) setCoverLetter(d.letter) }catch{} setGenerating(false) }} style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(167,139,250,0.12)', border:'1px solid rgba(167,139,250,0.25)', borderRadius:9, padding:'9px 18px', fontSize:12, fontWeight:700, color:'#A78BFA', cursor:'pointer', fontFamily:'inherit', opacity:generating?0.7:1 }}>
                  {generating ? <><div style={{ width:12,height:12,borderRadius:'50%',border:'1.5px solid transparent',borderTopColor:'#A78BFA',animation:'spin 1s linear infinite' }}/> Generating...</> : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> Generate Cover Letter</>}
                </button>
            }
          </div>
        </div>
      )

      case 'style': return (
        <div>
          {/* Accent color */}
          <Field label="Accent Color" hint="This color will be used for headers and accents in your resume.">
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:4 }}>
              {ACCENT_COLORS.map(c => (
                <button key={c} onClick={()=>setAccentColor(c)} style={{ width:36, height:36, borderRadius:10, background:c, border:`2px solid ${accentColor===c ? '#fff' : 'transparent'}`, cursor:'pointer', transition:'all 0.18s', boxShadow:accentColor===c?`0 0 0 3px ${c}50`:'' }}/>
              ))}
              <input type="color" value={accentColor} onChange={e=>setAccentColor(e.target.value)} style={{ width:36, height:36, borderRadius:10, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)', cursor:'pointer', padding:2 }}/>
            </div>
          </Field>

          {/* Template */}
          <Field label="Template" hint="Choose a layout for your resume.">
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:4 }}>
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={()=>setTemplate(t.id)} style={{ display:'flex', alignItems:'center', gap:14, background:template===t.id?'rgba(59,255,125,0.07)':'rgba(255,255,255,0.03)', border:`1.5px solid ${template===t.id?'rgba(59,255,125,0.35)':'rgba(255,255,255,0.08)'}`, borderRadius:12, padding:'14px 16px', cursor:'pointer', textAlign:'left', transition:'all 0.18s', fontFamily:'inherit' }}>
                  <div style={{ width:40, height:52, borderRadius:4, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', flexShrink:0, overflow:'hidden', position:'relative' }}>
                    {template===t.id && <div style={{ position:'absolute', inset:0, background:accentColor, opacity:0.2 }}/>}
                    <div style={{ padding:'4px 3px' }}>
                      {[8,12,10,12,9,11].map((w,i)=><div key={i} style={{ height:2, width:`${w*5}%`, background:template===t.id?accentColor:'rgba(255,255,255,0.2)', borderRadius:1, marginBottom:2 }}/>)}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:template===t.id?'#3BFF7D':'#f1f5f9', margin:0, marginBottom:3 }}>{t.label}</p>
                    <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:0 }}>{t.desc}</p>
                  </div>
                  {template===t.id && <div style={{ marginLeft:'auto', width:18, height:18, borderRadius:'50%', background:'rgba(59,255,125,0.15)', border:'1.5px solid #3BFF7D', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="#3BFF7D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>}
                </button>
              ))}
            </div>
          </Field>

          {/* Additional sections toggles */}
          <Field label="Optional Sections">
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['volunteer','Volunteer Experience',()=>addItem('volunteer',{role:'',organization:'',duration:''})],
                ['projects','Projects',()=>addItem('projects',{name:'',description:''})],
                ['awards','Awards',()=>addItem('awards',{name:'',issuer:'',year:''})],
                ['interests','Interests',()=>addItem('interests',{interest:''})],
              ].map(([key,label,addFn]) => (
                <button key={key} onClick={addFn} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'12px 16px', cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                  <span style={{ fontSize:13, color:'#f1f5f9' }}>{label}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', gap:4 }}>
                    {(data[key]||[]).length} added
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v8M1 5h8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  </span>
                </button>
              ))}
            </div>
          </Field>
        </div>
      )

      default: return null
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#070a14', fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif", color:'#fff', display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .tab-content{animation:fadeIn 0.25s ease both;}
        textarea,input{font-family:inherit;}
        textarea:focus,input:focus{border-color:rgba(59,255,125,0.4)!important;box-shadow:0 0 0 3px rgba(59,255,125,0.08)!important;outline:none!important;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}
        .pill-tab{transition:all 0.2s ease;}
      `}</style>

      {/* ── Top Bar ── */}
      <div style={{ height:56, background:'rgba(7,10,20,0.95)', backdropFilter:'blur(32px)', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flexShrink:0, position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={()=>router.push('/dashboard')} style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'7px 14px', fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.5)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 1.5L2 6l5.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back
          </button>
          <div style={{ height:20, width:1, background:'rgba(255,255,255,0.07)' }}/>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:'#f1f5f9', margin:0, letterSpacing:'-0.01em' }}>
              {data.name || 'Untitled Resume'}
            </p>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)', margin:0 }}>{data.title || 'Add your job title'}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {saveMsg && <span style={{ fontSize:12, color:'#3BFF7D', fontWeight:500 }}>{saveMsg}</span>}
          <button onClick={handleSave} disabled={saving} style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="1.8"/><polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleDownload} style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#3BFF7D', color:'#050a14', border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 16px rgba(59,255,125,0.3)', transition:'all 0.2s' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Split Screen ── */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'480px 1fr', minHeight:0, height:'calc(100vh - 56px)' }}>

        {/* LEFT — Form panel */}
        <div style={{ background:'rgba(255,255,255,0.015)', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', height:'100%' }}>
          
          {/* Pill tabs */}
          <div style={{ padding:'16px 24px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
            <div style={{ display:'flex', gap:2, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:4 }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className="pill-tab" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'8px 4px', borderRadius:9, background:activeTab===tab.id?'rgba(255,255,255,0.1)':'transparent', border:'none', cursor:'pointer', fontSize:11.5, fontWeight:activeTab===tab.id?600:400, color:activeTab===tab.id?'#f1f5f9':'rgba(255,255,255,0.35)', fontFamily:'inherit', transition:'all 0.2s' }}>
                  <span style={{ color:activeTab===tab.id?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.25)', display:'flex' }}>{tab.icon}</span>
                  <span style={{ whiteSpace:'nowrap' }}>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable form */}
          <div style={{ flex:1, overflowY:'auto', padding:'24px', minHeight:0 }}>
            <div className="tab-content" key={activeTab}>
              {renderTab()}
            </div>
          </div>
        </div>

        {/* RIGHT — Live Preview */}
        <div style={{ position:'relative', height:'100%', overflow:'hidden' }}>
          {/* Preview label */}
          <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', zIndex:10, background:'rgba(10,14,26,0.8)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:100, padding:'5px 14px', display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'#3BFF7D', boxShadow:'0 0 6px #3BFF7D' }}/>
            <span style={{ fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.45)', letterSpacing:'0.04em' }}>Live Preview</span>
          </div>
          <CVPreview data={data} accentColor={accentColor} template={template}/>
        </div>

      </div>
    </div>
  )
}