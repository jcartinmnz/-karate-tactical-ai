import Link from 'next/link'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function CombatesPage() {
  const combates = await sql`
    SELECT c.*, r.nombre as rival_nombre
    FROM combates c
    JOIN rivales r ON r.id = c.rival_id
    ORDER BY c.fecha DESC
  `

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Combates</h1>
        <Link
          href="/combates/nuevo"
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo combate
        </Link>
      </div>

      {combates.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">No hay combates registrados aún.</p>
          <Link href="/combates/nuevo" className="text-red-400 hover:underline mt-2 inline-block">
            Registrá el primero →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {combates.map((c) => (
            <Link
              key={c.id}
              href={`/combates/${c.id}`}
              className="block p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">vs. {c.rival_nombre}</span>
                  <span className="text-gray-500 text-sm ml-3">{c.competencia}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm">{new Date(c.fecha).toLocaleDateString()}</span>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                    c.resultado === 'victoria' ? 'bg-green-900/50 text-green-400' :
                    c.resultado === 'derrota' ? 'bg-red-900/50 text-red-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {c.resultado.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-sm font-mono">
                    {c.puntos_propios} – {c.puntos_rival}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
