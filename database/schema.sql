-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('BENEFICIARIO', 'CONSTRUCTORA', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "estado_usuario" AS ENUM ('activo', 'inactivo', 'suspendido');

-- CreateEnum
CREATE TYPE "genero_tipo" AS ENUM ('masculino', 'femenino', 'no_binario', 'prefiero_no_decir');

-- CreateEnum
CREATE TYPE "estado_material" AS ENUM ('nuevo', 'buen_estado', 'usado');

-- CreateEnum
CREATE TYPE "estado_pub_material" AS ENUM ('borrador', 'activo', 'pausado', 'agotado', 'vencido');

-- CreateEnum
CREATE TYPE "estado_solicitud" AS ENUM ('pendiente', 'aprobada', 'rechazada', 'entregada', 'cancelada');

-- CreateEnum
CREATE TYPE "tipo_evento" AS ENUM ('entrega_masiva', 'taller', 'feria', 'otro');

-- CreateEnum
CREATE TYPE "estado_evento" AS ENUM ('borrador', 'publicado', 'en_curso', 'finalizado', 'cancelado');

-- CreateEnum
CREATE TYPE "estado_inscripcion" AS ENUM ('inscrito', 'cancelada', 'asistio', 'no_asistio');

-- CreateEnum
CREATE TYPE "tipo_publicacion" AS ENUM ('reutilizacion', 'tutorial', 'proyecto', 'producto', 'noticia', 'recurso');

-- CreateEnum
CREATE TYPE "estado_publicacion" AS ENUM ('borrador', 'publicada', 'suspendida');

-- CreateEnum
CREATE TYPE "tipo_reporte" AS ENUM ('publicacion', 'material', 'comentario', 'usuario');

-- CreateEnum
CREATE TYPE "estado_reporte" AS ENUM ('pendiente', 'resuelto', 'ignorado');

-- CreateEnum
CREATE TYPE "rol_miembro" AS ENUM ('admin', 'miembro');

-- CreateEnum
CREATE TYPE "estado_miembro" AS ENUM ('activo', 'pendiente', 'invitado');

-- CreateEnum
CREATE TYPE "privacidad_grupo" AS ENUM ('publico', 'privado');

-- CreateEnum
CREATE TYPE "tipo_notificacion" AS ENUM ('material_nuevo', 'solicitud_nueva', 'solicitud_aprobada', 'solicitud_rechazada', 'solicitud_entregada', 'solicitud_cancelada', 'recepcion_confirmada', 'evento_nuevo', 'evento_inscripcion', 'evento_cupos_bajos', 'evento_cancelado', 'evento_actualizado', 'comentario', 'comentario_respuesta', 'like', 'repost', 'seguidor_nuevo', 'mensaje_nuevo', 'grupo_invitacion', 'grupo_solicitud', 'verificacion', 'documento_revisado', 'reporte_resuelto', 'material_vence', 'cuenta');

-- CreateEnum
CREATE TYPE "tipo_documento" AS ENUM ('rut', 'camara_comercio');

-- CreateEnum
CREATE TYPE "estado_documento" AS ENUM ('pendiente', 'aprobado', 'vencido', 'rechazado');

-- CreateTable
CREATE TABLE "localidades" (
    "id" SMALLSERIAL NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,

    CONSTRAINT "localidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_material" (
    "id" SMALLSERIAL NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "color_hex" CHAR(7) NOT NULL,
    "icono" VARCHAR(60) NOT NULL,

    CONSTRAINT "categorias_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "clave" VARCHAR(60) NOT NULL,
    "valor" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "rol_usuario" NOT NULL,
    "estado" "estado_usuario" NOT NULL DEFAULT 'activo',
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "telefono" VARCHAR(20),
    "avatar_url" TEXT,
    "mfa_habilitado" BOOLEAN NOT NULL DEFAULT false,
    "preferencias_notif" JSONB NOT NULL DEFAULT '{"email": true, "inApp": true}',
    "ultimo_login" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "intentos" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "nombre_completo" VARCHAR(150) NOT NULL,
    "cedula" VARCHAR(20) NOT NULL,
    "fecha_nacimiento" DATE,
    "genero" "genero_tipo",
    "estrato" SMALLINT,
    "localidad_id" SMALLINT,
    "es_alimentador_web" BOOLEAN NOT NULL DEFAULT false,
    "nombre_emprendimiento" VARCHAR(150),
    "bio_publica" TEXT,
    "portafolio_publico" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "beneficiarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constructoras" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "razon_social" VARCHAR(200) NOT NULL,
    "nit" VARCHAR(20) NOT NULL,
    "representante_legal" VARCHAR(150),
    "cargo_representante" VARCHAR(100),
    "num_empleados" INTEGER,
    "direccion" TEXT,
    "localidad_id" SMALLINT,
    "descripcion" TEXT,
    "logo_url" TEXT,
    "sitio_web" TEXT,
    "verificada" BOOLEAN NOT NULL DEFAULT false,
    "fecha_verificacion" TIMESTAMPTZ,
    "motivo_rechazo" TEXT,

    CONSTRAINT "constructoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_empresa" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "constructora_id" UUID NOT NULL,
    "tipo" "tipo_documento" NOT NULL,
    "url" TEXT NOT NULL,
    "fecha_subida" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" DATE,
    "estado" "estado_documento" NOT NULL DEFAULT 'pendiente',
    "motivo_rechazo" TEXT,
    "revisado_en" TIMESTAMPTZ,

    CONSTRAINT "documentos_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "constructora_id" UUID NOT NULL,
    "categoria_id" SMALLINT NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "estado_material" "estado_material" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "cantidad_inicial" DECIMAL(10,2),
    "unidad_medida" VARCHAR(30) NOT NULL,
    "valor_unitario_cop" DECIMAL(15,2),
    "condiciones_retiro" TEXT,
    "fecha_limite" DATE,
    "max_solicitudes" INTEGER,
    "estado_publicacion" "estado_pub_material" NOT NULL DEFAULT 'borrador',
    "publicado_en" TIMESTAMPTZ,
    "eliminado_en" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_material" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "material_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "orden" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "fotos_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes_material" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "material_id" UUID NOT NULL,
    "beneficiario_id" UUID NOT NULL,
    "cantidad_solicitada" DECIMAL(10,2) NOT NULL,
    "proposito_uso" VARCHAR(200),
    "descripcion_proyecto" TEXT,
    "estado" "estado_solicitud" NOT NULL DEFAULT 'pendiente',
    "instrucciones_retiro" TEXT,
    "motivo_rechazo" TEXT,
    "fecha_solicitud" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_respuesta" TIMESTAMPTZ,
    "fecha_entrega" TIMESTAMPTZ,
    "fecha_confirmacion" TIMESTAMPTZ,
    "fecha_cancelacion" TIMESTAMPTZ,
    "valor_donado_cop" DECIMAL(15,2),
    "numero_constancia" VARCHAR(30),
    "calificacion" SMALLINT,
    "comentario_calificacion" TEXT,

    CONSTRAINT "solicitudes_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados_donacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "constructora_id" UUID NOT NULL,
    "periodo" VARCHAR(20) NOT NULL,
    "total_materiales_donados" INTEGER NOT NULL DEFAULT 0,
    "valor_estimado_cop" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deduccion_estimada_cop" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pdf_url" TEXT,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificados_donacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "constructora_id" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "tipo_evento" "tipo_evento" NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" TIMESTAMPTZ NOT NULL,
    "fecha_fin" TIMESTAMPTZ NOT NULL,
    "direccion" TEXT,
    "localidad_id" SMALLINT,
    "capacidad_maxima" INTEGER,
    "imagen_url" TEXT,
    "estado" "estado_evento" NOT NULL DEFAULT 'borrador',
    "motivo_cancelacion" TEXT,
    "publicado_en" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiales_evento" (
    "evento_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,

    CONSTRAINT "materiales_evento_pkey" PRIMARY KEY ("evento_id","material_id")
);

-- CreateTable
CREATE TABLE "inscripciones_evento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evento_id" UUID NOT NULL,
    "beneficiario_id" UUID NOT NULL,
    "estado" "estado_inscripcion" NOT NULL DEFAULT 'inscrito',
    "fecha_inscripcion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cancelacion" TIMESTAMPTZ,

    CONSTRAINT "inscripciones_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publicaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "autor_id" UUID NOT NULL,
    "tipo" "tipo_publicacion" NOT NULL,
    "titulo" VARCHAR(300),
    "contenido" TEXT NOT NULL,
    "estado" "estado_publicacion" NOT NULL DEFAULT 'publicada',
    "repost_de_id" UUID,
    "editada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_publicacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicacion_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "orden" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "fotos_publicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiales_publicacion" (
    "publicacion_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,

    CONSTRAINT "materiales_publicacion_pkey" PRIMARY KEY ("publicacion_id","material_id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicacion_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "contenido" TEXT NOT NULL,
    "parent_id" UUID,
    "editado" BOOLEAN NOT NULL DEFAULT false,
    "oculto" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "usuario_id" UUID NOT NULL,
    "publicacion_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("usuario_id","publicacion_id")
);

-- CreateTable
CREATE TABLE "likes_comentario" (
    "usuario_id" UUID NOT NULL,
    "comentario_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_comentario_pkey" PRIMARY KEY ("usuario_id","comentario_id")
);

-- CreateTable
CREATE TABLE "reportes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo_contenido" "tipo_reporte" NOT NULL,
    "contenido_id" UUID NOT NULL,
    "reportado_por" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "estado_reporte" NOT NULL DEFAULT 'pendiente',
    "resolucion" TEXT,
    "resuelto_por" UUID,
    "resuelto_en" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguidores" (
    "seguidor_id" UUID NOT NULL,
    "seguido_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguidores_pkey" PRIMARY KEY ("seguidor_id","seguido_id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "imagen_url" TEXT,
    "privacidad" "privacidad_grupo" NOT NULL DEFAULT 'publico',
    "creador_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temas_grupo" (
    "grupo_id" UUID NOT NULL,
    "tema" VARCHAR(80) NOT NULL,

    CONSTRAINT "temas_grupo_pkey" PRIMARY KEY ("grupo_id","tema")
);

-- CreateTable
CREATE TABLE "miembros_grupo" (
    "grupo_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "rol" "rol_miembro" NOT NULL DEFAULT 'miembro',
    "estado" "estado_miembro" NOT NULL DEFAULT 'activo',
    "fecha_union" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "miembros_grupo_pkey" PRIMARY KEY ("grupo_id","usuario_id")
);

-- CreateTable
CREATE TABLE "mensajes_grupo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grupo_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "contenido" TEXT NOT NULL,
    "adjunto_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_a_id" UUID NOT NULL,
    "usuario_b_id" UUID NOT NULL,
    "ultimo_mensaje_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_directos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversacion_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "contenido" TEXT NOT NULL,
    "adjunto_url" TEXT,
    "leido_en" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_directos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "tipo" "tipo_notificacion" NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "url_destino" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID,
    "accion" VARCHAR(100) NOT NULL,
    "entidad" VARCHAR(60) NOT NULL,
    "entidad_id" VARCHAR(64),
    "detalle" JSONB,
    "ip" VARCHAR(64),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intentos_login" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "usuario_id" UUID,
    "exito" BOOLEAN NOT NULL,
    "motivo" VARCHAR(60),
    "ip" VARCHAR(64),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intentos_login_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "localidades_nombre_key" ON "localidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_material_nombre_key" ON "categorias_material"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE INDEX "usuarios_estado_idx" ON "usuarios"("estado");

-- CreateIndex
CREATE INDEX "tokens_usuario_usuario_id_tipo_usado_idx" ON "tokens_usuario"("usuario_id", "tipo", "usado");

-- CreateIndex
CREATE INDEX "tokens_usuario_token_hash_idx" ON "tokens_usuario"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiarios_usuario_id_key" ON "beneficiarios"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiarios_cedula_key" ON "beneficiarios"("cedula");

-- CreateIndex
CREATE INDEX "beneficiarios_localidad_id_idx" ON "beneficiarios"("localidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "constructoras_usuario_id_key" ON "constructoras"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "constructoras_nit_key" ON "constructoras"("nit");

-- CreateIndex
CREATE INDEX "constructoras_verificada_idx" ON "constructoras"("verificada");

-- CreateIndex
CREATE INDEX "constructoras_localidad_id_idx" ON "constructoras"("localidad_id");

-- CreateIndex
CREATE INDEX "documentos_empresa_constructora_id_idx" ON "documentos_empresa"("constructora_id");

-- CreateIndex
CREATE INDEX "documentos_empresa_estado_idx" ON "documentos_empresa"("estado");

-- CreateIndex
CREATE INDEX "materiales_constructora_id_idx" ON "materiales"("constructora_id");

-- CreateIndex
CREATE INDEX "materiales_categoria_id_idx" ON "materiales"("categoria_id");

-- CreateIndex
CREATE INDEX "materiales_estado_publicacion_idx" ON "materiales"("estado_publicacion");

-- CreateIndex
CREATE INDEX "materiales_fecha_limite_idx" ON "materiales"("fecha_limite");

-- CreateIndex
CREATE INDEX "fotos_material_material_id_idx" ON "fotos_material"("material_id");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_material_numero_constancia_key" ON "solicitudes_material"("numero_constancia");

-- CreateIndex
CREATE INDEX "solicitudes_material_material_id_idx" ON "solicitudes_material"("material_id");

-- CreateIndex
CREATE INDEX "solicitudes_material_beneficiario_id_idx" ON "solicitudes_material"("beneficiario_id");

-- CreateIndex
CREATE INDEX "solicitudes_material_estado_idx" ON "solicitudes_material"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_donacion_constructora_id_periodo_key" ON "certificados_donacion"("constructora_id", "periodo");

-- CreateIndex
CREATE INDEX "eventos_constructora_id_idx" ON "eventos"("constructora_id");

-- CreateIndex
CREATE INDEX "eventos_estado_idx" ON "eventos"("estado");

-- CreateIndex
CREATE INDEX "eventos_fecha_inicio_idx" ON "eventos"("fecha_inicio");

-- CreateIndex
CREATE INDEX "inscripciones_evento_beneficiario_id_idx" ON "inscripciones_evento"("beneficiario_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_evento_evento_id_beneficiario_id_key" ON "inscripciones_evento"("evento_id", "beneficiario_id");

-- CreateIndex
CREATE INDEX "publicaciones_autor_id_idx" ON "publicaciones"("autor_id");

-- CreateIndex
CREATE INDEX "publicaciones_estado_created_at_idx" ON "publicaciones"("estado", "created_at");

-- CreateIndex
CREATE INDEX "publicaciones_tipo_idx" ON "publicaciones"("tipo");

-- CreateIndex
CREATE INDEX "publicaciones_repost_de_id_idx" ON "publicaciones"("repost_de_id");

-- CreateIndex
CREATE INDEX "comentarios_publicacion_id_idx" ON "comentarios"("publicacion_id");

-- CreateIndex
CREATE INDEX "comentarios_autor_id_idx" ON "comentarios"("autor_id");

-- CreateIndex
CREATE INDEX "comentarios_parent_id_idx" ON "comentarios"("parent_id");

-- CreateIndex
CREATE INDEX "likes_publicacion_id_idx" ON "likes"("publicacion_id");

-- CreateIndex
CREATE INDEX "likes_comentario_comentario_id_idx" ON "likes_comentario"("comentario_id");

-- CreateIndex
CREATE INDEX "reportes_estado_idx" ON "reportes"("estado");

-- CreateIndex
CREATE INDEX "reportes_tipo_contenido_contenido_id_idx" ON "reportes"("tipo_contenido", "contenido_id");

-- CreateIndex
CREATE INDEX "seguidores_seguido_id_idx" ON "seguidores"("seguido_id");

-- CreateIndex
CREATE INDEX "miembros_grupo_usuario_id_idx" ON "miembros_grupo"("usuario_id");

-- CreateIndex
CREATE INDEX "mensajes_grupo_grupo_id_created_at_idx" ON "mensajes_grupo"("grupo_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "conversaciones_usuario_b_id_idx" ON "conversaciones"("usuario_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversaciones_usuario_a_id_usuario_b_id_key" ON "conversaciones"("usuario_a_id", "usuario_b_id");

-- CreateIndex
CREATE INDEX "mensajes_directos_conversacion_id_created_at_idx" ON "mensajes_directos"("conversacion_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_leida_idx" ON "notificaciones"("usuario_id", "leida");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_created_at_idx" ON "notificaciones"("usuario_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auditoria_entidad_entidad_id_idx" ON "auditoria"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "auditoria_created_at_idx" ON "auditoria"("created_at" DESC);

-- CreateIndex
CREATE INDEX "intentos_login_created_at_idx" ON "intentos_login"("created_at" DESC);

-- CreateIndex
CREATE INDEX "intentos_login_email_idx" ON "intentos_login"("email");

-- AddForeignKey
ALTER TABLE "tokens_usuario" ADD CONSTRAINT "tokens_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiarios" ADD CONSTRAINT "beneficiarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiarios" ADD CONSTRAINT "beneficiarios_localidad_id_fkey" FOREIGN KEY ("localidad_id") REFERENCES "localidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constructoras" ADD CONSTRAINT "constructoras_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constructoras" ADD CONSTRAINT "constructoras_localidad_id_fkey" FOREIGN KEY ("localidad_id") REFERENCES "localidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_empresa" ADD CONSTRAINT "documentos_empresa_constructora_id_fkey" FOREIGN KEY ("constructora_id") REFERENCES "constructoras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales" ADD CONSTRAINT "materiales_constructora_id_fkey" FOREIGN KEY ("constructora_id") REFERENCES "constructoras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales" ADD CONSTRAINT "materiales_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_material" ADD CONSTRAINT "fotos_material_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_material" ADD CONSTRAINT "solicitudes_material_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_material" ADD CONSTRAINT "solicitudes_material_beneficiario_id_fkey" FOREIGN KEY ("beneficiario_id") REFERENCES "beneficiarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados_donacion" ADD CONSTRAINT "certificados_donacion_constructora_id_fkey" FOREIGN KEY ("constructora_id") REFERENCES "constructoras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_constructora_id_fkey" FOREIGN KEY ("constructora_id") REFERENCES "constructoras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_localidad_id_fkey" FOREIGN KEY ("localidad_id") REFERENCES "localidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales_evento" ADD CONSTRAINT "materiales_evento_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales_evento" ADD CONSTRAINT "materiales_evento_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones_evento" ADD CONSTRAINT "inscripciones_evento_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones_evento" ADD CONSTRAINT "inscripciones_evento_beneficiario_id_fkey" FOREIGN KEY ("beneficiario_id") REFERENCES "beneficiarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_repost_de_id_fkey" FOREIGN KEY ("repost_de_id") REFERENCES "publicaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_publicacion" ADD CONSTRAINT "fotos_publicacion_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales_publicacion" ADD CONSTRAINT "materiales_publicacion_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales_publicacion" ADD CONSTRAINT "materiales_publicacion_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes_comentario" ADD CONSTRAINT "likes_comentario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes_comentario" ADD CONSTRAINT "likes_comentario_comentario_id_fkey" FOREIGN KEY ("comentario_id") REFERENCES "comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_reportado_por_fkey" FOREIGN KEY ("reportado_por") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_resuelto_por_fkey" FOREIGN KEY ("resuelto_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguidores" ADD CONSTRAINT "seguidores_seguidor_id_fkey" FOREIGN KEY ("seguidor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguidores" ADD CONSTRAINT "seguidores_seguido_id_fkey" FOREIGN KEY ("seguido_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temas_grupo" ADD CONSTRAINT "temas_grupo_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros_grupo" ADD CONSTRAINT "miembros_grupo_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros_grupo" ADD CONSTRAINT "miembros_grupo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_grupo" ADD CONSTRAINT "mensajes_grupo_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_grupo" ADD CONSTRAINT "mensajes_grupo_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_usuario_a_id_fkey" FOREIGN KEY ("usuario_a_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_usuario_b_id_fkey" FOREIGN KEY ("usuario_b_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_directos" ADD CONSTRAINT "mensajes_directos_conversacion_id_fkey" FOREIGN KEY ("conversacion_id") REFERENCES "conversaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_directos" ADD CONSTRAINT "mensajes_directos_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_login" ADD CONSTRAINT "intentos_login_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- =============================================================
-- Objetos que Prisma no modela (se crean en las migraciones)
-- =============================================================

-- Consecutivo de las constancias de donación (BBB-<año>-<nnnnnn>)
CREATE SEQUENCE IF NOT EXISTS "constancia_donacion_seq" START 1;
