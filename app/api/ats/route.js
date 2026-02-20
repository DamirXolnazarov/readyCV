import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { resume, jobDescription } = await req.json()

    const prompt = `
You are a professional resume writer and ATS optimization expert.

Here is the candidate's current resume data:
- Summary: ${resume.summary}
- Experience: ${JSON.stringify(resume.experience)}

Here is the job description they are applying for:
${jobDescription}

Your task:
1. Rewrite the summary (max 3 sentences) to naturally include relevant keywords from the job description
2. Rewrite each experience description to emphasize skills and keywords that match the job
3. DO NOT invent experience, skills, or qualifications that are not already present
4. Keep the same facts, just reframe them to match the job language
5. Return ONLY valid JSON, nothing else:

{
  "summary": "rewritten summary here",
  "experience": [
    { "company": "", "role": "", "duration": "", "description": "rewritten description" }
  ]
}
`

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw   = result.choices[0].message.content
    const clean = raw.replace(/```json|```/g, '').trim()
    const updated = JSON.parse(clean)

    return NextResponse.json({ updated })

  } catch (err) {
    console.error('ATS error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}