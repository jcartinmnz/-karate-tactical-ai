'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Rival, Zona, TipoTecnica, Ejecutor } from '@/types'

interface TacticaItem {
  id: string
  nombre: string
  tipo: string
  secuencia: { orden: number; accion: string }[]
}

interface TacticaUsada {
  tactica_id: string
  exitosa: boolean | null
}

const TECNICAS = [
  { nombre: 'gyaku-zuki',   nombre_es: 'Gyaku-zuki (Puñetazo inverso)', tipo: 'ataque',       zonas: ['jodan','chudan'], puntos: 1 },
  { nombre: 'kizami-zuki',  nombre_es: 'Kizami-zuki (Jab)',             tipo: 'ataque',       zonas: ['jodan','chudan'], puntos: 1 },
  { nombre: 'uraken',       nombre_es: 'Uraken (Revés de puño)',        tipo: 'ataque',       zonas: ['jodan'],          puntos: 1 },
  { nombre: 'shuto-uchi',   nombre_es: 'Shuto-uchi (Canto de mano)',    tipo: 'ataque',       zonas: ['jodan','chudan'], puntos: 1 },
  { nombre: 'mawashi-geri', nombre_es: 'Mawashi-geri (Circular)',       tipo: 'ataque',       zonas: ['jodan','chudan'], puntos: 2 },
  { nombre: 'yoko-geri',    nombre_es: 'Yoko-geri (Lateral)',           tipo: 'ataque',       zonas: ['jodan','chudan'], puntos: 2 },
  { nombre: 'ushiro-geri',  nombre_es: 'Ushiro-geri (Trasera)',         tipo: 'ataque',       zonas: ['chudan'],         puntos: 2 },
  { nombre: 'ura-mawashi',  nombre_es: 'Ura-mawashi (Circular inv.)',   tipo: 'ataque',       zonas: ['jodan'],          puntos: 3 },
  { nombre: 'tobi-geri',    nombre_es: 'Tobi-geri (Saltando)',          tipo: 'ataque',       zonas: ['jodan','chudan'], puntos: 3 },
  { nombre: 'ashi-barai',   nombre_es: 'Ashi-barai (Barrido)',          tipo: 'barrido',      zonas: ['gedan'],          puntos: 1 },
  { nombre: 'gyaku-zuki-c', nombre_es: 'Contra-gyaku-zuki',            tipo: 'contraataque', zonas: ['jodan','chudan'], puntos: 1 },
  { nombre: 'mawashi-c',    nombre_es: 'Contra-mawashi',               tipo: 'contraataque', zonas: ['jodan','chudan'], puntos: 2 },
]

interface TecnicaEntry {
  tecnica: string
  zona: Zona
  tipo: TipoTecnica
  puntos: number
  exitosa: boolean
  ronda: number
  ejecutor: Ejecutor
}

export default function NuevoCombatePage() {
  const router = useRouter()
  const [rivales, setRivales] = useState<Rival[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Datos del combate
  const [rivalId, setRivalId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [competencia, setCompetencia] = useState('')
  const [resultado, setResultado] = useState<'victoria' | 'derrota' | 'empate'>('victoria')
  const [puntosPropios, setPuntosPropios] = useState(0)
  const [puntosRival, setPuntosRival] = useState(0)
  const [notas, setNotas] = useState('')

  // Tácticas del catálogo
  const [tacticasCatalogo, setTacticasCatalogo] = useState<TacticaItem[]>([])
  const [tacticasUsadas, setTacticasUsadas] = useState<TacticaUsada[]>([])

  // Técnicas
  const [tecnicas, setTecnicas] = useState<TecnicaEntry[]>([])
  const [tecnicaSeleccionada, setTecnicaSeleccionada] = useState(TECNICAS[0].nombre)
  const [zonaSeleccionada, setZonaSeleccionada] = useState<Zona>('chudan')
  const [rondaSeleccionada, setRondaSeleccionada] = useState(1)
  const [ejecutorSeleccionado, setEjecutorSeleccionado] = useState<Ejecutor>('propio')
  const [exitosaSeleccionada, setExitosaSeleccionada] = useState(true)

  useEffect(() => {
    fetch('/api/rivales')
      .then(r => r.json())
      .then(d => setRivales(d.data ?? []))
    fetch('/api/tacticas')
      .then(r => r.json())
      .then(d => setTacticasCatalogo(d.data ?? []))
  }, [])

  const tecnicaInfo = TECNICAS.find(t => t.nombre === tecnicaSeleccionada)!

  function agregarTecnica() {
    const zonasValidas = tecnicaInfo.zonas as Zona[]
    const zonaFinal = zonasValidas.includes(zonaSeleccionada) ? zonaSeleccionada : zonasValidas[0]

    const nueva: TecnicaEntry = {
      tecnica: tecnicaSeleccionada,
      zona: zonaFinal,
      tipo: tecnicaInfo.tipo as TipoTecnica,
      puntos: exitosaSeleccionada ? (ejecutorSeleccionado === 'propio' ? tecnicaInfo.puntos : -tecnicaInfo.puntos) : 0,
      exitosa: exitosaSeleccionada,
      ronda: rondaSeleccionada,
      ejecutor: ejecutorSeleccionado,
    }
    setTecnicas(prev => [...prev, nueva])

    // Auto-actualizar marcador
    if (exitosaSeleccionada) {
      if (ejecutorSeleccionado === 'propio') setPuntosPropios(p => p + tecnicaInfo.puntos)
      else setPuntosRival(p => p + tecnicaInfo.puntos)
    }
  }

  function toggleTactica(id: string) {
    setTacticasUsadas(prev => {
      const existe = prev.find(t => t.tactica_id === id)
      if (existe) return prev.filter(t => t.tactica_id !== id)
      return [...prev, { tactica_id: id, exitosa: null }]
    })
  }

  function setExitosaTactica(id: string, exitosa: boolean | null) {
    setTacticasUsadas(prev =>
      prev.map(t => t.tactica_id === id ? { ...t, exitosa } : t)
    )
  }

  function eliminarTecnica(idx: number) {
    const t = tecnicas[idx]
    if (t.exitosa) {
      if (t.ejecutor === 'propio') setPuntosPropios(p => Math.max(0, p - Math.abs(t.puntos)))
      else setPuntosRival(p => Math.max(0, p - Math.abs(t.puntos)))
    }
    setTecnicas(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rivalId) { setError('Seleccioná un rival'); return }
    if (!competencia) { setError('Ingresá la competencia'); return }

    setLoading(true)
    setError('')

    try {
      // 1. Crear el combate
      const combateRes = await fetch('/api/combates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rival_id: rivalId,
          fecha,
          competencia,
          resultado,
          puntos_propios: puntosPropios,
          puntos_rival: puntosRival,
          notas: notas || undefined,
        }),
      })

      const combateData = await combateRes.json()
      if (!combateRes.ok) throw new Error(combateData.error || 'Error al crear combate')

      const combateId = combateData.data.id

      // 2. Guardar tácticas usadas si hay
      if (tacticasUsadas.length > 0) {
        await fetch('/api/combate-tacticas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ combate_id: combateId, tacticas: tacticasUsadas }),
        })
      }

      // 3. Registrar técnicas si hay
      if (tecnicas.length > 0) {
        const tecnicasPayload = tecnicas.map(t => ({ ...t, combate_id: combateId }))
        const tecRes = await fetch('/api/tecnicas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tecnicasPayload),
        })
        if (!tecRes.ok) {
          const tecData = await tecRes.json()
          throw new Error(tecData.error || 'Error al guardar técnicas')
        }
      }

      router.push(`/combates/${combateId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const propias = tecnicas.filter(t => t.ejecutor === 'propio')
  const delRival = tecnicas.filter(t => t.ejecutor === 'rival')

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Registrar Combate</h1>
        <p className="text-gray-400 text-sm mt-1">Completá los datos del combate y agregá las técnicas usadas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* — Datos del combate — */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-200">Datos del combate</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rival *</label>
              <select
                value={rivalId}
                onChange={e => setRivalId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              >
                <option value="">Seleccioná un rival...</option>
                {rivales.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre} {r.pais ? `(${r.pais})` : ''}</option>
                ))}
              </select>
              {rivales.length === 0 && (
                <p className="text-xs text-yellow-500 mt-1">
                  No hay rivales. <a href="/rivales/nuevo" className="underline">Creá uno primero →</a>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Fecha *</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Competencia *</label>
              <input
                type="text"
                value={competencia}
                onChange={e => setCompetencia(e.target.value)}
                placeholder="ej: Torneo Nacional 2025, Copa Regional..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Resultado y marcador */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Resultado *</label>
            <div className="flex gap-3">
              {(['victoria', 'empate', 'derrota'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setResultado(r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    resultado === r
                      ? r === 'victoria' ? 'bg-green-700 border-green-500 text-white'
                        : r === 'derrota' ? 'bg-red-800 border-red-600 text-white'
                        : 'bg-gray-600 border-gray-400 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Mis puntos</label>
              <input
                type="number"
                min={0}
                value={puntosPropios}
                onChange={e => setPuntosPropios(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 text-center font-mono text-lg"
              />
            </div>
            <span className="text-gray-500 text-2xl mt-4">–</span>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Puntos del rival</label>
              <input
                type="number"
                min={0}
                value={puntosRival}
                onChange={e => setPuntosRival(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 text-center font-mono text-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Notas del combate</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              placeholder="Observaciones tácticas, contexto, condiciones..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 resize-none"
            />
          </div>
        </section>

        {/* — Registro de técnicas — */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-200">Técnicas del combate</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Técnica</label>
              <select
                value={tecnicaSeleccionada}
                onChange={e => {
                  setTecnicaSeleccionada(e.target.value)
                  const info = TECNICAS.find(t => t.nombre === e.target.value)!
                  setZonaSeleccionada(info.zonas[0] as Zona)
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              >
                {TECNICAS.map(t => (
                  <option key={t.nombre} value={t.nombre}>{t.nombre_es}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Zona</label>
              <select
                value={zonaSeleccionada}
                onChange={e => setZonaSeleccionada(e.target.value as Zona)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              >
                {tecnicaInfo.zonas.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Ronda</label>
              <select
                value={rondaSeleccionada}
                onChange={e => setRondaSeleccionada(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              >
                <option value={1}>Ronda 1</option>
                <option value={2}>Ronda 2</option>
                <option value={3}>Ronda 3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Ejecutor</label>
              <div className="flex gap-2">
                {(['propio', 'rival'] as Ejecutor[]).map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEjecutorSeleccionado(e)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      ejecutorSeleccionado === e
                        ? 'bg-red-700 border-red-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    {e === 'propio' ? 'Yo' : 'Rival'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">¿Anotó punto?</label>
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setExitosaSeleccionada(v)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      exitosaSeleccionada === v
                        ? v ? 'bg-green-700 border-green-500 text-white' : 'bg-gray-600 border-gray-400 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    {v ? `Sí (+${tecnicaInfo.puntos}pts)` : 'No'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={agregarTecnica}
            className="w-full py-2 border border-dashed border-gray-600 rounded-lg text-sm text-gray-400 hover:border-red-500 hover:text-red-400 transition-colors"
          >
            + Agregar técnica
          </button>

          {/* Lista de técnicas agregadas */}
          {tecnicas.length > 0 && (
            <div className="space-y-3 mt-2">
              {/* Propias */}
              {propias.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Mis técnicas ({propias.length})</p>
                  <div className="space-y-1">
                    {tecnicas.map((t, i) => t.ejecutor !== 'propio' ? null : (
                      <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${t.exitosa ? 'bg-green-400' : 'bg-gray-500'}`} />
                          <span className="font-medium">{t.tecnica}</span>
                          <span className="text-gray-500 text-xs">{t.zona} · R{t.ronda}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {t.exitosa && <span className="text-green-400 text-xs font-mono">+{t.puntos}pts</span>}
                          <button type="button" onClick={() => eliminarTecnica(i)} className="text-gray-600 hover:text-red-400 transition-colors text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Del rival */}
              {delRival.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Técnicas del rival ({delRival.length})</p>
                  <div className="space-y-1">
                    {tecnicas.map((t, i) => t.ejecutor !== 'rival' ? null : (
                      <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${t.exitosa ? 'bg-red-400' : 'bg-gray-500'}`} />
                          <span className="font-medium">{t.tecnica}</span>
                          <span className="text-gray-500 text-xs">{t.zona} · R{t.ronda}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {t.exitosa && <span className="text-red-400 text-xs font-mono">+{Math.abs(t.puntos)}pts</span>}
                          <button type="button" onClick={() => eliminarTecnica(i)} className="text-gray-600 hover:text-red-400 transition-colors text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* — Tácticas usadas — */}
        {tacticasCatalogo.length > 0 && (
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-200">Tácticas usadas en este combate</h2>
              <p className="text-gray-500 text-xs mt-0.5">Marcá las que intentaste y si funcionaron</p>
            </div>
            <div className="space-y-2">
              {tacticasCatalogo.map(t => {
                const usada = tacticasUsadas.find(u => u.tactica_id === t.id)
                return (
                  <div
                    key={t.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      usada
                        ? 'border-red-700 bg-red-900/20'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleTactica(t.id)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          usada ? 'bg-red-600 border-red-500' : 'border-gray-600'
                        }`}>
                          {usada && <span className="text-white text-xs">✓</span>}
                        </span>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-200">{t.nombre}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {t.secuencia.map(p => p.accion).join(' → ')}
                          </span>
                        </div>
                      </button>

                      {usada && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setExitosaTactica(t.id, true)}
                            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                              usada.exitosa === true
                                ? 'bg-green-700 border-green-500 text-white'
                                : 'border-gray-600 text-gray-400 hover:border-green-600 hover:text-green-400'
                            }`}
                          >
                            Funcionó
                          </button>
                          <button
                            type="button"
                            onClick={() => setExitosaTactica(t.id, false)}
                            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                              usada.exitosa === false
                                ? 'bg-gray-600 border-gray-500 text-white'
                                : 'border-gray-600 text-gray-400 hover:border-gray-500'
                            }`}
                          >
                            No funcionó
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {tacticasUsadas.length > 0 && (
              <p className="text-xs text-gray-500">
                {tacticasUsadas.length} táctica{tacticasUsadas.length !== 1 ? 's' : ''} seleccionada{tacticasUsadas.length !== 1 ? 's' : ''} ·{' '}
                {tacticasUsadas.filter(t => t.exitosa === true).length} funcionaron
              </p>
            )}
          </section>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar combate'}
          </button>
        </div>
      </form>
    </div>
  )
}
