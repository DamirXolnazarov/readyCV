import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function POST(req) {
  try {
    const { html } = await req.json()

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    await page.setContent(html, { waitUntil: 'domcontentloaded' })

    await page.pdf({
      path: undefined,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    })

    await browser.close()

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume-readyCV.pdf"',
      },
    })

  } catch (err) {
    console.error('Puppeteer error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}