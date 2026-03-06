import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const PasoSchema = z.object({
  orden: z.number().int().min(1),
  accion: z.string().min(1),
  intencion: z.string().optional(),
})

const TacticaSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  secuencia: z.array(PasoSchema).min(1).max(4),
  tipo: z.enum(['combinacion', 'intercepcion', 'finta', 'contraataque']),
  notas: z.string().optional(),
})

export async function GET() {
  try {
    const tacticas = await sql`
      SELECT * FROM tacticas_combate ORDER BY created_at DESC
    `
    return NextResponse.json({ data: tacticas })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener tácticas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = TacticaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { nombre, descripcion, secuencia, tipo, notas } = parsed.data

    const [tactica] = await sql`
      INSERT INTO tacticas_combate (nombre, descripcion, secuencia, tipo, notas)
      VALUES (
        ${nombre},
        ${descripcion ?? null},
        ${JSON.stringify(secuencia)},
        ${tipo},
        ${notas ?? null}
      )
      RETURNING *
    `

    return NextResponse.json({ data: tactica }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al crear táctica' }, { status: 500 })
  }
}
