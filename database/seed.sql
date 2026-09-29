-- =============================================================
-- BrickByBrick — Catálogos iniciales (SQL plano)
--
-- Equivale a la parte de catálogos de backend/prisma/seed.js y es
-- idempotente (ON CONFLICT DO NOTHING). Ejecutar DESPUÉS de schema.sql.
--
-- Los usuarios (administrador y cuentas de demostración) NO se crean aquí:
-- sus contraseñas deben quedar hasheadas con bcrypt, así que se crean con
--   cd backend && npm run db:seed                 (catálogos + administrador)
--   cd backend && SEED_DEMO=true npm run db:seed  (además datos de demostración)
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
  ('Sumapaz')
ON CONFLICT (nombre) DO NOTHING;

-- =============================================================
-- CATEGORÍAS DE MATERIALES (íconos de Material Icons)
-- =============================================================

INSERT INTO categorias_material (nombre, color_hex, icono) VALUES
  ('Ladrillo y bloque',        '#C0392B', 'grid_view'),
  ('Cemento y concreto',       '#7F8C8D', 'texture'),
  ('Arena, grava y agregados', '#D4A017', 'landscape'),
  ('Madera',                   '#8B4513', 'forest'),
  ('Acero y hierro',           '#2C3E50', 'hardware'),
  ('Cerámica y porcelanato',   '#E67E22', 'grid_on'),
  ('Vidrio y ventanería',      '#2E86AB', 'window'),
  ('Pintura y acabados',       '#27AE60', 'format_paint'),
  ('Tubería y plomería',       '#16A085', 'plumbing'),
  ('Material eléctrico',       '#B7950B', 'electrical_services'),
  ('Puertas y carpintería',    '#6D4C41', 'door_front'),
  ('Otros',                    '#95A5A6', 'category')
ON CONFLICT (nombre) DO NOTHING;

-- =============================================================
-- CONFIGURACIÓN DEL SISTEMA (editable desde Administración → Configuración)
-- =============================================================

INSERT INTO configuracion_sistema (clave, valor) VALUES
  ('maxSolicitudesActivasBeneficiario', '5'),
  ('maxFotosMaterial',                  '5'),
  ('diasRecordatorioVencimiento',       '3'),
  ('umbralReportesOcultar',             '5'),
  ('porcentajeDescuentoTributario',     '25'),
  ('topeDescuentoSobreImpuesto',        '25'),
  ('emailSoporte',                      '"soporte@brickbybrick.co"'),
  ('modoMantenimiento',                 'false')
ON CONFLICT (clave) DO NOTHING;
