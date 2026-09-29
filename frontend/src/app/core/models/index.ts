// =============================================================
// BrickByBrick — Modelos del frontend (espejo de las respuestas de la API v2)
// =============================================================

// --- Enums ---
export type RolUsuario = 'BENEFICIARIO' | 'CONSTRUCTORA' | 'ADMINISTRADOR';
export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido';
export type Genero = 'masculino' | 'femenino' | 'no_binario' | 'prefiero_no_decir';
export type EstadoMaterial = 'nuevo' | 'buen_estado' | 'usado';
export type EstadoPubMaterial = 'borrador' | 'activo' | 'pausado' | 'agotado' | 'vencido';
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'entregada' | 'cancelada';
export type TipoEvento = 'entrega_masiva' | 'taller' | 'feria' | 'otro';
export type EstadoEvento = 'borrador' | 'publicado' | 'en_curso' | 'finalizado' | 'cancelado';
export type EstadoInscripcion = 'inscrito' | 'cancelada' | 'asistio' | 'no_asistio';
export type TipoPublicacion = 'reutilizacion' | 'tutorial' | 'proyecto' | 'producto' | 'noticia' | 'recurso';
export type EstadoPublicacion = 'borrador' | 'publicada' | 'suspendida';
export type TipoReporte = 'publicacion' | 'material' | 'comentario' | 'usuario';
export type EstadoReporte = 'pendiente' | 'resuelto' | 'ignorado';
export type PrivacidadGrupo = 'publico' | 'privado';
export type EstadoMiembro = 'activo' | 'pendiente' | 'invitado';
export type TipoDocumento = 'rut' | 'camara_comercio';
export type EstadoDocumento = 'pendiente' | 'aprobado' | 'vencido' | 'rechazado';
export type TipoNotificacion =
  | 'material_nuevo' | 'solicitud_nueva' | 'solicitud_aprobada' | 'solicitud_rechazada' | 'solicitud_entregada'
  | 'solicitud_cancelada' | 'recepcion_confirmada' | 'evento_nuevo' | 'evento_inscripcion' | 'evento_cupos_bajos'
  | 'evento_cancelado' | 'evento_actualizado' | 'comentario' | 'comentario_respuesta' | 'like' | 'repost'
  | 'seguidor_nuevo' | 'mensaje_nuevo' | 'grupo_invitacion' | 'grupo_solicitud' | 'verificacion'
  | 'documento_revisado' | 'reporte_resuelto' | 'material_vence' | 'cuenta';

// --- Respuestas estándar ---
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: { field: string; message: string }[];
}

export interface Pagina<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ResumenSolicitudes = Record<EstadoSolicitud, number>;

export interface Localidad { id: number; nombre: string }

export interface CategoriaMaterial {
  id: number;
  nombre: string;
  colorHex: string;
  icono: string;
  _count?: { materiales: number };
}

// --- Sesión ---
export interface PerfilSesion {
  tipo: 'beneficiario' | 'constructora';
  id: string;
  nombreCompleto?: string;
  esAlimentadorWeb?: boolean;
  nombreEmprendimiento?: string | null;
  razonSocial?: string;
  verificada?: boolean;
  logoUrl?: string | null;
  localidadId?: number | null;
}

export interface UsuarioSesion {
  id: string;
  email: string;
  rol: RolUsuario;
  emailVerificado: boolean;
  mfaHabilitado: boolean;
  avatarUrl: string | null;
  perfil: PerfilSesion | null;
}

export interface Sesion {
  accessToken: string;
  user: UsuarioSesion;
}

export interface DesafioMfa {
  mfaRequerido: true;
  desafioId: string;
  emailParcial: string;
}

export type RespuestaLogin = (Sesion & { mfaRequerido: false }) | DesafioMfa;

/** Usuario público (sin email ni documentos). */
export interface UsuarioPublico {
  id: string;
  rol: RolUsuario;
  nombre: string;
  avatarUrl: string | null;
  esAlimentadorWeb: boolean;
  verificada: boolean;
  siguiendoPorMi?: boolean;
}

// --- Perfil propio (/me) ---
export interface DocumentoEmpresa {
  id: string;
  constructoraId: string;
  tipo: TipoDocumento;
  url: string;
  fechaSubida: string;
  fechaVencimiento: string | null;
  estado: EstadoDocumento;
  motivoRechazo: string | null;
  revisadoEn: string | null;
}

export interface Beneficiario {
  id: string;
  usuarioId: string;
  nombreCompleto: string;
  cedula: string;
  fechaNacimiento: string | null;
  genero: Genero | null;
  estrato: number | null;
  esAlimentadorWeb: boolean;
  nombreEmprendimiento: string | null;
  bioPublica: string | null;
  portafolioPublico: boolean;
  localidad: Localidad | null;
  usuario?: { id: string; email: string; telefono: string | null; estado: EstadoUsuario; createdAt: string; avatarUrl: string | null };
}

export interface Constructora {
  id: string;
  usuarioId: string;
  razonSocial: string;
  descripcion: string | null;
  logoUrl: string | null;
  sitioWeb: string | null;
  verificada: boolean;
  localidad: Localidad | null;
  nit?: string;
  representanteLegal?: string | null;
  cargoRepresentante?: string | null;
  numEmpleados?: number | null;
  direccion?: string | null;
  fechaVerificacion?: string | null;
  motivoRechazo?: string | null;
  usuario?: { id: string; email: string; telefono: string | null; estado: EstadoUsuario; createdAt: string };
  documentosEmpresa?: DocumentoEmpresa[];
}

export interface PreferenciasNotif { email: boolean; inApp: boolean }

export interface Me {
  id: string;
  email: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  emailVerificado: boolean;
  telefono: string | null;
  avatarUrl: string | null;
  mfaHabilitado: boolean;
  preferenciasNotif: PreferenciasNotif;
  ultimoLogin: string | null;
  createdAt: string;
  beneficiario: Beneficiario | null;
  constructora: Constructora | null;
}

export interface PerfilPublico extends UsuarioPublico {
  miembroDesde: string;
  suspendido: boolean;
  esPropio: boolean;
  publicaciones: number;
  seguidores: number;
  siguiendo: number;
  siguiendoPorMi: boolean;
  portafolio?: { publico: boolean; nombreEmprendimiento: string | null; bio: string | null; localidad: Localidad | null };
  empresa?: { id: string; descripcion: string | null; sitioWeb: string | null; localidad: Localidad | null; materialesActivos: number; entregas: number };
}

// --- Materiales ---
export interface FotoMaterial { id: string; materialId: string; url: string; orden: number }

export interface Material {
  id: string;
  constructoraId: string;
  categoriaId: number;
  nombre: string;
  descripcion: string | null;
  estadoMaterial: EstadoMaterial;
  cantidad: number;
  cantidadInicial: number | null;
  unidadMedida: string;
  valorUnitarioCop: number | null;
  condicionesRetiro: string | null;
  fechaLimite: string | null;
  maxSolicitudes: number | null;
  estadoPublicacion: EstadoPubMaterial;
  publicadoEn: string | null;
  createdAt: string;
  categoria: Pick<CategoriaMaterial, 'id' | 'nombre' | 'colorHex' | 'icono'>;
  constructora: {
    id: string; usuarioId: string; razonSocial: string; logoUrl: string | null; verificada: boolean; localidad: Localidad | null;
  };
  fotos: FotoMaterial[];
  _count: { solicitudes: number };
  esPropio?: boolean;
  miSolicitudActiva?: SolicitudMaterial | null;
}

export interface FiltrosMaterial {
  q?: string;
  categoriaId?: number;
  localidadId?: number;
  constructoraId?: string;
  estadoMaterial?: EstadoMaterial;
  estadoPublicacion?: EstadoPubMaterial;
  orden?: 'recientes' | 'vencen' | 'cantidad';
  page?: number;
  limit?: number;
}

// --- Solicitudes ---
export interface SolicitudMaterial {
  id: string;
  materialId: string;
  beneficiarioId: string;
  cantidadSolicitada: number;
  propositoUso: string | null;
  descripcionProyecto: string | null;
  estado: EstadoSolicitud;
  instruccionesRetiro: string | null;
  motivoRechazo: string | null;
  fechaSolicitud: string;
  fechaRespuesta: string | null;
  fechaEntrega: string | null;
  fechaConfirmacion: string | null;
  fechaCancelacion: string | null;
  valorDonadoCop: number | null;
  numeroConstancia: string | null;
  calificacion: number | null;
  comentarioCalificacion: string | null;
  material?: {
    id: string; nombre: string; unidadMedida: string; cantidad: number; valorUnitarioCop: number | null;
    estadoPublicacion: EstadoPubMaterial; constructoraId: string; condicionesRetiro?: string | null;
    categoria: Pick<CategoriaMaterial, 'id' | 'nombre' | 'colorHex' | 'icono'>;
    fotos: FotoMaterial[];
    constructora?: {
      id: string; razonSocial: string; logoUrl?: string | null; direccion?: string | null;
      localidad?: { nombre: string } | null; usuario?: { telefono: string | null } | null;
    };
  };
  beneficiario?: {
    id: string; nombreCompleto: string; cedula: string | null;
    localidad?: { nombre: string } | null; usuario?: { email: string; telefono: string | null } | null;
  };
}

export interface PaginaSolicitudes extends Pagina<SolicitudMaterial> { resumen: ResumenSolicitudes }

// --- Tributario ---
export interface ResumenTributario {
  anio: number;
  constructora: { id: string; razonSocial: string; nit: string; verificada: boolean };
  entregas: number;
  beneficiarios: number;
  valorDonadoCop: number;
  porcentaje: number;
  descuentoEstimadoCop: number;
  topePorcentaje: number;
  impuestoEstimadoCop: number | null;
  topeCop: number | null;
  descuentoAplicableCop: number;
  porMes: { mes: number; entregas: number; valorDonadoCop: number }[];
  porCategoria: { categoria: string; valorDonadoCop: number }[];
  requisitos: {
    empresaVerificada: boolean; rutAprobado: boolean; camaraComercioAprobada: boolean;
    tieneEntregas: boolean; materialesSinValor: number;
  };
}

export interface Constancia {
  id: string;
  numeroConstancia: string;
  fechaEntrega: string;
  fechaConfirmacion: string | null;
  material: { nombre: string; categoria: string; unidadMedida: string };
  cantidad: number;
  valorDonadoCop: number;
  beneficiario: string;
}

// --- Eventos ---
export interface Evento {
  id: string;
  constructoraId: string;
  nombre: string;
  tipoEvento: TipoEvento;
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string;
  direccion: string | null;
  localidadId: number | null;
  capacidadMaxima: number | null;
  imagenUrl: string | null;
  estado: EstadoEvento;
  motivoCancelacion: string | null;
  publicadoEn: string | null;
  createdAt: string;
  constructora: { id: string; usuarioId: string; razonSocial: string; logoUrl: string | null; verificada: boolean };
  localidad: Localidad | null;
  inscritos: number;
  cuposDisponibles: number | null;
  miInscripcion?: EstadoInscripcion | null;
  esPropio?: boolean;
  materiales?: { material: Pick<Material, 'id' | 'nombre' | 'cantidad' | 'unidadMedida' | 'estadoPublicacion' | 'fotos'> & { categoria: Pick<CategoriaMaterial, 'nombre' | 'colorHex' | 'icono'> } }[];
  _count?: { inscripciones: number; materiales: number };
}

export interface FiltrosEvento {
  q?: string;
  tipoEvento?: TipoEvento;
  localidadId?: number;
  estado?: EstadoEvento;
  alcance?: 'proximos' | 'pasados' | 'todos';
  page?: number;
  limit?: number;
}

export interface Inscripcion {
  id: string;
  eventoId: string;
  beneficiarioId: string;
  estado: EstadoInscripcion;
  fechaInscripcion: string;
  evento?: Evento;
  beneficiario?: {
    id: string; nombreCompleto: string; cedula: string;
    localidad: { nombre: string } | null; usuario: { email: string; telefono: string | null };
  };
}

// --- Comunidad ---
export interface Publicacion {
  id: string;
  tipo: TipoPublicacion;
  titulo: string | null;
  contenido: string;
  estado: EstadoPublicacion;
  editada: boolean;
  createdAt: string;
  updatedAt: string;
  autor: UsuarioPublico;
  fotos: { id: string; url: string; orden: number }[];
  materiales: { id: string; nombre: string; categoria: { nombre: string } }[];
  likes: number;
  comentarios: number;
  reposts: number;
  likedByMe: boolean;
  repostedByMe: boolean;
  repostDe: Publicacion | null;
}

export interface Comentario {
  id: string;
  publicacionId: string;
  parentId: string | null;
  contenido: string | null;
  oculto: boolean;
  editado: boolean;
  createdAt: string;
  autor: UsuarioPublico;
  likes: number;
  likedByMe: boolean;
  respuestas: Comentario[];
}

export interface Reporte {
  id: string;
  tipoContenido: TipoReporte;
  contenidoId: string;
  motivo: string;
  estado: EstadoReporte;
  resolucion: string | null;
  resueltoEn: string | null;
  createdAt: string;
  reportadoPor: UsuarioPublico;
  resueltoPor: string | null;
  totalReportes: number;
  contenido: { titulo?: string | null; texto?: string | null; estado: string; autor: Partial<UsuarioPublico>; enlaceId: string } | null;
}

export interface Grupo {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  privacidad: PrivacidadGrupo;
  createdAt: string;
  temas: string[];
  creador: UsuarioPublico;
  miembros: number;
  mensajes: number;
  miMembresia: { estado: EstadoMiembro; rol: 'admin' | 'miembro' } | null;
}

export interface MiembroGrupo extends UsuarioPublico {
  rolGrupo: 'admin' | 'miembro';
  estado: EstadoMiembro;
  fechaUnion: string;
}

export interface MensajeGrupo {
  id: string;
  grupoId: string;
  contenido: string;
  adjuntoUrl: string | null;
  createdAt: string;
  autor: UsuarioPublico;
}

export interface PaginaCursor<T> { items: T[]; hayMas: boolean }

export interface Conversacion {
  id: string;
  otroUsuario: UsuarioPublico;
  ultimoMensaje: MensajeDirecto | null;
  ultimoMensajeEn: string;
  noLeidos: number;
}

export interface MensajeDirecto {
  id: string;
  conversacionId: string;
  autorId: string;
  contenido: string;
  leidoEn: string | null;
  createdAt: string;
}

// --- Notificaciones ---
export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  urlDestino: string | null;
  leida: boolean;
  createdAt: string;
}

export interface PaginaNotificaciones extends Pagina<Notificacion> { noLeidas: number }

// --- Administración ---
export interface UsuarioAdmin {
  id: string;
  email: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  emailVerificado: boolean;
  mfaHabilitado: boolean;
  telefono: string | null;
  ultimoLogin: string | null;
  createdAt: string;
  beneficiario: { id: string; nombreCompleto: string; cedula: string; esAlimentadorWeb: boolean; localidad: Localidad | null } | null;
  constructora: { id: string; razonSocial: string; nit: string; verificada: boolean; localidad: Localidad | null } | null;
}

export interface SerieMensual {
  mes: string;
  usuarios: number;
  materiales: number;
  solicitudes: number;
  entregas: number;
  valorDonadoCop: number;
}

export interface DashboardAdmin {
  beneficiarios: number;
  constructoras: number;
  constructorasVerificadas: number;
  constructorasPendientes: number;
  materialesActivos: number;
  totalMateriales: number;
  solicitudesPendientes: number;
  totalSolicitudes: number;
  solicitudesEntregadas: number;
  eventosActivos: number;
  totalEventos: number;
  publicaciones: number;
  reportesPendientes: number;
  usuariosSuspendidos: number;
  valorDonadoCop: number;
  beneficiariosAtendidos: number;
  calificacionPromedio: number | null;
  calificaciones: number;
  constructorasActivasMes: number;
  solicitudesPorEstado: Partial<Record<EstadoSolicitud, number>>;
  series: SerieMensual[];
}

export interface MetricasAdmin {
  periodoTeaDias: number;
  ipe: { eventos: number; cupos: number; inscripciones: number; ipe: number; tasaAsistencia: number };
  tpa: { tpaDias: number; respuestaDias: number; entregas: number };
  tea: { intentos: number; validos: number; tea: number; mfaExitosos: number; mfaFallidos: number };
  impacto: {
    valorDonadoCop: number; beneficiariosAtendidos: number; calificacionPromedio: number | null;
    calificaciones: number; constructorasActivasMes: number; descuentoEstimadoCop: number;
  };
  topConstructoras: { id: string; razonSocial: string; entregas: number; valorDonadoCop: number }[];
  topCategorias: { nombre: string; colorHex: string; entregas: number }[];
  series: SerieMensual[];
}

export interface MetricasRendimiento {
  desde: string;
  trpPromedioMs: number;
  trpP95Ms: number;
  peticiones: number;
  porServicio: { servicio: string; peticiones: number; promedioMs: number; p95Ms: number; errores5xx: number; bajo3sPct: number }[];
}

export interface SaludServicios {
  status: 'ok' | 'degraded';
  gateway: string;
  servicios: { servicio: string; status: string; db?: string; latenciaMs: number }[];
}

export interface ConfiguracionSistema {
  maxSolicitudesActivasBeneficiario: number;
  maxFotosMaterial: number;
  diasRecordatorioVencimiento: number;
  umbralReportesOcultar: number;
  porcentajeDescuentoTributario: number;
  topeDescuentoSobreImpuesto: number;
  emailSoporte: string;
  modoMantenimiento: boolean;
}

export interface RegistroAuditoria {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detalle: unknown;
  createdAt: string;
  usuario: { id: string; email: string; rol: RolUsuario } | null;
}

export interface EstadisticasPublicas {
  entregasRealizadas: number;
  beneficiariosAtendidos: number;
  constructorasVerificadas: number;
  materialesDisponibles: number;
  eventosRealizados: number;
}
