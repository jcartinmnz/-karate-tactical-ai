import { sql } from '@/lib/db'
import { openai } from '@/lib/openai'
import { SCOUTING_SYSTEM_PROMPT, buildScoutingPrompt } from '@/lib/prompts'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({ rival_id: z.string().uuid() })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { rival_id } = parsed.data

    // 1. Obtener datos del rival
    const [rival] = await sql`SELECT * FROM rivales WHERE id = ${rival_id}`
    if (!rival) return NextResponse.json({ error: 'Rival no encontrado' }, { status: 404 })

    // 2. Obtener combates con notas
    const combates = await sql`
      SELECT resultado, puntos_propios, puntos_rival, notas
      FROM combates WHERE rival_id = ${rival_id}
    `

    // 3. Técnicas del rival
    const tecnicasRival = await sql`
      SELECT t.tecnica, t.zona,
        COUNT(*)::int as veces_usada,
        SUM(CASE WHEN t.exitosa THEN 1 ELSE 0 END)::int as veces_exitosa,
        ROUND(100.0 * SUM(CASE WHEN t.exitosa THEN 1 ELSE 0 END) / COUNT(*), 1)::float as tasa_exito_pct
      FROM tecnicas_por_combate t
      JOIN combates c ON c.id = t.combate_id
      WHERE c.rival_id = ${rival_id} AND t.ejecutor = 'rival'
      GROUP BY t.tecnica, t.zona
      ORDER BY veces_usada DESC
    `

    // 4. Mis técnicas contra este rival
    const tecnicasPropias = await sql`
      SELECT t.tecnica, t.zona,
        COUNT(*)::int as veces_usada,
        ROUND(100.0 * SUM(CASE WHEN t.exitosa THEN 1 ELSE 0 END) / COUNT(*), 1)::float as tasa_exito_pct
      FROM tecnicas_por_combate t
      JOIN combates c ON c.id = t.combate_id
      WHERE c.rival_id = ${rival_id} AND t.ejecutor = 'propio'
      GROUP BY t.tecnica, t.zona
      ORDER BY veces_usada DESC
    `

    // 5. Obtener notas y videos de scouting previos
    const [scoutingExistente] = await sql`
      SELECT notas_scouting, videos_referencia
      FROM scouting_rivales WHERE rival_id = ${rival_id}
    `

    const victorias = (combates as Record<string, unknown>[]).filter((c) => c['resultado'] === 'victoria').length
    const derrotas = (combates as Record<string, unknown>[]).filter((c) => c['resultado'] === 'derrota').length

    // 6. Generar gameplan con GPT-4o
    const prompt = buildScoutingPrompt({
      rivalNombre: rival.nombre,
      rivalPais: rival.pais,
      rivalCategoria: rival.categoria_peso,
      totalCombates: combates.length,
      victorias,
      derrotas,
      tecnicasRival: tecnicasRival as { tecnica: string; zona: string; veces_usada: number; veces_exitosa: number; tasa_exito_pct: number }[],
      tecnicasPropias: tecnicasPropias as { tecnica: string; zona: string; veces_usada: number; tasa_exito_pct: number }[],
      notasCombates: (combates as Record<string, unknown>[]).map((c) => c['notas'] as string | undefined).filter(Boolean) as string[],
      notasScouting: scoutingExistente?.notas_scouting ?? null,
      videosReferencia: (scoutingExistente?.videos_referencia as string[] | undefined) ?? [],
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SCOUTING_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    })

    const gameplan = completion.choices[0].message.content ?? ''

    // 7. Generar embedding del gameplan
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: gameplan,
    })
    const embedding = embeddingRes.data[0].embedding

    // 8. Guardar o actualizar scouting en DB
    const [scouting] = await sql`
      INSERT INTO scouting_rivales
        (rival_id, tecnicas_frecuentes, gameplan, gameplan_embedding, combates_analizados, ultima_actualizacion)
      VALUES (
        ${rival_id},
        ${JSON.stringify(tecnicasRival)},
        ${gameplan},
        ${JSON.stringify(embedding)},
        ${combates.length},
        NOW()
      )
      ON CONFLICT (rival_id) DO UPDATE SET
        tecnicas_frecuentes = EXCLUDED.tecnicas_frecuentes,
        gameplan = EXCLUDED.gameplan,
        gameplan_embedding = EXCLUDED.gameplan_embedding,
        combates_analizados = EXCLUDED.combates_analizados,
        ultima_actualizacion = NOW()
      RETURNING *
    `

    return NextResponse.json({ data: { ...scouting, gameplan } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al generar gameplan' }, { status: 500 })
  }
}
