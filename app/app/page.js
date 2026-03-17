'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

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

// Templates — renamed, no color field needed anymore
const TEMPLATES = [
  { id:'sidebar',  label:'Sidebar',   desc:'Two-column with accent sidebar',   hasColor:true  },
  { id:'executive',label:'Executive', desc:'Bold header, single column',        hasColor:true  },
  { id:'heritage', label:'Heritage',  desc:'Classic centered, timeless layout', hasColor:false },
]

// 8 premium accent colors for Sidebar and Executive templates
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
    { id:'inter',        label:'Inter',          value:"'Inter', sans-serif",               google:'Inter:wght@300;400;500;600;700' },
    { id:'jakarta',      label:'Jakarta',         value:"'Plus Jakarta Sans', sans-serif",   google:'Plus+Jakarta+Sans:wght@300;400;500;600;700' },
    { id:'dm',           label:'DM Sans',         value:"'DM Sans', sans-serif",             google:'DM+Sans:wght@300;400;500;600;700' },
  ],
  executive: [
    { id:'georgia',      label:'Georgia',         value:"Georgia, serif",                    google:null },
    { id:'playfair',     label:'Playfair',         value:"'Playfair Display', serif",         google:'Playfair+Display:wght@400;500;600;700;800;900' },
    { id:'merriweather', label:'Merriweather',     value:"'Merriweather', serif",             google:'Merriweather:wght@300;400;700;900' },
  ],
  heritage:  [
    { id:'georgia',      label:'Georgia',         value:"Georgia, serif",                    google:null },
    { id:'lora',         label:'Lora',             value:"'Lora', serif",                     google:'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400' },
    { id:'baskerville',  label:'Baskerville',      value:"'Libre Baskerville', serif",        google:'Libre+Baskerville:wght@400;700' },
  ],
}

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

// ── TEMPLATE 1: Sidebar (formerly Navy) ──────────────────────
function TemplateSidebar({ resume, accent='#0f1b2e', font="'Inter', sans-serif" }) {
  if (!resume) return null
  return (
    <div style={{ background:'#fff', width:794, minHeight:1123, display:'flex', flexShrink:0, fontFamily:font }}>
      <div style={{ width:215, background:'#fafafa', borderRight:'1px solid #f0f0f0', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'20px 16px 0' }}>
          <div style={{fontSize:7.5,fontWeight:700,letterSpacing:'0.16em',color:'#374151',marginBottom:5}}>CONTACT</div>
          <div style={{height:1,background:'#e5e7eb',marginBottom:7}}/>
          {resume.email    && <p style={T1.sideText}>{resume.email}</p>}
          {resume.phone    && <p style={T1.sideText}>{resume.phone}</p>}
          {resume.location && <p style={T1.sideText}>{resume.location}</p>}
          {resume.linkedin && <p style={T1.sideText}>{resume.linkedin}</p>}
          {resume.website  && <p style={T1.sideText}>{resume.website}</p>}
          {resume.nationality && <p style={T1.sideText}>{resume.nationality}</p>}
          {resume.dob      && <p style={T1.sideText}>Born: {resume.dob}</p>}
        </div>
        {(resume.skills||[]).filter(Boolean).length>0 && (
          <div style={{ padding:'16px 16px 0' }}>
            <div style={{fontSize:7.5,fontWeight:700,letterSpacing:'0.16em',color:'#374151',marginBottom:5}}>SKILLS</div>
            <div style={{height:1,background:'#e5e7eb',marginBottom:7}}/>
            {resume.skills.filter(Boolean).map((s,i)=><p key={i} style={T1.sideText}>· {s}</p>)}
          </div>
        )}
        {(resume.languages||[]).length>0 && (
          <div style={{ padding:'16px 16px 0' }}>
            <div style={{fontSize:7.5,fontWeight:700,letterSpacing:'0.16em',color:'#374151',marginBottom:5}}>LANGUAGES</div>
            <div style={{height:1,background:'#e5e7eb',marginBottom:7}}/>
            {resume.languages.map((l,i)=>(
              <div key={i} style={{marginBottom:5}}>
                <p style={{...T1.sideText,fontWeight:600}}>{l.language}</p>
                {l.proficiency&&<p style={{...T1.sideText,fontSize:8.5,color:'#9ca3af'}}>{l.proficiency}</p>}
              </div>
            ))}
          </div>
        )}
        {(resume.certifications||[]).length>0 && (
          <div style={{ padding:'16px 16px 0' }}>
            <div style={{fontSize:7.5,fontWeight:700,letterSpacing:'0.16em',color:'#374151',marginBottom:5}}>CERTIFICATIONS</div>
            <div style={{height:1,background:'#e5e7eb',marginBottom:7}}/>
            {resume.certifications.map((c,i)=>(
              <div key={i} style={{marginBottom:6}}>
                <p style={{...T1.sideText,fontWeight:600}}>{c.name}</p>
                {c.issuer&&<p style={{...T1.sideText,fontSize:8.5,color:'#9ca3af'}}>{c.issuer}{c.year?` · ${c.year}`:''}</p>}
              </div>
            ))}
          </div>
        )}
        {(resume.interests||[]).length>0 && (
          <div style={{ padding:'16px 16px 0' }}>
            <div style={{fontSize:7.5,fontWeight:700,letterSpacing:'0.16em',color:'#374151',marginBottom:5}}>INTERESTS</div>
            <div style={{height:1,background:'#e5e7eb',marginBottom:7}}/>
            {resume.interests.map((it,i)=><p key={i} style={T1.sideText}>· {it.interest}</p>)}
          </div>
        )}
        {(resume.awards||[]).length>0 && (
          <div style={{ padding:'16px 16px 0' }}>
            <div style={{fontSize:7.5,fontWeight:700,letterSpacing:'0.16em',color:'#374151',marginBottom:5}}>AWARDS</div>
            <div style={{height:1,background:'#e5e7eb',marginBottom:7}}/>
            {resume.awards.map((a,i)=>(
              <div key={i} style={{marginBottom:5}}>
                <p style={{...T1.sideText,fontWeight:600}}>{a.name}</p>
                {a.year&&<p style={{...T1.sideText,fontSize:8.5,color:'#9ca3af'}}>{a.year}</p>}
              </div>
            ))}
          </div>
        )}
        <div style={{marginTop:'auto',padding:'12px 16px 10px',display:'flex',alignItems:'center',gap:5,borderTop:'1px solid #f0f0f0'}}>
          <ReadyCVLogo size={10} />
          <span style={{fontSize:8,color:'#9ca3af',letterSpacing:'0.08em',fontWeight:600}}>readyCV</span>
        </div>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ background:accent, padding:'28px 28px 20px' }}>
          <h1 style={{fontSize:23,fontWeight:700,color:'#fff',margin:'0 0 4px',letterSpacing:'-0.02em'}}>{resume.name||'Your Name'}</h1>
          {resume.title&&<p style={{fontSize:12,color:'rgba(255,255,255,0.65)',margin:'0 0 6px',fontWeight:400}}>{resume.title}</p>}
          {resume.email&&<p style={{fontSize:10,color:'rgba(255,255,255,0.35)',margin:0}}>{resume.email}</p>}
        </div>
        <div style={{ padding:'20px 28px', flex:1 }}>
          {resume.summary&&<T1Sec title="PROFILE" accent={accent}><p style={T1.body}>{resume.summary}</p>{resume.references&&<p style={{...T1.body,fontStyle:'italic',color:'#9ca3af',marginTop:4}}>References: {resume.references}</p>}</T1Sec>}
          {(resume.experience||[]).length>0&&<T1Sec title="EXPERIENCE" accent={accent}>{resume.experience.map((e,i)=><T1Entry key={i} title={e.role} sub={e.company} meta={e.duration} desc={e.description}/>)}</T1Sec>}
          {(resume.education||[]).length>0&&<T1Sec title="EDUCATION" accent={accent}>{resume.education.map((e,i)=><div key={i} style={{marginBottom:10}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}><div style={{flex:1,minWidth:0}}><span style={T1.entryTitle}>{e.school}</span>{e.degree&&<span style={T1.entrySub}> · {e.degree}{e.field?` in ${e.field}`:''}</span>}</div>{e.year&&<span style={{...T1.meta,flexShrink:0}}>{e.year}</span>}</div>{e.gpa&&<p style={{...T1.body,color:'#9ca3af'}}>GPA: {e.gpa}</p>}</div>)}</T1Sec>}
          {(resume.volunteer||[]).length>0&&<T1Sec title="VOLUNTEER" accent={accent}>{resume.volunteer.map((v,i)=><T1Entry key={i} title={v.role} sub={v.organization} meta={v.duration}/>)}</T1Sec>}
          {(resume.projects||[]).length>0&&<T1Sec title="PROJECTS" accent={accent}>{resume.projects.map((p,i)=><div key={i} style={{marginBottom:10}}><span style={T1.entryTitle}>{p.name}</span>{p.description&&<p style={T1.body}>{p.description}</p>}</div>)}</T1Sec>}
        </div>
      </div>
    </div>
  )
}
function T1Sec({title,children,accent}){return(<div style={{marginBottom:15}}><div style={{fontSize:8.5,fontWeight:700,letterSpacing:'0.16em',color:accent,marginBottom:3}}>{title}</div><div style={{height:1.5,background:accent,opacity:0.15,marginBottom:9}}/>{children}</div>)}
function T1Entry({title,sub,meta,desc}){return(<div style={{marginBottom:10}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:3}}><div style={{flex:1,minWidth:0}}><span style={T1.entryTitle}>{title}</span>{sub&&<span style={T1.entrySub}> · {sub}</span>}</div>{meta&&<span style={{...T1.meta,flexShrink:0}}>{meta}</span>}</div>{desc&&<p style={T1.body}>{desc}</p>}</div>)}
const T1 = {
  sideText:   {fontSize:9.5,color:'#4b5563',margin:'0 0 3px',lineHeight:1.55,wordBreak:'break-word'},
  entryTitle: {fontSize:11.5,fontWeight:600,color:'#111827'},
  entrySub:   {fontSize:11,color:'#6b7280'},
  meta:       {fontSize:9.5,color:'#9ca3af',whiteSpace:'nowrap',marginLeft:8},
  body:       {fontSize:10.5,color:'#374151',lineHeight:1.7,margin:'3px 0 0'},
}

// ── TEMPLATE 2: Executive (formerly Olive) ───────────────────
function TemplateExecutive({ resume, accent='#1a3a2a', font="Georgia, serif" }) {
  if (!resume) return null
  // Derive a slightly darker shade for the contact bar
  return (
    <div style={{ background:'#fff', width:794, minHeight:1123, flexShrink:0, fontFamily:font, padding:'32px 40px', boxSizing:'border-box' }}>
      <div style={{marginBottom:16}}>
        <h1 style={{fontSize:32,fontWeight:700,color:accent,margin:'0 0 4px',letterSpacing:'-0.01em'}}>{resume.name||'Your Name'}</h1>
        {resume.title&&<p style={{fontSize:13,color:'#555',margin:0,fontWeight:400}}>{resume.title}</p>}
      </div>
      <div style={{background:accent,display:'flex',flexWrap:'wrap',gap:0,marginBottom:20,borderRadius:3,overflow:'hidden'}}>
        {resume.phone    && <div style={T2.contactItem}>📞 {resume.phone}</div>}
        {resume.email    && <div style={T2.contactItem}>✉ {resume.email}</div>}
        {resume.location && <div style={T2.contactItem}>📍 {resume.location}</div>}
        {resume.website  && <div style={T2.contactItem}>🌐 {resume.website}</div>}
      </div>
      {resume.summary&&<T2Sec title="SUMMARY" accent={accent}><p style={T2.body}>{resume.summary}</p></T2Sec>}
      {(resume.skills||[]).filter(Boolean).length>0&&(
        <T2Sec title="SKILLS" accent={accent}>
          <div style={{display:'flex',flexWrap:'wrap',gap:'0 16px'}}>
            <div style={{background:accent,color:'#fff',fontSize:10,padding:'3px 10px',borderRadius:2,marginRight:4,marginBottom:4}}>Skills</div>
            {resume.skills.filter(Boolean).map((s,i)=><span key={i} style={{fontSize:10,color:'#333',padding:'3px 0'}}>{s}{i<resume.skills.length-1?' | ':''}</span>)}
          </div>
        </T2Sec>
      )}
      {(resume.experience||[]).length>0&&(
        <T2Sec title="WORK EXPERIENCE" accent={accent}>
          {resume.experience.map((e,i)=>(
            <div key={i} style={{marginBottom:12}}>
              <p style={{fontSize:11,color:'#555',margin:'0 0 2px',fontWeight:400}}>{e.company}</p>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                <p style={{fontSize:11.5,fontWeight:700,color:'#222',margin:'0 0 3px'}}>{e.role}</p>
                {e.duration&&<span style={{fontSize:10,color:'#777',flexShrink:0,marginLeft:8}}>{e.duration}</span>}
              </div>
              {e.description&&<p style={T2.body}>{e.description}</p>}
            </div>
          ))}
        </T2Sec>
      )}
      {(resume.education||[]).length>0&&(
        <T2Sec title="EDUCATION" accent={accent}>
          {resume.education.map((e,i)=>(
            <div key={i} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:11.5,fontWeight:700,color:'#222',margin:'0 0 2px'}}>{e.school}</p>
                  {e.degree&&<p style={{fontSize:10.5,color:'#555',margin:0}}>{e.degree}{e.field?` in ${e.field}`:''}</p>}
                </div>
                {e.year&&<span style={{fontSize:10,color:'#777',flexShrink:0}}>{e.year}</span>}
              </div>
              {e.gpa&&<p style={{...T2.body,color:'#777'}}>GPA: {e.gpa}</p>}
            </div>
          ))}
        </T2Sec>
      )}
      {(resume.languages||[]).length>0&&(
        <T2Sec title="LANGUAGES" accent={accent}>
          <div style={{display:'flex',flexWrap:'wrap',gap:'4px 24px'}}>
            {resume.languages.map((l,i)=><span key={i} style={{fontSize:10.5,color:'#444'}}><strong>{l.language}</strong>{l.proficiency?` — ${l.proficiency}`:''}</span>)}
          </div>
        </T2Sec>
      )}
      {(resume.volunteer||[]).length>0&&(
        <T2Sec title="VOLUNTEER" accent={accent}>
          {resume.volunteer.map((v,i)=>(
            <div key={i} style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:11.5,fontWeight:700,color:'#222'}}>{v.role}</span>
                {v.duration&&<span style={{fontSize:10,color:'#777'}}>{v.duration}</span>}
              </div>
              {v.organization&&<p style={{...T2.body,color:'#666'}}>{v.organization}</p>}
            </div>
          ))}
        </T2Sec>
      )}
      <div style={{display:'flex',alignItems:'center',gap:5,marginTop:'auto',paddingTop:12,borderTop:'1px solid #e5e7eb'}}>
        <ReadyCVLogo size={10} />
        <span style={{fontSize:8,color:'#9ca3af',letterSpacing:'0.08em',fontWeight:600}}>readyCV</span>
      </div>
    </div>
  )
}
function T2Sec({title,children,accent}){return(<div style={{marginBottom:16}}><div style={{background:'#f8f8f6',padding:'4px 10px',marginBottom:8,borderLeft:`3px solid ${accent}`}}><span style={{fontSize:10,fontWeight:700,color:accent,letterSpacing:'0.12em'}}>{title}</span></div>{children}</div>)}
const T2 = {
  contactItem: {color:'#fff',fontSize:10,padding:'7px 14px',display:'flex',alignItems:'center',gap:5},
  body:        {fontSize:10.5,color:'#444',lineHeight:1.7,margin:'3px 0 0',fontFamily:"Georgia, serif"},
}

// ── TEMPLATE 3: Heritage (formerly Classic) ──────────────────
function TemplateHeritage({ resume, font="Georgia, serif" }) {
  if (!resume) return null
  return (
    <div style={{ background:'#fff', width:794, minHeight:1123, flexShrink:0, fontFamily:font, padding:'36px 48px', boxSizing:'border-box' }}>
      <div style={{textAlign:'center',marginBottom:16,borderBottom:'2px solid #1a1a1a',paddingBottom:14}}>
        <h1 style={{fontSize:26,fontWeight:700,color:'#1a1a1a',margin:'0 0 4px',letterSpacing:'0.04em',textTransform:'uppercase'}}>{resume.name||'Your Name'}</h1>
        <div style={{fontSize:10.5,color:'#555',display:'flex',justifyContent:'center',flexWrap:'wrap',gap:'0 10px'}}>
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
            <div key={i} style={{display:'flex',gap:16,marginBottom:10}}>
              {e.year&&<div style={{width:80,flexShrink:0,fontSize:10.5,color:'#555',paddingTop:1}}>{e.year}</div>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                  <span style={{fontSize:12,fontWeight:700,color:'#1a1a1a',textTransform:'uppercase',letterSpacing:'0.02em'}}>{e.school}</span>
                </div>
                {e.degree&&<p style={{fontSize:11,color:'#333',margin:'2px 0 0',fontStyle:'italic'}}>{e.degree}{e.field?` in ${e.field}`:''}</p>}
                {e.gpa&&<p style={{fontSize:10.5,color:'#666',margin:'2px 0 0'}}>GPA: {e.gpa}</p>}
              </div>
            </div>
          ))}
        </T3Sec>
      )}
      {(resume.experience||[]).length>0&&(
        <T3Sec title="EXPERIENCE">
          {resume.experience.map((e,i)=>(
            <div key={i} style={{display:'flex',gap:16,marginBottom:12}}>
              {e.duration&&<div style={{width:80,flexShrink:0,fontSize:10,color:'#555',paddingTop:1,lineHeight:1.4}}>{e.duration}</div>}
              <div style={{flex:1,minWidth:0}}>
                <span style={{fontSize:12,fontWeight:700,color:'#1a1a1a',textTransform:'uppercase',letterSpacing:'0.02em'}}>{e.company}</span>
                {e.role&&<p style={{fontSize:11,fontWeight:700,color:'#333',margin:'2px 0 3px'}}>{e.role}</p>}
                {e.description&&<p style={T3.body}>{e.description}</p>}
              </div>
            </div>
          ))}
        </T3Sec>
      )}
      {((resume.skills||[]).filter(Boolean).length>0||(resume.languages||[]).length>0)&&(
        <T3Sec title="OTHER">
          {(resume.skills||[]).filter(Boolean).length>0&&(<div style={{display:'flex',gap:16,marginBottom:6}}><div style={{width:80,flexShrink:0,fontSize:10.5,color:'#555',fontWeight:600}}>Skills</div><p style={T3.body}>{resume.skills.filter(Boolean).join(' · ')}</p></div>)}
          {(resume.languages||[]).length>0&&(<div style={{display:'flex',gap:16,marginBottom:6}}><div style={{width:80,flexShrink:0,fontSize:10.5,color:'#555',fontWeight:600}}>Languages</div><p style={T3.body}>{resume.languages.map(l=>`${l.language}${l.proficiency?` (${l.proficiency})`:''}`).join(' · ')}</p></div>)}
          {(resume.certifications||[]).length>0&&(<div style={{display:'flex',gap:16,marginBottom:6}}><div style={{width:80,flexShrink:0,fontSize:10.5,color:'#555',fontWeight:600}}>Certifications</div><p style={T3.body}>{resume.certifications.map(c=>c.name).join(' · ')}</p></div>)}
          {(resume.volunteer||[]).length>0&&(<div style={{display:'flex',gap:16,marginBottom:6}}><div style={{width:80,flexShrink:0,fontSize:10.5,color:'#555',fontWeight:600}}>Volunteer</div><p style={T3.body}>{resume.volunteer.map(v=>`${v.role}${v.organization?`, ${v.organization}`:''}`).join(' · ')}</p></div>)}
          {(resume.interests||[]).length>0&&(<div style={{display:'flex',gap:16,marginBottom:6}}><div style={{width:80,flexShrink:0,fontSize:10.5,color:'#555',fontWeight:600}}>Interests</div><p style={T3.body}>{resume.interests.map(i=>i.interest).join(' · ')}</p></div>)}
        </T3Sec>
      )}
      <div style={{display:'flex',alignItems:'center',gap:5,marginTop:20,paddingTop:10,borderTop:'1px solid #e5e7eb'}}>
        <ReadyCVLogo size={10}/>
        <span style={{fontSize:8,color:'#9ca3af',letterSpacing:'0.08em',fontWeight:600}}>readyCV</span>
      </div>
    </div>
  )
}
function T3Sec({title,children}){return(<div style={{marginBottom:16}}><div style={{borderBottom:'1.5px solid #1a1a1a',marginBottom:8}}><span style={{fontSize:11,fontWeight:700,letterSpacing:'0.1em',color:'#1a1a1a'}}>{title}</span></div>{children}</div>)}
const T3 = {
  body:{fontSize:10.5,color:'#333',lineHeight:1.7,margin:'2px 0 0',fontFamily:"Georgia, serif"},
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  // ── Hooks first — always at top ──
  const { data: session, status } = useSession()
  const router = useRouter()

  const [file,              setFile]             = useState(null)
  const [loading,           setLoading]          = useState(false)
  const [resume,            setResume]           = useState(null)
  const [activeTab,         setActiveTab]        = useState('personal')
  const [showWarnings,      setShowWarnings]     = useState(true)
  const [atsLoading,        setAtsLoading]       = useState(false)
  const [atsSuccess,        setAtsSuccess]       = useState(false)
  const [coverLoading,      setCoverLoading]     = useState(false)
  const [coverLetter,       setCoverLetter]      = useState('')
  const [template,          setTemplate]         = useState('sidebar')
  const [templateSelected,  setTemplateSelected] = useState(false)
  const [accentColor,       setAccentColor]      = useState('#0f1b2e')
  const [resumeId,          setResumeId]         = useState(null)
  const [saveStatus,        setSaveStatus]       = useState('')
  const [mobileTab,         setMobileTab]        = useState('edit')
  const [resumeFont,        setResumeFont]       = useState(FONTS.sidebar[0].value)
  const autoSaveTimer = useRef(null)

  // Load resume being edited from dashboard
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

  // Auto-save every 30 seconds when resume exists
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
    // Save to Supabase before downloading
    await saveResume(resume, template, accentColor)
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
    const payload = {
      user_email:   session.user.email,
      data:         resumeData,
      template:     tpl,
      accent_color: color,
      font:         resumeFont,
      updated_at:   new Date().toISOString(),
    }
    if (resumeId) {
      await supabase.from('resumes').update(payload).eq('id', resumeId)
    } else {
      const { data: inserted } = await supabase.from('resumes').insert(payload).select().single()
      if (inserted) setResumeId(inserted.id)
    }
  }

  const set     = (f,v) => setResume(p => ({ ...p, [f]:v }))
  const setArr  = (s,i,k,v) => setResume(p => { const a=[...(p[s]||[])]; a[i]={...a[i],[k]:v}; return {...p,[s]:a} })
  const addItem = (s) => {
    setResume(p => ({ ...p, [s]:[...(p[s]||[]),{...EMPTY[s],id:uid()}] }))
    setTimeout(() => { const fa=document.getElementById('form-area'); if(fa) fa.scrollTop=fa.scrollHeight }, 50)
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

  // ── Auth checks ──────────────────────────────────────────────
  if (status === 'loading') return (
    <div style={{minHeight:'100vh',background:'#0f1b2e',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#64748b',fontSize:14,fontFamily:"'Inter',sans-serif"}}>Loading...</div>
    </div>
  )

  if (!session) {
    router.push('/signin')
    return null
  }

  // ── Upload screen ────────────────────────────────────────────
  if (!resume) return (
    <div style={U.bg}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;}@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}.upload-card{animation:fadeUp 0.6s ease both;}.upload-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(37,99,235,0.35)!important;}`}</style>
      <div style={U.card} className="upload-card">
        <ReadyCVLogo size={48} />
        <h1 style={U.title}>readyCV</h1>
        <p style={U.sub}>Upload your LinkedIn PDF export and get a polished, professional resume in seconds.</p>
        <label style={U.fileLabel}>{file?`✓  ${file.name}`:'📎  Choose LinkedIn PDF'}<input type="file" accept=".pdf" style={{display:'none'}} onChange={e=>setFile(e.target.files[0])}/></label>
        <button onClick={handleUpload} disabled={loading} style={{...U.btn,opacity:loading?0.7:1}} className="upload-btn">{loading?'⏳  Generating your resume...':'✨  Generate Resume'}</button>
      </div>
    </div>
  )

  // ── Template selection screen ────────────────────────────────
  if (!templateSelected) return (
    <div style={TS.bg}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;overflow-y:auto;}.ts-card:hover{border-color:rgba(255,255,255,0.2)!important;transform:translateY(-2px);}.ts-select:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(37,99,235,0.4)!important;}`}</style>
      <div style={TS.header}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:14}}>
          <ReadyCVLogo size={28}/>
          <span style={TS.logo}>readyCV</span>
        </div>
        <h2 style={TS.heading}>Choose your template</h2>
        <p style={TS.sub}>Your resume is ready — pick a design to continue. You can switch anytime in the editor.</p>
      </div>
      <div style={TS.grid}>
        {TEMPLATES.map(t=>(
          <div key={t.id} style={TS.card} className="ts-card">
            <p style={TS.templateName}>{t.label}</p>
            <p style={TS.templateDesc}>{t.desc}</p>
            {/* Color swatches for colorable templates */}
            {t.hasColor && (
              <div style={TS.swatchRow}>
                {ACCENT_COLORS.map(c=>(
                  <button key={c.id} title={c.label} onClick={(e)=>{ e.stopPropagation(); setAccentColor(c.value) }}
                    style={{
                      width:20, height:20, borderRadius:'50%', background:c.value, border:'none',
                      outline: accentColor===c.value ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: accentColor===c.value ? '0 0 0 1px rgba(255,255,255,0.5)' : 'none',
                      cursor:'pointer', transition:'all 0.15s', flexShrink:0,
                    }}
                  />
                ))}
              </div>
            )}
            {!t.hasColor && (
              <div style={{...TS.swatchRow, justifyContent:'center'}}>
                <span style={{fontSize:11,color:'#475569',fontStyle:'italic'}}>Timeless black & white</span>
              </div>
            )}
            {/* Template preview image */}
            <div style={{width:'100%',height:320,overflow:'hidden',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'#fff'}}>
              <img src={`/templates/${t.id}.png`} alt={t.label} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top',display:'block'}}/>
            </div>
            <button className="ts-select" style={TS.selectBtn}
              onClick={()=>{ setTemplate(t.id); setTemplateSelected(true) }}>
              Use {t.label} →
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Editor ───────────────────────────────────────────────────
  const missing = getMissing()
  const pct     = completion()
  const tabHasDot = (id) =>
    (id==='personal'   && missing.some(m=>['Full Name','Email','Phone','Job Title','Location','LinkedIn URL','Date of Birth'].includes(m))) ||
    (id==='summary'    && missing.includes('Profile Summary')) ||
    (id==='experience' && missing.includes('Work Experience')) ||
    (id==='education'  && missing.includes('Education')) ||
    (id==='skills'     && missing.includes('Skills'))

  const currentTemplate = TEMPLATES.find(t=>t.id===template)

  return (
    <div style={E.wrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800;900&family=Merriweather:wght@300;400;700;900&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Libre+Baskerville:wght@400;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;overflow:hidden;}.tab-btn:hover{background:rgba(255,255,255,0.06)!important;}.inp:focus{border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,0.12)!important;}.add-btn:hover{background:rgba(37,99,235,0.18)!important;}.dl-btn:hover{background:rgba(255,255,255,0.12)!important;}.ai-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(37,99,235,0.3)!important;}.swatch:hover{transform:scale(1.2);}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.form-in{animation:fadeUp 0.2s ease both;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}@media(max-width:768px){.mobile-only{display:flex!important;}.mobile-left{width:100%!important;flex-shrink:0!important;}.mobile-right{display:none!important;}.mobile-right.show{display:flex!important;}.mobile-left.show{display:flex!important;}.mobile-left:not(.show){display:none!important;}body{overflow:auto!important;}}@media(min-width:769px){.mobile-only{display:none!important;}.mobile-left{display:flex!important;}.mobile-right{display:flex!important;}}`}</style>

      {/* Mobile tab bar */}
      <div className="mobile-only" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:100,background:'#0f1b2e',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',height:56}}>
        <button onClick={()=>setMobileTab('edit')} style={{flex:1,background:mobileTab==='edit'?'rgba(37,99,235,0.15)':'transparent',border:'none',color:mobileTab==='edit'?'#60a5fa':'#64748b',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif",display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2}}>
          <span style={{fontSize:16}}>✏️</span>Edit
        </button>
        <button onClick={()=>setMobileTab('preview')} style={{flex:1,background:mobileTab==='preview'?'rgba(37,99,235,0.15)':'transparent',border:'none',color:mobileTab==='preview'?'#60a5fa':'#64748b',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif",display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2}}>
          <span style={{fontSize:16}}>👁</span>Preview
        </button>
      </div>

      {/* LEFT PANEL */}
      <div style={E.left} className={`mobile-left${mobileTab==='edit'?' show':''}`}>
        <div style={E.leftTop}>
          <div style={{display:'flex',alignItems:'center',gap:8}}><ReadyCVLogo size={22}/><span style={E.logo}>readyCV</span></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><button onClick={()=>{ setResume(null); setTemplateSelected(false) }} style={E.newBtn}>← New</button><button onClick={()=>signOut()} style={{...E.newBtn,color:"#ef4444",borderColor:"rgba(239,68,68,0.2)"}}>Sign out</button></div>
        </div>

        {/* Completion */}
        <div style={E.completionWrap}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={E.completionLabel}>Resume completeness</span>
            <span style={{...E.completionLabel,color:pct===100?'#10b981':'#f59e0b',fontWeight:600}}>{pct}%</span>
          </div>
          <div style={E.progressBg}><div style={{...E.progressFill,width:`${pct}%`,background:pct===100?'#10b981':'#2563eb'}}/></div>
          {missing.length>0&&showWarnings&&(
            <div style={E.warnBox}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={E.warnTitle}>Missing fields</span>
                <button onClick={()=>setShowWarnings(false)} style={E.warnX}>✕</button>
              </div>
              <div style={E.warnTags}>{missing.map(m=><span key={m} style={E.warnTag}>{m}</span>)}</div>
            </div>
          )}
          {pct===100&&<div style={E.completeBox}>✓ Resume is complete</div>}
        </div>

        {/* Tabs */}
        <div style={E.tabs}>
          {NAV.map(({id,label,icon})=>(
            <button key={id} onClick={()=>setActiveTab(id)} style={{...E.tab,...(activeTab===id?E.tabActive:{})}} className="tab-btn">
              <span style={E.tabIcon}>{icon}</span>
              <span style={E.tabLabel}>{label}</span>
              {tabHasDot(id)&&<span style={E.tabDot}/>}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={E.formArea} id="form-area" className="form-in" key={activeTab}>
          {activeTab==='personal'&&<Sec title="Personal Information">
            <Inp label="Full Name *"        val={resume.name}        set={v=>set('name',v)}        miss={!resume.name}/>
            <Inp label="Job Title *"         val={resume.title}       set={v=>set('title',v)}       miss={!resume.title}/>
            <Inp label="Email *"             val={resume.email}       set={v=>set('email',v)}       miss={!resume.email}/>
            <Inp label="Phone *"             val={resume.phone}       set={v=>set('phone',v)}       miss={!resume.phone}/>
            <Inp label="Location *"          val={resume.location}    set={v=>set('location',v)}    miss={!resume.location}/>
            <Inp label="Date of Birth *"     val={resume.dob}         set={v=>set('dob',v)}         miss={!resume.dob}      ph="e.g. 15 March 1998"/>
            <Inp label="LinkedIn URL *"      val={resume.linkedin}    set={v=>set('linkedin',v)}    miss={!resume.linkedin} ph="linkedin.com/in/yourname"/>
            <Inp label="Website / Portfolio" val={resume.website}     set={v=>set('website',v)}     ph="yourwebsite.com"/>
            <Inp label="Nationality"         val={resume.nationality} set={v=>set('nationality',v)}/>
          </Sec>}
          {activeTab==='summary'&&<Sec title="Profile Summary">
            <p style={E.hint}>2–3 sharp sentences. AI has already shortened it for you.</p>
            <TA val={resume.summary} set={v=>set('summary',v)} rows={6} miss={!resume.summary}/>
            <Inp label="References" val={resume.references} set={v=>set('references',v)}/>
          </Sec>}
          {activeTab==='experience'&&<Sec title="Work Experience" onAdd={()=>addItem('experience')}>
            {missing.includes('Work Experience')&&<Warn text="Add at least one work experience."/>}
            {(resume.experience||[]).map((e,i)=>(<Card key={e.id||i} onDel={()=>delItem('experience',i)}><Inp label="Job Title *" val={e.role} set={v=>setArr('experience',i,'role',v)} miss={!e.role}/><Inp label="Company *" val={e.company} set={v=>setArr('experience',i,'company',v)} miss={!e.company}/><Inp label="Duration" val={e.duration} set={v=>setArr('experience',i,'duration',v)} ph="e.g. Jan 2022 – Present"/><TA label="Description" val={e.description} set={v=>setArr('experience',i,'description',v)} rows={4}/></Card>))}
          </Sec>}
          {activeTab==='education'&&<Sec title="Education" onAdd={()=>addItem('education')}>
            {missing.includes('Education')&&<Warn text="Add at least one education entry."/>}
            {(resume.education||[]).map((e,i)=>(<Card key={e.id||i} onDel={()=>delItem('education',i)}><Inp label="Degree *" val={e.degree} set={v=>setArr('education',i,'degree',v)} miss={!e.degree}/><Inp label="Field" val={e.field} set={v=>setArr('education',i,'field',v)}/><Inp label="School *" val={e.school} set={v=>setArr('education',i,'school',v)} miss={!e.school}/><Inp label="Year" val={e.year} set={v=>setArr('education',i,'year',v)}/><Inp label="GPA / Grade" val={e.gpa} set={v=>setArr('education',i,'gpa',v)} ph="e.g. 3.8 / 4.0"/></Card>))}
          </Sec>}
          {activeTab==='skills'&&<Sec title="Skills" onAdd={()=>set('skills',[...(resume.skills||[]),''])}>
            {missing.includes('Skills')&&<Warn text="Add at least one skill."/>}
            <div>{(resume.skills||[]).map((sk,i)=>(<div key={i} style={E.skillRow}><input style={E.inp} className="inp" value={sk} onChange={e=>setSk(i,e.target.value)} placeholder="e.g. Project Management"/><button style={E.skillDel} onClick={()=>delSk(i)}>✕</button></div>))}</div>
          </Sec>}
          {activeTab==='languages'&&<Sec title="Languages" onAdd={()=>addItem('languages')}>
            {(resume.languages||[]).map((l,i)=>(<Card key={l.id||i} onDel={()=>delItem('languages',i)}><Inp label="Language" val={l.language} set={v=>setArr('languages',i,'language',v)}/><Inp label="Proficiency" val={l.proficiency} set={v=>setArr('languages',i,'proficiency',v)} ph="e.g. Native, Fluent, B2"/></Card>))}
          </Sec>}
          {activeTab==='volunteer'&&<Sec title="Volunteer Work" onAdd={()=>addItem('volunteer')}>
            <p style={E.hint}>Highly valued by universities and NGOs.</p>
            {(resume.volunteer||[]).map((v,i)=>(<Card key={v.id||i} onDel={()=>delItem('volunteer',i)}><Inp label="Organization" val={v.organization} set={vv=>setArr('volunteer',i,'organization',vv)}/><Inp label="Role" val={v.role} set={vv=>setArr('volunteer',i,'role',vv)}/><Inp label="Duration" val={v.duration} set={vv=>setArr('volunteer',i,'duration',vv)}/></Card>))}
          </Sec>}
          {activeTab==='certifications'&&<Sec title="Certifications" onAdd={()=>addItem('certifications')}>
            {(resume.certifications||[]).map((c,i)=>(<Card key={c.id||i} onDel={()=>delItem('certifications',i)}><Inp label="Name" val={c.name} set={v=>setArr('certifications',i,'name',v)}/><Inp label="Issuer" val={c.issuer} set={v=>setArr('certifications',i,'issuer',v)}/><Inp label="Year" val={c.year} set={v=>setArr('certifications',i,'year',v)}/></Card>))}
          </Sec>}
          {activeTab==='projects'&&<Sec title="Projects" onAdd={()=>addItem('projects')}>
            {(resume.projects||[]).map((p,i)=>(<Card key={p.id||i} onDel={()=>delItem('projects',i)}><Inp label="Name" val={p.name} set={v=>setArr('projects',i,'name',v)}/><TA label="Description" val={p.description} set={v=>setArr('projects',i,'description',v)} rows={3}/></Card>))}
          </Sec>}
          {activeTab==='interests'&&<Sec title="Hobbies & Interests" onAdd={()=>addItem('interests')}>
            <p style={E.hint}>Shows personality — valued by universities especially.</p>
            {(resume.interests||[]).map((item,i)=>(<Card key={item.id||i} onDel={()=>delItem('interests',i)}><Inp label="Interest" val={item.interest} set={v=>setArr('interests',i,'interest',v)} ph="e.g. Open-source development"/></Card>))}
          </Sec>}
          {activeTab==='awards'&&<Sec title="Awards & Honours" onAdd={()=>addItem('awards')}>
            {(resume.awards||[]).map((a,i)=>(<Card key={a.id||i} onDel={()=>delItem('awards',i)}><Inp label="Award" val={a.name} set={v=>setArr('awards',i,'name',v)}/><Inp label="Issuer" val={a.issuer} set={v=>setArr('awards',i,'issuer',v)}/><Inp label="Year" val={a.year} set={v=>setArr('awards',i,'year',v)}/></Card>))}
          </Sec>}
          {activeTab==='ats'&&<Sec title="ATS Job Tailoring">
            <p style={E.hint}>Paste the job description. AI rewrites your summary and experience to match — without inventing facts.</p>
            <TA val={resume.jobDescription||''} set={v=>set('jobDescription',v)} rows={10} ph="Paste job description here..."/>
            <button onClick={handleATS} disabled={atsLoading} style={{...E.aiBtn,marginTop:10}} className="ai-btn">{atsLoading?'⏳ Tailoring...':'🎯 Tailor Resume to This Job'}</button>
            {atsSuccess&&<div style={E.successBox}>✓ Resume tailored! Check Summary and Experience.</div>}
          </Sec>}
          {activeTab==='cover'&&<Sec title="Cover Letter">
            <p style={E.hint}>Tip: fill the ATS Tailor tab first for a more targeted letter.</p>
            <button onClick={handleCover} disabled={coverLoading} style={{...E.aiBtn,marginBottom:12}} className="ai-btn">{coverLoading?'⏳ Writing...':'✉️ Generate Cover Letter'}</button>
            {coverLetter&&<><TA val={coverLetter} set={v=>setCoverLetter(v)} rows={16}/><button style={{...E.aiBtn,background:'#059669',marginTop:8}} className="ai-btn" onClick={()=>{const blob=new Blob([coverLetter],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${resume.name||'cover'}-letter.txt`;a.click()}}>⬇ Download Cover Letter</button></>}
          </Sec>}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{...E.right,paddingBottom:56}} className={`mobile-right${mobileTab==='preview'?' show':''}`}>
        <div style={E.toolbar}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            {/* Template switcher */}
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:'#475569',fontSize:11,fontWeight:500}}>Template:</span>
              {TEMPLATES.map(t=>(
                <button key={t.id} onClick={()=>{ setTemplate(t.id); setResumeFont(FONTS[t.id][0].value) }}
                  style={{background:template===t.id?'rgba(255,255,255,0.1)':'transparent',border:template===t.id?'1px solid rgba(255,255,255,0.25)':'1px solid rgba(255,255,255,0.08)',borderRadius:7,padding:'5px 10px',cursor:'pointer',transition:'all 0.15s',fontFamily:"'Inter',sans-serif",color:template===t.id?'#e2e8f0':'#64748b',fontSize:11,fontWeight:template===t.id?600:400}}>
                  {t.label}
                </button>
              ))}
            </div>
            {/* Color picker — only for Sidebar and Executive */}
            {currentTemplate?.hasColor && (
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{color:'#475569',fontSize:11,fontWeight:500}}>Color:</span>
                {ACCENT_COLORS.map(c=>(
                  <button key={c.id} title={c.label} className="swatch"
                    onClick={()=>setAccentColor(c.value)}
                    style={{
                      width:16, height:16, borderRadius:'50%', background:c.value,
                      border:'none', cursor:'pointer', flexShrink:0, transition:'all 0.15s',
                      outline: accentColor===c.value ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: accentColor===c.value ? '0 0 0 1px rgba(255,255,255,0.4)' : 'none',
                    }}
                  />
                ))}
              </div>
            )}
            {/* Font picker */}
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:'#475569',fontSize:11,fontWeight:500}}>Font:</span>
              {FONTS[template].map(f=>(
                <button key={f.id} onClick={()=>setResumeFont(f.value)}
                  style={{background:resumeFont===f.value?'rgba(255,255,255,0.1)':'transparent',border:resumeFont===f.value?'1px solid rgba(255,255,255,0.25)':'1px solid rgba(255,255,255,0.08)',borderRadius:7,padding:'5px 10px',cursor:'pointer',transition:'all 0.15s',fontFamily:f.value,color:resumeFont===f.value?'#e2e8f0':'#64748b',fontSize:11,fontWeight:resumeFont===f.value?600:400}}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {saveStatus==='saving' && <span style={{color:'#64748b',fontSize:11}}>⏳ Saving...</span>}
            {saveStatus==='saved'  && <span style={{color:'#10b981',fontSize:11}}>✓ Saved</span>}
            <div style={{display:'flex',gap:8}}>
              <button onClick={async()=>{ await saveResume(resume,template,accentColor); router.push('/dashboard') }} style={{...E.dlBtn,background:'rgba(16,185,129,0.1)',borderColor:'rgba(16,185,129,0.2)',color:'#10b981'}}>💾 Save</button>
              <button onClick={handleDownload} style={E.dlBtn} className="dl-btn">⬇ Download PDF</button>
            </div>
          </div>
        </div>

        <div style={E.previewScroll}>
          <div id="resume-preview">
            {template==='sidebar'   && <TemplateSidebar   resume={resume} accent={accentColor} font={resumeFont}/>}
            {template==='executive' && <TemplateExecutive resume={resume} accent={accentColor} font={resumeFont}/>}
            {template==='heritage'  && <TemplateHeritage  resume={resume} font={resumeFont}/>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Small components ──────────────────────────────────────────
function Sec({title,children,onAdd}){return(<div style={E.sec}><div style={E.secHead}><h3 style={E.secTitle}>{title}</h3>{onAdd&&<button style={E.addBtn} className="add-btn" onClick={onAdd}>+ Add</button>}</div>{children}</div>)}
function Card({children,onDel}){return(<div style={E.card}><button style={E.cardDel} onClick={onDel}>✕ Remove</button>{children}</div>)}
function Inp({label,val,set,ph='',miss=false}){return(<div style={E.field}>{label&&<label style={E.label}>{label}{miss&&<span style={E.missMark}>● missing</span>}</label>}<input className="inp" style={{...E.inp,...(miss?E.inpMiss:{})}} value={val||''} placeholder={ph} onChange={e=>set(e.target.value)}/></div>)}
function TA({label,val,set,rows=4,miss=false,ph=''}){return(<div style={E.field}>{label&&<label style={E.label}>{label}{miss&&<span style={E.missMark}>● missing</span>}</label>}<textarea className="inp" style={{...E.inp,resize:'vertical',lineHeight:1.65,...(miss?E.inpMiss:{})}} value={val||''} rows={rows} placeholder={ph} onChange={e=>set(e.target.value)}/></div>)}
function Warn({text}){return <div style={E.warnBanner}>⚠ {text}</div>}

// ── Styles ────────────────────────────────────────────────────
const U = {
  bg:        {minHeight:'100vh',background:'#0f1b2e',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Inter',sans-serif"},
  card:      {background:'rgba(255,255,255,0.04)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:24,padding:'56px 48px',textAlign:'center',width:440,boxShadow:'0 40px 80px rgba(0,0,0,0.4)'},
  title:     {color:'#f1f5f9',fontSize:28,fontWeight:700,letterSpacing:'-0.02em',margin:'16px 0 10px'},
  sub:       {color:'#64748b',fontSize:14,lineHeight:1.75,margin:'0 0 32px',fontWeight:400},
  fileLabel: {display:'block',background:'rgba(37,99,235,0.08)',color:'#60a5fa',border:'1px dashed rgba(37,99,235,0.3)',borderRadius:12,padding:'13px 20px',cursor:'pointer',marginBottom:14,fontSize:14,fontWeight:500},
  btn:       {width:'100%',background:'#2563eb',color:'#fff',border:'none',borderRadius:12,padding:14,fontSize:15,cursor:'pointer',fontWeight:600,transition:'all 0.15s ease-out',boxShadow:'0 4px 16px rgba(37,99,235,0.3)'},
}

const TS = {
  bg:           {minHeight:'100vh',background:'#0a1628',fontFamily:"'Inter',sans-serif",paddingBottom:60},
  header:       {textAlign:'center',padding:'48px 24px 32px'},
  logo:         {color:'#f1f5f9',fontWeight:700,fontSize:20,letterSpacing:'-0.01em'},
  heading:      {color:'#f1f5f9',fontSize:28,fontWeight:700,margin:'8px 0 10px',letterSpacing:'-0.02em'},
  sub:          {color:'#64748b',fontSize:14,fontWeight:400,maxWidth:480,margin:'0 auto'},
  grid:         {display:'flex',justifyContent:'center',gap:24,flexWrap:'wrap',padding:'0 32px'},
  card:         {background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'22px',width:300,display:'flex',flexDirection:'column',gap:14,transition:'all 0.2s ease',cursor:'default'},
  templateName: {color:'#e2e8f0',fontWeight:700,fontSize:16,textAlign:'center',margin:0},
  templateDesc: {color:'#64748b',fontSize:12,textAlign:'center',margin:0},
  swatchRow:    {display:'flex',gap:8,justifyContent:'center',alignItems:'center',padding:'4px 0'},
  selectBtn:    {background:'#2563eb',color:'#fff',border:'none',borderRadius:10,padding:'12px',fontSize:14,fontWeight:600,cursor:'pointer',textAlign:'center',fontFamily:"'Inter',sans-serif",transition:'all 0.15s',boxShadow:'0 4px 14px rgba(37,99,235,0.3)'},
}

const E = {
  wrap:          {display:'flex',height:'100vh',overflow:'hidden',fontFamily:"'Inter',sans-serif",background:'#f3f4f6'},
  left:          {width:340,background:'#0f1b2e',display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',borderRight:'1px solid rgba(255,255,255,0.04)'},
  leftTop:       {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'18px 18px 14px',borderBottom:'1px solid rgba(255,255,255,0.05)'},
  logo:          {color:'#f1f5f9',fontWeight:700,fontSize:15,letterSpacing:'-0.01em'},
  newBtn:        {background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',color:'#94a3b8',borderRadius:8,padding:'5px 12px',cursor:'pointer',fontSize:12,fontWeight:500,transition:'all 0.15s'},
  completionWrap:{padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,0.05)'},
  completionLabel:{fontSize:11,color:'#64748b',fontWeight:500},
  progressBg:    {height:3,background:'rgba(255,255,255,0.06)',borderRadius:2,marginBottom:10},
  progressFill:  {height:3,borderRadius:2,transition:'width 0.4s ease, background 0.3s'},
  warnBox:       {background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.15)',borderRadius:8,padding:'10px 11px',marginTop:8},
  warnTitle:     {fontSize:11,color:'#f59e0b',fontWeight:600},
  warnX:         {background:'transparent',border:'none',color:'rgba(245,158,11,0.5)',cursor:'pointer',fontSize:13,padding:0},
  warnTags:      {display:'flex',flexWrap:'wrap',gap:5,marginTop:5},
  warnTag:       {background:'rgba(245,158,11,0.08)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.15)',borderRadius:4,fontSize:10,padding:'2px 7px',fontWeight:500},
  completeBox:   {marginTop:8,background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:8,padding:'7px 11px',color:'#10b981',fontSize:11,fontWeight:600},
  tabs:          {overflowY:'auto',padding:'6px 8px',borderBottom:'1px solid rgba(255,255,255,0.05)',maxHeight:260},
  tab:           {display:'flex',alignItems:'center',gap:8,width:'100%',background:'transparent',border:'none',color:'#64748b',borderRadius:8,padding:'9px 10px',cursor:'pointer',fontSize:12,fontWeight:500,position:'relative',transition:'background 0.15s',textAlign:'left',fontFamily:"'Inter',sans-serif"},
  tabActive:     {background:'rgba(37,99,235,0.12)',color:'#60a5fa'},
  tabIcon:       {fontSize:13,flexShrink:0},
  tabLabel:      {flex:1},
  tabDot:        {width:6,height:6,borderRadius:'50%',background:'#f59e0b',flexShrink:0},
  formArea:      {flex:1,overflowY:'auto',padding:'16px 14px'},
  sec:           {marginBottom:4},
  secHead:       {display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14},
  secTitle:      {color:'#e2e8f0',fontSize:13,fontWeight:600,margin:0},
  addBtn:        {background:'rgba(37,99,235,0.1)',border:'1px solid rgba(37,99,235,0.2)',color:'#60a5fa',borderRadius:7,padding:'4px 10px',cursor:'pointer',fontSize:11,fontWeight:500,transition:'background 0.15s'},
  card:          {background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'12px',marginBottom:10},
  cardDel:       {background:'transparent',border:'none',color:'#ef4444',fontSize:11,cursor:'pointer',padding:0,marginBottom:8,fontWeight:500,fontFamily:"'Inter',sans-serif"},
  field:         {marginBottom:10},
  label:         {display:'flex',alignItems:'center',gap:6,color:'#475569',fontSize:10,fontWeight:500,marginBottom:4,letterSpacing:'0.04em',textTransform:'uppercase'},
  inp:           {width:'100%',background:'rgba(255,255,255,0.05)',borderWidth:'1px',borderStyle:'solid',borderColor:'rgba(255,255,255,0.08)',borderRadius:8,color:'#e2e8f0',padding:'8px 10px',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:"'Inter',sans-serif",transition:'all 0.15s'},
  inpMiss:       {borderWidth:'1px',borderStyle:'solid',borderColor:'rgba(245,158,11,0.5)',background:'rgba(245,158,11,0.04)'},
  missMark:      {color:'#f59e0b',fontSize:9,fontWeight:600},
  warnBanner:    {background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.15)',borderRadius:7,color:'#f59e0b',fontSize:12,padding:'8px 10px',marginBottom:12,fontWeight:500},
  hint:          {color:'#475569',fontSize:11,margin:'0 0 10px',lineHeight:1.6,fontWeight:400},
  skillRow:      {display:'flex',gap:8,alignItems:'center',marginBottom:7},
  skillDel:      {background:'transparent',border:'none',color:'#ef4444',cursor:'pointer',fontSize:15,padding:0,flexShrink:0},
  aiBtn:         {width:'100%',background:'#2563eb',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.15s ease-out',boxShadow:'0 4px 14px rgba(37,99,235,0.25)',fontFamily:"'Inter',sans-serif"},
  successBox:    {marginTop:10,background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:8,color:'#10b981',fontSize:12,padding:'8px 10px',fontWeight:600},
  right:         {flex:1,display:'flex',flexDirection:'column',overflow:'hidden'},
  toolbar:       {background:'#0f1b2e',padding:'10px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid rgba(255,255,255,0.04)'},
  dlBtn:         {background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',borderRadius:8,padding:'7px 16px',cursor:'pointer',fontSize:13,fontWeight:600,transition:'background 0.15s',fontFamily:"'Inter',sans-serif"},
  previewScroll: {flex:1,overflowY:'auto',padding:'32px 24px',display:'flex',justifyContent:'center',background:'#f3f4f6'},
}