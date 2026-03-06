import { neon, NeonQueryFunction } from '@neondatabase/serverless'

let _sql: NeonQueryFunction<false, false> | null = null

export function getDb(): NeonQueryFunction<false, false> {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está definida en las variables de entorno')
    }
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}

// Proxy conveniente: sql`...` funciona igual que antes, pero la conexión
// se crea solo cuando se ejecuta la primera query (en runtime, no en build time)
export const sql = new Proxy((() => {}) as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, args) {
    return (getDb() as unknown as (...a: unknown[]) => unknown)(...args)
  },
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
}) as NeonQueryFunction<false, false>
