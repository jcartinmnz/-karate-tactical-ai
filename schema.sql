-- =============================================================
-- KarateIQ — Database Schema
-- Neon DB (PostgreSQL serverless) con pgvector
-- =============================================================

-- Habilitar extensión pgvector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================
-- TABLA: rivales
-- Perfil básico de cada oponente registrado
-- =============================================================
CREATE TABLE IF NOT EXISTS rivales (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          TEXT NOT NULL,
    pais            TEXT,
    categoria_peso  TEXT,                                           -- ej: -60kg, -75kg, +84kg
    nivel           TEXT CHECK (nivel IN ('local', 'nacional', 'internacional')),
    notas           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLA: combates
-- Registro de cada combate disputado
-- =============================================================
CREATE TABLE IF NOT EXISTS combates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rival_id        UUID NOT NULL REFERENCES rivales(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    competencia     TEXT NOT NULL,                                  -- Nombre del torneo/competencia
    resultado       TEXT NOT NULL CHECK (resultado IN ('victoria', 'derrota', 'empate')),
    puntos_propios  INT NOT NULL DEFAULT 0,
    puntos_rival    INT NOT NULL DEFAULT 0,
    duracion_seg    INT,                                            -- Duración total en segundos
    notas           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_combates_rival_id ON combates(rival_id);
CREATE INDEX IF NOT EXISTS idx_combates_fecha ON combates(fecha DESC);

-- =============================================================
-- TABLA: tecnicas_por_combate
-- Registro granular de cada técnica ejecutada en un combate
-- =============================================================
CREATE TABLE IF NOT EXISTS tecnicas_por_combate (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combate_id      UUID NOT NULL REFERENCES combates(id) ON DELETE CASCADE,

    -- Identificación de la técnica
    tecnica         TEXT NOT NULL,                                  -- ej: mawashi-geri, gyaku-zuki
    zona            TEXT NOT NULL CHECK (zona IN ('jodan', 'chudan', 'gedan')),
    tipo            TEXT NOT NULL CHECK (tipo IN ('ataque', 'contraataque', 'barrido')),

    -- Resultado
    puntos          INT NOT NULL DEFAULT 0,                         -- Positivo = ganados, negativo = recibidos
    exitosa         BOOLEAN NOT NULL DEFAULT FALSE,                 -- TRUE si anotó punto

    -- Contexto temporal
    ronda           INT NOT NULL DEFAULT 1,
    segundo         INT,                                            -- Segundo aproximado del combate

    -- ¿Fue técnica propia o del rival?
    ejecutor        TEXT NOT NULL DEFAULT 'propio' CHECK (ejecutor IN ('propio', 'rival')),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tecnicas_combate_id ON tecnicas_por_combate(combate_id);
CREATE INDEX IF NOT EXISTS idx_tecnicas_tecnica ON tecnicas_por_combate(tecnica);
CREATE INDEX IF NOT EXISTS idx_tecnicas_ejecutor ON tecnicas_por_combate(ejecutor);

-- =============================================================
-- TABLA: scouting_rivales
-- Perfil táctico generado por IA para cada rival
-- =============================================================
CREATE TABLE IF NOT EXISTS scouting_rivales (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rival_id                UUID NOT NULL UNIQUE REFERENCES rivales(id) ON DELETE CASCADE,

    -- Análisis táctico estructurado (generado por IA)
    tecnicas_frecuentes     JSONB,      -- [{tecnica, zona, frecuencia, tasa_exito}]
    patrones_ataque         JSONB,      -- [{descripcion, frecuencia, contexto}]
    debilidades             JSONB,      -- [{descripcion, zona_vulnerable, recomendacion}]
    fortalezas              JSONB,      -- [{descripcion, tecnica_principal}]

    -- Gameplan generado por GPT-4o
    gameplan                TEXT,       -- Texto del gameplan táctico
    gameplan_embedding      vector(1536),  -- Embedding para búsqueda semántica (text-embedding-3-small)

    -- Metadata
    combates_analizados     INT DEFAULT 0,  -- Cantidad de combates usados para el análisis
    ultima_actualizacion    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scouting_rival_id ON scouting_rivales(rival_id);

-- Índice HNSW para búsqueda por similitud de embeddings (pgvector)
CREATE INDEX IF NOT EXISTS idx_scouting_embedding ON scouting_rivales
    USING hnsw (gameplan_embedding vector_cosine_ops);

-- =============================================================
-- TABLA: tacticas_combate
-- Arsenal de tácticas registradas por el atleta
-- =============================================================
CREATE TABLE IF NOT EXISTS tacticas_combate (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      TEXT NOT NULL,
    descripcion TEXT,
    secuencia   JSONB NOT NULL DEFAULT '[]',              -- [{orden, accion, intencion}]
    tipo        TEXT NOT NULL CHECK (tipo IN ('combinacion', 'intercepcion', 'finta', 'contraataque')),
    efectividad INT NOT NULL DEFAULT 0,                   -- Veces que funcionó
    intentos    INT NOT NULL DEFAULT 0,                   -- Veces que se intentó
    notas       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tacticas_tipo ON tacticas_combate(tipo);

-- =============================================================
-- TABLA: combate_tacticas
-- Relación entre combates y las tácticas usadas en ellos
-- =============================================================
CREATE TABLE IF NOT EXISTS combate_tacticas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combate_id  UUID NOT NULL REFERENCES combates(id) ON DELETE CASCADE,
    tactica_id  UUID NOT NULL REFERENCES tacticas_combate(id) ON DELETE CASCADE,
    exitosa     BOOLEAN DEFAULT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(combate_id, tactica_id)
);

CREATE INDEX IF NOT EXISTS idx_combate_tacticas_combate ON combate_tacticas(combate_id);
CREATE INDEX IF NOT EXISTS idx_combate_tacticas_tactica ON combate_tacticas(tactica_id);

-- =============================================================
-- VISTAS ÚTILES
-- =============================================================

-- Vista: estadísticas de técnicas propias por rival
CREATE OR REPLACE VIEW vista_tecnicas_propias_por_rival AS
SELECT
    r.id                AS rival_id,
    r.nombre            AS rival_nombre,
    t.tecnica,
    t.zona,
    COUNT(*)            AS veces_usada,
    SUM(CASE WHEN t.exitosa THEN 1 ELSE 0 END) AS veces_exitosa,
    ROUND(
        100.0 * SUM(CASE WHEN t.exitosa THEN 1 ELSE 0 END) / COUNT(*),
        1
    )                   AS tasa_exito_pct,
    SUM(t.puntos)       AS puntos_totales
FROM tecnicas_por_combate t
JOIN combates c ON c.id = t.combate_id
JOIN rivales r ON r.id = c.rival_id
WHERE t.ejecutor = 'propio'
GROUP BY r.id, r.nombre, t.tecnica, t.zona
ORDER BY r.nombre, veces_usada DESC;

-- Vista: técnicas del rival (para scouting)
CREATE OR REPLACE VIEW vista_tecnicas_rival_por_rival AS
SELECT
    r.id                AS rival_id,
    r.nombre            AS rival_nombre,
    t.tecnica,
    t.zona,
    COUNT(*)            AS veces_usada,
    SUM(CASE WHEN t.exitosa THEN 1 ELSE 0 END) AS veces_exitosa,
    ROUND(
        100.0 * SUM(CASE WHEN t.exitosa THEN 1 ELSE 0 END) / COUNT(*),
        1
    )                   AS tasa_exito_pct
FROM tecnicas_por_combate t
JOIN combates c ON c.id = t.combate_id
JOIN rivales r ON r.id = c.rival_id
WHERE t.ejecutor = 'rival'
GROUP BY r.id, r.nombre, t.tecnica, t.zona
ORDER BY r.nombre, veces_usada DESC;

-- Vista: resumen de combates por rival
CREATE OR REPLACE VIEW vista_resumen_combates AS
SELECT
    r.id                    AS rival_id,
    r.nombre                AS rival_nombre,
    r.pais,
    r.categoria_peso,
    COUNT(c.id)             AS total_combates,
    SUM(CASE WHEN c.resultado = 'victoria' THEN 1 ELSE 0 END)  AS victorias,
    SUM(CASE WHEN c.resultado = 'derrota'  THEN 1 ELSE 0 END)  AS derrotas,
    SUM(CASE WHEN c.resultado = 'empate'   THEN 1 ELSE 0 END)  AS empates,
    SUM(c.puntos_propios)   AS puntos_propios_totales,
    SUM(c.puntos_rival)     AS puntos_rival_totales
FROM rivales r
LEFT JOIN combates c ON c.rival_id = r.id
GROUP BY r.id, r.nombre, r.pais, r.categoria_peso
ORDER BY total_combates DESC;

-- =============================================================
-- DATOS SEMILLA (opcional — catálogo de técnicas)
-- =============================================================

-- Puedes usar esta tabla como referencia para el TecnicaSelector del frontend
CREATE TABLE IF NOT EXISTS catalogo_tecnicas (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL UNIQUE,
    nombre_es   TEXT NOT NULL,                  -- Nombre en español
    tipo        TEXT NOT NULL CHECK (tipo IN ('ataque', 'contraataque', 'barrido')),
    zonas       TEXT[] NOT NULL,                -- Zonas válidas: jodan, chudan, gedan
    puntos_base INT NOT NULL DEFAULT 1          -- Puntos WKF base
);

INSERT INTO catalogo_tecnicas (nombre, nombre_es, tipo, zonas, puntos_base) VALUES
    ('gyaku-zuki',    'Puñetazo inverso',          'ataque',        ARRAY['jodan','chudan'], 1),
    ('kizami-zuki',   'Jab directo',               'ataque',        ARRAY['jodan','chudan'], 1),
    ('uraken',        'Revés de puño',             'ataque',        ARRAY['jodan'],          1),
    ('shuto-uchi',    'Canto de mano',             'ataque',        ARRAY['jodan','chudan'], 1),
    ('mawashi-geri',  'Patada circular',           'ataque',        ARRAY['jodan','chudan'], 2),
    ('yoko-geri',     'Patada lateral',            'ataque',        ARRAY['jodan','chudan'], 2),
    ('ushiro-geri',   'Patada trasera',            'ataque',        ARRAY['chudan'],         2),
    ('ura-mawashi',   'Patada circular inversa',   'ataque',        ARRAY['jodan'],          3),
    ('tobi-geri',     'Patada saltando',           'ataque',        ARRAY['jodan','chudan'], 3),
    ('ashi-barai',    'Barrido de pierna',         'barrido',       ARRAY['gedan'],          1),
    ('gyaku-zuki-c',  'Contraataque puñetazo',     'contraataque',  ARRAY['jodan','chudan'], 1),
    ('mawashi-c',     'Contra con circular',       'contraataque',  ARRAY['jodan','chudan'], 2)
ON CONFLICT (nombre) DO NOTHING;
