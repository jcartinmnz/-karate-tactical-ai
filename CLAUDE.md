# KarateIQ — Tactical AI System for Competitive Karate

## Project Overview

KarateIQ is an AI-powered tactical analysis system for competitive sport karate. It helps athletes and coaches track fight techniques, analyze opponent patterns, and generate AI-driven gameplans.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Neon DB (PostgreSQL serverless) + pgvector |
| AI | OpenAI API (GPT-4o) |
| Language | TypeScript |
| ORM | Raw SQL via `@neondatabase/serverless` |

---

## Project Structure

```
karate-tactical-ai/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Dashboard/Home
│   ├── combates/
│   │   ├── page.tsx                # Lista de combates
│   │   ├── nuevo/
│   │   │   └── page.tsx            # Formulario registro de combate
│   │   └── [id]/
│   │       └── page.tsx            # Detalle de combate
│   ├── rivales/
│   │   ├── page.tsx                # Lista de rivales
│   │   ├── nuevo/
│   │   │   └── page.tsx            # Formulario nuevo rival
│   │   └── [id]/
│   │       └── page.tsx            # Perfil táctico del rival + gameplan IA
│   └── api/
│       ├── combates/
│       │   ├── route.ts            # GET (lista), POST (crear)
│       │   └── [id]/
│       │       └── route.ts        # GET, PUT, DELETE
│       ├── tecnicas/
│       │   └── route.ts            # POST (registrar técnica en combate)
│       ├── rivales/
│       │   ├── route.ts            # GET, POST
│       │   └── [id]/
│       │       └── route.ts        # GET, PUT, DELETE
│       └── scouting/
│           ├── route.ts            # POST (crear/actualizar scouting)
│           └── gameplan/
│               └── route.ts        # POST (generar gameplan con IA)
├── components/
│   ├── ui/                         # Componentes base (Button, Input, Card, etc.)
│   ├── combates/
│   │   ├── CombateForm.tsx         # Formulario registro combate
│   │   ├── CombateCard.tsx         # Tarjeta resumen combate
│   │   └── TecnicaSelector.tsx     # Selector de técnicas con puntos
│   └── rivales/
│       ├── RivalCard.tsx           # Tarjeta rival
│       ├── ScoutingPanel.tsx       # Panel de análisis táctico
│       └── GameplanDisplay.tsx     # Muestra el gameplan generado por IA
├── lib/
│   ├── db.ts                       # Cliente Neon DB
│   ├── openai.ts                   # Cliente OpenAI
│   └── prompts.ts                  # System prompts para GPT-4o
├── types/
│   └── index.ts                    # Tipos TypeScript globales
├── schema.sql                      # Schema completo de la base de datos
├── .env.local.example              # Variables de entorno requeridas
└── CLAUDE.md                       # Este archivo
```

---

## Database Schema

### Tablas principales

#### `rivales`
Almacena el perfil de cada oponente registrado.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| nombre | TEXT | Nombre del rival |
| pais | TEXT | País/federación |
| categoria_peso | TEXT | Categoría de peso |
| nivel | TEXT | local / nacional / internacional |
| notas | TEXT | Notas libres del entrenador |
| created_at | TIMESTAMPTZ | Fecha de creación |

#### `combates`
Registro de cada combate disputado.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| rival_id | UUID | FK → rivales |
| fecha | DATE | Fecha del combate |
| competencia | TEXT | Nombre de la competencia |
| resultado | TEXT | victoria / derrota / empate |
| puntos_propios | INT | Puntos obtenidos |
| puntos_rival | INT | Puntos del rival |
| notas | TEXT | Observaciones del combate |
| created_at | TIMESTAMPTZ | Fecha de registro |

#### `tecnicas_por_combate`
Registro granular de cada técnica ejecutada en un combate.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| combate_id | UUID | FK → combates |
| tecnica | TEXT | Nombre de la técnica |
| zona | TEXT | jodan / chudan / gedan |
| tipo | TEXT | ataque / contra / barrido |
| puntos | INT | Puntos ganados (negativo = recibido) |
| exitosa | BOOL | Si la técnica anotó punto |
| ronda | INT | Número de ronda |
| segundo | INT | Segundo aproximado del combate |
| created_at | TIMESTAMPTZ | Fecha de registro |

#### `scouting_rivales`
Perfil táctico generado por IA para cada rival.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| rival_id | UUID | FK → rivales (UNIQUE) |
| tecnicas_frecuentes | JSONB | Array de técnicas con frecuencia |
| patrones_ataque | JSONB | Patrones detectados |
| debilidades | JSONB | Debilidades identificadas |
| gameplan | TEXT | Gameplan generado por IA |
| gameplan_embedding | vector(1536) | Embedding del gameplan para búsqueda semántica |
| ultima_actualizacion | TIMESTAMPTZ | Última vez que se actualizó |
| created_at | TIMESTAMPTZ | Fecha de creación |

---

## Técnicas Karate — Catálogo

Las técnicas están categorizadas para el selector del formulario:

### Ataques de mano
- `gyaku-zuki` — Puñetazo inverso (chudan/jodan) — 1 punto
- `kizami-zuki` — Jab directo (jodan) — 1 punto
- `uraken` — Revés de puño (jodan) — 1 punto
- `shuto-uchi` — Golpe de canto (jodan/chudan) — 1 punto

### Patadas
- `mawashi-geri` — Patada circular (jodan) — 2 pts / (chudan) — 1 pt
- `yoko-geri` — Patada lateral (chudan/jodan) — 2 pts
- `ushiro-geri` — Patada trasera (chudan) — 2 pts
- `ura-mawashi` — Patada circular inversa (jodan) — 3 pts
- `tobi-geri` — Patada saltando — 3 pts

### Técnicas de barrido/derribo
- `ashi-barai` — Barrido de pierna — 1 punto extra si sigue ataque

---

## AI Integration — OpenAI GPT-4o

### Endpoint: `/api/scouting/gameplan`

**Flujo:**
1. Se recopilan todos los combates registrados contra el rival
2. Se agregan las técnicas exitosas/fallidas del rival
3. Se construye un prompt con el historial táctico
4. GPT-4o genera un perfil táctico + gameplan estructurado
5. Se guarda en `scouting_rivales` y se genera el embedding con `text-embedding-3-small`

**System prompt base** (ver `lib/prompts.ts`):
> Eres un coach de karate de élite especializado en análisis táctico de competición. Analiza los datos del oponente y genera un perfil táctico preciso con un gameplan accionable.

### Uso de pgvector
El campo `gameplan_embedding` en `scouting_rivales` permite búsqueda semántica futura: encontrar rivales con perfiles tácticos similares para reutilizar gameplans.

---

## Key Conventions

- **API Routes**: Usar `@neondatabase/serverless` con `neon(DATABASE_URL)` para queries
- **Tipos**: Todos los tipos globales en `types/index.ts`
- **Validación**: Zod para validación de formularios y API inputs
- **Error handling**: Todos los API routes retornan `{ error: string }` en caso de fallo
- **IDs**: UUID v4 generados por PostgreSQL con `gen_random_uuid()`
- **Fechas**: Siempre en UTC, formato ISO 8601

## Environment Variables

Ver `.env.local.example` para la lista completa de variables requeridas.

---

## Development Commands

```bash
npm run dev       # Servidor de desarrollo en localhost:3000
npm run build     # Build de producción
npm run lint      # ESLint
```

---

## V1 Roadmap

- [x] Schema de base de datos
- [ ] Registro de combates con técnicas
- [ ] Perfil de rivales
- [ ] Scouting con IA (gameplan)
- [ ] Dashboard con estadísticas
- [ ] Exportar gameplan como PDF
