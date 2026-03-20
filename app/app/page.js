'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useTrack } from '../../lib/useTrack'

const uid = () => Math.random().toString(36).slice(2, 7)

const EMPTY = {
  experience:     { id:'', role:'', company:'', duration:'', description:'' },
  education:      { id:'', degree:'', field:'', school:'', year:'', gpa:'' },
  certifications: { id:'', name:'', issuer:'', year:'', description:'' },
  projects:       { id:'', name:'', description:'' },
  languages:      { id:'', language:'', proficiency:'' },
  awards:         { id:'', name:'', issuer:'', year:'', description:'' },
  volunteer:      { id:'', organization:'', role:'', duration:'', description:'' },
  interests:      { id:'', interest:'', description:'' },
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
  { id:'personal',       label:'Personal' },
  { id:'summary',        label:'Summary' },
  { id:'experience',     label:'Experience' },
  { id:'education',      label:'Education' },
  { id:'skills',         label:'Skills' },
  { id:'languages',      label:'Languages' },
  { id:'volunteer',      label:'Volunteer' },
  { id:'certifications', label:'Certifications' },
  { id:'projects',       label:'Projects' },
  { id:'interests',      label:'Interests' },
  { id:'awards',         label:'Awards' },
  { id:'ats',            label:'ATS Tailor' },
  { id:'cover',          label:'Cover Letter' },
]

const TEMPLATES = [
  { id:'sidebar',   label:'Sidebar',   desc:'Two-column with accent sidebar',   hasColor:true  },
  { id:'executive', label:'Executive', desc:'Bold header, single column',        hasColor:true  },
  { id:'heritage',  label:'Heritage',  desc:'Classic centered, timeless layout', hasColor:false },
]

const ACCENT_COLORS = [
  { id:'midnight', label:'Midnight',  value:'#0f1b2e' },
  { id:'forest',   label:'Forest',    value:'#1a3a2a' },
  { id:'burgundy', label:'Burgundy',  value:'#4a1528' },
  { id:'slate',    label:'Slate',     value:'#2d3748' },
  { id:'pine',     label:'Pine',      value:'#1e3a2e' },
  { id:'indigo',   label:'Indigo',    value:'#1e1b4b' },
  { id:'copper',   label:'Copper',    value:'#7c3a1e' },
  { id:'teal',     label:'Teal',      value:'#0d3d3d' },
]

const FONTS = {
  sidebar:   [
    { id:'inter',   label:'Inter',   value:"'Inter', sans-serif",             google:'Inter:wght@300;400;500;600;700' },
    { id:'jakarta', label:'Jakarta', value:"'Plus Jakarta Sans', sans-serif", google:'Plus+Jakarta+Sans:wght@300;400;500;600;700' },
    { id:'dm',      label:'DM Sans', value:"'DM Sans', sans-serif",           google:'DM+Sans:wght@300;400;500;600;700' },
  ],
  executive: [
    { id:'georgia',      label:'Georgia',     value:"Georgia, serif",                  google:null },
    { id:'playfair',     label:'Playfair',    value:"'Playfair Display', serif",       google:'Playfair+Display:wght@400;500;600;700;800;900' },
    { id:'merriweather', label:'Merriweather',value:"'Merriweather', serif",           google:'Merriweather:wght@300;400;700;900' },
  ],
  heritage: [
    { id:'georgia',     label:'Georgia',    value:"Georgia, serif",                google:null },
    { id:'lora',        label:'Lora',       value:"'Lora', serif",                 google:'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400' },
    { id:'baskerville', label:'Baskerville',value:"'Libre Baskerville', serif",    google:'Libre+Baskerville:wght@400;700' },
  ],
}

// ── Logo watermark using the real logo ──────────────────────
function WatermarkLogo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <img src="/logo.png" alt="readyCV" style={{ height:8, width:'auto', objectFit:'contain', opacity:0.4 }}/>
    </div>
  )
}

// ── TEMPLATE 1: Sidebar ──────────────────────────────────────
function TemplateSidebar({ resume, accent='#0f1b2e', font="'Inter', sans-serif" }) {
  if (!resume) return null
  return (
    <div style={{ background:'#fff', width:794, minHeight:1123, display:'flex', flexShrink:0, fontFamily:font }}>
      {/* Sidebar */}
      <div style={{ width:215, background:'#fafafa', borderRight:'1px solid #f0f0f0', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'20px 16px 0' }}>
          <SideSecTitle>CONTACT</SideSecTitle>
          {resume.email    && <p style={T1.sideText}>{resume.email}</p>}
          {resume.phone    && <p style={T1.sideText}>{resume.phone}</p>}
          {resume.location && <p style={T1.sideText}>{resume.location}</p>}
          {resume.linkedin && <p style={T1.sideText}>{resume.linkedin}</p>}
          {resume.website  && <p style={T1.sideText}>{resume.website}</p>}
          {resume.nationality && <p style={T1.sideText}>{resume.nationality}</p>}
          {resume.dob      && <p style={T1.sideText}>Born: {resume.dob}</p>}
        </div>
        {(resume.skills||[]).filter(Boolean).length>0 && (
          <div style={{ padding:'14px 16px 0' }}>
            <SideSecTitle>SKILLS</SideSecTitle>
            {resume.skills.filter(Boolean).map((s,i)=><p key={i} style={T1.sideText}>· {s}</p>)}
          </div>
        )}
        {(resume.languages||[]).length>0 && (
          <div style={{ padding:'14px 16px 0' }}>
            <SideSecTitle>LANGUAGES</SideSecTitle>
            {resume.languages.map((l,i)=>(
              <div key={i} style={{marginBottom:5}}>
                <p style={{...T1.sideText,fontWeight:600}}>{l.language}</p>
                {l.proficiency&&<p style={{...T1.sideText,fontSize:8.5,color:'#9ca3af'}}>{l.proficiency}</p>}
              </div>
            ))}
          </div>
        )}
        {(resume.certifications||[]).length>0 && (
          <div style={{ padding:'14px 16px 0' }}>
            <SideSecTitle>CERTIFICATIONS</SideSecTitle>
            {resume.certifications.map((c,i)=>(
              <div key={i} style={{marginBottom:6}}>
                <p style={{...T1.sideText,fontWeight:600}}>{c.name}</p>
                {c.issuer&&<p style={{...T1.sideText,fontSize:8.5,color:'#9ca3af'}}>{c.issuer}{c.year?` · ${c.year}`:''}</p>}
                {c.description&&<p style={{...T1.sideText,fontSize:8.5,color:'#6b7280',fontStyle:'italic'}}>{c.description}</p>}
              </div>
            ))}
          </div>
        )}
        {(resume.awards||[]).length>0 && (
          <div style={{ padding:'14px 16px 0' }}>
            <SideSecTitle>AWARDS</SideSecTitle>
            {resume.awards.map((a,i)=>(
              <div key={i} style={{marginBottom:6}}>
                <p style={{...T1.sideText,fontWeight:600}}>{a.name}</p>
                {(a.issuer||a.year)&&<p style={{...T1.sideText,fontSize:8.5,color:'#9ca3af'}}>{a.issuer}{a.year?` · ${a.year}`:''}</p>}
                {a.description&&<p style={{...T1.sideText,fontSize:8.5,color:'#6b7280',fontStyle:'italic'}}>{a.description}</p>}
              </div>
            ))}
          </div>
        )}
        {(resume.interests||[]).length>0 && (
          <div style={{ padding:'14px 16px 0' }}>
            <SideSecTitle>INTERESTS</SideSecTitle>
            {resume.interests.map((it,i)=>(
              <div key={i} style={{marginBottom:4}}>
                <p style={T1.sideText}>· {it.interest}</p>
                {it.description&&<p style={{...T1.sideText,fontSize:8.5,color:'#6b7280',fontStyle:'italic',paddingLeft:8}}>{it.description}</p>}
              </div>
            ))}
          </div>
        )}
        <div style={{marginTop:'auto',padding:'10px 16px 8px',display:'flex',alignItems:'center',gap:4,borderTop:'1px solid #f0f0f0'}}>
          <WatermarkLogo/>
        </div>
      </div>
      {/* Main column */}
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ background:accent, padding:'24px 24px 18px' }}>
          <h1 style={{fontSize:22,fontWeight:700,color:'#fff',margin:'0 0 3px',letterSpacing:'-0.02em'}}>{resume.name||'Your Name'}</h1>
          {resume.title&&<p style={{fontSize:11.5,color:'rgba(255,255,255,0.65)',margin:0,fontWeight:400}}>{resume.title}</p>}
        </div>
        <div style={{ padding:'18px 24px', flex:1 }}>
          {resume.summary&&<T1Sec title="PROFILE" accent={accent}><p style={T1.body}>{resume.summary}</p>{resume.references&&<p style={{...T1.body,fontStyle:'italic',color:'#9ca3af',marginTop:3}}>References: {resume.references}</p>}</T1Sec>}
          {(resume.experience||[]).length>0&&<T1Sec title="EXPERIENCE" accent={accent}>{resume.experience.map((e,i)=><T1Entry key={i} title={e.role} sub={e.company} meta={e.duration} desc={e.description}/>)}</T1Sec>}
          {(resume.education||[]).length>0&&<T1Sec title="EDUCATION" accent={accent}>{resume.education.map((e,i)=>(
            <div key={i} style={{marginBottom:9}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <span style={T1.entryTitle}>{e.school}</span>
                  {e.degree&&<span style={T1.entrySub}> · {e.degree}{e.field?` in ${e.field}`:''}</span>}
                </div>
                {e.year&&<span style={{...T1.meta,flexShrink:0}}>{e.year}</span>}
              </div>
              {e.gpa&&<p style={{...T1.body,color:'#9ca3af'}}>GPA: {e.gpa}</p>}
            </div>
          ))}</T1Sec>}
          {(resume.volunteer||[]).length>0&&<T1Sec title="VOLUNTEER" accent={accent}>{resume.volunteer.map((v,i)=><T1Entry key={i} title={v.role} sub={v.organization} meta={v.duration} desc={v.description}/>)}</T1Sec>}
          {(resume.projects||[]).length>0&&<T1Sec title="PROJECTS" accent={accent}>{resume.projects.map((p,i)=>(
            <div key={i} style={{marginBottom:9}}>
              <span style={T1.entryTitle}>{p.name}</span>
              {p.description&&<p style={T1.body}>{p.description}</p>}
            </div>
          ))}</T1Sec>}
        </div>
      </div>
    </div>
  )
}
function SideSecTitle({ children }) {
  return (
    <>
      <div style={{fontSize:7.5,fontWeight:700,letterSpacing:'0.16em',color:'#374151',marginBottom:4}}>{children}</div>
      <div style={{height:1,background:'#e5e7eb',marginBottom:6}}/>
    </>
  )
}
function T1Sec({title,children,accent}){return(<div style={{marginBottom:13}}><div style={{fontSize:8,fontWeight:700,letterSpacing:'0.16em',color:accent,marginBottom:2}}>{title}</div><div style={{height:1.5,background:accent,opacity:0.15,marginBottom:8}}/>{children}</div>)}
function T1Entry({title,sub,meta,desc}){return(<div style={{marginBottom:9}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:2}}><div style={{flex:1,minWidth:0}}><span style={T1.entryTitle}>{title}</span>{sub&&<span style={T1.entrySub}> · {sub}</span>}</div>{meta&&<span style={{...T1.meta,flexShrink:0}}>{meta}</span>}</div>{desc&&<p style={T1.body}>{desc}</p>}</div>)}
const T1 = {
  sideText:   {fontSize:9.5,color:'#4b5563',margin:'0 0 2px',lineHeight:1.55,wordBreak:'break-word'},
  entryTitle: {fontSize:11,fontWeight:600,color:'#111827'},
  entrySub:   {fontSize:10.5,color:'#6b7280'},
  meta:       {fontSize:9,color:'#9ca3af',whiteSpace:'nowrap',marginLeft:8},
  body:       {fontSize:10,color:'#374151',lineHeight:1.7,margin:'2px 0 0'},
}

// ── TEMPLATE 2: Executive ────────────────────────────────────
function TemplateExecutive({ resume, accent='#1a3a2a', font="Georgia, serif" }) {
  if (!resume) return null
  return (
    <div style={{ background:'#fff', width:794, minHeight:1123, flexShrink:0, fontFamily:font, padding:'30px 38px', boxSizing:'border-box' }}>
      <div style={{marginBottom:14}}>
        <h1 style={{fontSize:30,fontWeight:700,color:accent,margin:'0 0 3px',letterSpacing:'-0.01em'}}>{resume.name||'Your Name'}</h1>
        {resume.title&&<p style={{fontSize:12.5,color:'#555',margin:0,fontWeight:400}}>{resume.title}</p>}
      </div>
      <div style={{background:accent,display:'flex',flexWrap:'wrap',gap:0,marginBottom:18,borderRadius:3,overflow:'hidden'}}>
        {resume.phone    && <div style={T2.contactItem}>📞 {resume.phone}</div>}
        {resume.email    && <div style={T2.contactItem}>✉ {resume.email}</div>}
        {resume.location && <div style={T2.contactItem}>📍 {resume.location}</div>}
        {resume.linkedin && <div style={T2.contactItem}>🔗 {resume.linkedin}</div>}
      </div>
      {resume.summary&&<T2Sec title="SUMMARY" accent={accent}><p style={T2.body}>{resume.summary}</p></T2Sec>}
      {(resume.skills||[]).filter(Boolean).length>0&&(
        <T2Sec title="SKILLS" accent={accent}>
          <p style={T2.body}>{resume.skills.filter(Boolean).join(' · ')}</p>
        </T2Sec>
      )}
      {(resume.experience||[]).length>0&&(
        <T2Sec title="EXPERIENCE" accent={accent}>
          {resume.experience.map((e,i)=>(
            <div key={i} style={{marginBottom:11}}>
              <p style={{fontSize:10.5,color:'#555',margin:'0 0 1px',fontWeight:400}}>{e.company}</p>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                <p style={{fontSize:11,fontWeight:700,color:'#222',margin:'0 0 2px'}}>{e.role}</p>
                {e.duration&&<span style={{fontSize:9.5,color:'#777',flexShrink:0,marginLeft:8}}>{e.duration}</span>}
              </div>
              {e.description&&<p style={T2.body}>{e.description}</p>}
            </div>
          ))}
        </T2Sec>
      )}
      {(resume.education||[]).length>0&&(
        <T2Sec title="EDUCATION" accent={accent}>
          {resume.education.map((e,i)=>(
            <div key={i} style={{marginBottom:9}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:11,fontWeight:700,color:'#222',margin:'0 0 1px'}}>{e.school}</p>
                  {e.degree&&<p style={{fontSize:10,color:'#555',margin:0}}>{e.degree}{e.field?` in ${e.field}`:''}</p>}
                </div>
                {e.year&&<span style={{fontSize:9.5,color:'#777',flexShrink:0}}>{e.year}</span>}
              </div>
              {e.gpa&&<p style={{...T2.body,color:'#777'}}>GPA: {e.gpa}</p>}
            </div>
          ))}
        </T2Sec>
      )}
      {(resume.languages||[]).length>0&&(
        <T2Sec title="LANGUAGES" accent={accent}>
          <p style={T2.body}>{resume.languages.map(l=>`${l.language}${l.proficiency?` (${l.proficiency})`:''}`).join(' · ')}</p>
        </T2Sec>
      )}
      {(resume.volunteer||[]).length>0&&(
        <T2Sec title="VOLUNTEER" accent={accent}>
          {resume.volunteer.map((v,i)=>(
            <div key={i} style={{marginBottom:7}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:11,fontWeight:700,color:'#222'}}>{v.role}</span>
                {v.duration&&<span style={{fontSize:9.5,color:'#777'}}>{v.duration}</span>}
              </div>
              {v.organization&&<p style={{...T2.body,color:'#666'}}>{v.organization}</p>}
              {v.description&&<p style={T2.body}>{v.description}</p>}
            </div>
          ))}
        </T2Sec>
      )}
      {(resume.projects||[]).length>0&&(
        <T2Sec title="PROJECTS" accent={accent}>
          {resume.projects.map((p,i)=>(
            <div key={i} style={{marginBottom:8}}>
              <p style={{fontSize:11,fontWeight:700,color:'#222',margin:'0 0 1px'}}>{p.name}</p>
              {p.description&&<p style={T2.body}>{p.description}</p>}
            </div>
          ))}
        </T2Sec>
      )}
      {(resume.certifications||[]).length>0&&(
        <T2Sec title="CERTIFICATIONS" accent={accent}>
          {resume.certifications.map((c,i)=>(
            <div key={i} style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                <p style={{fontSize:11,fontWeight:700,color:'#222',margin:0}}>{c.name}</p>
                {c.year&&<span style={{fontSize:9.5,color:'#777',flexShrink:0,marginLeft:8}}>{c.year}</span>}
              </div>
              {c.issuer&&<p style={{fontSize:10,color:'#555',margin:'1px 0 0'}}>{c.issuer}</p>}
              {c.description&&<p style={{...T2.body,fontStyle:'italic',color:'#666'}}>{c.description}</p>}
            </div>
          ))}
        </T2Sec>
      )}
      {(resume.awards||[]).length>0&&(
        <T2Sec title="AWARDS" accent={accent}>
          {resume.awards.map((a,i)=>(
            <div key={i} style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                <p style={{fontSize:11,fontWeight:700,color:'#222',margin:0}}>{a.name}</p>
                {a.year&&<span style={{fontSize:9.5,color:'#777',flexShrink:0,marginLeft:8}}>{a.year}</span>}
              </div>
              {a.issuer&&<p style={{fontSize:10,color:'#555',margin:'1px 0 0'}}>{a.issuer}</p>}
              {a.description&&<p style={{...T2.body,fontStyle:'italic',color:'#666'}}>{a.description}</p>}
            </div>
          ))}
        </T2Sec>
      )}
      {(resume.interests||[]).length>0&&(
        <T2Sec title="INTERESTS" accent={accent}>
          {resume.interests.some(i=>i.description) ? (
            resume.interests.map((it,i)=>(
              <div key={i} style={{marginBottom:5}}>
                <p style={{...T2.body,fontWeight:600,margin:0}}>{it.interest}</p>
                {it.description&&<p style={{...T2.body,fontStyle:'italic',color:'#666'}}>{it.description}</p>}
              </div>
            ))
          ) : (
            <p style={T2.body}>{resume.interests.map(i=>i.interest).join(' · ')}</p>
          )}
        </T2Sec>
      )}
      <div style={{display:'flex',alignItems:'center',gap:4,marginTop:'auto',paddingTop:10,borderTop:'1px solid #e5e7eb'}}>
        <WatermarkLogo/>
      </div>
    </div>
  )
}
function T2Sec({title,children,accent}){return(<div style={{marginBottom:14}}><div style={{background:'#f8f8f6',padding:'3px 9px',marginBottom:7,borderLeft:`3px solid ${accent}`}}><span style={{fontSize:9.5,fontWeight:700,color:accent,letterSpacing:'0.12em'}}>{title}</span></div>{children}</div>)}
const T2 = {
  contactItem: {color:'#fff',fontSize:10,padding:'6px 12px',display:'flex',alignItems:'center',gap:5},
  body:        {fontSize:10,color:'#444',lineHeight:1.7,margin:'2px 0 0'},
}

// ── TEMPLATE 3: Heritage ─────────────────────────────────────
function TemplateHeritage({ resume, font="Georgia, serif" }) {
  if (!resume) return null
  return (
    <div style={{ background:'#fff', width:794, minHeight:1123, flexShrink:0, fontFamily:font, padding:'34px 46px', boxSizing:'border-box' }}>
      <div style={{textAlign:'center',marginBottom:14,borderBottom:'2px solid #1a1a1a',paddingBottom:12}}>
        <h1 style={{fontSize:24,fontWeight:700,color:'#1a1a1a',margin:'0 0 3px',letterSpacing:'0.04em',textTransform:'uppercase'}}>{resume.name||'Your Name'}</h1>
        <div style={{fontSize:10,color:'#555',display:'flex',justifyContent:'center',flexWrap:'wrap',gap:'0 8px'}}>
          {resume.location&&<span>{resume.location}</span>}
          {resume.phone&&<span>· {resume.phone}</span>}
          {resume.email&&<span>· {resume.email}</span>}
          {resume.linkedin&&<span>· {resume.linkedin}</span>}
          {resume.dob&&<span>· {resume.dob}</span>}
        </div>
      </div>
      {resume.summary&&<T3Sec title="SUMMARY"><p style={T3.body}>{resume.summary}</p></T3Sec>}
      {(resume.education||[]).length>0&&(
        <T3Sec title="EDUCATION">
          {resume.education.map((e,i)=>(
            <div key={i} style={{display:'flex',gap:14,marginBottom:9}}>
              {e.year&&<div style={{width:76,flexShrink:0,fontSize:10,color:'#555',paddingTop:1}}>{e.year}</div>}
              <div style={{flex:1,minWidth:0}}>
                <span style={{fontSize:11.5,fontWeight:700,color:'#1a1a1a',textTransform:'uppercase',letterSpacing:'0.02em'}}>{e.school}</span>
                {e.degree&&<p style={{fontSize:10.5,color:'#333',margin:'1px 0 0',fontStyle:'italic'}}>{e.degree}{e.field?` in ${e.field}`:''}</p>}
                {e.gpa&&<p style={{fontSize:10,color:'#666',margin:'1px 0 0'}}>GPA: {e.gpa}</p>}
              </div>
            </div>
          ))}
        </T3Sec>
      )}
      {(resume.experience||[]).length>0&&(
        <T3Sec title="EXPERIENCE">
          {resume.experience.map((e,i)=>(
            <div key={i} style={{display:'flex',gap:14,marginBottom:11}}>
              {e.duration&&<div style={{width:76,flexShrink:0,fontSize:9.5,color:'#555',paddingTop:1,lineHeight:1.4}}>{e.duration}</div>}
              <div style={{flex:1,minWidth:0}}>
                <span style={{fontSize:11.5,fontWeight:700,color:'#1a1a1a',textTransform:'uppercase',letterSpacing:'0.02em'}}>{e.company}</span>
                {e.role&&<p style={{fontSize:10.5,fontWeight:700,color:'#333',margin:'1px 0 2px'}}>{e.role}</p>}
                {e.description&&<p style={T3.body}>{e.description}</p>}
              </div>
            </div>
          ))}
        </T3Sec>
      )}
      {((resume.skills||[]).filter(Boolean).length>0||(resume.languages||[]).length>0||(resume.certifications||[]).length>0||(resume.volunteer||[]).length>0||(resume.projects||[]).length>0||(resume.awards||[]).length>0||(resume.interests||[]).length>0)&&(
        <T3Sec title="OTHER">
          {(resume.skills||[]).filter(Boolean).length>0&&(<div style={{display:'flex',gap:14,marginBottom:5}}><div style={{width:76,flexShrink:0,fontSize:10,color:'#555',fontWeight:600}}>Skills</div><p style={T3.body}>{resume.skills.filter(Boolean).join(' · ')}</p></div>)}
          {(resume.languages||[]).length>0&&(<div style={{display:'flex',gap:14,marginBottom:5}}><div style={{width:76,flexShrink:0,fontSize:10,color:'#555',fontWeight:600}}>Languages</div><p style={T3.body}>{resume.languages.map(l=>`${l.language}${l.proficiency?` (${l.proficiency})`:''}`).join(' · ')}</p></div>)}
          {(resume.certifications||[]).length>0&&(
            <div style={{display:'flex',gap:14,marginBottom:5}}>
              <div style={{width:76,flexShrink:0,fontSize:10,color:'#555',fontWeight:600}}>Certifications</div>
              <div style={{flex:1}}>
                {resume.certifications.map((c,i)=>(
                  <div key={i} style={{marginBottom:3}}>
                    <p style={{...T3.body,fontWeight:600,margin:0}}>{c.name}{c.issuer?` — ${c.issuer}`:''}{ c.year?` (${c.year})`:''}</p>
                    {c.description&&<p style={{...T3.body,fontStyle:'italic',color:'#555'}}>{c.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {(resume.volunteer||[]).length>0&&(<div style={{display:'flex',gap:14,marginBottom:5}}><div style={{width:76,flexShrink:0,fontSize:10,color:'#555',fontWeight:600}}>Volunteer</div><p style={T3.body}>{resume.volunteer.map(v=>[v.role,v.organization].filter(Boolean).join(', ')).join(' · ')}</p></div>)}
          {(resume.projects||[]).length>0&&(
            <div style={{display:'flex',gap:14,marginBottom:5}}>
              <div style={{width:76,flexShrink:0,fontSize:10,color:'#555',fontWeight:600}}>Projects</div>
              <div style={{flex:1}}>
                {resume.projects.map((p,i)=>(
                  <div key={i} style={{marginBottom:3}}>
                    <p style={{...T3.body,fontWeight:600,margin:0}}>{p.name}</p>
                    {p.description&&<p style={{...T3.body,fontStyle:'italic',color:'#555'}}>{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {(resume.awards||[]).length>0&&(
            <div style={{display:'flex',gap:14,marginBottom:5}}>
              <div style={{width:76,flexShrink:0,fontSize:10,color:'#555',fontWeight:600}}>Awards</div>
              <div style={{flex:1}}>
                {resume.awards.map((a,i)=>(
                  <div key={i} style={{marginBottom:3}}>
                    <p style={{...T3.body,fontWeight:600,margin:0}}>{a.name}{a.issuer?` — ${a.issuer}`:''}{ a.year?` (${a.year})`:''}</p>
                    {a.description&&<p style={{...T3.body,fontStyle:'italic',color:'#555'}}>{a.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {(resume.interests||[]).length>0&&(
            <div style={{display:'flex',gap:14,marginBottom:5}}>
              <div style={{width:76,flexShrink:0,fontSize:10,color:'#555',fontWeight:600}}>Interests</div>
              <div style={{flex:1}}>
                {resume.interests.some(i=>i.description) ? (
                  resume.interests.map((it,i)=>(
                    <div key={i} style={{marginBottom:3}}>
                      <p style={{...T3.body,fontWeight:600,margin:0}}>{it.interest}</p>
                      {it.description&&<p style={{...T3.body,fontStyle:'italic',color:'#555'}}>{it.description}</p>}
                    </div>
                  ))
                ) : (
                  <p style={T3.body}>{resume.interests.map(i=>i.interest).join(' · ')}</p>
                )}
              </div>
            </div>
          )}
        </T3Sec>
      )}
      <div style={{display:'flex',alignItems:'center',gap:4,marginTop:18,paddingTop:8,borderTop:'1px solid #e5e7eb'}}>
        <WatermarkLogo/>
      </div>
    </div>
  )
}
function T3Sec({title,children}){return(<div style={{marginBottom:14}}><div style={{borderBottom:'1.5px solid #1a1a1a',marginBottom:7}}><span style={{fontSize:10.5,fontWeight:700,letterSpacing:'0.1em',color:'#1a1a1a'}}>{title}</span></div>{children}</div>)}
const T3 = {
  body:{fontSize:10,color:'#333',lineHeight:1.7,margin:'1px 0 0'},
}

// ── AI Rewrite Button ────────────────────────────────────────
function AIBtn({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title="AI rewrite — condenses without changing meaning"
      style={{
        display:'inline-flex', alignItems:'center', gap:3,
        background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.22)',
        borderRadius:5, padding:'2px 7px', cursor: loading ? 'wait' : 'pointer',
        fontFamily:'inherit', transition:'all 0.15s', flexShrink:0,
        opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={e=>{ if(!loading){ e.currentTarget.style.background='rgba(139,92,246,0.2)'; e.currentTarget.style.borderColor='rgba(139,92,246,0.4)' }}}
      onMouseLeave={e=>{ e.currentTarget.style.background='rgba(139,92,246,0.1)'; e.currentTarget.style.borderColor='rgba(139,92,246,0.22)' }}
    >
      {loading
        ? <span style={{ width:7, height:7, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'#a78bfa', animation:'spin 0.6s linear infinite', display:'inline-block' }}/>
        : <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="#a78bfa"/>
          </svg>
      }
      <span style={{ fontSize:9, fontWeight:700, color:'#a78bfa', letterSpacing:'0.03em' }}>
        {loading ? '…' : 'AI'}
      </span>
    </button>
  )
}

// ── AI Generate from fields (for structured entries like awards) ─
function AIGenBtn({ onClick, loading, val }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
      <label style={lblStyle}>Description</label>
      <button
        onClick={onClick}
        disabled={loading}
        title="Generate a professional description from the details above"
        style={{
          display:'inline-flex', alignItems:'center', gap:3,
          background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.22)',
          borderRadius:5, padding:'2px 8px', cursor: loading ? 'wait' : 'pointer',
          fontFamily:'inherit', transition:'all 0.15s', opacity: loading ? 0.7 : 1,
        }}
        onMouseEnter={e=>{ if(!loading){ e.currentTarget.style.background='rgba(139,92,246,0.2)'; e.currentTarget.style.borderColor='rgba(139,92,246,0.4)' }}}
        onMouseLeave={e=>{ e.currentTarget.style.background='rgba(139,92,246,0.1)'; e.currentTarget.style.borderColor='rgba(139,92,246,0.22)' }}
      >
        {loading
          ? <span style={{ width:7, height:7, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'#a78bfa', animation:'spin 0.6s linear infinite', display:'inline-block' }}/>
          : <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="#a78bfa"/></svg>
        }
        <span style={{ fontSize:9, fontWeight:700, color:'#a78bfa', letterSpacing:'0.03em' }}>
          {loading ? '…' : val ? 'Rewrite' : 'Generate'}
        </span>
      </button>
    </div>
  )
}

// Composed component: label row with AI button + textarea
function AIFieldDesc({ val, set, prompt }) {
  const [loading, setLoading] = useState(false)
  const handleGenerate = async () => {
    if (!prompt) return
    setLoading(true)
    try {
      const res  = await fetch('/api/rewrite', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ text: prompt, context:'generate' }) })
      const data = await res.json()
      if (data.rewritten) set(data.rewritten)
    } catch {}
    setLoading(false)
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <AIGenBtn onClick={handleGenerate} loading={loading} val={val}/>
      <textarea
        className="inp"
        style={{ ...inpBase, resize:'vertical', lineHeight:1.6, minHeight:44 }}
        value={val||''}
        rows={2}
        placeholder="Click Generate to auto-write, or type manually…"
        onChange={e=>set(e.target.value)}
      />
    </div>
  )
}
function TAI({ label, val, set, rows=3, miss=false, ph='', context='' }) {
  const [loading, setLoading] = useState(false)
  const handleRewrite = async () => {
    if (!val?.trim()) return
    setLoading(true)
    try {
      const res  = await fetch('/api/rewrite', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ text:val, context }) })
      const data = await res.json()
      if (data.rewritten) set(data.rewritten)
    } catch {}
    setLoading(false)
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        {label && <label style={lblStyle}>{label}{miss&&<MissTag/>}</label>}
        <AIBtn onClick={handleRewrite} loading={loading}/>
      </div>
      <textarea className="inp" style={{ ...inpBase, resize:'vertical', lineHeight:1.6, ...(miss?{borderColor:'rgba(245,158,11,0.38)'}:{}) }}
        value={val||''} rows={rows} placeholder={ph} onChange={e=>set(e.target.value)}/>
    </div>
  )
}

// ── Plain input / textarea ───────────────────────────────────
function Inp({ label, val, set, ph='', miss=false }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      {label && <label style={lblStyle}>{label}{miss&&<MissTag/>}</label>}
      <input className="inp" style={{ ...inpBase, ...(miss?{borderColor:'rgba(245,158,11,0.38)'}:{}) }}
        value={val||''} placeholder={ph} onChange={e=>set(e.target.value)}/>
    </div>
  )
}
function TA({ label, val, set, rows=3, miss=false, ph='' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      {label && <label style={lblStyle}>{label}{miss&&<MissTag/>}</label>}
      <textarea className="inp" style={{ ...inpBase, resize:'vertical', lineHeight:1.6, ...(miss?{borderColor:'rgba(245,158,11,0.38)'}:{}) }}
        value={val||''} rows={rows} placeholder={ph} onChange={e=>set(e.target.value)}/>
    </div>
  )
}
function Row2({ children }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>{children}</div>
}
function Warn({ text }) {
  return <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.14)', borderRadius:7, color:'#f59e0b', fontSize:11, padding:'6px 9px', fontWeight:500 }}>{text}</div>
}
function MissTag() {
  return <span style={{ color:'#f59e0b', fontSize:9, fontWeight:700, letterSpacing:'0.03em' }}>missing</span>
}
function ICard({ children, onDel, title }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'9px 10px', display:'flex', flexDirection:'column', gap:8, animation:'cardIn 0.2s cubic-bezier(0.16,1,0.3,1) both' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,0.5)', letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'78%' }}>{title}</span>
        <button
          onClick={onDel}
          style={{ background:'none', border:'none', color:'rgba(255,255,255,0.18)', fontSize:10.5, cursor:'pointer', fontFamily:'inherit', fontWeight:500, padding:0, transition:'color 0.15s', flexShrink:0 }}
          onMouseEnter={e=>e.currentTarget.style.color='#f87171'}
          onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.18)'}
        >Remove</button>
      </div>
      {children}
    </div>
  )
}
function SLabelAdd({ label, onAdd }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <p style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.45)', letterSpacing:'0.07em', textTransform:'uppercase', margin:0 }}>{label}</p>
      <button
        onClick={onAdd}
        style={{ background:'rgba(59,255,125,0.08)', border:'1px solid rgba(59,255,125,0.2)', color:'#3bff7d', borderRadius:6, padding:'3px 10px', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit', transition:'all 0.15s' }}
        onMouseEnter={e=>{ e.currentTarget.style.background='rgba(59,255,125,0.16)'; e.currentTarget.style.borderColor='rgba(59,255,125,0.38)' }}
        onMouseLeave={e=>{ e.currentTarget.style.background='rgba(59,255,125,0.08)'; e.currentTarget.style.borderColor='rgba(59,255,125,0.2)' }}
      >+ Add</button>
    </div>
  )
}
function SLabel({ children }) {
  return <p style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.45)', letterSpacing:'0.07em', textTransform:'uppercase', margin:0 }}>{children}</p>
}

const lblStyle = {
  color:'rgba(255,255,255,0.28)', fontSize:9.5, fontWeight:600,
  letterSpacing:'0.07em', textTransform:'uppercase',
  display:'flex', alignItems:'center', gap:5,
}
const inpBase = {
  width:'100%', background:'rgba(255,255,255,0.05)',
  border:'1px solid rgba(255,255,255,0.08)', borderRadius:8,
  color:'#e2e8f0', padding:'7px 9px', fontSize:12.5,
  outline:'none', boxSizing:'border-box',
  fontFamily:"'Figtree',sans-serif", transition:'all 0.15s',
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const track  = useTrack()

  const [file,             setFile]            = useState(null)
  const [loading,          setLoading]         = useState(false)
  const [resume,           setResume]          = useState(null)
  const [activeTab,        setActiveTab]       = useState('personal')
  const [showWarnings,     setShowWarnings]    = useState(true)
  const [atsLoading,       setAtsLoading]      = useState(false)
  const [atsSuccess,       setAtsSuccess]      = useState(false)
  const [coverLoading,     setCoverLoading]    = useState(false)
  const [coverLetter,      setCoverLetter]     = useState('')
  const [template,         setTemplate]        = useState('sidebar')
  const [templateSelected, setTemplateSelected]= useState(false)
  const [accentColor,      setAccentColor]     = useState('#0f1b2e')
  const [sidebarAccent,    setSidebarAccent]   = useState('#0f1b2e')
  const [executiveAccent,  setExecutiveAccent] = useState('#1a3a2a')
  const [resumeId,         setResumeId]        = useState(null)
  const [saveStatus,       setSaveStatus]      = useState('')
  const [mobileTab,        setMobileTab]       = useState('edit')
  const [resumeFont,       setResumeFont]      = useState(FONTS.sidebar[0].value)
  const autoSaveTimer   = useRef(null)
  const blobCanvasRef   = useRef(null)
  const blobCleanupRef  = useRef(null)

  // Run blobs on whichever canvas is currently mounted — re-runs every time the screen changes
  useEffect(() => {
    // Give React one frame to mount the canvas into the DOM
    const frame = requestAnimationFrame(() => {
      const canvas = blobCanvasRef.current
      // Kill previous loop
      if (blobCleanupRef.current) { blobCleanupRef.current(); blobCleanupRef.current = null }
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      let BW, BH, raf
      const resize = () => { BW = canvas.width = window.innerWidth; BH = canvas.height = window.innerHeight }
      resize()
      window.addEventListener('resize', resize)
      const blobs = [
        {bx:-0.08,by:-0.05,ox:0.04,oy:0.03,sp:0.0008,op:0,   r:0.68,c:[28,95,255], a:0.58},
        {bx:-0.02,by:0.60, ox:0.03,oy:0.05,sp:0.0006,op:1.2,  r:0.44,c:[0,195,145],a:0.50},
        {bx:1.06, by:-0.04,ox:0.04,oy:0.04,sp:0.0007,op:0.7,  r:0.65,c:[130,15,245],a:0.60},
        {bx:1.02, by:0.55, ox:0.03,oy:0.06,sp:0.0010,op:3.1,  r:0.42,c:[90,0,210],  a:0.44},
        {bx:0.48, by:-0.10,ox:0.07,oy:0.03,sp:0.0007,op:4.2,  r:0.32,c:[50,130,255],a:0.30},
      ]
      const draw = () => {
        ctx.clearRect(0,0,BW,BH); ctx.fillStyle='#04060c'; ctx.fillRect(0,0,BW,BH)
        blobs.forEach(b => {
          b.op += b.sp
          const cx=(b.bx+Math.sin(b.op)*b.ox)*BW, cy=(b.by+Math.cos(b.op*0.77)*b.oy)*BH, rad=b.r*Math.max(BW,BH)
          const g=ctx.createRadialGradient(cx,cy,0,cx,cy,rad)
          const[r,gr,bv]=b.c
          g.addColorStop(0,`rgba(${r},${gr},${bv},${b.a})`)
          g.addColorStop(0.35,`rgba(${r},${gr},${bv},${(b.a*0.4).toFixed(3)})`)
          g.addColorStop(1,`rgba(${r},${gr},${bv},0)`)
          ctx.globalCompositeOperation='screen'; ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2); ctx.fillStyle=g; ctx.fill()
        })
        ctx.globalCompositeOperation='multiply'
        const ink=ctx.createRadialGradient(BW*.5,BH*.5,0,BW*.5,BH*.5,BW*.65)
        ink.addColorStop(0,'rgba(4,5,16,0.82)'); ink.addColorStop(0.5,'rgba(4,5,16,0.45)'); ink.addColorStop(1,'rgba(4,5,16,0)')
        ctx.fillStyle=ink; ctx.fillRect(0,0,BW,BH)
        ctx.fillStyle='rgba(3,4,12,0.35)'; ctx.fillRect(0,0,BW,BH)
        ctx.globalCompositeOperation='source-over'
        raf = requestAnimationFrame(draw)
      }
      draw()
      blobCleanupRef.current = () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf) }
    })
    return () => {
      cancelAnimationFrame(frame)
      if (blobCleanupRef.current) { blobCleanupRef.current(); blobCleanupRef.current = null }
    }
  // Re-run whenever the visible screen changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, !!resume, templateSelected])

  // Load resume from dashboard
  useEffect(() => {
    const stored = sessionStorage.getItem('editResume')
    if (stored) {
      const parsed = JSON.parse(stored)
      setResume(parsed.data)
      setTemplate(parsed.template || 'sidebar')
      setAccentColor(parsed.accent_color || '#0f1b2e')
      setResumeFont(parsed.font || FONTS[parsed.template||'sidebar'][0].value)
      setResumeId(parsed.id)
      setTemplateSelected(true)
      sessionStorage.removeItem('editResume')
    }
  }, [])

  // Auto-save
  useEffect(() => {
    if (!resume || !session?.user?.email) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      await saveResume(resume, template, accentColor)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(''), 2500)
    }, 30000)
    return () => clearTimeout(autoSaveTimer.current)
  }, [resume, template, accentColor])

  const handleUpload = async () => {
    if (!file) return alert('Please select a file first!')
    setLoading(true)
    const fd = new FormData(); fd.append('pdf', file)
    const res  = await fetch('/api/parse', { method:'POST', body:fd })
    const data = await res.json()
    if (data.resumeData) {
      setResume({ linkedin:'', website:'', nationality:'', dob:'', references:'Available upon request', interests:[], volunteer:[], ...data.resumeData })
      track('resume_created', { file_name: file.name })
    } else alert('Error: ' + data.error)
    setLoading(false)
  }

  const handleATS = async () => {
    if (!resume.jobDescription) return alert('Paste a job description first!')
    setAtsLoading(true); setAtsSuccess(false)
    const res  = await fetch('/api/ats', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ resume, jobDescription:resume.jobDescription }) })
    const data = await res.json()
    if (data.updated) { setResume(p => ({ ...p, ...data.updated })); setAtsSuccess(true); track('ats_tailored') }
    else alert('Error: ' + data.error)
    setAtsLoading(false)
  }

  const handleCover = async () => {
    setCoverLoading(true)
    const res  = await fetch('/api/cover', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ resume, jobDescription:resume.jobDescription||'' }) })
    const data = await res.json()
    if (data.letter) { setCoverLetter(data.letter); track('cover_letter_generated') }
    else alert('Error: ' + data.error)
    setCoverLoading(false)
  }

  const handleDownload = async () => {
    await saveResume(resume, template, accentColor)
    track('pdf_downloaded', { template, name: resume.name })
    const element = document.getElementById('resume-preview')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}body{font-family:Arial,sans-serif;}</style></head><body>${element.outerHTML}</body></html>`
    const res = await fetch('/api/download', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ html }) })
    if (!res.ok) { alert('Download failed'); return }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${resume.name||'resume'}-readyCV.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  const saveResume = async (resumeData, tpl, color) => {
    if (!session?.user?.email) return
    const payload = { user_email:session.user.email, data:resumeData, template:tpl, accent_color:color, font:resumeFont, updated_at:new Date().toISOString() }
    if (resumeId) {
      await supabase.from('resumes').update(payload).eq('id', resumeId)
    } else {
      const { data: inserted } = await supabase.from('resumes').insert(payload).select().single()
      if (inserted) setResumeId(inserted.id)
    }
  }

  const set_    = (f,v) => setResume(p => ({ ...p, [f]:v }))
  const setArr  = (s,i,k,v) => setResume(p => { const a=[...(p[s]||[])]; a[i]={...a[i],[k]:v}; return {...p,[s]:a} })
  const addItem = (s) => {
    setResume(p => ({ ...p, [s]:[...(p[s]||[]), {...EMPTY[s], id:uid()}] }))
    setTimeout(() => { const fa=document.getElementById('form-area'); if(fa) fa.scrollTop=fa.scrollHeight }, 60)
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
    const total = REQUIRED_CHECKS.length + SECTION_CHECKS.length
    return Math.round(((total - getMissing().length) / total) * 100)
  }

  // ── Auth ────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div style={{ minHeight:'100vh', background:'#04060c', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <canvas ref={blobCanvasRef} style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'relative', zIndex:1, width:32, height:32, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'#3bff7d', animation:'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!session) { router.push('/signin'); return null }

  // ── Upload screen ───────────────────────────────────────────
  if (!resume) return (
    <div style={{ minHeight:'100vh', background:'#04060c', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Figtree',-apple-system,sans-serif", position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(32px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.45;transform:scale(0.8)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{transform:translateX(-100%) skewX(-20deg)}100%{transform:translateX(260%) skewX(-20deg)}}
        .up-card{animation:fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) both;}
        .up-file-zone{position:relative;overflow:hidden;cursor:pointer;border:1px dashed rgba(255,255,255,0.1);border-radius:16px;background:rgba(255,255,255,0.02);transition:all 0.3s cubic-bezier(0.16,1,0.3,1);}
        .up-file-zone:hover{border-color:rgba(59,255,125,0.28);background:rgba(59,255,125,0.035);transform:translateY(-1px);}
        .up-file-zone.has-file{border-style:solid;border-color:rgba(59,255,125,0.38);background:rgba(59,255,125,0.045);}
        .up-btn{position:relative;overflow:hidden;width:100%;border:none;cursor:pointer;border-radius:14px;padding:15px 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;font-family:'Figtree',sans-serif;background:linear-gradient(135deg,#3bff7d 0%,#2de06a 60%,#00d4aa 100%);color:#021a0c;box-shadow:0 0 0 1px rgba(59,255,125,0.28),0 8px 28px rgba(59,255,125,0.22),0 2px 4px rgba(0,0,0,0.4);transition:all 0.25s cubic-bezier(0.16,1,0.3,1);}
        .up-btn::before{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent);animation:shimmer 3.2s ease infinite;}
        .up-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 0 0 1px rgba(59,255,125,0.5),0 14px 40px rgba(59,255,125,0.32),0 4px 8px rgba(0,0,0,0.5);}
        .up-btn:disabled{opacity:0.5;cursor:not-allowed;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.25);box-shadow:none;}
        .up-btn:disabled::before{display:none;}
      `}</style>
      <canvas ref={blobCanvasRef} style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', inset:0, zIndex:1, pointerEvents:'none', opacity:0.45, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }}/>
      <div className="up-card" style={{ position:'relative', zIndex:2, width:460, padding:'48px 40px 40px', background:'rgba(6,8,18,0.22)', backdropFilter:'blur(56px) saturate(180%)', WebkitBackdropFilter:'blur(56px) saturate(180%)', borderRadius:28, borderTop:'1px solid rgba(255,255,255,0.22)', borderLeft:'1px solid rgba(255,255,255,0.09)', borderRight:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.04)', boxShadow:'0 0 0 1px rgba(0,0,0,0.25),0 40px 80px rgba(0,0,0,0.65),0 16px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(255,255,255,0.04)' }}>
        <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1, borderRadius:'28px 28px 0 0', pointerEvents:'none', zIndex:10, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06) 15%,rgba(255,255,255,0.38) 42%,rgba(255,255,255,0.52) 50%,rgba(255,255,255,0.38) 58%,rgba(255,255,255,0.06) 85%,transparent)' }}/>
        <div style={{ position:'absolute', inset:0, borderRadius:28, pointerEvents:'none', zIndex:0, opacity:0.55, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")` }}/>
        <div style={{ position:'absolute', bottom:0, left:'15%', right:'15%', height:140, pointerEvents:'none', zIndex:0, background:'radial-gradient(ellipse at 50% 100%, rgba(59,255,125,0.05) 0%, rgba(79,143,255,0.03) 50%, transparent 75%)' }}/>
        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:30 }}>
            <img src="/logo.png" alt="readyCV" style={{ height:32, width:'auto', objectFit:'contain' }}/>
          </div>
          <h1 style={{ fontSize:29, fontWeight:900, color:'#fff', letterSpacing:'-0.045em', lineHeight:1.1, marginBottom:10, textAlign:'center' }}>
            From Linked<span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', background:'#0A66C2', borderRadius:5, padding:'0px 4px', fontSize:26, fontWeight:900, color:'#fff', letterSpacing:'-0.03em', lineHeight:1.25, margin:'0 1px', verticalAlign:'middle', position:'relative', top:'-1px', boxShadow:'0 2px 10px rgba(10,102,194,0.45)' }}>in</span>{' '}to
            <br/>
            <span style={{ background:'linear-gradient(100deg,#3bff7d 0%,#4f8fff 55%,#a78bfa 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>your dream resume.</span>
          </h1>
          <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.3)', lineHeight:1.8, marginBottom:28, fontWeight:400, textAlign:'center' }}>Upload your LinkedIn PDF export and get a polished,<br/>ATS-ready resume in seconds.</p>
          <label className={`up-file-zone${file ? ' has-file' : ''}`} style={{ display:'block', padding:'20px 22px', marginBottom:10 }}>
            <input type="file" accept=".pdf" style={{ display:'none' }} onChange={e => setFile(e.target.files[0])}/>
            {file ? (
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:38, height:38, borderRadius:9, background:'#0A66C2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 16px rgba(10,102,194,0.45),0 2px 6px rgba(0,0,0,0.4)' }}>
                  <span style={{ color:'#fff', fontWeight:900, fontSize:15, fontFamily:"'Figtree',sans-serif", letterSpacing:'-0.03em', lineHeight:1 }}>in</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:'#3bff7d', letterSpacing:'-0.01em', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{file.name}</p>
                  <p style={{ fontSize:11, color:'rgba(59,255,125,0.45)', margin:'2px 0 0', fontWeight:500 }}>Ready to generate · tap to change</p>
                </div>
                <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(59,255,125,0.12)', border:'1px solid rgba(59,255,125,0.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#3bff7d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:38, height:38, borderRadius:9, background:'rgba(10,102,194,0.15)', border:'1px solid rgba(10,102,194,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ color:'rgba(10,102,194,0.7)', fontWeight:900, fontSize:15, fontFamily:"'Figtree',sans-serif", letterSpacing:'-0.03em', lineHeight:1 }}>in</span>
                </div>
                <div>
                  <p style={{ fontSize:13.5, fontWeight:600, color:'rgba(255,255,255,0.45)', margin:0, letterSpacing:'-0.01em' }}>Choose LinkedIn PDF</p>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.2)', margin:'2px 0 0', fontWeight:400 }}>Export from LinkedIn · PDF format only</p>
                </div>
              </div>
            )}
          </label>
          <button onClick={handleUpload} disabled={loading || !file} className="up-btn">
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9 }}>
                <span style={{ width:14, height:14, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'rgba(2,26,12,0.7)', animation:'spin 0.75s linear infinite', flexShrink:0 }}/>
                Generating your resume…
              </span>
            ) : 'Generate Resume'}
          </button>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, marginTop:20 }}>
            {[{d:'M9 12l2 2 4-4M12 3a9 9 0 100 18A9 9 0 0012 3z',label:'Free forever'},{d:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',label:'Never stored'},{d:'M13 10V3L4 14h7v7l9-11h-7z',label:'Under 30s'}].map((t,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d={t.d} stroke="rgba(255,255,255,0.2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.18)', fontWeight:500 }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ── Template selection ──────────────────────────────────────
  if (!templateSelected) return (
    <div style={{ minHeight:'100vh', background:'#04060c', fontFamily:"'Figtree',-apple-system,sans-serif", overflowY:'auto', position:'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.8)}}
        @keyframes shimmer{0%{transform:translateX(-100%) skewX(-20deg)}100%{transform:translateX(260%) skewX(-20deg)}}
        .ts-header{animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both;}
        .ts-cards{animation:fadeUp 0.7s 0.08s cubic-bezier(0.16,1,0.3,1) both;}
        .ts-card{position:relative;overflow:hidden;cursor:default;background:rgba(6,8,18,0.22);backdrop-filter:blur(48px) saturate(160%);-webkit-backdrop-filter:blur(48px) saturate(160%);border-top:1px solid rgba(255,255,255,0.20);border-left:1px solid rgba(255,255,255,0.09);border-right:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.04);border-radius:22px;box-shadow:0 0 80px rgba(0,0,0,0.5),0 20px 60px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.14);transition:all 0.35s cubic-bezier(0.16,1,0.3,1);width:290px;flex-shrink:0;}
        .ts-card:hover{transform:translateY(-6px);border-top-color:rgba(255,255,255,0.32);box-shadow:0 0 80px rgba(0,0,0,0.6),0 32px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.22);}
        .ts-select-btn{position:relative;overflow:hidden;width:100%;border:none;cursor:pointer;border-radius:11px;padding:12px;font-size:13px;font-weight:700;letter-spacing:-0.01em;font-family:'Figtree',sans-serif;background:linear-gradient(135deg,#3bff7d 0%,#2de06a 50%,#00d4aa 100%);color:#021a0c;box-shadow:0 0 0 1px rgba(59,255,125,0.28),0 6px 20px rgba(59,255,125,0.2);transition:all 0.22s cubic-bezier(0.16,1,0.3,1);}
        .ts-select-btn::before{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);animation:shimmer 3s ease infinite;}
        .ts-select-btn:hover{transform:translateY(-1px);box-shadow:0 0 0 1px rgba(59,255,125,0.5),0 10px 28px rgba(59,255,125,0.3);}
        .swatch-btn{width:18px;height:18px;border-radius:50%;border:none;cursor:pointer;transition:all 0.15s ease;flex-shrink:0;outline:2px solid transparent;outline-offset:2px;}
        .swatch-btn.active{outline-color:rgba(255,255,255,0.7);box-shadow:0 0 8px rgba(255,255,255,0.3);transform:scale(1.15);}
        .swatch-btn:hover{transform:scale(1.2);}
      `}</style>
      <canvas ref={blobCanvasRef} style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', inset:0, zIndex:1, pointerEvents:'none', opacity:0.45, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }}/>
      <div style={{ position:'relative', zIndex:2, maxWidth:1060, margin:'0 auto', padding:'60px 28px 80px' }}>
        <div className="ts-header" style={{ textAlign:'center', marginBottom:50 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:26 }}>
            <img src="/logo.png" alt="readyCV" style={{ height:30, objectFit:'contain' }}/>
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:100, padding:'5px 14px', marginBottom:20 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#3bff7d', boxShadow:'0 0 6px #3bff7d', animation:'pulse 2.5s ease infinite', flexShrink:0 }}/>
            <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', letterSpacing:'0.05em' }}>Resume ready · Step 2 of 2</span>
          </div>
          <h1 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:900, color:'#fff', letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:10 }}>
            Choose your{' '}
            <span style={{ background:'linear-gradient(100deg,#3bff7d 0%,#4f8fff 55%,#a78bfa 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>template.</span>
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.3)', lineHeight:1.75, fontWeight:400 }}>Pick a design to continue. You can switch anytime inside the editor.</p>
        </div>
        <div className="ts-cards" style={{ display:'flex', justifyContent:'center', gap:20, flexWrap:'wrap' }}>
          {TEMPLATES.map(t => (
            <div key={t.id} className="ts-card">
              <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1, pointerEvents:'none', zIndex:10, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06) 15%,rgba(255,255,255,0.38) 42%,rgba(255,255,255,0.48) 50%,rgba(255,255,255,0.38) 58%,rgba(255,255,255,0.06) 85%,transparent)' }}/>
              <div style={{ position:'absolute', inset:0, borderRadius:22, pointerEvents:'none', zIndex:0, opacity:0.55, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")` }}/>
              <div style={{ position:'relative', zIndex:2, padding:'20px 18px 18px' }}>
                <p style={{ color:'#f1f5f9', fontWeight:700, fontSize:15, margin:'0 0 3px', letterSpacing:'-0.02em' }}>{t.label}</p>
                <p style={{ color:'rgba(255,255,255,0.28)', fontSize:12, margin:'0 0 12px', lineHeight:1.5 }}>{t.desc}</p>
                {t.hasColor ? (
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
                    {ACCENT_COLORS.map(c => {
                      const cur = t.id==='sidebar' ? sidebarAccent : executiveAccent
                      const setC = t.id==='sidebar' ? setSidebarAccent : setExecutiveAccent
                      return (
                        <button key={c.id} title={c.label} className={`swatch-btn${cur===c.value?' active':''}`}
                          style={{ background:c.value }}
                          onClick={e=>{ e.stopPropagation(); setC(c.value) }}/>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                    <div style={{ width:15, height:15, borderRadius:3, background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.1)' }}/>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontStyle:'italic' }}>Timeless black &amp; white</span>
                  </div>
                )}
                <div style={{ width:'100%', height:300, overflow:'hidden', borderRadius:9, border:'1px solid rgba(255,255,255,0.07)', background:'#0d1420', marginBottom:12 }}>
                  <img src={`/templates/${t.id}.png`} alt={t.label} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center', display:'block', transition:'transform 0.4s cubic-bezier(0.16,1,0.3,1)' }}
                    onMouseEnter={e=>e.currentTarget.style.transform='scale(1.03)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}/>
                </div>
                <button className="ts-select-btn" onClick={()=>{
                  setTemplate(t.id)
                  setResumeFont(FONTS[t.id][0].value)
                  setAccentColor(t.id==='sidebar' ? sidebarAccent : t.id==='executive' ? executiveAccent : '#0f1b2e')
                  setTemplateSelected(true)
                }}>Use {t.label}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Editor ──────────────────────────────────────────────────
  const missing = getMissing()
  const pct     = completion()
  const currentTemplate = TEMPLATES.find(t=>t.id===template)

  const tabHasDot = (id) =>
    (id==='personal'   && missing.some(m=>['Full Name','Email','Phone','Job Title','Location','LinkedIn URL','Date of Birth'].includes(m))) ||
    (id==='summary'    && missing.includes('Profile Summary')) ||
    (id==='experience' && missing.includes('Work Experience')) ||
    (id==='education'  && missing.includes('Education')) ||
    (id==='skills'     && missing.includes('Skills'))

  return (
    <div style={{ height:'100vh', background:'#04060c', fontFamily:"'Figtree',-apple-system,sans-serif", color:'#fff', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800;900&family=Merriweather:wght@300;400;700;900&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Libre+Baskerville:wght@400;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{overflow:hidden;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes secIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cardIn{from{opacity:0;transform:translateY(5px) scale(0.99)}to{opacity:1;transform:translateY(0) scale(1)}}
        .inp:focus{border-color:rgba(59,255,125,0.38)!important;box-shadow:0 0 0 3px rgba(59,255,125,0.07)!important;background:rgba(255,255,255,0.08)!important;outline:none;}
        .ed-tab:hover{color:rgba(255,255,255,0.8)!important;background:rgba(255,255,255,0.06)!important;}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}
        @media(max-width:768px){.ed-right{display:none!important;}.ed-right.show{display:flex!important;}.ed-left.hide{display:none!important;}.mob-bar{display:flex!important;}body{overflow:auto!important;}}
        @media(min-width:769px){.mob-bar{display:none!important;}.ed-left{display:flex!important;}.ed-right{display:flex!important;}}
      `}</style>

      {/* Blob hues */}
      <canvas ref={blobCanvasRef} style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}/>
      {/* Grain */}
      <div style={{ position:'fixed', inset:0, zIndex:1, pointerEvents:'none', opacity:0.32, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }}/>

      {/* ── NAV ── */}
      <nav style={{ position:'relative', zIndex:10, height:52, flexShrink:0, background:'rgba(4,6,12,0.5)', backdropFilter:'blur(64px) saturate(200%)', WebkitBackdropFilter:'blur(64px) saturate(200%)', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', padding:'0 18px', gap:12 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)', pointerEvents:'none' }}/>
        {/* Logo + new */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <img src="/logo.png" alt="readyCV" style={{ height:22, objectFit:'contain' }}/>
          <div style={{ width:1, height:16, background:'rgba(255,255,255,0.08)' }}/>
          <button onClick={()=>{ setResume(null); setTemplateSelected(false) }}
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)', borderRadius:7, padding:'4px 11px', cursor:'pointer', fontSize:11.5, fontWeight:600, fontFamily:'inherit', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.color='rgba(255,255,255,0.8)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color='rgba(255,255,255,0.4)'}}>
            New
          </button>
        </div>

        {/* Center: template + color + font */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, justifyContent:'center', flexWrap:'nowrap', overflow:'hidden' }}>
          <div style={{ display:'flex', gap:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'3px', flexShrink:0 }}>
            {TEMPLATES.map(t=>(
              <button key={t.id} onClick={()=>{ setTemplate(t.id); setResumeFont(FONTS[t.id][0].value); setAccentColor(t.id==='sidebar'?sidebarAccent:t.id==='executive'?executiveAccent:'#0f1b2e') }}
                style={{ background:template===t.id?'rgba(255,255,255,0.1)':'transparent', border:template===t.id?'1px solid rgba(255,255,255,0.14)':'1px solid transparent', borderRadius:6, padding:'4px 10px', color:template===t.id?'#e2e8f0':'rgba(255,255,255,0.32)', fontSize:11.5, fontWeight:template===t.id?600:400, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', whiteSpace:'nowrap' }}>
                {t.label}
              </button>
            ))}
          </div>
          {currentTemplate?.hasColor && (
            <div style={{ display:'flex', gap:4, alignItems:'center', flexShrink:0 }}>
              {ACCENT_COLORS.map(c=>(
                <button key={c.id} title={c.label}
                  style={{ width:13, height:13, borderRadius:'50%', background:c.value, border:'none', cursor:'pointer', flexShrink:0, transition:'all 0.15s', outline: accentColor===c.value?'2px solid rgba(255,255,255,0.7)':'2px solid transparent', outlineOffset:2, boxShadow:accentColor===c.value?'0 0 5px rgba(255,255,255,0.2)':'none' }}
                  onClick={()=>{ setAccentColor(c.value); if(template==='sidebar') setSidebarAccent(c.value); else if(template==='executive') setExecutiveAccent(c.value) }}/>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'3px', flexShrink:0 }}>
            {FONTS[template].map(f=>(
              <button key={f.id} onClick={()=>setResumeFont(f.value)}
                style={{ background:resumeFont===f.value?'rgba(255,255,255,0.1)':'transparent', border:resumeFont===f.value?'1px solid rgba(255,255,255,0.14)':'1px solid transparent', borderRadius:6, padding:'4px 10px', fontFamily:f.value, color:resumeFont===f.value?'#e2e8f0':'rgba(255,255,255,0.32)', fontSize:11.5, fontWeight:resumeFont===f.value?600:400, cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, marginLeft:'auto' }}>
          {saveStatus==='saving'&&<span style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>Saving…</span>}
          {saveStatus==='saved' &&<span style={{ fontSize:11, color:'#3bff7d' }}>Saved</span>}
          <button onClick={async()=>{ await saveResume(resume,template,accentColor); router.push('/dashboard') }}
            style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(255,255,255,0.5)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.color='rgba(255,255,255,0.85)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='rgba(255,255,255,0.5)'}}>
            Save &amp; Exit
          </button>
          <button onClick={handleDownload}
            style={{ position:'relative', overflow:'hidden', background:'linear-gradient(135deg,#3bff7d 0%,#2de06a 60%,#00d4aa 100%)', color:'#021a0c', border:'none', borderRadius:9, padding:'7px 16px', cursor:'pointer', fontSize:12.5, fontWeight:700, fontFamily:'inherit', boxShadow:'0 0 0 1px rgba(59,255,125,0.25),0 4px 14px rgba(59,255,125,0.18)', transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 0 0 1px rgba(59,255,125,0.45),0 8px 22px rgba(59,255,125,0.28)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 0 0 1px rgba(59,255,125,0.25),0 4px 14px rgba(59,255,125,0.18)'}}>
            Download PDF
          </button>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div style={{ position:'relative', zIndex:2, display:'flex', flex:1, overflow:'hidden' }}>

        {/* LEFT PANEL */}
        <div className={`ed-left${mobileTab==='preview'?' hide':''}`}
          style={{ width:460, flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid rgba(255,255,255,0.08)', background:'rgba(4,6,12,0.42)', backdropFilter:'blur(64px) saturate(200%)', WebkitBackdropFilter:'blur(64px) saturate(200%)' }}>

          {/* Completion */}
          <div style={{ padding:'10px 14px 8px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.25)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Completeness</span>
              <span style={{ fontSize:10, fontWeight:700, color:pct===100?'#3bff7d':'#f59e0b' }}>{pct}%</span>
            </div>
            <div style={{ height:2, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
              <div style={{ height:2, borderRadius:2, width:`${pct}%`, transition:'width 0.5s ease', background:pct===100?'#3bff7d':'linear-gradient(90deg,#f59e0b,#3bff7d)' }}/>
            </div>
            {missing.length>0 && showWarnings && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:5, alignItems:'center' }}>
                {missing.slice(0,5).map(m=>(
                  <span key={m} style={{ fontSize:9.5, color:'#f59e0b', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:4, padding:'1px 6px', fontWeight:600 }}>{m}</span>
                ))}
                {missing.length>5&&<span style={{ fontSize:9.5, color:'rgba(255,255,255,0.22)' }}>+{missing.length-5}</span>}
                <button onClick={()=>setShowWarnings(false)} style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,0.18)', cursor:'pointer', fontSize:11 }}>✕</button>
              </div>
            )}
            {pct===100&&<div style={{ marginTop:5, background:'rgba(59,255,125,0.07)', border:'1px solid rgba(59,255,125,0.18)', borderRadius:6, padding:'5px 9px', color:'#3bff7d', fontSize:10, fontWeight:600 }}>Resume is complete</div>}
          </div>

          {/* Tab bar */}
          <div style={{ display:'flex', overflowX:'auto', gap:1, padding:'5px 8px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0, scrollbarWidth:'none' }}>
            {NAV.map(({id,label})=>(
              <button key={id} className="ed-tab"
                onClick={()=>setActiveTab(id)}
                style={{ position:'relative', display:'flex', alignItems:'center', gap:4, flexShrink:0, padding:'6px 10px', borderRadius:7, border:'none', background:activeTab===id?'rgba(59,255,125,0.1)':'transparent', color:activeTab===id?'#3bff7d':'rgba(255,255,255,0.32)', fontSize:11.5, fontWeight:activeTab===id?700:400, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', whiteSpace:'nowrap' }}>
                {label}
                {tabHasDot(id)&&<span style={{ position:'absolute', top:4, right:3, width:4, height:4, borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 4px #f59e0b' }}/>}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px' }} id="form-area">
            <div key={activeTab} style={{ animation:'secIn 0.22s cubic-bezier(0.16,1,0.3,1) both', background:'rgba(6,8,18,0.55)', backdropFilter:'blur(48px) saturate(180%)', WebkitBackdropFilter:'blur(48px) saturate(180%)', border:'1px solid rgba(255,255,255,0.1)', borderTop:'1px solid rgba(255,255,255,0.22)', borderRadius:14, padding:'16px 14px', boxShadow:'0 8px 40px rgba(0,0,0,0.5),0 2px 8px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.14)', display:'flex', flexDirection:'column', gap:10 }}>

              {activeTab==='personal'&&<>
                <SLabel>Personal</SLabel>
                <Inp label="Full Name *"       val={resume.name}        set={v=>set_('name',v)}        miss={!resume.name}/>
                <Inp label="Job Title *"       val={resume.title}       set={v=>set_('title',v)}       miss={!resume.title}/>
                <Row2><Inp label="Email *" val={resume.email} set={v=>set_('email',v)} miss={!resume.email}/><Inp label="Phone *" val={resume.phone} set={v=>set_('phone',v)} miss={!resume.phone}/></Row2>
                <Row2><Inp label="Location *" val={resume.location} set={v=>set_('location',v)} miss={!resume.location}/><Inp label="Date of Birth *" val={resume.dob} set={v=>set_('dob',v)} miss={!resume.dob} ph="15 March 1998"/></Row2>
                <Inp label="LinkedIn URL *"    val={resume.linkedin}    set={v=>set_('linkedin',v)}    miss={!resume.linkedin} ph="linkedin.com/in/yourname"/>
                <Row2><Inp label="Website" val={resume.website} set={v=>set_('website',v)} ph="yourwebsite.com"/><Inp label="Nationality" val={resume.nationality} set={v=>set_('nationality',v)}/></Row2>
              </>}

              {activeTab==='summary'&&<>
                <SLabel>Profile Summary</SLabel>
                {missing.includes('Profile Summary')&&<Warn text="A summary is required."/>}
                <TAI val={resume.summary} set={v=>set_('summary',v)} rows={5} miss={!resume.summary} ph="2–3 sharp sentences about who you are…" context="professional resume summary"/>
                <Inp label="References" val={resume.references} set={v=>set_('references',v)}/>
              </>}

              {activeTab==='experience'&&<>
                <SLabelAdd label="Experience" onAdd={()=>addItem('experience')}/>
                {missing.includes('Work Experience')&&<Warn text="Add at least one role."/>}
                {(resume.experience||[]).map((e,i)=>(
                  <ICard key={e.id||i} onDel={()=>delItem('experience',i)} title={e.role||e.company||`Role ${i+1}`}>
                    <Row2><Inp label="Job Title *" val={e.role} set={v=>setArr('experience',i,'role',v)} miss={!e.role}/><Inp label="Company *" val={e.company} set={v=>setArr('experience',i,'company',v)} miss={!e.company}/></Row2>
                    <Inp label="Duration" val={e.duration} set={v=>setArr('experience',i,'duration',v)} ph="Jan 2022 – Present"/>
                    <TAI label="Description" val={e.description} set={v=>setArr('experience',i,'description',v)} rows={3} ph="Led a team of 8 to ship…" context="job description for a resume, use strong action verbs"/>
                  </ICard>
                ))}
              </>}

              {activeTab==='education'&&<>
                <SLabelAdd label="Education" onAdd={()=>addItem('education')}/>
                {missing.includes('Education')&&<Warn text="Add at least one entry."/>}
                {(resume.education||[]).map((e,i)=>(
                  <ICard key={e.id||i} onDel={()=>delItem('education',i)} title={e.school||`Education ${i+1}`}>
                    <Row2><Inp label="Degree *" val={e.degree} set={v=>setArr('education',i,'degree',v)} miss={!e.degree}/><Inp label="Field" val={e.field} set={v=>setArr('education',i,'field',v)}/></Row2>
                    <Row2><Inp label="School *" val={e.school} set={v=>setArr('education',i,'school',v)} miss={!e.school}/><Inp label="Year" val={e.year} set={v=>setArr('education',i,'year',v)}/></Row2>
                    <Inp label="GPA / Grade" val={e.gpa} set={v=>setArr('education',i,'gpa',v)} ph="3.8 / 4.0"/>
                  </ICard>
                ))}
              </>}

              {activeTab==='skills'&&<>
                <SLabelAdd label="Skills" onAdd={()=>set_('skills',[...(resume.skills||[]),''])}/>
                {missing.includes('Skills')&&<Warn text="Add at least one skill."/>}
                {(resume.skills||[]).map((sk,i)=>(
                  <div key={i} style={{ display:'flex', gap:6, alignItems:'center', animation:'cardIn 0.2s cubic-bezier(0.16,1,0.3,1) both' }}>
                    <input className="inp" style={inpBase} value={sk} onChange={e=>setSk(i,e.target.value)} placeholder="e.g. Project Management"/>
                    <button style={{ background:'none', border:'none', color:'rgba(255,255,255,0.2)', cursor:'pointer', fontSize:14, padding:'0 2px', flexShrink:0, transition:'color 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.color='#f87171'}
                      onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.2)'}
                      onClick={()=>delSk(i)}>✕</button>
                  </div>
                ))}
              </>}

              {activeTab==='languages'&&<>
                <SLabelAdd label="Languages" onAdd={()=>addItem('languages')}/>
                {(resume.languages||[]).map((l,i)=>(
                  <ICard key={l.id||i} onDel={()=>delItem('languages',i)} title={l.language||`Language ${i+1}`}>
                    <Row2><Inp label="Language" val={l.language} set={v=>setArr('languages',i,'language',v)}/><Inp label="Proficiency" val={l.proficiency} set={v=>setArr('languages',i,'proficiency',v)} ph="Native / B2"/></Row2>
                  </ICard>
                ))}
              </>}

              {activeTab==='volunteer'&&<>
                <SLabelAdd label="Volunteer" onAdd={()=>addItem('volunteer')}/>
                {(resume.volunteer||[]).map((v,i)=>(
                  <ICard key={v.id||i} onDel={()=>delItem('volunteer',i)} title={v.role||v.organization||`Volunteer ${i+1}`}>
                    <Inp label="Organization" val={v.organization} set={vv=>setArr('volunteer',i,'organization',vv)}/>
                    <Row2><Inp label="Role" val={v.role} set={vv=>setArr('volunteer',i,'role',vv)}/><Inp label="Duration" val={v.duration} set={vv=>setArr('volunteer',i,'duration',vv)}/></Row2>
                    <TAI label="Description" val={v.description||''} set={vv=>setArr('volunteer',i,'description',vv)} rows={2} ph="What you did and the impact…" context="volunteer work description for a resume"/>
                  </ICard>
                ))}
              </>}

              {activeTab==='certifications'&&<>
                <SLabelAdd label="Certifications" onAdd={()=>addItem('certifications')}/>
                {(resume.certifications||[]).map((c,i)=>(
                  <ICard key={c.id||i} onDel={()=>delItem('certifications',i)} title={c.name||`Cert ${i+1}`}>
                    <Inp label="Name" val={c.name} set={v=>setArr('certifications',i,'name',v)}/>
                    <Row2><Inp label="Issuer" val={c.issuer} set={v=>setArr('certifications',i,'issuer',v)}/><Inp label="Year" val={c.year} set={v=>setArr('certifications',i,'year',v)}/></Row2>
                    <AIFieldDesc
                      val={c.description||''}
                      set={v=>setArr('certifications',i,'description',v)}
                      prompt={`Write a single concise professional sentence (max 20 words) for a resume certification entry. Certification: "${c.name||''}", Issued by: "${c.issuer||''}", Year: "${c.year||''}". Be specific, natural, not robotic. Return only the sentence.`}
                    />
                  </ICard>
                ))}
              </>}

              {activeTab==='projects'&&<>
                <SLabelAdd label="Projects" onAdd={()=>addItem('projects')}/>
                {(resume.projects||[]).map((p,i)=>(
                  <ICard key={p.id||i} onDel={()=>delItem('projects',i)} title={p.name||`Project ${i+1}`}>
                    <Inp label="Name" val={p.name} set={v=>setArr('projects',i,'name',v)}/>
                    <TAI label="Description" val={p.description||''} set={v=>setArr('projects',i,'description',v)} rows={2} ph="What it does and tech used…" context="project description for a resume"/>
                  </ICard>
                ))}
              </>}

              {activeTab==='interests'&&<>
                <SLabelAdd label="Interests" onAdd={()=>addItem('interests')}/>
                {(resume.interests||[]).map((item,i)=>(
                  <ICard key={item.id||i} onDel={()=>delItem('interests',i)} title={item.interest||`Interest ${i+1}`}>
                    <Inp label="Interest" val={item.interest} set={v=>setArr('interests',i,'interest',v)} ph="e.g. Open-source development"/>
                    <AIFieldDesc
                      val={item.description||''}
                      set={v=>setArr('interests',i,'description',v)}
                      prompt={`Write a single concise professional sentence (max 18 words) describing this personal interest for a resume: "${item.interest||''}". Show how it reflects positively on the candidate. Be natural, not robotic. Return only the sentence.`}
                    />
                  </ICard>
                ))}
              </>}

              {activeTab==='awards'&&<>
                <SLabelAdd label="Awards" onAdd={()=>addItem('awards')}/>
                {(resume.awards||[]).map((a,i)=>(
                  <ICard key={a.id||i} onDel={()=>delItem('awards',i)} title={a.name||`Award ${i+1}`}>
                    <Inp label="Award" val={a.name} set={v=>setArr('awards',i,'name',v)}/>
                    <Row2><Inp label="Issuer" val={a.issuer} set={v=>setArr('awards',i,'issuer',v)}/><Inp label="Year" val={a.year} set={v=>setArr('awards',i,'year',v)}/></Row2>
                    <AIFieldDesc
                      val={a.description||''}
                      set={v=>setArr('awards',i,'description',v)}
                      prompt={`Write a single concise professional sentence (max 20 words) for a resume award entry. Award: "${a.name||''}", Issued by: "${a.issuer||''}", Year: "${a.year||''}". Be specific, natural, not robotic. Return only the sentence.`}
                    />
                  </ICard>
                ))}
              </>}

              {activeTab==='ats'&&<>
                <SLabel>ATS Tailoring</SLabel>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.28)', lineHeight:1.65 }}>Paste a job description — AI rewrites your resume to match without inventing facts.</p>
                <TA val={resume.jobDescription||''} set={v=>set_('jobDescription',v)} rows={8} ph="Paste job description here…"/>
                <button onClick={handleATS} disabled={atsLoading} style={{ width:'100%', background:'rgba(59,255,125,0.09)', border:'1px solid rgba(59,255,125,0.2)', color:'#3bff7d', borderRadius:9, padding:'10px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                  {atsLoading?'Tailoring…':'Tailor to This Job'}
                </button>
                {atsSuccess&&<div style={{ background:'rgba(59,255,125,0.07)', border:'1px solid rgba(59,255,125,0.18)', borderRadius:7, color:'#3bff7d', fontSize:11, padding:'7px 10px', fontWeight:600 }}>Done — check Summary and Experience.</div>}
              </>}

              {activeTab==='cover'&&<>
                <SLabel>Cover Letter</SLabel>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.28)', lineHeight:1.65 }}>Complete the ATS tab first for a more targeted letter.</p>
                <button onClick={handleCover} disabled={coverLoading} style={{ width:'100%', background:'rgba(59,255,125,0.09)', border:'1px solid rgba(59,255,125,0.2)', color:'#3bff7d', borderRadius:9, padding:'10px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginBottom:8, transition:'all 0.15s' }}>
                  {coverLoading?'Writing…':'Generate Cover Letter'}
                </button>
                {coverLetter&&<>
                  <TA val={coverLetter} set={v=>setCoverLetter(v)} rows={12}/>
                  <button style={{ marginTop:6, width:'100%', background:'rgba(16,185,129,0.09)', border:'1px solid rgba(16,185,129,0.2)', color:'#10b981', borderRadius:9, padding:'10px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
                    onClick={()=>{ const blob=new Blob([coverLetter],{type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${resume.name||'cover'}-letter.txt`; a.click() }}>
                    Download Cover Letter
                  </button>
                </>}
              </>}

            </div>
          </div>
        </div>

        {/* RIGHT PANEL — live preview */}
        <div className={`ed-right${mobileTab==='preview'?' show':''}`}
          style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'rgba(4,6,12,0.1)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' }}>
          <div style={{ flex:1, overflowY:'auto', display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'24px 20px 40px' }}>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', inset:0, borderRadius:2, boxShadow:'0 40px 100px rgba(0,0,0,0.8),0 8px 30px rgba(0,0,0,0.6)', pointerEvents:'none', zIndex:0 }}/>
              <div id="resume-preview" style={{ position:'relative', zIndex:1 }}>
                {template==='sidebar'   && <TemplateSidebar   resume={resume} accent={accentColor} font={resumeFont}/>}
                {template==='executive' && <TemplateExecutive resume={resume} accent={accentColor} font={resumeFont}/>}
                {template==='heritage'  && <TemplateHeritage  resume={resume} font={resumeFont}/>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="mob-bar" style={{ display:'none', position:'fixed', bottom:0, left:0, right:0, zIndex:20, height:50, background:'rgba(4,6,12,0.95)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        {['edit','preview'].map(t=>(
          <button key={t} onClick={()=>setMobileTab(t)} style={{ flex:1, background:mobileTab===t?'rgba(59,255,125,0.1)':'transparent', border:'none', color:mobileTab===t?'#3bff7d':'rgba(255,255,255,0.35)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize' }}>{t}</button>
        ))}
      </div>
    </div>
  )
}