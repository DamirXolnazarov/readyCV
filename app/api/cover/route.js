import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { resume, jobDescription } = await req.json()

    const prompt = `
You are an expert cover letter writer.

Write a professional, compelling cover letter based on this resume data:
Name: ${resume.name}
Title: ${resume.title}
Summary: ${resume.summary}
Experience: ${JSON.stringify(resume.experience)}
Skills: ${resume.skills?.join(', ')}
Education: ${JSON.stringify(resume.education)}

Job they are applying for:
${jobDescription || 'General application'}

Rules:
- 3 paragraphs max
- First paragraph: who they are and why they want this role
- Second paragraph: 2-3 strongest relevant achievements
- Third paragraph: confident closing
- Tone: professional but human, not robotic
- DO NOT invent facts not present in the resume
- Return ONLY the cover letter text, no subject line, no JSON
`

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    })

    const letter = result.choices[0].message.content
    return NextResponse.json({ letter })

  } catch (err) {
    console.error('Cover letter error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}