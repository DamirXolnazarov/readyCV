'use client'
// components/FeedbackWidget.js
import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

export default function FeedbackWidget() {
  const { data: session } = useSession()
  const pathname          = usePathname()
  const [open,    setOpen]    = useState(false)
  const [message, setMessage] = useState('')
  const [status,  setStatus]  = useState('idle') // idle | sending | done | error
  const [visible, setVisible] = useState(false)
  const taRef = useRef(null)

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true))
    else      setVisible(false)
  }, [open])

  useEffect(() => {
    if (visible && taRef.current) setTimeout(() => taRef.current?.focus(), 160)
  }, [visible])

  const close = () => {
    setVisible(false)
    setTimeout(() => { setOpen(false); setStatus('idle'); setMessage('') }, 280)
  }

  const submit = async () => {
    if (!message.trim() || status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:   message.trim(),
          page:      pathname,
          userEmail: session?.user?.email ?? null,
          userName:  session?.user?.name  ?? null,
        }),
      })
      if (!res.ok) throw new Error()
      setStatus('done')
      setTimeout(close, 2000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="fb-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes fbSpin{to{transform:rotate(360deg)}}
        .fb-btn:hover{transform:scale(1.10)!important;box-shadow:0 0 28px rgba(59,255,125,0.60)!important;}
        .fb-send:hover:not(:disabled){transform:translateY(-1px)!important;box-shadow:0 0 20px rgba(59,255,125,0.55)!important;}
        .fb-send:disabled{opacity:0.5!important;cursor:not-allowed!important;}
        .fb-ta:focus{outline:none!important;border-color:rgba(59,255,125,0.38)!important;box-shadow:0 0 0 3px rgba(59,255,125,0.07)!important;}
        .fb-root{font-family:'Inter',-apple-system,sans-serif!important;}
        .fb-root *{font-family:'Inter',-apple-system,sans-serif!important;}
      `}</style>

      {/* ── Floating bubble ── */}
      <button onClick={() => open ? close() : setOpen(true)} className="fb-btn"
        style={{
          position:'fixed', bottom:28, right:28, zIndex:990,
          width:48, height:48, borderRadius:'50%',
          background:'linear-gradient(135deg,#3BFF7D,#00C853)',
          border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 18px rgba(59,255,125,0.40), 0 4px 16px rgba(0,0,0,0.45)',
          transition:'all 0.22s cubic-bezier(0.16,1,0.3,1)',
        }}>
        {open
          ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="#050508" strokeWidth="2" strokeLinecap="round"/></svg>
          : <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#050508" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
        }
      </button>

      {/* ── Panel ── */}
      {open && (
        <div style={{
          position:'fixed', bottom:88, right:28, zIndex:991,
          width:300,
          background:'rgba(4,5,14,0.48)',
          backdropFilter:'blur(56px) saturate(180%)',
          WebkitBackdropFilter:'blur(56px) saturate(180%)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderTop:'1px solid rgba(255,255,255,0.22)',
          borderRadius:18,
          boxShadow:'0 20px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.14)',
          overflow:'hidden',
          opacity:  visible ? 1 : 0,
          transform:visible ? 'scale(1) translateY(0)' : 'scale(0.90) translateY(12px)',
          transition:'opacity 0.26s ease, transform 0.26s cubic-bezier(0.16,1,0.3,1)',
          transformOrigin:'bottom right',
        }}>
          {/* specular */}
          <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06) 12%,rgba(255,255,255,0.42) 50%,rgba(255,255,255,0.06) 88%,transparent)', pointerEvents:'none' }}/>
          {/* noise */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.45, backgroundImage:GRAIN }}/>

          <div style={{ position:'relative', zIndex:1, padding:'16px 16px 18px' }}>
            {status === 'done' ? (
              <div style={{ textAlign:'center', padding:'20px 0 8px' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>🙏</div>
                <p style={{ color:'#3BFF7D', fontWeight:700, fontSize:14, margin:'0 0 4px' }}>Got it, thanks!</p>
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>We read every message.</p>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <p style={{ color:'#f1f5f9', fontWeight:700, fontSize:13, margin:0 }}>Send feedback</p>
                  <button onClick={close} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.28)', padding:2, lineHeight:1, transition:'color 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.7)'}
                    onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.28)'}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                  </button>
                </div>

                <textarea ref={taRef} className="fb-ta" rows={4}
                  placeholder="Bug, idea, or anything on your mind…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter' && (e.metaKey||e.ctrlKey)) submit() }}
                  style={{
                    width:'100%', resize:'none', boxSizing:'border-box',
                    background:'rgba(255,255,255,0.05)',
                    border:'1px solid rgba(255,255,255,0.09)',
                    borderRadius:10, color:'#f1f5f9', fontSize:13,
                    padding:'9px 11px', fontFamily:'inherit', lineHeight:1.6,
                    transition:'all 0.18s ease', marginBottom:10,
                  }}
                />

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ color:'rgba(255,255,255,0.16)', fontSize:11 }}>⌘↵ to send</span>
                  <button onClick={submit} disabled={!message.trim() || status==='sending'} className="fb-send"
                    style={{
                      background:'#3BFF7D', color:'#050508', border:'none',
                      borderRadius:8, padding:'7px 16px', fontSize:13, fontWeight:700,
                      cursor:'pointer', fontFamily:'inherit',
                      boxShadow:'0 0 14px rgba(59,255,125,0.32)',
                      transition:'all 0.18s ease',
                      display:'flex', alignItems:'center', gap:6,
                    }}>
                    {status === 'sending'
                      ? <><span style={{ width:10, height:10, borderRadius:'50%', border:'1.5px solid transparent', borderTopColor:'#050508', animation:'fbSpin 0.7s linear infinite', display:'inline-block' }}/> Sending</>
                      : status === 'error' ? '⚠ Retry' : 'Send'
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}