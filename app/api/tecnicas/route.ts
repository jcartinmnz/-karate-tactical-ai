import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const TecnicaSchema = z.object({
  combate_id: z.string().uuid(),
  tecnica: z.string().min(1),
  zona: z.enum(['jodan', 'chudan', 'gedan']),
  tipo: z.enum(['ataque', 'contraataque', 'barrido']),
  puntos: z.number().int(),
  exitosa: z.boolean(),
  ronda: z.number().int().min(1),
  segundo: z.number().int().optional(),
  ejecutor: z.enum(['propio', 'rival']),
})

const TecnicasBatchSchema = z.array(TecnicaSchema)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Acepta un array (batch) o un objeto individual
    const isArray = Array.isArray(body)
    const parsed = isArray
      ? TecnicasBatchSchema.safeParse(body)
      : TecnicaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const tecnicas = isArray ? (parsed.data as z.infer<typeof TecnicasBatchSchema>) : [parsed.data as z.infer<typeof TecnicaSchema>]

    const inserted = []
    for (const t of tecnicas) {
      const [row] = await sql`
        INSERT INTO tecnicas_por_combate
          (combate_id, tecnica, zona, tipo, puntos, exitosa, ronda, segundo, ejecutor)
        VALUES
          (${t.combate_id}, ${t.tecnica}, ${t.zona}, ${t.tipo}, ${t.puntos}, ${t.exitosa}, ${t.ronda}, ${t.segundo ?? null}, ${t.ejecutor})
        RETURNING *
      `
      inserted.push(row)
    }

    return NextResponse.json({ data: inserted }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al registrar técnica' }, { status: 500 })
  }
}
