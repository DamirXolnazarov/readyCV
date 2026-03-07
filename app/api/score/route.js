import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const ICONS = {
  'Impact & Achievements': '🎯',
  'Summary & Positioning': '📝',
  'Skills & Keywords': '⚡',
  'Completeness': '✅',
  'Quick Wins': '🚀',
}

export async function POST(req) {
  try {
    const { resume } = await req.json()
    if (!resume) return NextResponse.json({ error: 'No resume data' }, { status: 400 })

    const prompt = `You are an expert resume coach. Analyze this resume and respond with ONLY a raw JSON object. Do not write anything before or after the JSON. Do not use markdown or code blocks.

RESUME:
Name: ${resume.name || 'Not provided'}
Title: ${resume.title || 'Not provided'}
Summary: ${resume.summary || 'Not provided'}
Experience: ${(resume.experience||[]).slice(0,3).map(e=>`${e.role} at ${e.company}`).join(', ') || 'None'}
Skills: ${(resume.skills||[]).slice(0,15).join(', ') || 'None'}
Education: ${(resume.education||[]).slice(0,2).map(e=>`${e.degree} at ${e.school}`).join(', ') || 'None'}
LinkedIn: ${resume.linkedin || 'Missing'}
DOB: ${resume.dob || 'Missing'}
Location: ${resume.location || 'Missing'}

Return this JSON with real analysis of the resume above:
{"stars":3.5,"label":"Good","headline":"One sentence about their biggest strength or gap.","sections":[{"title":"Impact & Achievements","status":"needs-work","body":"Specific feedback about their experience and measurable impact."},{"title":"Summary & Positioning","status":"strong","body":"Feedback about their summary quality and positioning."},{"title":"Skills & Keywords","status":"strong","body":"Feedback about skills list and ATS optimization."},{"title":"Completeness","status":"needs-work","body":"Feedback about missing fields like LinkedIn, DOB, location."},{"title":"Quick Wins","status":"needs-work","body":"First action they can take today|Second action|Third action"}]}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1400,
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    console.log('Score raw:', raw?.slice(0, 300))

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })

    const result = JSON.parse(jsonMatch[0])

    // Inject icons
    if (result.sections) {
      result.sections = result.sections.map(s => ({ ...s, icon: ICONS[s.title] || '📋' }))
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('Score error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}