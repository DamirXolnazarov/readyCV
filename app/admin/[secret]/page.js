'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const FLAG = c => {
  if (!c || c.length !== 2) return '🌐'
  return String.fromCodePoint(...[...c.toUpperCase()].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65))
}

export default function AdminPage() {
  const { secret } = useParams()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    fetch(`/api/admin/stats?secret=${secret}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [secret])

  if (loading) return (
    <div style={S.bg}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'#3BFF7D', animation:'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={S.bg}><p style={{ color:'rgba(255,255,255,0.3)', fontSize:14 }}>Not found.</p></div>
  )

  const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  const stats = [
    { label:'Total users',      value: data.users.total,        accent:'#3BFF7D' },
    { label:'New (24h)',         value: data.users.last24h,      accent:'#3BFF7D' },
    { label:'New (7d)',          value: data.users.last7d,       accent:'#3BFF7D' },
    { label:'Total resumes',     value: data.resumes.total,      accent:'#60A5FA' },
    { label:'Resumes (7d)',      value: data.resumes.last7d,     accent:'#60A5FA' },
    { label:'PDFs downloaded',   value: data.events.pdf_downloaded,           accent:'#F59E0B' },
    { label:'Resumes created',   value: data.events.resume_created,           accent:'#F59E0B' },
    { label:'ATS tailored',      value: data.events.ats_tailored,             accent:'#A78BFA' },
    { label:'Cover letters',     value: data.events.cover_letter_generated,   accent:'#A78BFA' },
  ]

  return (
    <div style={{ ...S.bg, alignItems:'flex-start', padding:'48px 28px 80px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#04060c;font-family:'Inter',sans-serif;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);}
      `}</style>

      {/* Fixed background */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'-10%', left:'-5%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(37,99,235,0.10) 0%,transparent 60%)' }}/>
        <div style={{ position:'absolute', bottom:0, right:0, width:500, height:500, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(124,58,237,0.07) 0%,transparent 60%)' }}/>
        <div style={{ position:'absolute', inset:0, opacity:0.35, backgroundImage:GRAIN }}/>
      </div>

      <div style={{ maxWidth:780, width:'100%', margin:'0 auto', position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ marginBottom:36, animation:'fadeUp 0.5s ease both' }}>
          <p style={{ color:'rgba(255,255,255,0.2)', fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>Admin · Private</p>
          <h1 style={{ color:'#fff', fontSize:28, fontWeight:800, letterSpacing:'-0.03em' }}>Growth Overview</h1>
        </div>

        {/* Stat grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:28 }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background:'rgba(6,8,20,0.45)',
              backdropFilter:'blur(40px) saturate(160%)', WebkitBackdropFilter:'blur(40px) saturate(160%)',
              border:'1px solid rgba(255,255,255,0.07)',
              borderTop:'1px solid rgba(255,255,255,0.14)',
              borderRadius:14, padding:'18px 20px',
              animation:`fadeUp 0.5s ${i*40}ms ease both`,
              boxShadow:'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, fontWeight:500, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.07em' }}>{s.label}</p>
              <p style={{ color: s.accent, fontSize:32, fontWeight:800, letterSpacing:'-0.03em', lineHeight:1, textShadow:`0 0 24px ${s.accent}55` }}>{s.value ?? '—'}</p>
            </div>
          ))}
        </div>

        {/* Countries */}
        {data.countries?.length > 0 && (
          <div style={{
            background:'rgba(6,8,20,0.45)',
            backdropFilter:'blur(40px) saturate(160%)', WebkitBackdropFilter:'blur(40px) saturate(160%)',
            border:'1px solid rgba(255,255,255,0.07)',
            borderTop:'1px solid rgba(255,255,255,0.14)',
            borderRadius:14, padding:'22px 24px',
            animation:'fadeUp 0.5s 360ms ease both',
            boxShadow:'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:18 }}>Users by country</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {data.countries.map((c, i) => {
                const max = data.countries[0].count
                const pct = Math.round((c.count / max) * 100)
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{FLAG(c.country)}</span>
                    <span style={{ color:'rgba(255,255,255,0.55)', fontSize:13, fontWeight:500, width:140, flexShrink:0 }}>{c.country}</span>
                    <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:'linear-gradient(90deg,#3BFF7D,#00C853)', borderRadius:2, transition:'width 0.6s ease' }}/>
                    </div>
                    <span style={{ color:'#3BFF7D', fontSize:13, fontWeight:700, width:28, textAlign:'right', flexShrink:0 }}>{c.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <p style={{ color:'rgba(255,255,255,0.1)', fontSize:11, textAlign:'center', marginTop:32 }}>
          Refreshes on each visit · {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  )
}

const S = {
  bg: {
    minHeight:'100vh', background:'#04060c',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    fontFamily:"'Inter',sans-serif", color:'#fff',
  }
}