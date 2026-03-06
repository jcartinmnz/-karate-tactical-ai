import { sql } from '@/lib/db'
import Link from 'next/link'
import TacticaCard from '@/components/tacticas/TacticaCard'

export const dynamic = 'force-dynamic'

interface Paso {
  orden: number
  accion: string
  intencion?: string
}

interface Tactica {
  id: string
  nombre: string
  descripcion?: string | null
  secuencia: Paso[]
  tipo: 'combinacion' | 'intercepcion' | 'finta' | 'contraataque'
  efectividad: number
  intentos: number
  notas?: string | null
}

const TIPO_FILTROS = [
  { valor: '',             label: 'Todas' },
  { valor: 'combinacion',  label: 'Combinación' },
  { valor: 'intercepcion', label: 'Intercepción' },
  { valor: 'finta',        label: 'Finta' },
  { valor: 'contraataque', label: 'Contraataque' },
]

export default async function TacticasPage({
  searchParams,
}: {
  searchParams: { tipo?: string }
}) {
  const tipoFiltro = searchParams.tipo ?? ''

  const tacticas = tipoFiltro
    ? await sql`SELECT * FROM tacticas_combate WHERE tipo = ${tipoFiltro} ORDER BY created_at DESC`
    : await sql`SELECT * FROM tacticas_combate ORDER BY created_at DESC`

  const totalIntentos = (tacticas as Tactica[]).reduce((s, t) => s + t.intentos, 0)
  const totalExitosas = (tacticas as Tactica[]).reduce((s, t) => s + t.efectividad, 0)
  const pctGlobal = totalIntentos > 0 ? Math.round((totalExitosas / totalIntentos) * 100) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tácticas de Combate</h1>
          <p className="text-gray-400 text-sm mt-1">
            {tacticas.length === 0
              ? 'Sin tácticas registradas aún'
              : `${tacticas.length} táctica${tacticas.length !== 1 ? 's' : ''} en el arsenal${
                  pctGlobal !== null
                    ? ` · ${pctGlobal}% efectividad global (${totalIntentos} usos)`
                    : ''
                }`
            }
          </p>
        </div>
        <Link
          href="/tacticas/nuevo"
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
        >
          + Nueva táctica
        </Link>
      </div>

      {/* Stats rápidas */}
      {tacticas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total tácticas', value: tacticas.length, color: 'text-white' },
            { label: 'Total usos', value: totalIntentos, color: 'text-blue-400' },
            { label: 'Veces exitosas', value: totalExitosas, color: 'text-green-400' },
            { label: 'Efectividad global', value: pctGlobal !== null ? `${pctGlobal}%` : '—', color: pctGlobal !== null && pctGlobal >= 50 ? 'text-green-400' : 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros por tipo */}
      {tacticas.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {TIPO_FILTROS.map(f => (
            <Link
              key={f.valor}
              href={f.valor ? `/tacticas?tipo=${f.valor}` : '/tacticas'}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                tipoFiltro === f.valor
                  ? 'bg-red-700 border-red-600 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      )}

      {/* Lista */}
      {tacticas.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-800 rounded-xl">
          <p className="text-4xl mb-4">🥋</p>
          <p className="text-gray-400 font-medium">Sin tácticas registradas</p>
          <p className="text-gray-600 text-sm mt-1 mb-6">
            Registrá tus combinaciones, intercepciones y fintas para trackear su efectividad
          </p>
          <Link
            href="/tacticas/nuevo"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
          >
            Crear primera táctica
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(tacticas as Tactica[]).map(t => (
            <TacticaCard key={t.id} tactica={t} />
          ))}
        </div>
      )}
    </div>
  )
}
