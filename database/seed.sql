-- =============================================================
-- BrickByBrick — Datos Iniciales (Seed)
-- Ejecutar DESPUÉS de schema.sql
-- =============================================================

-- =============================================================
-- LOCALIDADES DE BOGOTÁ (20 localidades oficiales)
-- =============================================================

INSERT INTO localidades (nombre) VALUES
  ('Usaquén'),
  ('Chapinero'),
  ('Santa Fe'),
  ('San Cristóbal'),
  ('Usme'),
  ('Tunjuelito'),
  ('Bosa'),
  ('Kennedy'),
  ('Fontibón'),
  ('Engativá'),
  ('Suba'),
  ('Barrios Unidos'),
  ('Teusaquillo'),
  ('Los Mártires'),
  ('Antonio Nariño'),
  ('Puente Aranda'),
  ('La Candelaria'),
  ('Rafael Uribe Uribe'),
  ('Ciudad Bolívar'),
  ('Sumapaz');

-- =============================================================
-- CATEGORÍAS DE MATERIALES
-- Iconos: Material Icons (Google)
-- =============================================================

INSERT INTO categorias_material (nombre, color_hex, icono) VALUES
  ('Ladrillo',  '#C0392B', 'construction'),
  ('Concreto',  '#7F8C8D', 'texture'),
  ('Madera',    '#8B4513', 'forest'),
  ('Cerámica',  '#E67E22', 'grid_on'),
  ('Hierro',    '#2C3E50', 'hardware'),
  ('Vidrio',    '#2E86AB', 'window'),
  ('Pintura',   '#27AE60', 'format_color_fill'),
  ('Acero',     '#95A5A6', 'straighten'),
  ('PVC',       '#F39C12', 'plumbing'),
  ('Otro',      '#BDC3C7', 'category');

-- =============================================================
-- USUARIOS DE PRUEBA
--
-- Admin:         admin@brickbybrick.co      / Admin@BrickByBrick2024
-- Beneficiarios: beneficiario1@test.co      / Test@1234
--                beneficiario2@test.co      / Test@1234
--                beneficiario3@test.co      / Test@1234
-- Constructoras: constructora1@test.co      / Test@1234
--                constructora2@test.co      / Test@1234
--
-- Hashes generados con bcryptjs (rounds=12) — compatibles con auth-service
-- =============================================================

-- ── Admin ──────────────────────────────────────────────────────
INSERT INTO usuarios (id, email, password_hash, rol, estado)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@brickbybrick.co',
  '$2a$12$kbt8XS9VgvHVn.hrGYm4d.xY1fhVl4U/rzlMEPnlWuoqCp4CFGlK6',
  'ADMINISTRADOR',
  'activo'
);

-- ── Beneficiarios ──────────────────────────────────────────────
INSERT INTO usuarios (id, email, password_hash, rol, estado) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'beneficiario1@test.co', '$2a$12$i6GP1EqpQgbG1cjlo6OxnOgYD9oNBPv5wm3uByGGAfEeODavWex0W', 'BENEFICIARIO', 'activo'),
  ('b0000000-0000-0000-0000-000000000002', 'beneficiario2@test.co', '$2a$12$i6GP1EqpQgbG1cjlo6OxnOgYD9oNBPv5wm3uByGGAfEeODavWex0W', 'BENEFICIARIO', 'activo'),
  ('b0000000-0000-0000-0000-000000000003', 'beneficiario3@test.co', '$2a$12$i6GP1EqpQgbG1cjlo6OxnOgYD9oNBPv5wm3uByGGAfEeODavWex0W', 'BENEFICIARIO', 'activo');

INSERT INTO beneficiarios (id, usuario_id, nombre_completo, cedula, estrato, localidad_id, es_alimentador_web) VALUES
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'María García López',   '1020304050', 2, 7,  false),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'Carlos Rincón Pérez',  '1030405060', 3, 8,  true),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 'Ana Moreno Castillo',  '1040506070', 1, 19, false);

-- ── Constructoras ──────────────────────────────────────────────
INSERT INTO usuarios (id, email, password_hash, rol, estado) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'constructora1@test.co', '$2a$12$i6GP1EqpQgbG1cjlo6OxnOgYD9oNBPv5wm3uByGGAfEeODavWex0W', 'CONSTRUCTORA', 'activo'),
  ('c0000000-0000-0000-0000-000000000002', 'constructora2@test.co', '$2a$12$i6GP1EqpQgbG1cjlo6OxnOgYD9oNBPv5wm3uByGGAfEeODavWex0W', 'CONSTRUCTORA', 'activo');

INSERT INTO constructoras (id, usuario_id, razon_social, nit, representante_legal, cargo_representante, direccion, localidad_id, verificada) VALUES
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 'Constructora Bogotá S.A.S',  '900111222-1', 'Jorge Vargas Díaz',    'Gerente General',  'Cra 15 # 93-47, Chapinero',   2,  true),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 'Edificaciones Modernas Ltda', '900333444-5', 'Lucía Bermúdez Torres', 'Representante Legal', 'Av. Boyacá # 72-15, Engativá', 10, false);
