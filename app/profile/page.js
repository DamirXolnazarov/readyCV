'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

function Avatar({ src, name, size = 80 }) {
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  if (src) return <img src={src} alt="avatar" style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(255,255,255,0.1)' }}/>
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'linear-gradient(135deg,#3BFF7D,#00C853)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.32, fontWeight:800, color:'#050508', flexShrink:0, border:'2px solid rgba(59,255,125,0.25)', boxShadow:'0 0 20px rgba(59,255,125,0.15)', fontFamily:'inherit' }}>
      {initials}
    </div>
  )
}

function Toast({ message, type = 'success' }) {
  const colors = type==='success'
    ? { bg:'rgba(59,255,125,0.08)', border:'rgba(59,255,125,0.2)', color:'#3BFF7D' }
    : { bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.2)', color:'#FCA5A5' }
  return (
    <div style={{ position:'fixed', bottom:32, right:32, background:colors.bg, border:`1px solid ${colors.border}`, borderRadius:12, color:colors.color, padding:'12px 20px', fontSize:13, fontWeight:600, zIndex:999, boxShadow:'0 8px 32px rgba(0,0,0,0.5)', backdropFilter:'blur(16px)', animation:'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
      {message}
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
  const [avatarUploading,setAvatarUploading] = useState(false)
  const [oldPassword,   setOldPassword]   = useState('')
  const [newPassword,   setNewPassword]   = useState('')
  const [confirmPw,     setConfirmPw]     = useState('')
  const [pwSaving,      setPwSaving]      = useState(false)
  const [pwError,       setPwError]       = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting,      setDeleting]      = useState(false)
  const [toast,         setToast]         = useState(null)
  const [provider,      setProvider]      = useState('')
  const [joinedAt,      setJoinedAt]      = useState('')
  const fileRef = useRef(null)

  useEffect(() => { if (status==='unauthenticated') router.push('/signin') }, [status])
  useEffect(() => {
    if (!session?.user) return
    setName(session.user.name || ''); setAvatarUrl(session.user.image || null)
    const fetch_ = async () => {
      const { data } = await supabase.from('users').select('provider,created_at').eq('email', session.user.email).single()
      if (data) { setProvider(data.provider||'google'); setJoinedAt(data.created_at) }
    }
    fetch_()
  }, [session])

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(()=>setToast(null), 3000) }

  const handleSaveName = async () => {
    if (!name.trim()) return
    setNameSaving(true)
    await supabase.from('users').update({ name:name.trim() }).eq('email', session.user.email)
    await update({ name:name.trim() })
    setNameEditing(false); setNameSaving(false); showToast('✓ Name updated')
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 2*1024*1024) { showToast('⚠ Image must be under 2MB','error'); return }
    setAvatarUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `avatars/${session.user.email.replace('@','_').replace('.','_')}.${ext}`
    const { error:upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert:true })
    if (upErr) { showToast('⚠ Upload failed','error'); setAvatarUploading(false); return }
    const { data:urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = urlData.publicUrl
    await supabase.from('users').update({ image:publicUrl }).eq('email', session.user.email)
    await update({ image:publicUrl })
    setAvatarUrl(publicUrl); setAvatarUploading(false); showToast('✓ Avatar updated')
  }

  const handleChangePassword = async () => {
    setPwError('')
    if (!oldPassword||!newPassword||!confirmPw) { setPwError('All fields are required'); return }
    if (newPassword !== confirmPw) { setPwError('New passwords do not match'); return }
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return }
    setPwSaving(true)
    const res  = await fetch('/api/change-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:session.user.email, oldPassword, newPassword }) })
    const data = await res.json()
    if (data.error) { setPwError(data.error); setPwSaving(false); return }
    setOldPassword(''); setNewPassword(''); setConfirmPw(''); setPwSaving(false)
    showToast('✓ Password changed')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    await supabase.from('resumes').delete().eq('user_email', session.user.email)
    await supabase.from('users').delete().eq('email', session.user.email)
    await signOut({ callbackUrl:'/' })
  }

  if (status==='loading') return (
    <div style={{ minHeight:'100vh', background:'#050508', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'#3BFF7D', animation:'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const isGoogle = provider === 'google'
  const joined   = joinedAt ? new Date(joinedAt).toLocaleDateString('en-US',{month:'long',year:'numeric'}) : '—'

  return (
    <div style={{ minHeight:'100vh', background:'#050508', fontFamily:"'Inter', -apple-system, sans-serif", color:'#fff' }}>
      {toast && <Toast message={toast.msg} type={toast.type}/>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Inter',sans-serif;background:#050508;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .pr-inp:focus{border-color:rgba(59,255,125,0.4)!important;box-shadow:0 0 0 3px rgba(59,255,125,0.08)!important;outline:none;}
        .pr-save:hover{background:#1D4ED8!important;box-shadow:0 0 20px rgba(37,99,235,0.4)!important;}
        .pr-back:hover{color:#fff!important;}
        .avatar-hover:hover .avatar-overlay{opacity:1!important;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px;}
      `}</style>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:50, height:56, background:'rgba(5,5,8,0.85)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', padding:'0 28px', justifyContent:'space-between' }}>
        <img src="/logo.png" alt="ICVY" style={{ height:28, objectFit:'contain' }}/>
        <button onClick={()=>router.push('/dashboard')} className="pr-back" style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontSize:13, fontFamily:'inherit', transition:'color 0.15s', display:'flex', alignItems:'center', gap:6 }}>
          ← Back to Dashboard
        </button>
      </nav>

      <main style={{ maxWidth:640, margin:'0 auto', padding:'44px 28px 80px' }}>
        <div style={{ marginBottom:36 }}>
          <h1 style={{ color:'#fff', fontSize:26, fontWeight:800, letterSpacing:'-0.03em', marginBottom:6 }}>Profile Settings</h1>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:14 }}>Manage your account details and preferences</p>
        </div>

        {/* Profile card */}
        <Card style={{ marginBottom:16, animation:'fadeUp 0.5s ease both' }}>
          <CardTitle>Profile</CardTitle>

          <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:28, flexWrap:'wrap' }}>
            <div className="avatar-hover" style={{ position:'relative', cursor:'pointer' }} onClick={()=>fileRef.current?.click()}>
              <Avatar src={avatarUrl} name={name} size={72}/>
              <div className="avatar-overlay" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.2s', fontSize:11, color:'#fff', fontWeight:600, flexDirection:'column', gap:4 }}>
                {avatarUploading ? '⏳' : <><span style={{ fontSize:16 }}>📷</span><span>Change</span></>}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange}/>
            <div>
              <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:16, marginBottom:2 }}>{session?.user?.name||'—'}</p>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13, marginBottom:10 }}>{session?.user?.email}</p>
              <p style={{ color:'rgba(255,255,255,0.2)', fontSize:11 }}>Click avatar to change · JPG, PNG, WebP · Max 2MB</p>
            </div>
          </div>

          <FieldLabel>Display Name</FieldLabel>
          {nameEditing ? (
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input className="pr-inp" style={inpStyle} value={name} onChange={e=>setName(e.target.value)} autoFocus
                onKeyDown={e=>{if(e.key==='Enter')handleSaveName();if(e.key==='Escape')setNameEditing(false)}}/>
              <button onClick={handleSaveName} disabled={nameSaving} className="pr-save" style={saveBtnStyle}>{nameSaving?'Saving...':'Save'}</button>
              <button onClick={()=>{setNameEditing(false);setName(session.user.name||'')}} style={cancelBtnStyle}>Cancel</button>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ color:'#f1f5f9', fontSize:14 }}>{name||'—'}</span>
              <button onClick={()=>setNameEditing(true)} style={{ background:'rgba(255,255,255,0.05)', color:'#60A5FA', border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, padding:'5px 12px', fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.09)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
                ✏ Edit
              </button>
            </div>
          )}

          <div style={{ display:'flex', gap:32, flexWrap:'wrap', marginTop:24, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <FieldLabel>Sign-in Method</FieldLabel>
              <p style={{ color:'#f1f5f9', fontSize:13, marginTop:4 }}>
                {isGoogle ? '🔵 Google' : '🔑 Email & Password'}
              </p>
            </div>
            <div>
              <FieldLabel>Member Since</FieldLabel>
              <p style={{ color:'#f1f5f9', fontSize:13, marginTop:4 }}>{joined}</p>
            </div>
          </div>
        </Card>

        {/* Change password */}
        {!isGoogle && (
          <Card style={{ marginBottom:16, animation:'fadeUp 0.5s 0.08s ease both' }}>
            <CardTitle>Change Password</CardTitle>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13, marginBottom:20 }}>Must be at least 8 characters.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:380 }}>
              {[['Current Password', oldPassword, setOldPassword], ['New Password', newPassword, setNewPassword], ['Confirm New Password', confirmPw, setConfirmPw]].map(([label,val,setter])=>(
                <div key={label}>
                  <FieldLabel>{label}</FieldLabel>
                  <input className="pr-inp" style={inpStyle} type="password" placeholder="••••••••" value={val} onChange={e=>setter(e.target.value)}/>
                </div>
              ))}
              {pwError && <p style={{ color:'#F87171', fontSize:13 }}>{pwError}</p>}
              <button onClick={handleChangePassword} disabled={pwSaving} className="pr-save" style={{ ...saveBtnStyle, width:'fit-content' }}>
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </Card>
        )}

        {/* Danger zone */}
        <Card style={{ borderColor:'rgba(239,68,68,0.12)', animation:'fadeUp 0.5s 0.14s ease both' }}>
          <CardTitle style={{ color:'#F87171' }}>Danger Zone</CardTitle>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13, marginBottom:20, lineHeight:1.7 }}>
            Permanently delete your account and all resumes. This cannot be undone.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:380 }}>
            <FieldLabel>Type <span style={{ color:'#F87171', fontWeight:700 }}>DELETE</span> to confirm</FieldLabel>
            <input className="pr-inp" style={{ ...inpStyle, borderColor:deleteConfirm==='DELETE'?'rgba(239,68,68,0.35)':'rgba(255,255,255,0.08)' }}
              value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder="DELETE"/>
            <button onClick={handleDeleteAccount} disabled={deleteConfirm!=='DELETE'||deleting} style={{ background:deleteConfirm==='DELETE'?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.02)', border:`1px solid ${deleteConfirm==='DELETE'?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.06)'}`, borderRadius:9, padding:'10px 20px', color:deleteConfirm==='DELETE'?'#FCA5A5':'rgba(255,255,255,0.2)', fontSize:13, fontWeight:600, cursor:deleteConfirm==='DELETE'?'pointer':'not-allowed', fontFamily:'inherit', width:'fit-content', transition:'all 0.15s' }}>
              {deleting ? 'Deleting...' : '🗑 Delete My Account'}
            </button>
          </div>
        </Card>
      </main>
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'28px 32px', ...style }}>
      {children}
    </div>
  )
}

function CardTitle({ children, style = {} }) {
  return <h2 style={{ color:'#f1f5f9', fontSize:15, fontWeight:600, marginBottom:20, ...style }}>{children}</h2>
}

function FieldLabel({ children }) {
  return <label style={{ display:'block', color:'rgba(255,255,255,0.35)', fontSize:11, fontWeight:600, marginBottom:7, letterSpacing:'0.07em', textTransform:'uppercase' }}>{children}</label>
}

const inpStyle = {
  width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10,
  color:'#f1f5f9', padding:'10px 13px', fontSize:14, fontFamily:'inherit', transition:'all 0.18s ease',
}

const saveBtnStyle = {
  background:'#2563EB', color:'#fff', border:'none', borderRadius:9, padding:'10px 20px',
  fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
  boxShadow:'0 0 16px rgba(37,99,235,0.3)', transition:'all 0.18s ease',
}

const cancelBtnStyle = {
  background:'transparent', color:'rgba(255,255,255,0.35)', border:'1px solid rgba(255,255,255,0.08)',
  borderRadius:9, padding:'10px 16px', fontSize:13, cursor:'pointer', fontFamily:'inherit',
}