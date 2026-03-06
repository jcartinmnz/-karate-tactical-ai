import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KarateIQ — Tactical AI',
  description: 'Sistema táctico de IA para karate deportivo de competición',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-tight text-white">
              Karate<span className="text-red-500">IQ</span>
            </Link>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/combates" className="hover:text-white transition-colors">Combates</Link>
              <Link href="/rivales" className="hover:text-white transition-colors">Rivales</Link>
              <Link href="/tacticas" className="hover:text-white transition-colors">Tácticas</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
