import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

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
        mode:     { label:'Mode',     type:'text'     }, // 'signin' or 'signup'
      },
      async authorize(credentials) {
        const { email, password, name, mode } = credentials

        if (mode === 'signup') {
          // Check if user already exists
          const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

          if (existing) throw new Error('Email already in use')

          // Hash password and create user
          const hashed = await bcrypt.hash(password, 12)
          const { data: newUser, error } = await supabase
            .from('users')
            .insert({ email, name, password: hashed, provider:'credentials' })
            .select()
            .single()

          if (error) throw new Error('Failed to create account')
          return { id: newUser.id, email: newUser.email, name: newUser.name }
        }

        // Sign in
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (!user) throw new Error('No account found with this email')
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
        const { error } = await supabase.from('users').upsert({
          email:    user.email,
          name:     user.name,
          image:    user.image,
          provider: 'google',
        }, { onConflict: 'email' })
        if (error) console.error('Supabase upsert error:', error)
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