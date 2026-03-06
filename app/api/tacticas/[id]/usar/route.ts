import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({
  exitosa: z.boolean(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { exitosa } = parsed.data

    const [tactica] = await sql`
      UPDATE tacticas_combate
      SET
        intentos    = intentos + 1,
        efectividad = efectividad + ${exitosa ? 1 : 0}
      WHERE id = ${params.id}
      RETURNING *
    `

    if (!tactica) {
      return NextResponse.json({ error: 'Táctica no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ data: tactica })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al registrar uso' }, { status: 500 })
  }
}
