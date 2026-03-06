import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [combate] = await sql`
      SELECT c.*, r.nombre as rival_nombre
      FROM combates c
      JOIN rivales r ON r.id = c.rival_id
      WHERE c.id = ${params.id}
    `
    if (!combate) return NextResponse.json({ error: 'Combate no encontrado' }, { status: 404 })

    const tecnicas = await sql`
      SELECT * FROM tecnicas_por_combate
      WHERE combate_id = ${params.id}
      ORDER BY ronda, segundo
    `

    return NextResponse.json({ data: { ...combate, tecnicas } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener combate' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM combates WHERE id = ${params.id}`
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al eliminar combate' }, { status: 500 })
  }
}
