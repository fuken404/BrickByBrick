-- CreateEnum
CREATE TYPE "estado_inscripcion" AS ENUM ('inscrito', 'cancelada', 'asistio', 'no_asistio');

-- CreateEnum
CREATE TYPE "estado_miembro" AS ENUM ('activo', 'pendiente', 'invitado');

-- CreateEnum
CREATE TYPE "privacidad_grupo" AS ENUM ('publico', 'privado');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "tipo_notificacion" ADD VALUE 'solicitud_nueva';
ALTER TYPE "tipo_notificacion" ADD VALUE 'solicitud_cancelada';
ALTER TYPE "tipo_notificacion" ADD VALUE 'recepcion_confirmada';
ALTER TYPE "tipo_notificacion" ADD VALUE 'evento_nuevo';
ALTER TYPE "tipo_notificacion" ADD VALUE 'evento_cancelado';
ALTER TYPE "tipo_notificacion" ADD VALUE 'evento_actualizado';
ALTER TYPE "tipo_notificacion" ADD VALUE 'comentario_respuesta';
ALTER TYPE "tipo_notificacion" ADD VALUE 'repost';
ALTER TYPE "tipo_notificacion" ADD VALUE 'seguidor_nuevo';
ALTER TYPE "tipo_notificacion" ADD VALUE 'mensaje_nuevo';
ALTER TYPE "tipo_notificacion" ADD VALUE 'grupo_solicitud';
ALTER TYPE "tipo_notificacion" ADD VALUE 'documento_revisado';
ALTER TYPE "tipo_notificacion" ADD VALUE 'reporte_resuelto';
ALTER TYPE "tipo_notificacion" ADD VALUE 'cuenta';

-- AlterEnum
ALTER TYPE "tipo_publicacion" ADD VALUE 'producto';

-- DropIndex
DROP INDEX "solicitudes_material_material_id_beneficiario_id_key";

-- AlterTable
ALTER TABLE "beneficiarios" ADD COLUMN     "bio_publica" TEXT,
ADD COLUMN     "nombre_emprendimiento" VARCHAR(150),
ADD COLUMN     "portafolio_publico" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "comentarios" ADD COLUMN     "editado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oculto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "constructoras" ADD COLUMN     "motivo_rechazo" TEXT;

-- AlterTable
ALTER TABLE "documentos_empresa" ADD COLUMN     "motivo_rechazo" TEXT,
ADD COLUMN     "revisado_en" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "motivo_cancelacion" TEXT,
ADD COLUMN     "publicado_en" TIMESTAMPTZ,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "grupos" ADD COLUMN     "privacidad" "privacidad_grupo" NOT NULL DEFAULT 'publico',
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "inscripciones_evento" ADD COLUMN     "estado" "estado_inscripcion" NOT NULL DEFAULT 'inscrito',
ADD COLUMN     "fecha_cancelacion" TIMESTAMPTZ;
-- Conservar la asistencia registrada antes de eliminar la columna booleana
UPDATE "inscripciones_evento" SET "estado" = 'asistio' WHERE "asistio" = true;
ALTER TABLE "inscripciones_evento" DROP COLUMN "asistio";

-- AlterTable
ALTER TABLE "materiales" ADD COLUMN     "cantidad_inicial" DECIMAL(10,2),
ADD COLUMN     "eliminado_en" TIMESTAMPTZ,
ADD COLUMN     "publicado_en" TIMESTAMPTZ,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "valor_unitario_cop" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "miembros_grupo" ADD COLUMN     "estado" "estado_miembro" NOT NULL DEFAULT 'activo';

-- AlterTable
ALTER TABLE "publicaciones" DROP COLUMN "visibilidad",
ADD COLUMN     "editada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "repost_de_id" UUID,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "titulo" DROP NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'publicada';

-- AlterTable
ALTER TABLE "reportes" ADD COLUMN     "resolucion" TEXT,
ADD COLUMN     "resuelto_en" TIMESTAMPTZ,
ADD COLUMN     "resuelto_por" UUID;

-- AlterTable
ALTER TABLE "solicitudes_material" ADD COLUMN     "fecha_cancelacion" TIMESTAMPTZ,
ADD COLUMN     "fecha_confirmacion" TIMESTAMPTZ,
ADD COLUMN     "motivo_rechazo" TEXT,
ADD COLUMN     "numero_constancia" VARCHAR(30),
ADD COLUMN     "valor_donado_cop" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "tokens_usuario" ADD COLUMN     "intentos" SMALLINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "mfa_habilitado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferencias_notif" JSONB NOT NULL DEFAULT '{"email": true, "inApp": true}',
ADD COLUMN     "telefono" VARCHAR(20),
ADD COLUMN     "ultimo_login" TIMESTAMPTZ;

-- DropEnum
DROP TYPE "visibilidad_pub";

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "clave" VARCHAR(60) NOT NULL,
    "valor" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "likes_comentario" (
    "usuario_id" UUID NOT NULL,
    "comentario_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_comentario_pkey" PRIMARY KEY ("usuario_id","comentario_id")
);

-- CreateTable
CREATE TABLE "seguidores" (
    "seguidor_id" UUID NOT NULL,
    "seguido_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguidores_pkey" PRIMARY KEY ("seguidor_id","seguido_id")
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
CREATE INDEX "likes_comentario_comentario_id_idx" ON "likes_comentario"("comentario_id");

-- CreateIndex
CREATE INDEX "seguidores_seguido_id_idx" ON "seguidores"("seguido_id");

-- CreateIndex
CREATE INDEX "conversaciones_usuario_b_id_idx" ON "conversaciones"("usuario_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversaciones_usuario_a_id_usuario_b_id_key" ON "conversaciones"("usuario_a_id", "usuario_b_id");

-- CreateIndex
CREATE INDEX "mensajes_directos_conversacion_id_created_at_idx" ON "mensajes_directos"("conversacion_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auditoria_entidad_entidad_id_idx" ON "auditoria"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "auditoria_created_at_idx" ON "auditoria"("created_at" DESC);

-- CreateIndex
CREATE INDEX "intentos_login_created_at_idx" ON "intentos_login"("created_at" DESC);

-- CreateIndex
CREATE INDEX "intentos_login_email_idx" ON "intentos_login"("email");

-- CreateIndex
CREATE INDEX "beneficiarios_localidad_id_idx" ON "beneficiarios"("localidad_id");

-- CreateIndex
CREATE INDEX "comentarios_publicacion_id_idx" ON "comentarios"("publicacion_id");

-- CreateIndex
CREATE INDEX "comentarios_autor_id_idx" ON "comentarios"("autor_id");

-- CreateIndex
CREATE INDEX "comentarios_parent_id_idx" ON "comentarios"("parent_id");

-- CreateIndex
CREATE INDEX "constructoras_verificada_idx" ON "constructoras"("verificada");

-- CreateIndex
CREATE INDEX "constructoras_localidad_id_idx" ON "constructoras"("localidad_id");

-- CreateIndex
CREATE INDEX "documentos_empresa_constructora_id_idx" ON "documentos_empresa"("constructora_id");

-- CreateIndex
CREATE INDEX "documentos_empresa_estado_idx" ON "documentos_empresa"("estado");

-- CreateIndex
CREATE INDEX "eventos_constructora_id_idx" ON "eventos"("constructora_id");

-- CreateIndex
CREATE INDEX "eventos_estado_idx" ON "eventos"("estado");

-- CreateIndex
CREATE INDEX "eventos_fecha_inicio_idx" ON "eventos"("fecha_inicio");

-- CreateIndex
CREATE INDEX "fotos_material_material_id_idx" ON "fotos_material"("material_id");

-- CreateIndex
CREATE INDEX "inscripciones_evento_beneficiario_id_idx" ON "inscripciones_evento"("beneficiario_id");

-- CreateIndex
CREATE INDEX "likes_publicacion_id_idx" ON "likes"("publicacion_id");

-- CreateIndex
CREATE INDEX "materiales_constructora_id_idx" ON "materiales"("constructora_id");

-- CreateIndex
CREATE INDEX "materiales_categoria_id_idx" ON "materiales"("categoria_id");

-- CreateIndex
CREATE INDEX "materiales_estado_publicacion_idx" ON "materiales"("estado_publicacion");

-- CreateIndex
CREATE INDEX "materiales_fecha_limite_idx" ON "materiales"("fecha_limite");

-- CreateIndex
CREATE INDEX "mensajes_grupo_grupo_id_created_at_idx" ON "mensajes_grupo"("grupo_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "miembros_grupo_usuario_id_idx" ON "miembros_grupo"("usuario_id");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_leida_idx" ON "notificaciones"("usuario_id", "leida");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_created_at_idx" ON "notificaciones"("usuario_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "publicaciones_autor_id_idx" ON "publicaciones"("autor_id");

-- CreateIndex
CREATE INDEX "publicaciones_estado_created_at_idx" ON "publicaciones"("estado", "created_at");

-- CreateIndex
CREATE INDEX "publicaciones_tipo_idx" ON "publicaciones"("tipo");

-- CreateIndex
CREATE INDEX "publicaciones_repost_de_id_idx" ON "publicaciones"("repost_de_id");

-- CreateIndex
CREATE INDEX "reportes_estado_idx" ON "reportes"("estado");

-- CreateIndex
CREATE INDEX "reportes_tipo_contenido_contenido_id_idx" ON "reportes"("tipo_contenido", "contenido_id");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_material_numero_constancia_key" ON "solicitudes_material"("numero_constancia");

-- CreateIndex
CREATE INDEX "solicitudes_material_material_id_idx" ON "solicitudes_material"("material_id");

-- CreateIndex
CREATE INDEX "solicitudes_material_beneficiario_id_idx" ON "solicitudes_material"("beneficiario_id");

-- CreateIndex
CREATE INDEX "solicitudes_material_estado_idx" ON "solicitudes_material"("estado");

-- CreateIndex
CREATE INDEX "tokens_usuario_token_hash_idx" ON "tokens_usuario"("token_hash");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE INDEX "usuarios_estado_idx" ON "usuarios"("estado");

-- AddForeignKey
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_repost_de_id_fkey" FOREIGN KEY ("repost_de_id") REFERENCES "publicaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes_comentario" ADD CONSTRAINT "likes_comentario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes_comentario" ADD CONSTRAINT "likes_comentario_comentario_id_fkey" FOREIGN KEY ("comentario_id") REFERENCES "comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_resuelto_por_fkey" FOREIGN KEY ("resuelto_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguidores" ADD CONSTRAINT "seguidores_seguidor_id_fkey" FOREIGN KEY ("seguidor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguidores" ADD CONSTRAINT "seguidores_seguido_id_fkey" FOREIGN KEY ("seguido_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_usuario_a_id_fkey" FOREIGN KEY ("usuario_a_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_usuario_b_id_fkey" FOREIGN KEY ("usuario_b_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_directos" ADD CONSTRAINT "mensajes_directos_conversacion_id_fkey" FOREIGN KEY ("conversacion_id") REFERENCES "conversaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_directos" ADD CONSTRAINT "mensajes_directos_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_login" ADD CONSTRAINT "intentos_login_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Datos existentes: cantidad inicial y fecha de publicación de materiales ya publicados
UPDATE "materiales" SET "cantidad_inicial" = "cantidad" WHERE "cantidad_inicial" IS NULL;
UPDATE "materiales" SET "publicado_en" = "created_at" WHERE "estado_publicacion" <> 'borrador' AND "publicado_en" IS NULL;
UPDATE "eventos" SET "publicado_en" = "fecha_inicio" WHERE "estado" <> 'borrador' AND "publicado_en" IS NULL;

-- Consecutivo de constancias de donación (BBB-<año>-<n>)
CREATE SEQUENCE IF NOT EXISTS "constancia_donacion_seq" START 1;
