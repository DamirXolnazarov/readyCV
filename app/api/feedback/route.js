import { NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID

export async function POST(req) {
  try {
    const { type, message, page, userEmail, userName } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'No message' }, { status: 400 })

    const emoji = { bug:'🐛', idea:'💡', praise:'🙌', other:'💬' }[type] || '💬'

    const text = [
      `${emoji} <b>${type?.toUpperCase()}</b>`,
      ``,
      `<b>Message:</b>`,
      message.trim(),
      ``,
      `<b>From:</b> ${userEmail || 'anonymous'}${userName ? ` (${userName})` : ''}`,
      `<b>Page:</b> ${page || '?'}`,
    ].join('\n')

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Telegram error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}