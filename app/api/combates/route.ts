import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const CombateSchema = z.object({
  rival_id: z.string().uuid(),
  fecha: z.string(),
  competencia: z.string().min(1),
  resultado: z.enum(['victoria', 'derrota', 'empate']),
  puntos_propios: z.number().int().min(0),
  puntos_rival: z.number().int().min(0),
  duracion_seg: z.number().int().optional(),
  notas: z.string().optional(),
})

export async function GET() {
  try {
    const combates = await sql`
      SELECT c.*, r.nombre as rival_nombre
      FROM combates c
      JOIN rivales r ON r.id = c.rival_id
      ORDER BY c.fecha DESC, c.created_at DESC
    `
    return NextResponse.json({ data: combates })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener combates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CombateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { rival_id, fecha, competencia, resultado, puntos_propios, puntos_rival, duracion_seg, notas } = parsed.data

    const [combate] = await sql`
      INSERT INTO combates (rival_id, fecha, competencia, resultado, puntos_propios, puntos_rival, duracion_seg, notas)
      VALUES (${rival_id}, ${fecha}, ${competencia}, ${resultado}, ${puntos_propios}, ${puntos_rival}, ${duracion_seg ?? null}, ${notas ?? null})
      RETURNING *
    `

    return NextResponse.json({ data: combate }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al crear combate' }, { status: 500 })
  }
}
