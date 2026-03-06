import { sql } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ScoutingPanel from '@/components/rivales/ScoutingPanel'

export const dynamic = 'force-dynamic'

export default async function RivalDetallePage({ params }: { params: { id: string } }) {
  const [rival] = await sql`SELECT * FROM rivales WHERE id = ${params.id}`
  if (!rival) notFound()

  const combates = await sql`
    SELECT * FROM combates
    WHERE rival_id = ${params.id}
    ORDER BY fecha DESC
  `

  const [scouting] = await sql`
    SELECT id, rival_id, notas_scouting, videos_referencia, gameplan, ultima_actualizacion
    FROM scouting_rivales WHERE rival_id = ${params.id}
  `

  const tecnicasRival = await sql`
    SELECT t.tecnica, t.zona,
      COUNT(*)::int as veces_usada,
      SUM(CASE WHEN t.exitosa THEN 1 ELSE 0 END)::int as veces_exitosa,
      ROUND(100.0 * SUM(CASE WHEN t.exitosa THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 1)::float as tasa_exito_pct
    FROM tecnicas_por_combate t
    JOIN combates c ON c.id = t.combate_id
    WHERE c.rival_id = ${params.id} AND t.ejecutor = 'rival'
    GROUP BY t.tecnica, t.zona
    ORDER BY veces_usada DESC
    LIMIT 8
  `

  const tecnicasPropias = await sql`
    SELECT t.tecnica, t.zona,
      COUNT(*)::int as veces_usada,
      SUM(CASE WHEN t.exitosa THEN 1 ELSE 0 END)::int as veces_exitosa,
      ROUND(100.0 * SUM(CASE WHEN t.exitosa THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 1)::float as tasa_exito_pct
    FROM tecnicas_por_combate t
    JOIN combates c ON c.id = t.combate_id
    WHERE c.rival_id = ${params.id} AND t.ejecutor = 'propio'
    GROUP BY t.tecnica, t.zona
    ORDER BY veces_exitosa DESC
    LIMIT 8
  `

  const victorias = combates.filter((c) => c.resultado === 'victoria').length
  const derrotas  = combates.filter((c) => c.resultado === 'derrota').length
  const empates   = combates.filter((c) => c.resultado === 'empate').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/rivales" className="text-gray-500 hover:text-gray-300 text-sm">← Rivales</Link>
          <h1 className="text-2xl font-bold mt-1">{rival.nombre}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {[rival.pais, rival.categoria_peso, rival.nivel].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Link
          href="/combates/nuevo"
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
        >
          + Registrar combate
        </Link>
      </div>

      {/* Stats de historial */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Combates', value: combates.length, color: 'text-white' },
          { label: 'Victorias', value: victorias, color: 'text-green-400' },
          { label: 'Derrotas', value: derrotas, color: 'text-red-400' },
          { label: 'Empates', value: empates, color: 'text-gray-400' },
          { label: 'Técnicas rival', value: tecnicasRival.length, color: 'text-yellow-400' },
          { label: 'Mis técnicas', value: tecnicasPropias.length, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Técnicas del rival */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider mb-4">
            Técnicas del rival
          </h2>
          {tecnicasRival.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin datos — registrá combates primero</p>
          ) : (
            <div className="space-y-3">
              {tecnicasRival.map((t) => (
                <div key={`${t.tecnica}-${t.zona}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      <span className="font-medium">{t.tecnica}</span>
                      <span className="text-gray-500 text-xs ml-2">{t.zona}</span>
                    </span>
                    <span className="text-gray-400 text-xs">
                      {t.veces_usada}x · <span className="text-yellow-400">{t.tasa_exito_pct}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${Math.min(t.tasa_exito_pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mis mejores técnicas vs este rival */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider mb-4">
            Mis técnicas efectivas
          </h2>
          {tecnicasPropias.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin datos — registrá combates primero</p>
          ) : (
            <div className="space-y-3">
              {tecnicasPropias.map((t) => (
                <div key={`${t.tecnica}-${t.zona}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      <span className="font-medium">{t.tecnica}</span>
                      <span className="text-gray-500 text-xs ml-2">{t.zona}</span>
                    </span>
                    <span className="text-gray-400 text-xs">
                      {t.veces_exitosa}/{t.veces_usada} · <span className="text-green-400">{t.tasa_exito_pct}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min(t.tasa_exito_pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historial de combates */}
      {combates.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider mb-4">
            Historial de combates
          </h2>
          <div className="space-y-2">
            {combates.map((c) => (
              <Link
                key={c.id}
                href={`/combates/${c.id}`}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    c.resultado === 'victoria' ? 'bg-green-400' :
                    c.resultado === 'derrota' ? 'bg-red-400' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm">{c.competencia}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">{String(c.fecha).slice(0, 10)}</span>
                  <span className="font-mono text-gray-300">{c.puntos_propios}–{c.puntos_rival}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notas del rival */}
      {rival.notas && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider mb-2">Notas</h2>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{rival.notas}</p>
        </div>
      )}

      {/* Módulo de Scouting + Gameplan IA */}
      <div>
        <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider mb-3 px-1">
          Scouting & Gameplan IA
        </h2>
        <ScoutingPanel
          rivalId={rival.id}
          rivalNombre={rival.nombre}
          totalCombates={combates.length}
          scoutingInicial={scouting ?? null}
        />
      </div>
    </div>
  )
}
