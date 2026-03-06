'use client'

import { useState } from 'react'

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

const TIPO_LABELS: Record<string, { label: string; color: string }> = {
  combinacion:  { label: 'Combinación',  color: 'bg-blue-900/50 text-blue-300 border-blue-700' },
  intercepcion: { label: 'Intercepción', color: 'bg-orange-900/50 text-orange-300 border-orange-700' },
  finta:        { label: 'Finta',        color: 'bg-purple-900/50 text-purple-300 border-purple-700' },
  contraataque: { label: 'Contraataque', color: 'bg-green-900/50 text-green-300 border-green-700' },
}

export default function TacticaCard({ tactica }: { tactica: Tactica }) {
  const [intentos, setIntentos] = useState(tactica.intentos)
  const [efectividad, setEfectividad] = useState(tactica.efectividad)
  const [loading, setLoading] = useState<'uso' | 'exitosa' | null>(null)
  const [feedback, setFeedback] = useState<'uso' | 'exitosa' | null>(null)

  const pct = intentos > 0 ? Math.round((efectividad / intentos) * 100) : null
  const tipo = TIPO_LABELS[tactica.tipo] ?? { label: tactica.tipo, color: 'bg-gray-800 text-gray-300 border-gray-700' }

  async function registrarUso(exitosa: boolean) {
    const key = exitosa ? 'exitosa' : 'uso'
    setLoading(key)
    try {
      const res = await fetch(`/api/tacticas/${tactica.id}/usar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exitosa }),
      })
      const data = await res.json()
      if (res.ok) {
        setIntentos(data.data.intentos)
        setEfectividad(data.data.efectividad)
        setFeedback(key)
        setTimeout(() => setFeedback(null), 2000)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base text-white">{tactica.nombre}</h3>
            <span className={`text-xs px-2 py-0.5 rounded border ${tipo.color}`}>
              {tipo.label}
            </span>
          </div>
          {tactica.descripcion && (
            <p className="text-gray-400 text-sm mt-1">{tactica.descripcion}</p>
          )}
        </div>
        {/* Efectividad */}
        <div className="text-right shrink-0">
          {pct !== null ? (
            <>
              <p className={`text-2xl font-bold ${pct >= 60 ? 'text-green-400' : pct >= 35 ? 'text-yellow-400' : 'text-red-400'}`}>
                {pct}%
              </p>
              <p className="text-xs text-gray-500">{efectividad}/{intentos} veces</p>
            </>
          ) : (
            <p className="text-gray-600 text-sm">Sin datos</p>
          )}
        </div>
      </div>

      {/* Secuencia visual */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tactica.secuencia.map((paso, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="group relative">
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
                <span className="text-gray-500 text-xs mr-1.5">{paso.orden}.</span>
                <span className="text-gray-200 font-medium">{paso.accion}</span>
              </div>
              {paso.intencion && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10">
                  <div className="bg-gray-700 text-gray-200 text-xs rounded px-2 py-1 whitespace-nowrap">
                    {paso.intencion}
                  </div>
                </div>
              )}
            </div>
            {i < tactica.secuencia.length - 1 && (
              <span className="text-red-600 text-sm font-bold">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Barra de efectividad */}
      {pct !== null && (
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 60 ? 'bg-green-500' : pct >= 35 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {tactica.notas && (
        <p className="text-xs text-gray-500 italic border-l-2 border-gray-700 pl-3">{tactica.notas}</p>
      )}

      {/* Acciones rápidas */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => registrarUso(false)}
          disabled={loading !== null}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
            feedback === 'uso'
              ? 'bg-gray-700 border-gray-500 text-gray-200'
              : loading === 'uso'
              ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
          }`}
        >
          {feedback === 'uso' ? '✓ Registrado' : loading === 'uso' ? '...' : 'Usé esta táctica'}
        </button>
        <button
          onClick={() => registrarUso(true)}
          disabled={loading !== null}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
            feedback === 'exitosa'
              ? 'bg-green-700 border-green-500 text-white'
              : loading === 'exitosa'
              ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-800 border-green-800 text-green-400 hover:bg-green-900/40 hover:border-green-600'
          }`}
        >
          {feedback === 'exitosa' ? '✓ Anotado' : loading === 'exitosa' ? '...' : '✓ Funcionó'}
        </button>
      </div>
    </div>
  )
}
