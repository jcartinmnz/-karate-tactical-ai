import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({
  combate_id: z.string().uuid(),
  tacticas: z.array(
    z.object({
      tactica_id: z.string().uuid(),
      exitosa: z.boolean().nullable().optional(),
    })
  ),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { combate_id, tacticas } = parsed.data
    if (tacticas.length === 0) return NextResponse.json({ data: { saved: 0 } })

    for (const t of tacticas) {
      const exitosa = t.exitosa ?? null

      await sql`
        INSERT INTO combate_tacticas (combate_id, tactica_id, exitosa)
        VALUES (${combate_id}, ${t.tactica_id}, ${exitosa})
        ON CONFLICT (combate_id, tactica_id) DO UPDATE SET exitosa = EXCLUDED.exitosa
      `

      // Actualizar estadísticas de la táctica
      await sql`
        UPDATE tacticas_combate
        SET
          intentos    = intentos + 1,
          efectividad = efectividad + ${exitosa === true ? 1 : 0}
        WHERE id = ${t.tactica_id}
      `
    }

    return NextResponse.json({ data: { saved: tacticas.length } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al guardar tácticas del combate' }, { status: 500 })
  }
}
