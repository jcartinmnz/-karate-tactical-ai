import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const RivalSchema = z.object({
  nombre: z.string().min(1),
  pais: z.string().optional(),
  categoria_peso: z.string().optional(),
  nivel: z.enum(['local', 'nacional', 'internacional']).optional(),
  notas: z.string().optional(),
})

export async function GET() {
  try {
    const rivales = await sql`
      SELECT r.*, COUNT(c.id)::int as total_combates
      FROM rivales r
      LEFT JOIN combates c ON c.rival_id = r.id
      GROUP BY r.id
      ORDER BY r.nombre ASC
    `
    return NextResponse.json({ data: rivales })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener rivales' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RivalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { nombre, pais, categoria_peso, nivel, notas } = parsed.data

    const [rival] = await sql`
      INSERT INTO rivales (nombre, pais, categoria_peso, nivel, notas)
      VALUES (${nombre}, ${pais ?? null}, ${categoria_peso ?? null}, ${nivel ?? null}, ${notas ?? null})
      RETURNING *
    `

    return NextResponse.json({ data: rival }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al crear rival' }, { status: 500 })
  }
}
