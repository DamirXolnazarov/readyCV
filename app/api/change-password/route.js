import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    const { email, oldPassword, newPassword } = await req.json()
    if (!email || !oldPassword || !newPassword)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Fetch current hashed password
    const { data: user, error } = await supabase
      .from('users').select('password').eq('email', email).single()
    if (error || !user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!user.password)
      return NextResponse.json({ error: 'This account uses Google sign-in' }, { status: 400 })

    // Verify old password
    const valid = await bcrypt.compare(oldPassword, user.password)
    if (!valid)
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })

    // Hash and save new password
    const hashed = await bcrypt.hash(newPassword, 12)
    await supabase.from('users').update({ password: hashed }).eq('email', email)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}