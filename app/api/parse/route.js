import { NextResponse } from 'next/server'
import PDFParser from 'pdf2json'
import Groq from 'groq-sdk'

export async function POST(req) {
  try {
    console.log('API KEY:', process.env.GROQ_API_KEY ? 'Found ✅' : 'Missing ❌')

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const formData = await req.formData()
    const file = formData.get('pdf')

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Extract text from PDF
    const text = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser()
      pdfParser.on('pdfParser_dataError', (err) => reject(err))
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        const text = pdfData.Pages.map(page =>
          page.Texts.map(t => decodeURIComponent(t.R[0].T)).join(' ')
        ).join('\n')
        resolve(text)
      })
      pdfParser.parseBuffer(buffer)
    })

    console.log('PDF TEXT (first 200 chars):', text.slice(0, 200))

    // Send to Groq
const prompt = `
You are a professional resume writer and layout expert. Your job is to extract and rewrite this LinkedIn PDF into a resume that fits EXACTLY on one A4 page.

CORE RULE: The total amount of text must fit on a single A4 page. You must judge how much content there is and compress accordingly.

STRICT RULES — non negotiable:
- NEVER invent or guess dates. If a date is not explicitly written in the PDF, leave duration as empty string ""
- NEVER move entries between sections. Experience stays in experience, volunteer stays in volunteer, projects stay in projects
- Only populate volunteer[] if the LinkedIn PDF has an explicit "Volunteering" section — do not pull from experience
- Only populate projects[] if the LinkedIn PDF has an explicit "Projects" section — do not pull from experience  
- If volunteer section exists in LinkedIn, include a short description of what they did
- If a section does not exist in the PDF, return empty array [] — never fill it with guessed data
- Copy dates exactly as they appear in the text — do not calculate or estimate durations
- If you are unsure about any data point, leave it as empty string rather than guessing

COMPRESSION GUIDE based on content volume:
- If the person has 6+ experience entries → max 1 sentence per description, keep only 5 most recent roles
- If the person has 3-5 experience entries → max 2 sentences per description
- If the person has 1-2 experience entries → max 3 sentences per description
- Summary: always 2 sentences max, sharp and specific
- Skills: max 12, pick the most relevant
- If there are many sections (volunteer, projects, certs, awards) → keep only the most impressive 2 entries per section
- If there are few sections → you can be slightly more generous with descriptions

ALWAYS:
- Keep company names, roles, dates, school names exactly as written
- Never invent facts
- Write descriptions as clean flowing sentences, no bullet symbols, no line breaks inside descriptions
- Remove filler, repetition, vague phrases like "responsible for" or "worked on"
- Start descriptions with strong action verbs

Return ONLY valid JSON, nothing else:
{
  "name": "",
  "title": "",
  "email": "",
  "phone": "",
  "location": "",
  "summary": "",
  "experience": [
    { "company": "", "role": "", "duration": "", "description": "" }
  ],
  "education": [
    { "school": "", "degree": "", "field": "", "year": "" }
  ],
  "skills": [],
  "languages": [{ "language": "", "proficiency": "" }],
  "certifications": [{ "name": "", "issuer": "", "year": "" }],
  "volunteer": [{ "organization": "", "role": "", "duration": "" }],
  "projects": [{ "name": "", "description": "" }],
  "awards": [{ "name": "", "issuer": "", "year": "" }]
}

LinkedIn PDF text:
${text}
`

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = result.choices[0].message.content
    console.log('RAW GROQ RESPONSE:', raw)

    const clean = raw.replace(/```json|```/g, '').trim()
    const resumeData = JSON.parse(clean)
    console.log('PARSED DATA:', resumeData)

    return NextResponse.json({ resumeData })

  } catch (err) {
    console.error('FULL ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

