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

function noop() { return Promise.resolve({ data: null, error: null }) }

const safeHandler = {
  get(_target, prop) {
    const client = getSupabase()
    if (!client) {
      if (prop === 'then') return undefined
      if (prop === 'auth') return new Proxy({}, safeHandler)
      return noop
    }
    const val = client[prop]
    if (typeof val === 'function') return val.bind(client)
    return val
  }
}

export const supabase = new Proxy({}, safeHandler)
