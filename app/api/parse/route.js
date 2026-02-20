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
You are a professional resume writer. Extract and aggressively compress this LinkedIn PDF into a clean one-page resume.

STRICT RULES:
- Summary: MAXIMUM 2 sentences, no more
- Each experience description: MAXIMUM 1-2 lines of plain text, no bullet points, no line breaks, just one clean sentence or two
- Remove ALL filler words, redundant phrases, repeated ideas
- Skills: maximum 10 items
- If there are more than 5 experience entries, keep only the 5 most recent or relevant
- NO line breaks inside description strings — must be plain single-paragraph text
- Descriptions must be under 180 characters each
- Keep all names, companies, dates exactly as written

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

