'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIAS = ['-50kg', '-55kg', '-60kg', '-65kg', '-70kg', '-75kg', '-80kg', '-84kg', '+84kg']

export default function NuevoRivalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [nombre, setNombre] = useState('')
  const [pais, setPais] = useState('')
  const [categoria, setCategoria] = useState('')
  const [nivel, setNivel] = useState<'local' | 'nacional' | 'internacional'>('nacional')
  const [notas, setNotas] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/rivales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          pais: pais.trim() || undefined,
          categoria_peso: categoria || undefined,
          nivel,
          notas: notas.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear rival')

      router.push(`/rivales/${data.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nuevo Rival</h1>
        <p className="text-gray-400 text-sm mt-1">Registrá el perfil básico del oponente</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">

        <div>
          <label className="block text-sm text-gray-400 mb-1">Nombre completo *</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="ej: Juan García"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">País / Federación</label>
            <input
              type="text"
              value={pais}
              onChange={e => setPais(e.target.value)}
              placeholder="ej: Argentina"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Categoría de peso</label>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            >
              <option value="">Sin especificar</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Nivel de competencia</label>
          <div className="flex gap-3">
            {(['local', 'nacional', 'internacional'] as const).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setNivel(n)}
                className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                  nivel === n
                    ? 'bg-red-700 border-red-500 text-white font-medium'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {n.charAt(0).toUpperCase() + n.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Notas iniciales</label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
            placeholder="Estilo de pelea, características físicas, observaciones..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {loading ? 'Guardando...' : 'Crear rival'}
          </button>
        </div>
      </form>
    </div>
  )
}
