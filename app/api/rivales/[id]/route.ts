import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [rival] = await sql`SELECT * FROM rivales WHERE id = ${params.id}`
    if (!rival) return NextResponse.json({ error: 'Rival no encontrado' }, { status: 404 })

    const combates = await sql`
      SELECT * FROM combates
      WHERE rival_id = ${params.id}
      ORDER BY fecha DESC
    `

    const scouting = await sql`
      SELECT * FROM scouting_rivales
      WHERE rival_id = ${params.id}
      LIMIT 1
    `

    return NextResponse.json({ data: { ...rival, combates, scouting: scouting[0] ?? null } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener rival' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM rivales WHERE id = ${params.id}`
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al eliminar rival' }, { status: 500 })
  }
}
