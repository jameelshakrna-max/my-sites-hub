import { PrismaClient } from '@prisma/client'

let _db: PrismaClient | null = null

function getDb() {
  if (!_db) {
    _db = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
    if (process.env.NODE_ENV !== 'production') {
      (globalThis as any).prisma = _db
    }
  }
  return _db
}

export const db = new Proxy({} as any, {
  get(_target, prop) {
    return getDb()[prop]
  }
})
