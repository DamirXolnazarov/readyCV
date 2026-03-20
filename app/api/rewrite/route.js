import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { text, context } = await req.json()
    if (!text?.trim()) return NextResponse.json({ error: 'No text' }, { status: 400 })

    let prompt

    if (context === 'generate') {
      // text IS the full prompt — used by AIFieldDesc for awards/certs/interests
      prompt = text
    } else {
      // Standard rewrite mode — condense without losing meaning
      prompt = `You are a professional resume editor. Rewrite the following ${context || 'text'} to be concise, impactful, and professional — using strong action verbs and specific details where possible. Do NOT change the meaning, add fake facts, or invent details. Keep it tight and human-sounding. Return ONLY the rewritten text, no quotes, no preamble, no explanation.

Text to rewrite:
${text}`
    }

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    })

    const rewritten = result.choices[0].message.content.trim()
    return NextResponse.json({ rewritten })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}