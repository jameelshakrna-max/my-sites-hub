import { supabase } from './supabase'

export async function getUserEmailFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  try {
    const { data: { user } } = await supabase.auth.getUser(token)
    return user?.email?.toLowerCase() ?? null
  } catch {
    return null
  }
}
