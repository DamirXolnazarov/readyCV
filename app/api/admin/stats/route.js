// app/api/admin/stats/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [
    { count: totalUsers },
    { count: newUsers7d },
    { count: newUsers24h },
    { count: totalResumes },
    { count: resumes7d },
    { data: countryRows },
  ] = await Promise.all([
    supabase.from('users').select('*', { count:'exact', head:true }),
    supabase.from('users').select('*', { count:'exact', head:true }).gte('created_at', new Date(Date.now()-7*86400000).toISOString()),
    supabase.from('users').select('*', { count:'exact', head:true }).gte('created_at', new Date(Date.now()-86400000).toISOString()),
    supabase.from('resumes').select('*', { count:'exact', head:true }),
    supabase.from('resumes').select('*', { count:'exact', head:true }).gte('updated_at', new Date(Date.now()-7*86400000).toISOString()),
    supabase.from('events').select('properties').not('properties->>country', 'is', null),
  ])

  // Country breakdown
  const cc = {}
  for (const row of countryRows || []) {
    const c = row.properties?.country
    if (c) cc[c] = (cc[c] || 0) + 1
  }
  const countries = Object.entries(cc)
    .sort((a,b) => b[1]-a[1]).slice(0,15)
    .map(([country,count]) => ({ country, count }))

  // Event counts
  const eventNames = ['resume_created','pdf_downloaded','ats_tailored','cover_letter_generated']
  const eventCounts = Object.fromEntries(
    await Promise.all(eventNames.map(async ev => {
      const { count } = await supabase.from('events').select('*',{count:'exact',head:true}).eq('event',ev)
      return [ev, count || 0]
    }))
  )

  return NextResponse.json({
    users:     { total:totalUsers, last7d:newUsers7d, last24h:newUsers24h },
    resumes:   { total:totalResumes, last7d:resumes7d },
    events:    eventCounts,
    countries,
  })
}