import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({
  rival_id: z.string().uuid(),
  notas_scouting: z.string().optional(),
  videos_referencia: z.array(z.string().url()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { rival_id, notas_scouting, videos_referencia } = parsed.data

    const [rival] = await sql`SELECT id FROM rivales WHERE id = ${rival_id}`
    if (!rival) return NextResponse.json({ error: 'Rival no encontrado' }, { status: 404 })

    const [scouting] = await sql`
      INSERT INTO scouting_rivales
        (rival_id, notas_scouting, videos_referencia, combates_analizados, ultima_actualizacion)
      VALUES (
        ${rival_id},
        ${notas_scouting ?? null},
        ${JSON.stringify(videos_referencia ?? [])},
        0,
        NOW()
      )
      ON CONFLICT (rival_id) DO UPDATE SET
        notas_scouting = EXCLUDED.notas_scouting,
        videos_referencia = EXCLUDED.videos_referencia,
        ultima_actualizacion = NOW()
      RETURNING id, rival_id, notas_scouting, videos_referencia, ultima_actualizacion
    `

    return NextResponse.json({ data: scouting }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al guardar observaciones' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rival_id = searchParams.get('rival_id')

    if (!rival_id) return NextResponse.json({ error: 'rival_id requerido' }, { status: 400 })

    const [scouting] = await sql`
      SELECT id, rival_id, notas_scouting, videos_referencia, gameplan, ultima_actualizacion
      FROM scouting_rivales WHERE rival_id = ${rival_id}
    `

    return NextResponse.json({ data: scouting ?? null })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener scouting' }, { status: 500 })
  }
}
