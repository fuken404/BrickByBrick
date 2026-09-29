import { Pipe, PipeTransform } from '@angular/core';

export interface BadgeConfig { label: string; cssClass: string }

type Contexto = 'material' | 'solicitud' | 'evento' | 'inscripcion' | 'usuario' | 'documento' | 'reporte' | 'publicacion' | 'estadoMaterial';

const MAPAS: Record<Contexto, Record<string, BadgeConfig>> = {
  material: {
    borrador: { label: 'Borrador', cssClass: 'badge-entregado' },
    activo: { label: 'Disponible', cssClass: 'badge-disponible' },
    pausado: { label: 'Pausado', cssClass: 'badge-warning' },
    agotado: { label: 'Agotado', cssClass: 'badge-rechazado' },
    vencido: { label: 'Vencido', cssClass: 'badge-rechazado' },
  },
  estadoMaterial: {
    nuevo: { label: 'Nuevo', cssClass: 'badge-aprobado' },
    buen_estado: { label: 'Buen estado', cssClass: 'badge-secundario' },
    usado: { label: 'Usado', cssClass: 'badge-entregado' },
  },
  solicitud: {
    pendiente: { label: 'Pendiente', cssClass: 'badge-pendiente' },
    aprobada: { label: 'Aprobada', cssClass: 'badge-aprobado' },
    rechazada: { label: 'Rechazada', cssClass: 'badge-rechazado' },
    entregada: { label: 'Entregada', cssClass: 'badge-secundario' },
    cancelada: { label: 'Cancelada', cssClass: 'badge-entregado' },
  },
  evento: {
    borrador: { label: 'Borrador', cssClass: 'badge-entregado' },
    publicado: { label: 'Publicado', cssClass: 'badge-aprobado' },
    en_curso: { label: 'En curso', cssClass: 'badge-secundario' },
    finalizado: { label: 'Finalizado', cssClass: 'badge-entregado' },
    cancelado: { label: 'Cancelado', cssClass: 'badge-rechazado' },
  },
  inscripcion: {
    inscrito: { label: 'Inscrito', cssClass: 'badge-aprobado' },
    cancelada: { label: 'Cancelada', cssClass: 'badge-entregado' },
    asistio: { label: 'Asistió', cssClass: 'badge-secundario' },
    no_asistio: { label: 'No asistió', cssClass: 'badge-rechazado' },
  },
  usuario: {
    activo: { label: 'Activo', cssClass: 'badge-aprobado' },
    inactivo: { label: 'Eliminado', cssClass: 'badge-entregado' },
    suspendido: { label: 'Suspendido', cssClass: 'badge-rechazado' },
  },
  documento: {
    pendiente: { label: 'En revisión', cssClass: 'badge-pendiente' },
    aprobado: { label: 'Aprobado', cssClass: 'badge-aprobado' },
    rechazado: { label: 'Rechazado', cssClass: 'badge-rechazado' },
    vencido: { label: 'Vencido', cssClass: 'badge-rechazado' },
  },
  reporte: {
    pendiente: { label: 'Pendiente', cssClass: 'badge-pendiente' },
    resuelto: { label: 'Contenido retirado', cssClass: 'badge-rechazado' },
    ignorado: { label: 'Descartado', cssClass: 'badge-entregado' },
  },
  publicacion: {
    publicada: { label: 'Visible', cssClass: 'badge-aprobado' },
    suspendida: { label: 'Oculta', cssClass: 'badge-rechazado' },
    borrador: { label: 'Borrador', cssClass: 'badge-entregado' },
  },
};

/** Etiqueta y color de un estado según su contexto: `valor | estadoBadge:'solicitud'` */
@Pipe({ name: 'estadoBadge', standalone: true })
export class EstadoBadgePipe implements PipeTransform {
  transform(valor: string | null | undefined, contexto: Contexto): BadgeConfig {
    if (!valor) return { label: '—', cssClass: 'badge-entregado' };
    return MAPAS[contexto][valor] ?? { label: valor, cssClass: 'badge-entregado' };
  }
}
