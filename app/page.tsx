import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-4 py-12">
        <h1 className="text-5xl font-bold tracking-tight">
          Karate<span className="text-red-500">IQ</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-xl mx-auto">
          Sistema táctico de IA para karate deportivo de competición.
          Registrá combates, analizá rivales y generá gameplans con inteligencia artificial.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/combates/nuevo"
            className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors"
          >
            Registrar combate
          </Link>
          <Link
            href="/rivales"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Ver rivales
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/combates" className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-red-500/50 transition-colors">
          <div className="text-3xl mb-3">🥊</div>
          <h2 className="text-lg font-semibold mb-2">Tracking de Combates</h2>
          <p className="text-gray-400 text-sm">
            Registrá cada combate con las técnicas usadas, puntos ganados/perdidos, rondas y resultado.
          </p>
        </Link>
        <Link href="/rivales" className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-red-500/50 transition-colors">
          <div className="text-3xl mb-3">🎯</div>
          <h2 className="text-lg font-semibold mb-2">Scouting de Rivales</h2>
          <p className="text-gray-400 text-sm">
            Perfil táctico de cada oponente con patrones de ataque, debilidades y gameplan generado por IA.
          </p>
        </Link>
      </div>
    </div>
  )
}
