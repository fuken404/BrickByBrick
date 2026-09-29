-- CreateTable
CREATE TABLE "archivos_subidos" (
    "ruta" VARCHAR(300) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "tamano" INTEGER NOT NULL,
    "datos" BYTEA NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivos_subidos_pkey" PRIMARY KEY ("ruta")
);

