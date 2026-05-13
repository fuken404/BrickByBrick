-- =============================================================
-- BrickByBrick — Schema Principal
-- Compatible con Supabase y Neon (PostgreSQL 15+)
-- Generado: 2026-05-02
-- =============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- TIPOS ENUMERADOS
-- =============================================================

CREATE TYPE rol_usuario AS ENUM ('BENEFICIARIO', 'CONSTRUCTORA', 'ADMINISTRADOR');

CREATE TYPE estado_usuario AS ENUM ('activo', 'inactivo', 'suspendido');

CREATE TYPE genero_tipo AS ENUM ('masculino', 'femenino', 'no_binario', 'prefiero_no_decir');

CREATE TYPE estado_material AS ENUM ('nuevo', 'buen_estado', 'usado');

CREATE TYPE estado_pub_material AS ENUM ('borrador', 'activo', 'pausado', 'agotado', 'vencido');

CREATE TYPE estado_solicitud AS ENUM (
  'pendiente', 'aprobada', 'rechazada', 'entregada', 'cancelada'
);

CREATE TYPE tipo_evento AS ENUM ('entrega_masiva', 'taller', 'feria', 'otro');

CREATE TYPE estado_evento AS ENUM (
  'borrador', 'publicado', 'en_curso', 'finalizado', 'cancelado'
);

CREATE TYPE tipo_publicacion AS ENUM (
  'reutilizacion', 'tutorial', 'proyecto', 'noticia', 'recurso'
);

CREATE TYPE visibilidad_pub AS ENUM ('publica', 'grupo');

CREATE TYPE estado_publicacion AS ENUM ('borrador', 'publicada', 'suspendida');

CREATE TYPE tipo_reporte AS ENUM ('publicacion', 'material', 'comentario', 'usuario');

CREATE TYPE estado_reporte AS ENUM ('pendiente', 'resuelto', 'ignorado');

CREATE TYPE rol_miembro AS ENUM ('admin', 'miembro');

CREATE TYPE tipo_notificacion AS ENUM (
  'material_nuevo',
  'solicitud_aprobada',
  'solicitud_rechazada',
  'solicitud_entregada',
  'evento_inscripcion',
  'evento_cupos_bajos',
  'comentario',
  'like',
  'grupo_invitacion',
  'verificacion',
  'material_vence'
);

CREATE TYPE tipo_documento AS ENUM ('rut', 'camara_comercio');

CREATE TYPE estado_documento AS ENUM ('pendiente', 'aprobado', 'vencido', 'rechazado');

-- =============================================================
-- TABLAS BASE
-- =============================================================

CREATE TABLE localidades (
  id     SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255)  NOT NULL UNIQUE,
  password_hash     TEXT          NOT NULL,
  rol               rol_usuario   NOT NULL,
  estado            estado_usuario NOT NULL DEFAULT 'activo',
  email_verificado  BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Tokens de verificación de email y restablecimiento de contraseña
CREATE TABLE tokens_usuario (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo       VARCHAR(30) NOT NULL CHECK (tipo IN ('reset_password', 'verify_email')),
  token_hash TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  usado      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tokens_usuario ON tokens_usuario(usuario_id, tipo, usado);

CREATE TABLE beneficiarios (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id         UUID        NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre_completo    VARCHAR(150) NOT NULL,
  cedula             VARCHAR(20)  NOT NULL UNIQUE,
  fecha_nacimiento   DATE,
  genero             genero_tipo,
  estrato            SMALLINT    CHECK (estrato BETWEEN 1 AND 6),
  localidad_id       SMALLINT    REFERENCES localidades(id) ON DELETE SET NULL,
  es_alimentador_web BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE constructoras (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          UUID         NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  razon_social        VARCHAR(200) NOT NULL,
  nit                 VARCHAR(20)  NOT NULL UNIQUE,
  representante_legal VARCHAR(150),
  cargo_representante VARCHAR(100),
  num_empleados       INT          CHECK (num_empleados >= 0),
  direccion           TEXT,
  localidad_id        SMALLINT     REFERENCES localidades(id) ON DELETE SET NULL,
  descripcion         TEXT,
  logo_url            TEXT,
  sitio_web           TEXT,
  verificada          BOOLEAN      NOT NULL DEFAULT FALSE,
  fecha_verificacion  TIMESTAMPTZ
);

-- =============================================================
-- MATERIALES
-- =============================================================

CREATE TABLE categorias_material (
  id        SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre    VARCHAR(60) NOT NULL UNIQUE,
  color_hex CHAR(7)     NOT NULL,
  icono     VARCHAR(60) NOT NULL
);

CREATE TABLE materiales (
  id                 UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  constructora_id    UUID              NOT NULL REFERENCES constructoras(id) ON DELETE CASCADE,
  categoria_id       SMALLINT          NOT NULL REFERENCES categorias_material(id),
  nombre             VARCHAR(200)      NOT NULL,
  descripcion        TEXT,
  estado_material    estado_material   NOT NULL,
  cantidad           NUMERIC(10, 2)    NOT NULL CHECK (cantidad > 0),
  unidad_medida      VARCHAR(30)       NOT NULL,
  condiciones_retiro TEXT,
  fecha_limite       DATE,
  max_solicitudes    INT               CHECK (max_solicitudes > 0),
  estado_publicacion estado_pub_material NOT NULL DEFAULT 'borrador',
  created_at         TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE TABLE fotos_material (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID    NOT NULL REFERENCES materiales(id) ON DELETE CASCADE,
  url         TEXT    NOT NULL,
  orden       SMALLINT NOT NULL DEFAULT 0
);

-- =============================================================
-- SOLICITUDES DE DONACIÓN
-- =============================================================

CREATE TABLE solicitudes_material (
  id                     UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id            UUID            NOT NULL REFERENCES materiales(id),
  beneficiario_id        UUID            NOT NULL REFERENCES beneficiarios(id),
  cantidad_solicitada    NUMERIC(10, 2)  NOT NULL CHECK (cantidad_solicitada > 0),
  proposito_uso          VARCHAR(200),
  descripcion_proyecto   TEXT,
  estado                 estado_solicitud NOT NULL DEFAULT 'pendiente',
  instrucciones_retiro   TEXT,
  fecha_solicitud        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  fecha_respuesta        TIMESTAMPTZ,
  fecha_entrega          TIMESTAMPTZ,
  calificacion           SMALLINT        CHECK (calificacion BETWEEN 1 AND 5),
  comentario_calificacion TEXT,
  CONSTRAINT uq_solicitud_material_beneficiario UNIQUE (material_id, beneficiario_id)
);

-- =============================================================
-- EVENTOS
-- =============================================================

CREATE TABLE eventos (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  constructora_id  UUID         NOT NULL REFERENCES constructoras(id) ON DELETE CASCADE,
  nombre           VARCHAR(200) NOT NULL,
  tipo_evento      tipo_evento  NOT NULL,
  descripcion      TEXT,
  fecha_inicio     TIMESTAMPTZ  NOT NULL,
  fecha_fin        TIMESTAMPTZ  NOT NULL,
  direccion        TEXT,
  localidad_id     SMALLINT     REFERENCES localidades(id) ON DELETE SET NULL,
  capacidad_maxima INT          CHECK (capacidad_maxima > 0),
  imagen_url       TEXT,
  estado           estado_evento NOT NULL DEFAULT 'borrador',
  CONSTRAINT chk_fechas_evento CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE materiales_evento (
  evento_id   UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materiales(id) ON DELETE CASCADE,
  PRIMARY KEY (evento_id, material_id)
);

CREATE TABLE inscripciones_evento (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id         UUID        NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  beneficiario_id   UUID        NOT NULL REFERENCES beneficiarios(id) ON DELETE CASCADE,
  fecha_inscripcion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  asistio           BOOLEAN     NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_inscripcion_evento_beneficiario UNIQUE (evento_id, beneficiario_id)
);

-- =============================================================
-- PUBLICACIONES Y COMUNIDAD
-- =============================================================

CREATE TABLE publicaciones (
  id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id    UUID               NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        tipo_publicacion   NOT NULL,
  titulo      VARCHAR(300)       NOT NULL,
  contenido   TEXT               NOT NULL,
  visibilidad visibilidad_pub    NOT NULL DEFAULT 'publica',
  estado      estado_publicacion NOT NULL DEFAULT 'borrador',
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE TABLE fotos_publicacion (
  id             UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id UUID     NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  url            TEXT     NOT NULL,
  orden          SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE materiales_publicacion (
  publicacion_id UUID NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  material_id    UUID NOT NULL REFERENCES materiales(id) ON DELETE CASCADE,
  PRIMARY KEY (publicacion_id, material_id)
);

CREATE TABLE comentarios (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id UUID        NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  autor_id       UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido      TEXT        NOT NULL,
  parent_id      UUID        REFERENCES comentarios(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE likes (
  usuario_id     UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  publicacion_id UUID        NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, publicacion_id)
);

CREATE TABLE reportes (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_contenido tipo_reporte  NOT NULL,
  contenido_id   UUID          NOT NULL,   -- polimórfico: no FK
  reportado_por  UUID          NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  motivo         TEXT          NOT NULL,
  estado         estado_reporte NOT NULL DEFAULT 'pendiente',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================================
-- GRUPOS
-- =============================================================

CREATE TABLE grupos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(150) NOT NULL,
  descripcion TEXT,
  imagen_url  TEXT,
  creador_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE temas_grupo (
  grupo_id UUID        NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  tema     VARCHAR(80) NOT NULL,
  PRIMARY KEY (grupo_id, tema)
);

CREATE TABLE miembros_grupo (
  grupo_id    UUID        NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol         rol_miembro NOT NULL DEFAULT 'miembro',
  fecha_union TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (grupo_id, usuario_id)
);

CREATE TABLE mensajes_grupo (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id    UUID        NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  autor_id    UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido   TEXT        NOT NULL,
  adjunto_url TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- NOTIFICACIONES
-- =============================================================

CREATE TABLE notificaciones (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID              NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        tipo_notificacion NOT NULL,
  titulo      VARCHAR(200)      NOT NULL,
  mensaje     TEXT              NOT NULL,
  url_destino TEXT,
  leida       BOOLEAN           NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- =============================================================
-- DOCUMENTOS Y CERTIFICADOS
-- =============================================================

CREATE TABLE documentos_empresa (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  constructora_id   UUID           NOT NULL REFERENCES constructoras(id) ON DELETE CASCADE,
  tipo              tipo_documento NOT NULL,
  url               TEXT           NOT NULL,
  fecha_subida      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  fecha_vencimiento DATE,
  estado            estado_documento NOT NULL DEFAULT 'pendiente'
);

CREATE TABLE certificados_donacion (
  id                       UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  constructora_id          UUID           NOT NULL REFERENCES constructoras(id) ON DELETE CASCADE,
  periodo                  VARCHAR(20)    NOT NULL,   -- ej: '2024-Q1' o '2024'
  total_materiales_donados INT            NOT NULL DEFAULT 0,
  valor_estimado_cop       NUMERIC(15, 2) NOT NULL DEFAULT 0,
  deduccion_estimada_cop   NUMERIC(15, 2) NOT NULL DEFAULT 0,
  pdf_url                  TEXT,
  generated_at             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_certificado_constructora_periodo UNIQUE (constructora_id, periodo)
);

-- =============================================================
-- ÍNDICES
-- =============================================================

-- Usuarios
CREATE INDEX idx_usuarios_email  ON usuarios(email);
CREATE INDEX idx_usuarios_rol    ON usuarios(rol);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);

-- Beneficiarios
CREATE INDEX idx_beneficiarios_cedula    ON beneficiarios(cedula);
CREATE INDEX idx_beneficiarios_localidad ON beneficiarios(localidad_id);

-- Constructoras
CREATE INDEX idx_constructoras_nit        ON constructoras(nit);
CREATE INDEX idx_constructoras_localidad  ON constructoras(localidad_id);
CREATE INDEX idx_constructoras_verificada ON constructoras(verificada);

-- Materiales
CREATE INDEX idx_materiales_constructora  ON materiales(constructora_id);
CREATE INDEX idx_materiales_categoria     ON materiales(categoria_id);
CREATE INDEX idx_materiales_estado_pub    ON materiales(estado_publicacion);
CREATE INDEX idx_materiales_fecha_limite  ON materiales(fecha_limite);

-- Solicitudes
CREATE INDEX idx_solicitudes_material     ON solicitudes_material(material_id);
CREATE INDEX idx_solicitudes_beneficiario ON solicitudes_material(beneficiario_id);
CREATE INDEX idx_solicitudes_estado       ON solicitudes_material(estado);

-- Eventos
CREATE INDEX idx_eventos_constructora ON eventos(constructora_id);
CREATE INDEX idx_eventos_estado       ON eventos(estado);
CREATE INDEX idx_eventos_fecha_inicio ON eventos(fecha_inicio);

-- Inscripciones
CREATE INDEX idx_inscripciones_beneficiario ON inscripciones_evento(beneficiario_id);
CREATE INDEX idx_inscripciones_evento       ON inscripciones_evento(evento_id);

-- Publicaciones
CREATE INDEX idx_publicaciones_autor  ON publicaciones(autor_id);
CREATE INDEX idx_publicaciones_estado ON publicaciones(estado);
CREATE INDEX idx_publicaciones_tipo   ON publicaciones(tipo);

-- Comentarios
CREATE INDEX idx_comentarios_publicacion ON comentarios(publicacion_id);
CREATE INDEX idx_comentarios_autor       ON comentarios(autor_id);

-- Notificaciones
CREATE INDEX idx_notificaciones_usuario      ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_usuario_leida ON notificaciones(usuario_id, leida);

-- Mensajes grupo
CREATE INDEX idx_mensajes_grupo_fecha ON mensajes_grupo(grupo_id, created_at DESC);

-- Miembros grupo
CREATE INDEX idx_miembros_usuario ON miembros_grupo(usuario_id);

-- Documentos
CREATE INDEX idx_documentos_constructora ON documentos_empresa(constructora_id);
CREATE INDEX idx_documentos_estado       ON documentos_empresa(estado);

-- =============================================================
-- TRIGGER: updated_at automático en tabla usuarios
-- =============================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================
-- ROW LEVEL SECURITY — Supabase
-- (Omitir en Neon o ajustar según estrategia de auth)
-- =============================================================

ALTER TABLE usuarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_empresa ENABLE ROW LEVEL SECURITY;

-- Política SELECT: cada usuario ve solo su propio registro
CREATE POLICY "usuarios_select_propio" ON usuarios
  FOR SELECT
  USING (auth.uid() = id);

-- Política UPDATE: cada usuario actualiza solo su registro
CREATE POLICY "usuarios_update_propio" ON usuarios
  FOR UPDATE
  USING (auth.uid() = id);

-- Política INSERT: el service-role puede insertar (registro)
-- En Supabase el service-role key bypasea RLS; para JWT normal:
CREATE POLICY "usuarios_insert_service" ON usuarios
  FOR INSERT
  WITH CHECK (TRUE);

-- Política: documentos visibles y editables solo por la constructora dueña
CREATE POLICY "documentos_propietario" ON documentos_empresa
  FOR ALL
  USING (
    constructora_id IN (
      SELECT id FROM constructoras WHERE usuario_id = auth.uid()
    )
  );

-- =============================================================
-- VISTAS ÚTILES
-- =============================================================

-- Vista: materiales activos con datos de constructora y localidad
CREATE OR REPLACE VIEW v_materiales_activos AS
SELECT
  m.id,
  m.nombre,
  m.descripcion,
  m.estado_material,
  m.cantidad,
  m.unidad_medida,
  m.condiciones_retiro,
  m.fecha_limite,
  m.max_solicitudes,
  m.created_at,
  cm.nombre    AS categoria,
  cm.color_hex AS categoria_color,
  cm.icono     AS categoria_icono,
  c.id         AS constructora_id,
  c.razon_social AS constructora_nombre,
  c.logo_url   AS constructora_logo,
  c.verificada AS constructora_verificada,
  l.nombre     AS localidad,
  (
    SELECT COUNT(*)
    FROM solicitudes_material s
    WHERE s.material_id = m.id
      AND s.estado NOT IN ('rechazada', 'cancelada')
  ) AS total_solicitudes,
  (
    SELECT url
    FROM fotos_material f
    WHERE f.material_id = m.id
    ORDER BY f.orden ASC
    LIMIT 1
  ) AS foto_portada
FROM materiales m
JOIN categorias_material cm ON cm.id = m.categoria_id
JOIN constructoras c        ON c.id  = m.constructora_id
LEFT JOIN localidades l     ON l.id  = c.localidad_id
WHERE m.estado_publicacion = 'activo'
  AND (m.fecha_limite IS NULL OR m.fecha_limite >= CURRENT_DATE);

-- Vista: estadísticas agregadas por constructora
CREATE OR REPLACE VIEW v_estadisticas_constructora AS
SELECT
  c.id                         AS constructora_id,
  c.razon_social,
  c.nit,
  c.verificada,
  COUNT(DISTINCT m.id)         AS total_materiales,
  COUNT(DISTINCT CASE WHEN m.estado_publicacion = 'activo' THEN m.id END)      AS materiales_activos,
  COUNT(DISTINCT s.id)         AS total_solicitudes,
  COUNT(DISTINCT CASE WHEN s.estado = 'entregada' THEN s.id END)               AS solicitudes_completadas,
  COUNT(DISTINCT e.id)         AS total_eventos,
  COUNT(DISTINCT CASE WHEN e.estado IN ('publicado', 'en_curso') THEN e.id END) AS eventos_activos,
  COALESCE(
    (SELECT SUM(cd.valor_estimado_cop)
     FROM certificados_donacion cd
     WHERE cd.constructora_id = c.id),
    0
  )                            AS valor_total_donado_cop
FROM constructoras c
LEFT JOIN materiales m           ON m.constructora_id = c.id
LEFT JOIN solicitudes_material s ON s.material_id = m.id
LEFT JOIN eventos e              ON e.constructora_id = c.id
GROUP BY c.id, c.razon_social, c.nit, c.verificada;

-- Vista: KPIs generales para dashboard de administrador
CREATE OR REPLACE VIEW v_dashboard_admin AS
SELECT
  (SELECT COUNT(*) FROM usuarios WHERE rol = 'BENEFICIARIO')              AS total_beneficiarios,
  (SELECT COUNT(*) FROM usuarios WHERE rol = 'CONSTRUCTORA')              AS total_constructoras,
  (SELECT COUNT(*) FROM constructoras WHERE verificada = TRUE)            AS constructoras_verificadas,
  (SELECT COUNT(*) FROM materiales WHERE estado_publicacion = 'activo')   AS materiales_activos,
  (SELECT COUNT(*) FROM materiales)                                        AS total_materiales,
  (SELECT COUNT(*) FROM solicitudes_material)                             AS total_solicitudes,
  (SELECT COUNT(*) FROM solicitudes_material WHERE estado = 'entregada')  AS solicitudes_completadas,
  (SELECT COUNT(*) FROM eventos WHERE estado IN ('publicado', 'en_curso')) AS eventos_activos,
  (SELECT COUNT(*) FROM eventos)                                           AS total_eventos,
  (SELECT COUNT(*) FROM publicaciones WHERE estado = 'publicada')         AS publicaciones_activas,
  (SELECT COUNT(*) FROM reportes WHERE estado = 'pendiente')              AS reportes_pendientes,
  (SELECT COALESCE(SUM(valor_estimado_cop), 0)
   FROM certificados_donacion)                                             AS valor_total_donaciones_cop;
