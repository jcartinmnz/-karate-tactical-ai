import Link from 'next/link'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function RivalesPage() {
  const rivales = await sql`
    SELECT r.*, COUNT(c.id)::int as total_combates,
      SUM(CASE WHEN c.resultado = 'victoria' THEN 1 ELSE 0 END)::int as victorias,
      SUM(CASE WHEN c.resultado = 'derrota' THEN 1 ELSE 0 END)::int as derrotas
    FROM rivales r
    LEFT JOIN combates c ON c.rival_id = r.id
    GROUP BY r.id
    ORDER BY r.nombre ASC
  `

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rivales</h1>
        <Link
          href="/rivales/nuevo"
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo rival
        </Link>
      </div>

      {rivales.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">No hay rivales registrados aún.</p>
          <Link href="/rivales/nuevo" className="text-red-400 hover:underline mt-2 inline-block">
            Agregá el primero →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rivales.map((r) => (
            <Link
              key={r.id}
              href={`/rivales/${r.id}`}
              className="block p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-lg">{r.nombre}</h2>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {[r.pais, r.categoria_peso, r.nivel].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-400">{r.total_combates} combates</p>
                  {r.total_combates > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="text-green-400">{r.victorias}V</span>
                      {' / '}
                      <span className="text-red-400">{r.derrotas}D</span>
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
