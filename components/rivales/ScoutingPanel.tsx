'use client'

import { useState } from 'react'
import GameplanDisplay from './GameplanDisplay'

const TECNICAS_CATALOGO = [
  { nombre: 'gyaku-zuki', label: 'Gyaku-zuki', tipo: 'puñetazo' },
  { nombre: 'kizami-zuki', label: 'Kizami-zuki', tipo: 'puñetazo' },
  { nombre: 'uraken', label: 'Uraken', tipo: 'puñetazo' },
  { nombre: 'shuto-uchi', label: 'Shuto-uchi', tipo: 'puñetazo' },
  { nombre: 'mawashi-geri', label: 'Mawashi-geri', tipo: 'patada' },
  { nombre: 'yoko-geri', label: 'Yoko-geri', tipo: 'patada' },
  { nombre: 'ushiro-geri', label: 'Ushiro-geri', tipo: 'patada' },
  { nombre: 'ura-mawashi', label: 'Ura-mawashi', tipo: 'patada' },
  { nombre: 'tobi-geri', label: 'Tobi-geri', tipo: 'patada' },
  { nombre: 'ashi-barai', label: 'Ashi-barai', tipo: 'barrido' },
]

interface Props {
  rivalId: string
  rivalNombre: string
  totalCombates: number
  scoutingInicial: {
    notas_scouting?: string | null
    videos_referencia?: string[] | null
    gameplan?: string | null
    ultima_actualizacion?: string | null
  } | null
}

export default function ScoutingPanel({
  rivalId,
  rivalNombre,
  totalCombates,
  scoutingInicial,
}: Props) {
  const [notas, setNotas] = useState(scoutingInicial?.notas_scouting ?? '')
  const [videos, setVideos] = useState<string[]>(
    scoutingInicial?.videos_referencia?.length
      ? scoutingInicial.videos_referencia
      : ['']
  )
  const [gameplan, setGameplan] = useState(scoutingInicial?.gameplan ?? null)
  const [ultimaAct, setUltimaAct] = useState(scoutingInicial?.ultima_actualizacion ?? null)

  const [savingNotes, setSavingNotes] = useState(false)
  const [generatingGameplan, setGeneratingGameplan] = useState(false)
  const [error, setError] = useState('')
  const [savedOk, setSavedOk] = useState(false)
  const [panelAbierto, setPanelAbierto] = useState(!scoutingInicial?.notas_scouting && !scoutingInicial?.gameplan)

  function addVideo() {
    setVideos((v) => [...v, ''])
  }

  function updateVideo(idx: number, val: string) {
    setVideos((v) => v.map((u, i) => (i === idx ? val : u)))
  }

  function removeVideo(idx: number) {
    setVideos((v) => v.filter((_, i) => i !== idx))
  }

  async function guardarObservaciones() {
    setSavingNotes(true)
    setError('')
    setSavedOk(false)

    const videosValidos = videos.filter((v) => v.trim() !== '')

    try {
      const res = await fetch('/api/scouting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rival_id: rivalId,
          notas_scouting: notas.trim() || undefined,
          videos_referencia: videosValidos,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSavingNotes(false)
    }
  }

  async function generarGameplan() {
    setGeneratingGameplan(true)
    setError('')

    try {
      // Guardar notas primero si hay contenido
      const videosValidos = videos.filter((v) => v.trim() !== '')
      if (notas.trim() || videosValidos.length > 0) {
        await fetch('/api/scouting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rival_id: rivalId,
            notas_scouting: notas.trim() || undefined,
            videos_referencia: videosValidos,
          }),
        })
      }

      const res = await fetch('/api/scouting/gameplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rival_id: rivalId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al generar gameplan')

      setGameplan(data.data.gameplan)
      setUltimaAct(data.data.ultima_actualizacion)
      setPanelAbierto(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setGeneratingGameplan(false)
    }
  }

  const tieneContenido = notas.trim() || videos.some((v) => v.trim())
  const puedeGenerar = tieneContenido || totalCombates > 0

  return (
    <div className="space-y-4">
      {/* Sección de ingreso de observaciones */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setPanelAbierto((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-blue-400 text-lg">🎥</span>
            <div className="text-left">
              <h2 className="font-semibold text-base">Observaciones de scouting</h2>
              <p className="text-gray-400 text-xs mt-0.5">
                {scoutingInicial?.notas_scouting
                  ? 'Notas guardadas — clic para editar'
                  : 'Ingresá videos o notas sobre este rival'}
              </p>
            </div>
          </div>
          <span className={`text-gray-500 transition-transform ${panelAbierto ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {panelAbierto && (
          <div className="px-6 pb-6 space-y-5 border-t border-gray-800">
            {/* Videos de referencia */}
            <div className="pt-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Videos de referencia
                <span className="text-gray-500 font-normal ml-2">(YouTube, competencias, etc.)</span>
              </label>
              <div className="space-y-2">
                {videos.map((url, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateVideo(idx, e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    {videos.length > 1 && (
                      <button
                        onClick={() => removeVideo(idx)}
                        className="px-3 py-2 text-gray-500 hover:text-red-400 transition-colors text-sm"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addVideo}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                + Agregar otro video
              </button>
            </div>

            {/* Observaciones / notas libres */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Observaciones del rival
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={6}
                placeholder={`Describí lo que observaste del rival. Ejemplos:
• Prefiere atacar con mawashi-geri jodan desde larga distancia
• Débil en la defensa del chudan lado derecho
• Se apoya hacia adelante al contraatacar
• Pérdida de ritmo en el último tercio del combate
• Reacciona tarde a las patadas laterales`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
              />
              <p className="text-xs text-gray-600 mt-1">{notas.length} caracteres</p>
            </div>

            {/* Acciones */}
            {error && (
              <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={guardarObservaciones}
                disabled={savingNotes || (!notas.trim() && !videos.some((v) => v.trim()))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  savingNotes || (!notas.trim() && !videos.some((v) => v.trim()))
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                }`}
              >
                {savingNotes ? 'Guardando...' : savedOk ? '✓ Guardado' : 'Guardar observaciones'}
              </button>

              <button
                onClick={generarGameplan}
                disabled={generatingGameplan || !puedeGenerar}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  generatingGameplan
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : !puedeGenerar
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {generatingGameplan ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Analizando con IA...
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    {gameplan ? 'Regenerar gameplan' : 'Generar gameplan IA'}
                  </>
                )}
              </button>

              {!puedeGenerar && (
                <p className="text-xs text-gray-500">
                  Agregá notas o registrá un combate para habilitar el análisis IA
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Gameplan Display */}
      {(gameplan || generatingGameplan) && (
        <GameplanDisplay
          gameplan={gameplan}
          rivalNombre={rivalNombre}
          ultimaActualizacion={ultimaAct}
          loading={generatingGameplan}
          totalCombates={totalCombates}
          tieneNotas={!!notas.trim()}
          onRegenerar={() => setPanelAbierto(true)}
        />
      )}

      {/* Empty state cuando no hay gameplan ni está generando */}
      {!gameplan && !generatingGameplan && (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-8 text-center">
          <p className="text-3xl mb-3">🥋</p>
          <p className="text-gray-400 text-sm font-medium mb-1">Sin gameplan generado aún</p>
          <p className="text-gray-600 text-xs">
            {puedeGenerar
              ? `Usá el botón "Generar gameplan IA" para analizar a ${rivalNombre}`
              : `Agregá observaciones de scouting o registrá combates contra ${rivalNombre}`
            }
          </p>
        </div>
      )}
    </div>
  )
}
