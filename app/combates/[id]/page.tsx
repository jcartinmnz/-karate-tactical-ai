import { sql } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CombateDetallePage({ params }: { params: { id: string } }) {
  const [combate] = await sql`
    SELECT c.*, r.nombre as rival_nombre, r.id as rival_id
    FROM combates c
    JOIN rivales r ON r.id = c.rival_id
    WHERE c.id = ${params.id}
  `
  if (!combate) notFound()

  const tecnicas = await sql`
    SELECT * FROM tecnicas_por_combate
    WHERE combate_id = ${params.id}
    ORDER BY ejecutor, ronda, segundo
  `

  const propias = tecnicas.filter((t) => t.ejecutor === 'propio')
  const delRival = tecnicas.filter((t) => t.ejecutor === 'rival')

  const puntosGenerados = propias.filter(t => t.exitosa).reduce((s: number, t) => s + Number(t.puntos), 0)
  const puntosRecibidos = delRival.filter(t => t.exitosa).reduce((s: number, t) => s + Number(t.puntos), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/combates" className="text-gray-500 hover:text-gray-300 text-sm">← Combates</Link>
          </div>
          <h1 className="text-2xl font-bold">vs. {combate.rival_nombre}</h1>
          <p className="text-gray-400 text-sm mt-1">{combate.competencia} · {new Date(combate.fecha).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
            combate.resultado === 'victoria' ? 'bg-green-900/50 text-green-400' :
            combate.resultado === 'derrota' ? 'bg-red-900/50 text-red-400' :
            'bg-gray-800 text-gray-400'
          }`}>
            {combate.resultado.toUpperCase()}
          </span>
          <p className="text-3xl font-mono font-bold mt-2">
            <span className="text-white">{combate.puntos_propios}</span>
            <span className="text-gray-600 mx-2">–</span>
            <span className="text-gray-400">{combate.puntos_rival}</span>
          </p>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Mis técnicas', value: propias.length },
          { label: 'Técnicas exitosas', value: propias.filter(t => t.exitosa).length },
          { label: 'Puntos generados', value: puntosGenerados },
          { label: 'Puntos recibidos', value: puntosRecibidos },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Técnicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Propias */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold mb-4 text-sm text-gray-300 uppercase tracking-wider">
            Mis técnicas ({propias.length})
          </h2>
          {propias.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay técnicas registradas</p>
          ) : (
            <div className="space-y-2">
              {propias.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.exitosa ? 'bg-green-400' : 'bg-gray-600'}`} />
                    <div>
                      <span className="text-sm font-medium">{t.tecnica}</span>
                      <span className="text-xs text-gray-500 ml-2">{t.zona} · R{t.ronda}</span>
                    </div>
                  </div>
                  {t.exitosa && (
                    <span className="text-green-400 text-xs font-mono font-medium">+{t.puntos}pts</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Del rival */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold mb-4 text-sm text-gray-300 uppercase tracking-wider">
            Técnicas del rival ({delRival.length})
          </h2>
          {delRival.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay técnicas registradas</p>
          ) : (
            <div className="space-y-2">
              {delRival.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.exitosa ? 'bg-red-400' : 'bg-gray-600'}`} />
                    <div>
                      <span className="text-sm font-medium">{t.tecnica}</span>
                      <span className="text-xs text-gray-500 ml-2">{t.zona} · R{t.ronda}</span>
                    </div>
                  </div>
                  {t.exitosa && (
                    <span className="text-red-400 text-xs font-mono font-medium">+{t.puntos}pts</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notas */}
      {combate.notas && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold mb-2 text-sm text-gray-300 uppercase tracking-wider">Notas</h2>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{combate.notas}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href={`/rivales/${combate.rival_id}`}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
        >
          Ver perfil de {combate.rival_nombre} →
        </Link>
      </div>
    </div>
  )
}
