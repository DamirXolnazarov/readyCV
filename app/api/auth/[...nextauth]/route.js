import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // service role bypasses RLS
  )
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label:'Email',    type:'email'    },
        password: { label:'Password', type:'password' },
        name:     { label:'Name',     type:'text'     },
        mode:     { label:'Mode',     type:'text'     },
      },
      async authorize(credentials) {
        const supabase = getSupabase()
        const { email, password, name, mode } = credentials

        if (mode === 'signup') {
          // Check if already exists
          const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle()

          if (existing) throw new Error('Email already in use')

          // Hash and insert
          const hashed = await bcrypt.hash(password, 12)
          const { data: newUser, error } = await supabase
            .from('users')
            .insert({ email, name, password: hashed, provider: 'credentials' })
            .select('id, email, name')
            .maybeSingle()

          if (error || !newUser) {
            console.error('Signup error:', error)
            throw new Error('Failed to create account')
          }

          return { id: newUser.id, email: newUser.email, name: newUser.name }
        }

        // Sign in
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle()

        if (!user)          throw new Error('No account found with this email')
        if (!user.password) throw new Error('Please sign in with Google')

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) throw new Error('Incorrect password')

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const supabase = getSupabase()
        const { error } = await supabase.from('users').upsert({
          email:    user.email,
          name:     user.name,
          image:    user.image,
          provider: 'google',
        }, { onConflict: 'email' })
        if (error) console.error('Google upsert error:', error)
      }
      return true
    },
    async session({ session, token }) {
      if (session?.user) session.user.id = token.sub
      return session
    },
  },
  pages: {
    signIn: '/signin',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }