'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Tipo = 'combinacion' | 'intercepcion' | 'finta' | 'contraataque'

interface Paso {
  orden: number
  accion: string
  intencion: string
}

const ACCIONES_CATALOGO = [
  { grupo: 'Puñetazos', opciones: [
    { valor: 'gyaku-zuki', label: 'Gyaku-zuki (Inverso)' },
    { valor: 'kizami-zuki', label: 'Kizami-zuki (Jab)' },
    { valor: 'uraken', label: 'Uraken (Revés)' },
    { valor: 'shuto-uchi', label: 'Shuto-uchi (Canto)' },
  ]},
  { grupo: 'Patadas', opciones: [
    { valor: 'mawashi-geri jodan', label: 'Mawashi-geri jodan' },
    { valor: 'mawashi-geri chudan', label: 'Mawashi-geri chudan' },
    { valor: 'yoko-geri', label: 'Yoko-geri (Lateral)' },
    { valor: 'ushiro-geri', label: 'Ushiro-geri (Trasera)' },
    { valor: 'ura-mawashi', label: 'Ura-mawashi (Inversa jodan)' },
    { valor: 'tobi-geri', label: 'Tobi-geri (Saltando)' },
    { valor: 'mae-geri', label: 'Mae-geri (Delantera)' },
    { valor: 'pierna delantera', label: 'Patada pierna delantera' },
  ]},
  { grupo: 'Contraataques', opciones: [
    { valor: 'gyaku-zuki contraataque', label: 'Gyaku-zuki en contra' },
    { valor: 'mawashi-geri contraataque', label: 'Mawashi-geri en contra' },
  ]},
  { grupo: 'Acciones tácticas', opciones: [
    { valor: 'finta / amague', label: 'Finta / amague' },
    { valor: 'intercepción de pierna (turco)', label: 'Intercepción de pierna (turco)' },
    { valor: 'intercepción de brazo', label: 'Intercepción de brazo' },
    { valor: 'avance-enganche', label: 'Avance-enganche' },
    { valor: 'barrido (ashi-barai)', label: 'Barrido (ashi-barai)' },
    { valor: 'presión / empuje', label: 'Presión / empuje' },
    { valor: 'fintar distancia', label: 'Fintar distancia' },
    { valor: 'hacer botar técnica rival', label: 'Hacer botar técnica rival' },
  ]},
]

const TIPO_OPCIONES: { valor: Tipo; label: string; desc: string }[] = [
  { valor: 'combinacion',  label: 'Combinación',  desc: 'Secuencia de ataques encadenados' },
  { valor: 'intercepcion', label: 'Intercepción', desc: 'Atacar cuando el rival inicia' },
  { valor: 'finta',        label: 'Finta',        desc: 'Engañar para crear apertura' },
  { valor: 'contraataque', label: 'Contraataque', desc: 'Responder al ataque del rival' },
]

export default function NuevaTacticaPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipo, setTipo] = useState<Tipo>('combinacion')
  const [notas, setNotas] = useState('')
  const [pasos, setPasos] = useState<Paso[]>([])

  // Estado del constructor de paso
  const [accionSeleccionada, setAccionSeleccionada] = useState('')
  const [accionCustom, setAccionCustom] = useState('')
  const [intencion, setIntencion] = useState('')
  const [usarCustom, setUsarCustom] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function agregarPaso() {
    const accion = usarCustom ? accionCustom.trim() : accionSeleccionada
    if (!accion) return

    const nuevoPaso: Paso = {
      orden: pasos.length + 1,
      accion,
      intencion: intencion.trim(),
    }
    setPasos(prev => [...prev, nuevoPaso])
    setAccionSeleccionada('')
    setAccionCustom('')
    setIntencion('')
    setUsarCustom(false)
  }

  function eliminarPaso(idx: number) {
    setPasos(prev =>
      prev
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, orden: i + 1 }))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError('Ingresá un nombre para la táctica'); return }
    if (pasos.length === 0) { setError('Agregá al menos un paso a la secuencia'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/tacticas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          tipo,
          secuencia: pasos,
          notas: notas.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? data.error ?? 'Error al guardar')

      window.location.href = '/tacticas'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const puedeAgregarPaso = pasos.length < 4 && (usarCustom ? accionCustom.trim() !== '' : accionSeleccionada !== '')

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <a href="/tacticas" className="text-gray-500 hover:text-gray-300 text-sm">← Tácticas</a>
        <h1 className="text-2xl font-bold mt-1">Nueva táctica</h1>
        <p className="text-gray-400 text-sm mt-1">Registrá una secuencia táctica para tu arsenal de combate</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Nombre y tipo */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombre de la táctica *</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="ej: Gyaku en intercepción + mawashi"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Tipo de táctica *</label>
            <div className="grid grid-cols-2 gap-2">
              {TIPO_OPCIONES.map(opt => (
                <button
                  key={opt.valor}
                  type="button"
                  onClick={() => setTipo(opt.valor)}
                  className={`p-3 rounded-lg text-left border transition-colors ${
                    tipo === opt.valor
                      ? 'border-red-600 bg-red-900/30 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="ej: Intercepción con pierna + seguimiento de puño"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </section>

        {/* Constructor de secuencia */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-200">Secuencia de acciones</h2>
              <p className="text-gray-500 text-xs mt-0.5">Agregá entre 1 y 4 pasos en orden de ejecución</p>
            </div>
            <span className={`text-sm font-mono ${pasos.length >= 4 ? 'text-red-400' : 'text-gray-500'}`}>
              {pasos.length}/4
            </span>
          </div>

          {/* Pasos actuales */}
          {pasos.length > 0 && (
            <div className="space-y-2">
              {pasos.map((paso, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2.5">
                  <span className="text-red-500 font-bold text-sm w-5 shrink-0">{paso.orden}.</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-200">{paso.accion}</span>
                    {paso.intencion && (
                      <span className="text-xs text-gray-500 ml-2">— {paso.intencion}</span>
                    )}
                  </div>
                  {i > 0 && (
                    <span className="text-gray-600 text-xs absolute -left-5">→</span>
                  )}
                  <button
                    type="button"
                    onClick={() => eliminarPaso(i)}
                    className="text-gray-600 hover:text-red-400 transition-colors text-sm shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Flecha visual entre pasos */}
          {pasos.length > 0 && pasos.length < 4 && (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <div className="h-px flex-1 bg-gray-800" />
              <span>+ siguiente paso</span>
              <div className="h-px flex-1 bg-gray-800" />
            </div>
          )}

          {/* Agregar nuevo paso */}
          {pasos.length < 4 && (
            <div className="space-y-3 border border-dashed border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Paso {pasos.length + 1}
                </p>
                <button
                  type="button"
                  onClick={() => setUsarCustom(v => !v)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {usarCustom ? '← Usar catálogo' : '✏️ Texto libre'}
                </button>
              </div>

              {usarCustom ? (
                <input
                  type="text"
                  value={accionCustom}
                  onChange={e => setAccionCustom(e.target.value)}
                  placeholder="ej: finta para hacer botar técnica, turco..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              ) : (
                <select
                  value={accionSeleccionada}
                  onChange={e => setAccionSeleccionada(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="">Seleccioná una acción...</option>
                  {ACCIONES_CATALOGO.map(grupo => (
                    <optgroup key={grupo.grupo} label={`— ${grupo.grupo} —`}>
                      {grupo.opciones.map(op => (
                        <option key={op.valor} value={op.valor}>{op.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}

              <input
                type="text"
                value={intencion}
                onChange={e => setIntencion(e.target.value)}
                placeholder="Intención táctica (opcional): abrir guardia, cazar, rematar..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />

              <button
                type="button"
                onClick={agregarPaso}
                disabled={!puedeAgregarPaso}
                className={`w-full py-2 rounded-lg text-sm font-medium border transition-colors ${
                  puedeAgregarPaso
                    ? 'border-red-700 text-red-400 hover:bg-red-900/30'
                    : 'border-gray-700 text-gray-600 cursor-not-allowed'
                }`}
              >
                + Agregar paso {pasos.length + 1}
              </button>
            </div>
          )}
        </section>

        {/* Notas */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <label className="block text-sm text-gray-400 mb-2">Notas tácticas</label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
            placeholder="Cuándo usar esta táctica, condiciones, distancia ideal, advertencias..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
          />
        </section>

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
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar táctica'}
          </button>
        </div>
      </form>
    </div>
  )
}
