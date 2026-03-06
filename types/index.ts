// =============================================================
// KarateIQ — Tipos globales TypeScript
// =============================================================

export type Resultado = 'victoria' | 'derrota' | 'empate'
export type Zona = 'jodan' | 'chudan' | 'gedan'
export type TipoTecnica = 'ataque' | 'contraataque' | 'barrido'
export type Ejecutor = 'propio' | 'rival'
export type NivelRival = 'local' | 'nacional' | 'internacional'

// --- Rivales ---

export interface Rival {
  id: string
  nombre: string
  pais?: string
  categoria_peso?: string
  nivel?: NivelRival
  notas?: string
  created_at: string
}

// --- Combates ---

export interface Combate {
  id: string
  rival_id: string
  rival_nombre?: string   // join
  fecha: string
  competencia: string
  resultado: Resultado
  puntos_propios: number
  puntos_rival: number
  duracion_seg?: number
  notas?: string
  created_at: string
}

// --- Técnicas ---

export interface TecnicaPorCombate {
  id: string
  combate_id: string
  tecnica: string
  zona: Zona
  tipo: TipoTecnica
  puntos: number
  exitosa: boolean
  ronda: number
  segundo?: number
  ejecutor: Ejecutor
  created_at: string
}

export interface CatalogoTecnica {
  id: number
  nombre: string
  nombre_es: string
  tipo: TipoTecnica
  zonas: Zona[]
  puntos_base: number
}

// --- Scouting ---

export interface TecnicaFrecuente {
  tecnica: string
  zona: Zona
  frecuencia: number
  tasa_exito: number
}

export interface PatronAtaque {
  descripcion: string
  frecuencia: 'alta' | 'media' | 'baja'
  contexto: string
}

export interface Debilidad {
  descripcion: string
  zona_vulnerable?: Zona
  recomendacion: string
}

export interface Fortaleza {
  descripcion: string
  tecnica_principal?: string
}

export interface ScoutingRival {
  id: string
  rival_id: string
  tecnicas_frecuentes?: TecnicaFrecuente[]
  patrones_ataque?: PatronAtaque[]
  debilidades?: Debilidad[]
  fortalezas?: Fortaleza[]
  gameplan?: string
  notas_scouting?: string | null
  videos_referencia?: string[]
  combates_analizados: number
  ultima_actualizacion: string
  created_at: string
}

// --- API Responses ---

export interface ApiError {
  error: string
}

export interface ApiSuccess<T> {
  data: T
}
