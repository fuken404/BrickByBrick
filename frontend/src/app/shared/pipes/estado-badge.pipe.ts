import { Pipe, PipeTransform } from '@angular/core';

export interface BadgeConfig {
  label: string;
  cssClass: string;
  color: string;
  bgColor: string;
}

const BADGE_MAP: Record<string, BadgeConfig> = {
  // Material
  activo:       { label: 'Disponible',    cssClass: 'badge-disponible',    color: '#27AE60', bgColor: '#d5f5e3' },
  pausado:      { label: 'Pausado',       cssClass: 'badge-pendiente',     color: '#E67E22', bgColor: '#fdebd0' },
  borrador:     { label: 'Borrador',      cssClass: 'badge-entregado',     color: '#6B6B6B', bgColor: '#efefef' },
  agotado:      { label: 'Agotado',       cssClass: 'badge-rechazado',     color: '#E74C3C', bgColor: '#fde8e7' },
  vencido:      { label: 'Vencido',       cssClass: 'badge-rechazado',     color: '#E74C3C', bgColor: '#fde8e7' },
  // Solicitudes
  pendiente:    { label: 'Pendiente',     cssClass: 'badge-pendiente',     color: '#E67E22', bgColor: '#fdebd0' },
  aprobada:     { label: 'Aprobada',      cssClass: 'badge-aprobado',      color: '#27AE60', bgColor: '#d5f5e3' },
  rechazada:    { label: 'Rechazada',     cssClass: 'badge-rechazado',     color: '#E74C3C', bgColor: '#fde8e7' },
  entregada:    { label: 'Entregada',     cssClass: 'badge-entregado',     color: '#6B6B6B', bgColor: '#efefef' },
  cancelada:    { label: 'Cancelada',     cssClass: 'badge-rechazado',     color: '#E74C3C', bgColor: '#fde8e7' },
  // Eventos
  publicado:    { label: 'Publicado',     cssClass: 'badge-aprobado',      color: '#27AE60', bgColor: '#d5f5e3' },
  en_curso:     { label: 'En curso',      cssClass: 'badge-secundario',    color: '#2E86AB', bgColor: 'rgba(46,134,171,0.12)' },
  finalizado:   { label: 'Finalizado',    cssClass: 'badge-entregado',     color: '#6B6B6B', bgColor: '#efefef' },
  // Constructoras
  verificada:   { label: 'Verificada',    cssClass: 'badge-verificado',    color: '#27AE60', bgColor: '#d5f5e3' },
  no_verificada:{ label: 'Sin verificar', cssClass: 'badge-pendiente-verificacion', color: '#E67E22', bgColor: '#fdebd0' },
  // Documentos
  aprobado:     { label: 'Aprobado',      cssClass: 'badge-aprobado',      color: '#27AE60', bgColor: '#d5f5e3' },
  // Material estado
  nuevo:        { label: 'Nuevo',         cssClass: 'badge-aprobado',      color: '#27AE60', bgColor: '#d5f5e3' },
  buen_estado:  { label: 'Buen estado',   cssClass: 'badge-secundario',    color: '#2E86AB', bgColor: 'rgba(46,134,171,0.12)' },
  usado:        { label: 'Usado',         cssClass: 'badge-entregado',     color: '#6B6B6B', bgColor: '#efefef' },
};

@Pipe({ name: 'estadoBadge', standalone: true })
export class EstadoBadgePipe implements PipeTransform {
  transform(value: string | null | undefined): BadgeConfig {
    if (!value) return { label: value ?? '', cssClass: 'badge-entregado', color: '#6B6B6B', bgColor: '#efefef' };
    return BADGE_MAP[value.toLowerCase()] ?? {
      label: value,
      cssClass: 'badge-entregado',
      color: '#6B6B6B',
      bgColor: '#efefef',
    };
  }
}
