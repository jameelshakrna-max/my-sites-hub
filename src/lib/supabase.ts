import { createClient } from '@supabase/supabase-js'

let _supabase = null

function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (url.startsWith('http')) {
      _supabase = createClient(url, key)
    }
  }
  return _supabase
}

export const supabase = new Proxy({}, {
  get(_target, prop) {
    const client = getSupabase()
    if (!client) return () => Promise.resolve({ data: null, error: null })
    const val = client[prop]
    if (typeof val === 'function') return val.bind(client)
    return val
  }
})
