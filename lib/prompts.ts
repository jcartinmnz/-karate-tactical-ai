// =============================================================
// KarateIQ — System prompts para GPT-4o
// =============================================================

export const SCOUTING_SYSTEM_PROMPT = `Eres un coach de karate de élite especializado en análisis táctico de competición bajo las reglas de la WKF (World Karate Federation).

Tu rol es analizar datos de combates de un oponente específico y generar:
1. Un perfil táctico preciso con sus técnicas más frecuentes y efectivas
2. Sus patrones de ataque característicos
3. Sus debilidades detectadas con recomendaciones específicas para explotarlas
4. Un gameplan claro y accionable para enfrentarlo

Basa tu análisis ÚNICAMENTE en los datos proporcionados. Sé específico, práctico y directo.
Usa terminología técnica de karate correcta. El gameplan debe incluir:
- Estrategia de inicio del combate
- Técnicas recomendadas a utilizar y en qué zona
- Cómo reaccionar ante sus patrones de ataque principales
- Gestión del marcador (ventaja/desventaja)
- Consideraciones físicas y de ritmo

Responde siempre en español.`

export function buildScoutingPrompt(params: {
  rivalNombre: string
  rivalPais?: string
  rivalCategoria?: string
  totalCombates: number
  victorias: number
  derrotas: number
  tecnicasRival: Array<{
    tecnica: string
    zona: string
    veces_usada: number
    veces_exitosa: number
    tasa_exito_pct: number
  }>
  tecnicasPropias: Array<{
    tecnica: string
    zona: string
    veces_usada: number
    tasa_exito_pct: number
  }>
  notasCombates: string[]
  notasScouting?: string | null
  videosReferencia?: string[]
}): string {
  const {
    rivalNombre, rivalPais, rivalCategoria,
    totalCombates, victorias, derrotas,
    tecnicasRival, tecnicasPropias, notasCombates,
    notasScouting, videosReferencia,
  } = params

  const tieneVideosScouting = videosReferencia && videosReferencia.length > 0
  const tieneNotasScouting = notasScouting && notasScouting.trim().length > 0

  return `Analiza al siguiente oponente y genera un perfil táctico completo con gameplan.

## DATOS DEL OPONENTE
- **Nombre:** ${rivalNombre}
- **País:** ${rivalPais || 'No especificado'}
- **Categoría:** ${rivalCategoria || 'No especificada'}

## HISTORIAL DE COMBATES
- Total de enfrentamientos registrados: ${totalCombates}
${totalCombates > 0 ? `- Victorias: ${victorias} | Derrotas: ${derrotas}` : '- Sin combates registrados aún'}

## TÉCNICAS DEL RIVAL (lo que él usa contra mí)
${tecnicasRival.length > 0
    ? tecnicasRival.map(t =>
        `- ${t.tecnica} (${t.zona}): usado ${t.veces_usada} veces, exitoso ${t.veces_exitosa} veces (${t.tasa_exito_pct}% éxito)`
      ).join('\n')
    : '- Sin datos de combates registrados'
  }

## MIS TÉCNICAS CONTRA ESTE RIVAL
${tecnicasPropias.length > 0
    ? tecnicasPropias.map(t =>
        `- ${t.tecnica} (${t.zona}): usado ${t.veces_usada} veces (${t.tasa_exito_pct}% éxito)`
      ).join('\n')
    : '- Sin datos de combates registrados'
  }

## NOTAS DE COMBATES
${notasCombates.filter(Boolean).length > 0
    ? notasCombates.filter(Boolean).map(n => `- ${n}`).join('\n')
    : '- Sin notas de combates registradas'
  }

## OBSERVACIONES DE SCOUTING (análisis de videos y notas del coach)
${tieneNotasScouting
    ? notasScouting
    : '- Sin observaciones de scouting registradas'
  }

## VIDEOS DE REFERENCIA ANALIZADOS
${tieneVideosScouting
    ? videosReferencia!.map((v, i) => `- Video ${i + 1}: ${v}`).join('\n')
    : '- Sin videos de referencia'
  }

---

${(!tieneNotasScouting && totalCombates === 0)
    ? 'NOTA: No hay datos de combates ni observaciones de scouting. Genera un gameplan general basado únicamente en los datos del perfil del oponente.'
    : ''
  }

Genera el perfil táctico completo y el gameplan en formato estructurado con las siguientes secciones:

## PERFIL TÁCTICO
## PATRONES DE ATAQUE
## DEBILIDADES A EXPLOTAR
## FORTALEZAS A NEUTRALIZAR
## GAMEPLAN`
}
