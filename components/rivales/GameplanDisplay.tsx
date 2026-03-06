'use client'

import { useState } from 'react'

interface Props {
  gameplan: string | null
  rivalNombre: string
  ultimaActualizacion: string | null
  loading: boolean
  totalCombates: number
  tieneNotas: boolean
  onRegenerar: () => void
}

// Parsea el gameplan en secciones basadas en encabezados ##
function parseSecciones(text: string): { titulo: string; contenido: string }[] {
  const lineas = text.split('\n')
  const secciones: { titulo: string; contenido: string }[] = []
  let seccionActual: { titulo: string; contenido: string } | null = null

  for (const linea of lineas) {
    if (linea.startsWith('## ')) {
      if (seccionActual) secciones.push(seccionActual)
      seccionActual = { titulo: linea.replace('## ', '').trim(), contenido: '' }
    } else if (linea.startsWith('# ')) {
      if (seccionActual) secciones.push(seccionActual)
      seccionActual = { titulo: linea.replace('# ', '').trim(), contenido: '' }
    } else if (seccionActual) {
      seccionActual.contenido += linea + '\n'
    }
  }
  if (seccionActual) secciones.push(seccionActual)

  // Si no hay secciones detectadas, devolver el texto completo como una sola sección
  if (secciones.length === 0) {
    return [{ titulo: 'Análisis táctico', contenido: text }]
  }

  return secciones
}

const SECCION_ICONS: Record<string, string> = {
  'PERFIL TÁCTICO': '🥋',
  'PATRONES DE ATAQUE': '⚔️',
  'DEBILIDADES A EXPLOTAR': '🎯',
  'FORTALEZAS A NEUTRALIZAR': '🛡️',
  'GAMEPLAN': '📋',
}

const SECCION_COLORS: Record<string, string> = {
  'PERFIL TÁCTICO': 'border-blue-700 bg-blue-950/30',
  'PATRONES DE ATAQUE': 'border-orange-700 bg-orange-950/30',
  'DEBILIDADES A EXPLOTAR': 'border-green-700 bg-green-950/30',
  'FORTALEZAS A NEUTRALIZAR': 'border-yellow-700 bg-yellow-950/30',
  'GAMEPLAN': 'border-red-700 bg-red-950/30',
}

function SeccionCard({ titulo, contenido }: { titulo: string; contenido: string }) {
  const icon = SECCION_ICONS[titulo] ?? '📌'
  const colorClass = SECCION_COLORS[titulo] ?? 'border-gray-700 bg-gray-800/30'

  // Formatear el contenido: negrita con **, listas con -/•
  const lineas = contenido.trim().split('\n').filter((l) => l.trim() !== '')

  return (
    <div className={`border rounded-xl p-5 ${colorClass}`}>
      <h3 className="font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
        <span>{icon}</span>
        <span>{titulo}</span>
      </h3>
      <div className="space-y-1.5">
        {lineas.map((linea, i) => {
          const esListItem = linea.trim().startsWith('-') || linea.trim().startsWith('•') || linea.trim().startsWith('*')
          const texto = linea.trim().replace(/^[-•*]\s*/, '')

          // Aplicar negrita a texto entre **
          const partes = texto.split(/\*\*(.*?)\*\*/g)
          const rendered = partes.map((p, j) =>
            j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{p}</strong> : p
          )

          if (esListItem) {
            return (
              <div key={i} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
                <span className="text-gray-500 mt-0.5 shrink-0">•</span>
                <span>{rendered}</span>
              </div>
            )
          }

          return (
            <p key={i} className="text-sm text-gray-300 leading-relaxed">
              {rendered}
            </p>
          )
        })}
      </div>
    </div>
  )
}

export default function GameplanDisplay({
  gameplan,
  rivalNombre,
  ultimaActualizacion,
  loading,
  totalCombates,
  tieneNotas,
  onRegenerar,
}: Props) {
  const [copied, setCopied] = useState(false)

  async function copiarGameplan() {
    if (!gameplan) return
    await navigator.clipboard.writeText(gameplan)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const secciones = gameplan ? parseSecciones(gameplan) : []
  const fuenteDatos = [
    totalCombates > 0 && `${totalCombates} combate${totalCombates !== 1 ? 's' : ''}`,
    tieneNotas && 'observaciones de scouting',
  ].filter(Boolean).join(' + ')

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <h2 className="font-bold text-base flex items-center gap-2">
            <span className="text-red-500">⚡</span>
            Gameplan IA — {rivalNombre}
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {fuenteDatos ? `Basado en ${fuenteDatos}` : 'Análisis táctico generado por GPT-4o'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {gameplan && (
            <button
              onClick={copiarGameplan}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          )}
          <button
            onClick={onRegenerar}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
          >
            Regenerar
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {loading && (
          <div className="space-y-4">
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-1/3" />
              <div className="h-3 bg-gray-800 rounded w-full" />
              <div className="h-3 bg-gray-800 rounded w-5/6" />
              <div className="h-3 bg-gray-800 rounded w-4/5" />
            </div>
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-1/4" />
              <div className="h-3 bg-gray-800 rounded w-full" />
              <div className="h-3 bg-gray-800 rounded w-3/4" />
            </div>
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-2/5" />
              <div className="h-3 bg-gray-800 rounded w-full" />
              <div className="h-3 bg-gray-800 rounded w-5/6" />
              <div className="h-3 bg-gray-800 rounded w-2/3" />
              <div className="h-3 bg-gray-800 rounded w-full" />
            </div>
            <p className="text-center text-gray-500 text-xs pt-2">
              GPT-4o está analizando el perfil táctico...
            </p>
          </div>
        )}

        {!loading && secciones.length > 0 && (
          <div className="space-y-4">
            {secciones.map((s) => (
              <SeccionCard key={s.titulo} titulo={s.titulo} contenido={s.contenido} />
            ))}
            {ultimaActualizacion && (
              <p className="text-xs text-gray-600 text-right pt-1">
                Generado:{' '}
                {new Date(ultimaActualizacion).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
