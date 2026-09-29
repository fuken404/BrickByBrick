import { Pipe, PipeTransform } from '@angular/core';

const ETIQUETAS: Record<string, Record<string, string>> = {
  tipoEvento: { entrega_masiva: 'Entrega masiva', taller: 'Taller', feria: 'Feria', otro: 'Otro' },
  tipoPublicacion: {
    reutilizacion: 'Reutilización', tutorial: 'Tutorial', proyecto: 'Proyecto', producto: 'Producto',
    noticia: 'Noticia', recurso: 'Recurso',
  },
  rol: { BENEFICIARIO: 'Beneficiario', CONSTRUCTORA: 'Constructora', ADMINISTRADOR: 'Administrador' },
  genero: { masculino: 'Masculino', femenino: 'Femenino', no_binario: 'No binario', prefiero_no_decir: 'Prefiero no decir' },
  documento: { rut: 'RUT', camara_comercio: 'Cámara de Comercio' },
  reporte: { publicacion: 'Publicación', comentario: 'Comentario', material: 'Material', usuario: 'Usuario' },
};

/** Traduce valores de enums a texto legible: `'entrega_masiva' | etiqueta:'tipoEvento'` */
@Pipe({ name: 'etiqueta', standalone: true })
export class EtiquetaPipe implements PipeTransform {
  transform(valor: string | null | undefined, tipo: keyof typeof ETIQUETAS): string {
    if (!valor) return '—';
    return ETIQUETAS[tipo]?.[valor] ?? valor;
  }
}

export const ETIQUETAS_TIPO_EVENTO = ETIQUETAS['tipoEvento'];
export const ETIQUETAS_TIPO_PUBLICACION = ETIQUETAS['tipoPublicacion'];
