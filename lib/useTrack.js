// lib/useTrack.js
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { supabase } from './supabase'

export function useTrack() {
  const { data: session } = useSession()
  const pathname = usePathname()

  return useCallback(async (event, properties = {}) => {
    try {
      await supabase.from('events').insert({
        user_email: session?.user?.email ?? null,
        event,
        properties: { ...properties, page: pathname },
      })
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.warn('[track]', e)
    }
  }, [session, pathname])
}