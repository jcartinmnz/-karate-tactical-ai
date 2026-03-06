'use client'

import { useState } from 'react'

interface Props {
  rivalId: string
  rivalNombre: string
  totalCombates: number
  gameplanExistente: string | null
  ultimaActualizacion: string | null
}

export default function GameplanGenerator({
  rivalId,
  rivalNombre,
  totalCombates,
  gameplanExistente,
  ultimaActualizacion,
}: Props) {
  const [gameplan, setGameplan] = useState(gameplanExistente)
  const [ultimaAct, setUltimaAct] = useState(ultimaActualizacion)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generarGameplan() {
    if (totalCombates === 0) {
      setError('Necesitás registrar al menos un combate contra este rival para generar el gameplan.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/scouting/gameplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rival_id: rivalId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al generar gameplan')

      setGameplan(data.data.gameplan)
      setUltimaAct(data.data.ultima_actualizacion)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-red-500">⚡</span> Gameplan IA
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Análisis táctico generado por GPT-4o basado en {totalCombates} combate{totalCombates !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={generarGameplan}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            loading
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : gameplan
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Analizando...
            </span>
          ) : gameplan ? 'Regenerar gameplan' : 'Generar gameplan'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-3/4" />
          <div className="h-4 bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-800 rounded w-5/6" />
          <div className="h-4 bg-gray-800 rounded w-2/3" />
          <div className="h-4 bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-800 rounded w-4/5" />
        </div>
      )}

      {!loading && gameplan && (
        <div>
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {gameplan}
            </div>
          </div>
          {ultimaAct && (
            <p className="text-xs text-gray-600 mt-4 text-right">
              Actualizado: {new Date(ultimaAct).toLocaleDateString('es-AR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          )}
        </div>
      )}

      {!loading && !gameplan && !error && (
        <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center text-gray-500">
          <p className="text-sm">
            {totalCombates === 0
              ? `Registrá al menos un combate contra ${rivalNombre} para habilitar el análisis IA.`
              : `Generá el gameplan táctico para enfrentar a ${rivalNombre}.`
            }
          </p>
        </div>
      )}
    </div>
  )
}
