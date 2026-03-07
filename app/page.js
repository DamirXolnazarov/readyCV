'use client'
import Link from 'next/link'

function ReadyCVLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#2563EB" fillOpacity="0.1" />
      <rect x="7" y="9"  width="11" height="1.7" rx="0.85" fill="#2563EB" />
      <rect x="7" y="13" width="18" height="1.7" rx="0.85" fill="#2563EB" />
      <rect x="7" y="17" width="14" height="1.7" rx="0.85" fill="#2563EB" />
      <rect x="7" y="21" width="9"  height="1.7" rx="0.85" fill="#2563EB" />
      <circle cx="24" cy="10" r="4" fill="#2563EB" />
      <path d="M22 10l1.5 1.5L26.5 8" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const features = [
  { icon: '⚡', title: 'Instant Extraction', desc: 'Upload your LinkedIn PDF and AI instantly parses every detail — name, roles, education, skills, languages — into a clean structure.' },
  { icon: '✏️', title: 'Live Split Editor', desc: 'Edit any field on the left and watch your A4 resume update in real time on the right. WYSIWYG, always.' },
  { icon: '🎯', title: 'ATS Job Tailoring', desc: 'Paste a job description. AI rewrites your resume keywords to match it — without inventing a single false fact.' },
  { icon: '✉️', title: 'Cover Letter AI', desc: 'One click generates a tailored, human-sounding cover letter. Edit and download as a text file instantly.' },
  { icon: '⚠️', title: 'Smart Completeness', desc: 'Real-time warnings flag every missing field — LinkedIn URL, date of birth, GPA — before you apply.' },
  { icon: '🌍', title: 'University Ready', desc: 'Includes nationality, DOB, volunteer work, references, and languages — fields universities and embassies actually require.' },
]

const steps = [
  { num: '01', title: 'Export from LinkedIn', desc: 'Profile → More → Save to PDF. Takes 30 seconds.' },
  { num: '02', title: 'Upload to readyCV',    desc: 'Drop your PDF. AI reads and structures everything instantly.' },
  { num: '03', title: 'Edit & Tailor',        desc: 'Refine details, add missing fields, tailor to any job.' },
  { num: '04', title: 'Download & Apply',     desc: 'Export a polished A4 resume and cover letter. Done.' },
]

const reviews = [
  { name: 'Asel Nurlanovna',  role: 'Marketing Graduate · Almaty',          avatar: 'AN', text: 'Uploaded my LinkedIn PDF and had a job-ready resume in under 3 minutes. The ATS tailoring helped me get callbacks I thought were impossible.' },
  { name: 'James Okonkwo',    role: 'Software Engineer · Lagos',             avatar: 'JO', text: 'The cover letter generator alone is worth it. I used to spend hours per application — now it takes 10 minutes. Landed my first international role.' },
  { name: 'Priya Sharma',     role: 'MBA Applicant · Mumbai',                avatar: 'PS', text: 'The missing fields feature is brilliant. It flagged my LinkedIn URL and DOB — things I never thought to add. Got into my first choice university.' },
  { name: 'Damir Xolnazarov', role: 'International Relations · Tashkent',   avatar: 'DX', text: 'Finally a tool that understands what universities want. The volunteer and languages sections are things other resume builders completely ignore.' },
  { name: 'Léa Fontaine',     role: 'UX Designer · Paris',                  avatar: 'LF', text: 'Clean, fast, and the resume actually looks good. I tried Kickresume and Resume.io — readyCV beats them for simplicity. And it is free.' },
  { name: 'Carlos Mendez',    role: 'Business Analyst · Mexico City',        avatar: 'CM', text: 'The live preview is a game changer. You see exactly what your resume looks like as you type. No more downloading 20 versions to check formatting.' },
]

export default function Landing() {
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; }
        a { text-decoration: none; }

        .nav-cta:hover   { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.3) !important; }
        .feat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important; }
        .review-card:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(0,0,0,0.08) !important; }
        .cta-btn:hover   { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(37,99,235,0.35) !important; }

        @keyframes floatUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        .hero-text  { animation: floatUp 0.8s ease both; }
        .hero-sub   { animation: floatUp 0.8s 0.1s ease both; }
        .hero-btns  { animation: floatUp 0.8s 0.2s ease both; }
        .hero-mock  { animation: floatUp 0.8s 0.15s ease both; }
        .mock-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.navBrand}>
            <ReadyCVLogo size={28} />
            <span style={S.navLogo}>readyCV</span>
          </div>
          <div style={S.navLinks}>
            <a href="#features" style={S.navLink}>Features</a>
            <a href="#how"      style={S.navLink}>How it works</a>
            <a href="#reviews"  style={S.navLink}>Reviews</a>
            <Link href="/signin" style={S.navCta} className="nav-cta">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={S.hero}>
        <div style={S.heroLeft}>
          <div style={S.heroBadge} className="hero-text">
            <span style={S.badgeDot} />
            Free · No sign-up required · AI-powered
          </div>
          <h1 style={S.heroTitle} className="hero-text">
            Build a Resume<br />
            <span style={S.heroAccent}>That Gets You Hired.</span>
          </h1>
          <p style={S.heroSub} className="hero-sub">
            Upload your LinkedIn PDF and readyCV transforms it into a polished, ATS-optimized resume with live editing, job tailoring, and cover letter generation — in under 3 minutes.
          </p>
          <div style={S.heroBtns} className="hero-btns">
            <Link href="/signin" style={S.btnPrimary} className="cta-btn">✨ Build My Resume Free</Link>
            <a href="#how" style={S.btnSecondary}>See how it works →</a>
          </div>
          <p style={S.heroProof} className="hero-btns">Trusted by 2,400+ job seekers and university applicants worldwide</p>
        </div>

        {/* Mock Editor */}
        <div style={S.heroRight} className="hero-mock">
          <div style={S.mockWrap} className="mock-float">
            <div style={S.mockEditor}>
              {/* Mock left panel */}
              <div style={S.mockPanel}>
                <div style={S.mockPanelHeader}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <ReadyCVLogo size={14} />
                    <span style={{ fontSize:10, fontWeight:600, color:'#94a3b8' }}>readyCV</span>
                  </div>
                </div>
                {['Personal','Summary','Experience','Education','Skills','Languages'].map((t,i) => (
                  <div key={t} style={{ ...S.mockTab, ...(i===2 ? S.mockTabActive : {}) }}>
                    <span>{t}</span>
                    {i===0 && <span style={S.mockDot} />}
                  </div>
                ))}
                <div style={S.mockInputGroup}>
                  <div style={S.mockInputLabel} />
                  <div style={S.mockInput} />
                  <div style={S.mockInputLabel} />
                  <div style={{ ...S.mockInput, width:'70%' }} />
                  <div style={S.mockInputLabel} />
                  <div style={S.mockInput} />
                </div>
              </div>
              {/* Mock resume */}
              <div style={S.mockResume}>
                <div style={S.mockResumeHeader}>
                  <div style={{ width:90, height:11, background:'rgba(255,255,255,0.9)', borderRadius:3, marginBottom:5 }} />
                  <div style={{ width:130, height:7,  background:'rgba(255,255,255,0.45)', borderRadius:3, marginBottom:3 }} />
                  <div style={{ width:100, height:6,  background:'rgba(255,255,255,0.3)', borderRadius:3 }} />
                </div>
                <div style={S.mockResumeBody}>
                  {[
                    { w:'40%', h:5, c:'#1e3a5f' },
                    { w:'100%', h:4, c:'#e5e7eb' },
                    { w:'90%',  h:4, c:'#e5e7eb' },
                    { w:'75%',  h:4, c:'#e5e7eb' },
                    { w:'40%',  h:5, c:'#1e3a5f' },
                    { w:'100%', h:4, c:'#e5e7eb' },
                    { w:'85%',  h:4, c:'#e5e7eb' },
                    { w:'40%',  h:5, c:'#1e3a5f' },
                    { w:'60%',  h:4, c:'#e5e7eb' },
                    { w:'80%',  h:4, c:'#e5e7eb' },
                  ].map((bar,i) => (
                    <div key={i} style={{ width:bar.w, height:bar.h, background:bar.c, borderRadius:2, marginBottom:6 }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={S.mockBadge}>⚡ Live preview · updates as you type</div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={S.section}>
        <div style={S.inner}>
          <div style={S.sectionTag}>Features</div>
          <h2 style={S.sectionTitle}>Everything you need.<br />Nothing you don't.</h2>
          <p style={S.sectionSub}>Built for job seekers, university applicants, and career changers who want results fast.</p>
          <div style={S.featGrid}>
            {features.map((f,i) => (
              <div key={i} style={S.featCard} className="feat-card">
                <div style={S.featIcon}>{f.icon}</div>
                <h3 style={S.featTitle}>{f.title}</h3>
                <p style={S.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={S.darkSection}>
        <div style={S.inner}>
          <div style={{ ...S.sectionTag, color:'#60a5fa', borderColor:'rgba(96,165,250,0.2)', background:'rgba(96,165,250,0.08)' }}>How it works</div>
          <h2 style={{ ...S.sectionTitle, color:'#f1f5f9' }}>From LinkedIn to hired.<br />Four steps.</h2>
          <div style={S.stepsRow}>
            {steps.map((step, i) => (
              <div key={i} style={S.stepCard}>
                <div style={S.stepNum}>{step.num}</div>
                <h3 style={S.stepTitle}>{step.title}</h3>
                <p style={S.stepDesc}>{step.desc}</p>
                {i < steps.length - 1 && <div style={S.stepArrow}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section id="reviews" style={S.section}>
        <div style={S.inner}>
          <div style={S.sectionTag}>Reviews</div>
          <h2 style={S.sectionTitle}>Loved by people<br />who got hired.</h2>
          <div style={S.reviewGrid}>
            {reviews.map((r,i) => (
              <div key={i} style={S.reviewCard} className="review-card">
                <div style={S.reviewStars}>★★★★★</div>
                <p style={S.reviewText}>"{r.text}"</p>
                <div style={S.reviewAuthor}>
                  <div style={S.reviewAvatar}>{r.avatar}</div>
                  <div>
                    <div style={S.reviewName}>{r.name}</div>
                    <div style={S.reviewRole}>{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={S.ctaSection}>
        <div style={{ textAlign:'center', maxWidth:560, margin:'0 auto' }}>
          <ReadyCVLogo size={52} />
          <h2 style={S.ctaTitle}>Start building for free.</h2>
          <p style={S.ctaSub}>No account. No credit card. Just a better resume.</p>
          <Link href="/signin" style={S.btnPrimary} className="cta-btn">✨ Build My Resume</Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={{ ...S.navInner }}>
          <div style={S.navBrand}>
            <ReadyCVLogo size={20} />
            <span style={{ ...S.navLogo, fontSize:14, color:'#9ca3af' }}>readyCV</span>
          </div>
          <p style={{ fontSize:13, color:'#9ca3af' }}>© 2026 readyCV · Built to get you hired.</p>
        </div>
      </footer>
    </div>
  )
}

const S = {
  page: { fontFamily:"'Inter', sans-serif", background:'#ffffff', color:'#0f172a', overflowX:'hidden' },

  // Nav
  nav:      { position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.82)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid rgba(0,0,0,0.05)' },
  navInner: { maxWidth:1100, margin:'0 auto', padding:'0 32px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' },
  navBrand: { display:'flex', alignItems:'center', gap:9 },
  navLogo:  { fontSize:17, fontWeight:700, color:'#0f172a', letterSpacing:'-0.01em' },
  navLinks: { display:'flex', alignItems:'center', gap:32 },
  navLink:  { fontSize:14, fontWeight:500, color:'#6b7280', transition:'color 0.15s' },
  navCta:   { background:'#0f1b2e', color:'#fff', padding:'9px 20px', borderRadius:10, fontSize:14, fontWeight:600, transition:'all 0.15s ease-out', boxShadow:'0 4px 14px rgba(15,27,46,0.2)' },

  // Hero
  hero:      { maxWidth:1100, margin:'0 auto', padding:'100px 32px 80px', display:'flex', alignItems:'center', gap:64, flexWrap:'wrap' },
  heroLeft:  { flex:'1 1 420px', display:'flex', flexDirection:'column', gap:24 },
  heroBadge: { display:'inline-flex', alignItems:'center', gap:8, background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:500, width:'fit-content' },
  badgeDot:  { width:6, height:6, borderRadius:'50%', background:'#10b981', flexShrink:0 },
  heroTitle: { fontSize:'clamp(36px,5vw,58px)', fontWeight:700, lineHeight:1.1, letterSpacing:'-0.03em', color:'#0f172a' },
  heroAccent:{ color:'#2563eb' },
  heroSub:   { fontSize:17, fontWeight:300, color:'#6b7280', lineHeight:1.75, maxWidth:500 },
  heroBtns:  { display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' },
  heroProof: { fontSize:13, color:'#9ca3af', fontWeight:400 },
  heroRight: { flex:'1 1 380px', display:'flex', justifyContent:'center' },

  btnPrimary:   { display:'inline-block', background:'#0f1b2e', color:'#fff', padding:'14px 28px', borderRadius:12, fontSize:15, fontWeight:600, transition:'all 0.15s ease-out', boxShadow:'0 4px 16px rgba(15,27,46,0.18)' },
  btnSecondary: { color:'#6b7280', fontSize:14, fontWeight:500, padding:'14px 4px', display:'inline-block' },

  // Mock Editor
  mockWrap:   { width:'100%', maxWidth:520 },
  mockEditor: { background:'#0f1b2e', borderRadius:20, overflow:'hidden', display:'flex', boxShadow:'0 40px 80px rgba(15,27,46,0.35)', border:'1px solid rgba(255,255,255,0.06)', height:340 },
  mockPanel:  { width:140, borderRight:'1px solid rgba(255,255,255,0.05)', padding:'12px 0', display:'flex', flexDirection:'column' },
  mockPanelHeader: { padding:'0 12px 10px', borderBottom:'1px solid rgba(255,255,255,0.05)', marginBottom:6 },
  mockTab:    { padding:'7px 12px', fontSize:9, color:'#475569', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'default' },
  mockTabActive: { background:'rgba(37,99,235,0.12)', color:'#60a5fa', fontWeight:600 },
  mockDot:    { width:5, height:5, borderRadius:'50%', background:'#f59e0b' },
  mockInputGroup: { padding:'10px 10px 0', marginTop:'auto' },
  mockInputLabel: { width:'40%', height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, marginBottom:4 },
  mockInput:  { width:'100%', height:18, background:'rgba(255,255,255,0.05)', borderRadius:5, border:'1px solid rgba(255,255,255,0.07)', marginBottom:8 },
  mockResume: { flex:1, display:'flex', flexDirection:'column' },
  mockResumeHeader: { background:'#1e3a5f', padding:'20px 16px 14px' },
  mockResumeBody:   { flex:1, padding:'12px 14px', background:'#fff' },
  mockBadge:  { textAlign:'center', marginTop:14, fontSize:12, color:'#9ca3af', fontWeight:500 },

  // Sections
  section:     { padding:'96px 32px' },
  darkSection: { padding:'96px 32px', background:'#0e1a2b' },
  inner:       { maxWidth:1100, margin:'0 auto' },
  sectionTag:  { display:'inline-block', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'#2563eb', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:6, padding:'4px 12px', marginBottom:20 },
  sectionTitle:{ fontSize:'clamp(28px,4vw,42px)', fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.2, margin:'0 0 16px', color:'#0f172a' },
  sectionSub:  { fontSize:16, fontWeight:400, color:'#6b7280', lineHeight:1.7, margin:'0 0 56px', maxWidth:500 },

  // Features
  featGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 },
  featCard: { background:'rgba(255,255,255,0.7)', backdropFilter:'blur(12px)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:20, padding:'32px 28px', transition:'all 0.2s ease-out', boxShadow:'0 4px 16px rgba(0,0,0,0.04)', cursor:'default' },
  featIcon: { fontSize:28, marginBottom:16 },
  featTitle:{ fontSize:16, fontWeight:600, color:'#0f172a', margin:'0 0 8px' },
  featDesc: { fontSize:14, fontWeight:400, color:'#6b7280', lineHeight:1.7, margin:0 },

  // Steps
  stepsRow:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:0 },
  stepCard:  { padding:'36px 28px', position:'relative' },
  stepNum:   { fontSize:52, fontWeight:700, color:'rgba(37,99,235,0.15)', lineHeight:1, marginBottom:16, letterSpacing:'-0.04em' },
  stepTitle: { fontSize:16, fontWeight:600, color:'#f1f5f9', margin:'0 0 8px' },
  stepDesc:  { fontSize:13, fontWeight:400, color:'#64748b', lineHeight:1.65 },
  stepArrow: { position:'absolute', right:-8, top:'38%', color:'#1e3a5f', fontSize:22 },

  // Reviews
  reviewGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 },
  reviewCard: { background:'#fff', border:'1px solid rgba(0,0,0,0.06)', borderRadius:18, padding:'28px', display:'flex', flexDirection:'column', gap:16, transition:'all 0.2s ease-out', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', cursor:'default' },
  reviewStars:{ color:'#f59e0b', fontSize:14, letterSpacing:2 },
  reviewText: { fontSize:14, color:'#374151', lineHeight:1.75, fontStyle:'italic', flex:1 },
  reviewAuthor:{ display:'flex', alignItems:'center', gap:12 },
  reviewAvatar:{ width:38, height:38, borderRadius:'50%', background:'#0f1b2e', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 },
  reviewName: { fontSize:13, fontWeight:600, color:'#0f172a' },
  reviewRole: { fontSize:11, color:'#9ca3af', marginTop:1 },

  // CTA
  ctaSection: { padding:'120px 32px', background:'#f8fafc', textAlign:'center' },
  ctaTitle:   { fontSize:'clamp(32px,5vw,52px)', fontWeight:700, letterSpacing:'-0.03em', color:'#0f172a', margin:'20px 0 12px' },
  ctaSub:     { fontSize:16, color:'#6b7280', margin:'0 0 36px' },

  // Footer
  footer: { background:'#fff', borderTop:'1px solid rgba(0,0,0,0.06)', padding:'20px 32px' },
}