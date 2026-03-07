'use client'
export const dynamic = 'force-dynamic'
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

function Avatar({ src, name, size = 80 }) {
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  if (src) return <img src={src} alt="avatar" style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:'3px solid rgba(255,255,255,0.1)'}}/>
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:'linear-gradient(135deg,#2563eb,#1e40af)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.32,fontWeight:700,color:'#fff',border:'3px solid rgba(255,255,255,0.1)',flexShrink:0,fontFamily:"'Inter',sans-serif"}}>
      {initials}
    </div>
  )
}

export default function Profile() {
  const { data:session, status, update } = useSession()
  const router = useRouter()

  const [name,          setName]          = useState('')
  const [nameEditing,   setNameEditing]   = useState(false)
  const [nameSaving,    setNameSaving]    = useState(false)
  const [avatarUrl,     setAvatarUrl]     = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [oldPassword,   setOldPassword]   = useState('')
  const [newPassword,   setNewPassword]   = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving,      setPwSaving]      = useState(false)
  const [pwError,       setPwError]       = useState('')
  const [pwSuccess,     setPwSuccess]     = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting,      setDeleting]      = useState(false)
  const [toast,         setToast]         = useState('')
  const [provider,      setProvider]      = useState('')
  const [joinedAt,      setJoinedAt]      = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signin')
  }, [status])

  useEffect(() => {
    if (!session?.user) return
    setName(session.user.name || '')
    setAvatarUrl(session.user.image || null)
    // fetch user record from supabase for provider + joined date
    const fetchUser = async () => {
      const { data } = await supabase.from('users').select('provider,created_at').eq('email', session.user.email).single()
      if (data) {
        setProvider(data.provider || 'google')
        setJoinedAt(data.created_at)
      }
    }
    fetchUser()
  }, [session])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSaveName = async () => {
    if (!name.trim()) return
    setNameSaving(true)
    await supabase.from('users').update({ name: name.trim() }).eq('email', session.user.email)
    await update({ name: name.trim() })
    setNameEditing(false)
    setNameSaving(false)
    showToast('✓ Name updated')
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showToast('⚠ Image must be under 2MB'); return }
    setAvatarUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `avatars/${session.user.email.replace('@','_').replace('.','_')}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { showToast('⚠ Upload failed: ' + upErr.message); setAvatarUploading(false); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = urlData.publicUrl
    await supabase.from('users').update({ image: publicUrl }).eq('email', session.user.email)
    await update({ image: publicUrl })
    setAvatarUrl(publicUrl)
    setAvatarUploading(false)
    showToast('✓ Avatar updated')
  }

  const handleChangePassword = async () => {
    setPwError(''); setPwSuccess(false)
    if (!oldPassword || !newPassword || !confirmPassword) { setPwError('All fields are required'); return }
    if (newPassword !== confirmPassword) { setPwError('New passwords do not match'); return }
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return }
    setPwSaving(true)
    const res  = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: session.user.email, oldPassword, newPassword }),
    })
    const data = await res.json()
    if (data.error) { setPwError(data.error); setPwSaving(false); return }
    setPwSuccess(true)
    setOldPassword(''); setNewPassword(''); setConfirmPassword('')
    setPwSaving(false)
    showToast('✓ Password changed')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    await supabase.from('resumes').delete().eq('user_email', session.user.email)
    await supabase.from('users').delete().eq('email', session.user.email)
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') return (
    <div style={{minHeight:'100vh',background:'#080f1a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#64748b',fontSize:14,fontFamily:"'Inter',sans-serif"}}>Loading...</div>
    </div>
  )

  const isGoogle = provider === 'google'
  const joined   = joinedAt ? new Date(joinedAt).toLocaleDateString('en-US',{month:'long',year:'numeric'}) : '—'

  return (
    <div style={P.bg}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Inter',sans-serif;background:#080f1a;}
        .inp:focus{border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,0.12)!important;outline:none;}
        .back-btn:hover{color:#f1f5f9!important;}
        .save-btn:hover{background:#1d4ed8!important;}
        .avatar-btn:hover{background:rgba(255,255,255,0.12)!important;}
        .del-btn:hover{background:rgba(239,68,68,0.2)!important;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px;}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',top:24,left:'50%',transform:'translateX(-50%)',background:'#1e293b',border:'1px solid rgba(255,255,255,0.1)',color:'#f1f5f9',padding:'10px 24px',borderRadius:10,fontSize:13,fontWeight:500,zIndex:999,boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
          {toast}
        </div>
      )}

      {/* Nav */}
      <nav style={P.nav}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <ReadyCVLogo size={24}/>
          <span style={P.navLogo}>readyCV</span>
        </div>
        <button onClick={()=>router.push('/dashboard')} style={P.backBtn} className="back-btn">
          ← Back to Dashboard
        </button>
      </nav>

      <main style={P.main}>
        <h1 style={P.title}>Profile Settings</h1>
        <p style={P.sub}>Manage your account details and preferences</p>

        {/* ── Avatar + basic info ── */}
        <div style={P.card}>
          <h2 style={P.cardTitle}>Profile</h2>
          <div style={{display:'flex',alignItems:'center',gap:24,marginBottom:28,flexWrap:'wrap'}}>
            <div style={{position:'relative'}}>
              <Avatar src={avatarUrl} name={name} size={80}/>
              {avatarUploading && (
                <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#fff'}}>
                  ⏳
                </div>
              )}
            </div>
            <div>
              <p style={{color:'#f1f5f9',fontWeight:600,fontSize:16,marginBottom:4}}>{session?.user?.name||'—'}</p>
              <p style={{color:'#475569',fontSize:13,marginBottom:12}}>{session?.user?.email}</p>
              <button onClick={()=>fileRef.current?.click()} style={P.avatarBtn} className="avatar-btn" disabled={avatarUploading}>
                {avatarUploading ? '⏳ Uploading...' : '📷 Change Avatar'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarChange}/>
              <p style={{color:'#334155',fontSize:11,marginTop:6}}>JPG, PNG or WebP · Max 2MB</p>
            </div>
          </div>

          {/* Name edit */}
          <div style={P.field}>
            <label style={P.label}>Display Name</label>
            {nameEditing ? (
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input className="inp" style={P.inp} value={name} onChange={e=>setName(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter')handleSaveName();if(e.key==='Escape')setNameEditing(false)}}
                  autoFocus/>
                <button onClick={handleSaveName} disabled={nameSaving} style={P.saveBtn} className="save-btn">
                  {nameSaving?'Saving...':'Save'}
                </button>
                <button onClick={()=>{setNameEditing(false);setName(session.user.name||'')}} style={P.cancelBtn}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{color:'#f1f5f9',fontSize:14}}>{name||'—'}</span>
                <button onClick={()=>setNameEditing(true)} style={P.editBtn}>✏ Edit</button>
              </div>
            )}
          </div>

          {/* Account info */}
          <div style={{display:'flex',gap:32,flexWrap:'wrap',marginTop:20,paddingTop:20,borderTop:'1px solid rgba(255,255,255,0.05)'}}>
            <div>
              <p style={P.label}>Sign-in Method</p>
              <p style={{color:'#f1f5f9',fontSize:14,marginTop:4,display:'flex',alignItems:'center',gap:6}}>
                {isGoogle ? (
                  <><svg width="14" height="14" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.7 29.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C40.9 39.2 44 34 44 24c0-1.3-.1-2.7-.4-4z"/></svg>Google</>
                ) : '🔑 Email & Password'}
              </p>
            </div>
            <div>
              <p style={P.label}>Member Since</p>
              <p style={{color:'#f1f5f9',fontSize:14,marginTop:4}}>{joined}</p>
            </div>
          </div>
        </div>

        {/* ── Change Password (email users only) ── */}
        {!isGoogle && (
          <div style={P.card}>
            <h2 style={P.cardTitle}>Change Password</h2>
            <p style={{color:'#475569',fontSize:13,marginBottom:20}}>Must be at least 8 characters.</p>
            <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:400}}>
              <div style={P.field}>
                <label style={P.label}>Current Password</label>
                <input className="inp" type="password" style={P.inp} value={oldPassword} onChange={e=>setOldPassword(e.target.value)} placeholder="••••••••"/>
              </div>
              <div style={P.field}>
                <label style={P.label}>New Password</label>
                <input className="inp" type="password" style={P.inp} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="••••••••"/>
              </div>
              <div style={P.field}>
                <label style={P.label}>Confirm New Password</label>
                <input className="inp" type="password" style={P.inp} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="••••••••"
                  onKeyDown={e=>{if(e.key==='Enter')handleChangePassword()}}/>
              </div>
              {pwError   && <p style={{color:'#f87171',fontSize:13}}>{pwError}</p>}
              {pwSuccess  && <p style={{color:'#10b981',fontSize:13}}>✓ Password updated successfully</p>}
              <button onClick={handleChangePassword} disabled={pwSaving} style={{...P.saveBtn,width:'fit-content'}} className="save-btn">
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        )}

        {/* ── Danger Zone ── */}
        <div style={{...P.card,borderColor:'rgba(239,68,68,0.15)'}}>
          <h2 style={{...P.cardTitle,color:'#f87171'}}>Danger Zone</h2>
          <p style={{color:'#475569',fontSize:13,marginBottom:20,lineHeight:1.7}}>
            Permanently delete your account and all resumes. This cannot be undone.
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:10,maxWidth:400}}>
            <label style={P.label}>Type <span style={{color:'#f87171',fontWeight:700}}>DELETE</span> to confirm</label>
            <input className="inp" style={{...P.inp,borderColor:deleteConfirm==='DELETE'?'rgba(239,68,68,0.4)':'rgba(255,255,255,0.08)'}}
              value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder="DELETE"/>
            <button onClick={handleDeleteAccount} disabled={deleteConfirm!=='DELETE'||deleting}
              style={{...P.saveBtn,background:deleteConfirm==='DELETE'?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.03)',borderColor:deleteConfirm==='DELETE'?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.06)',color:deleteConfirm==='DELETE'?'#f87171':'#334155',width:'fit-content',cursor:deleteConfirm==='DELETE'?'pointer':'not-allowed'}}
              className={deleteConfirm==='DELETE'?'del-btn':''}>
              {deleting ? 'Deleting...' : '🗑 Delete My Account'}
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}

const P = {
  bg:        {minHeight:'100vh',background:'#080f1a',fontFamily:"'Inter',sans-serif"},
  nav:       {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 40px',borderBottom:'1px solid rgba(255,255,255,0.05)',background:'rgba(8,15,26,0.9)',backdropFilter:'blur(16px)',position:'sticky',top:0,zIndex:10},
  navLogo:   {color:'#f1f5f9',fontWeight:700,fontSize:17,letterSpacing:'-0.02em'},
  backBtn:   {background:'transparent',border:'none',color:'#475569',cursor:'pointer',fontSize:13,fontFamily:"'Inter',sans-serif",transition:'color 0.15s'},
  main:      {maxWidth:680,margin:'0 auto',padding:'44px 32px 80px'},
  title:     {color:'#f1f5f9',fontSize:26,fontWeight:700,letterSpacing:'-0.02em',marginBottom:6},
  sub:       {color:'#475569',fontSize:14,marginBottom:36},
  card:      {background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'28px 32px',marginBottom:20},
  cardTitle: {color:'#f1f5f9',fontSize:16,fontWeight:600,marginBottom:20},
  field:     {display:'flex',flexDirection:'column',gap:6},
  label:     {color:'#64748b',fontSize:12,fontWeight:500,letterSpacing:'0.03em'},
  inp:       {background:'rgba(255,255,255,0.05)',borderWidth:'1px',borderStyle:'solid',borderColor:'rgba(255,255,255,0.08)',borderRadius:8,color:'#f1f5f9',padding:'9px 12px',fontSize:14,fontFamily:"'Inter',sans-serif",transition:'all 0.15s',width:'100%'},
  saveBtn:   {background:'#2563eb',color:'#fff',border:'1px solid transparent',borderRadius:8,padding:'9px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all 0.15s'},
  cancelBtn: {background:'transparent',color:'#64748b',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'9px 16px',fontSize:13,cursor:'pointer',fontFamily:"'Inter',sans-serif"},
  editBtn:   {background:'rgba(255,255,255,0.05)',color:'#60a5fa',border:'1px solid rgba(255,255,255,0.08)',borderRadius:6,padding:'5px 12px',fontSize:12,cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all 0.15s'},
  avatarBtn: {background:'rgba(255,255,255,0.07)',color:'#f1f5f9',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 16px',fontSize:13,cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all 0.15s'},
}