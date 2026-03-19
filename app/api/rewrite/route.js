import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { text, context } = await req.json()
    if (!text?.trim()) return NextResponse.json({ error: 'No text' }, { status: 400 })
    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role:'user', content:`You are a professional resume editor. Rewrite the following ${context||'text'} to be concise, impactful, and professional using strong action verbs. Do NOT change the meaning or add fake facts. Return ONLY the rewritten text.\n\n${text}` }],
      temperature: 0.3, max_tokens: 400,
    })
    return NextResponse.json({ rewritten: result.choices[0].message.content.trim() })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}