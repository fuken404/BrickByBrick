// =============================================================
// BrickByBrick — Interfaces TypeScript
// Espejo del schema Prisma / respuestas de la API
// =============================================================

// --- Enums ---
export type RolUsuario = 'BENEFICIARIO' | 'CONSTRUCTORA' | 'ADMINISTRADOR';
export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido';
export type EstadoMaterial = 'nuevo' | 'buen_estado' | 'usado';
export type EstadoPubMaterial = 'borrador' | 'activo' | 'pausado' | 'agotado' | 'vencido';
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'entregada' | 'cancelada';
export type TipoEvento = 'entrega_masiva' | 'taller' | 'feria' | 'otro';
export type EstadoEvento = 'borrador' | 'publicado' | 'en_curso' | 'finalizado' | 'cancelado';
export type TipoPublicacion = 'reutilizacion' | 'tutorial' | 'proyecto' | 'noticia' | 'recurso';
export type VisibilidadPub = 'publica' | 'grupo';
export type EstadoPublicacion = 'borrador' | 'publicada' | 'suspendida';
export type TipoNotificacion =
  | 'material_nuevo' | 'solicitud_aprobada' | 'solicitud_rechazada'
  | 'solicitud_entregada' | 'evento_inscripcion' | 'evento_cupos_bajos'
  | 'comentario' | 'like' | 'grupo_invitacion' | 'verificacion' | 'material_vence';

// --- Respuesta estándar de la API ---
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: { field: string; message: string }[];
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  items: T[];
}

// --- Localidades ---
export interface Localidad {
  id: number;
  nombre: string;
}

// --- Usuarios ---
export interface Usuario {
  id: string;
  email: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  emailVerificado: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    rol: RolUsuario;
    emailVerificado: boolean;
    perfil: Beneficiario | Constructora | null;
  };
}

// --- Beneficiarios ---
export interface Beneficiario {
  id: string;
  usuarioId: string;
  nombreCompleto: string;
  cedula: string;
  fechaNacimiento?: string;
  genero?: string;
  estrato?: number;
  localidad?: Localidad;
  esAlimentadorWeb: boolean;
  usuario: Pick<Usuario, 'id' | 'email' | 'estado' | 'createdAt'>;
}

// --- Constructoras ---
export interface Constructora {
  id: string;
  usuarioId: string;
  razonSocial: string;
  nit: string;
  representanteLegal?: string;
  cargoRepresentante?: string;
  numEmpleados?: number;
  direccion?: string;
  descripcion?: string;
  logoUrl?: string;
  sitioWeb?: string;
  verificada: boolean;
  fechaVerificacion?: string;
  localidad?: Localidad;
  usuario: Pick<Usuario, 'id' | 'email' | 'estado' | 'createdAt'>;
  documentosEmpresa?: DocumentoEmpresa[];
}

// --- Materiales ---
export interface CategoriaMaterial {
  id: number;
  nombre: string;
  colorHex: string;
  icono: string;
}

export interface FotoMaterial {
  id: string;
  materialId: string;
  url: string;
  orden: number;
}

export interface Material {
  id: string;
  nombre: string;
  descripcion?: string;
  estadoMaterial: EstadoMaterial;
  cantidad: number;
  unidadMedida: string;
  condicionesRetiro?: string;
  fechaLimite?: string;
  maxSolicitudes?: number;
  estadoPublicacion: EstadoPubMaterial;
  createdAt: string;
  categoria: CategoriaMaterial;
  constructora: Pick<Constructora, 'id' | 'razonSocial' | 'logoUrl' | 'verificada'> & {
    localidad?: Localidad;
  };
  fotos: FotoMaterial[];
  _count: { solicitudes: number };
}

// --- Solicitudes ---
export interface SolicitudMaterial {
  id: string;
  materialId: string;
  beneficiarioId: string;
  cantidadSolicitada: number;
  propositoUso?: string;
  descripcionProyecto?: string;
  estado: EstadoSolicitud;
  instruccionesRetiro?: string;
  fechaSolicitud: string;
  fechaRespuesta?: string;
  fechaEntrega?: string;
  calificacion?: number;
  comentarioCalificacion?: string;
  material?: Material;
  beneficiario?: Pick<Beneficiario, 'id' | 'nombreCompleto' | 'cedula'>;
}

// --- Eventos ---
export interface Evento {
  id: string;
  nombre: string;
  tipoEvento: TipoEvento;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  direccion?: string;
  capacidadMaxima?: number;
  imagenUrl?: string;
  estado: EstadoEvento;
  constructora: Pick<Constructora, 'id' | 'razonSocial' | 'logoUrl'>;
  localidad?: Localidad;
  _count: { inscripciones: number };
}

export interface InscripcionEvento {
  id: string;
  eventoId: string;
  beneficiarioId: string;
  fechaInscripcion: string;
  asistio: boolean;
  evento?: Evento;
  beneficiario?: Pick<Beneficiario, 'id' | 'nombreCompleto' | 'cedula'>;
}

// --- Publicaciones ---
export interface Publicacion {
  id: string;
  autorId: string;
  tipo: TipoPublicacion;
  titulo: string;
  contenido: string;
  visibilidad: VisibilidadPub;
  estado: EstadoPublicacion;
  createdAt: string;
  autor: Pick<Usuario, 'id' | 'email' | 'rol'>;
  fotos: { id: string; url: string; orden: number }[];
  _count: { comentarios: number; likes: number };
}

export interface Comentario {
  id: string;
  publicacionId: string;
  autorId: string;
  contenido: string;
  parentId?: string;
  createdAt: string;
  autor: Pick<Usuario, 'id' | 'email'>;
  respuestas?: Comentario[];
}

// --- Grupos ---
export interface Grupo {
  id: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  creadorId: string;
  createdAt: string;
  temas: { grupoId: string; tema: string }[];
  creador: Pick<Usuario, 'id' | 'email'>;
  _count: { miembros: number };
}

export interface MensajeGrupo {
  id: string;
  grupoId: string;
  autorId: string;
  contenido: string;
  adjuntoUrl?: string;
  createdAt: string;
  autor: Pick<Usuario, 'id' | 'email'>;
}

// --- Notificaciones ---
export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  urlDestino?: string;
  leida: boolean;
  createdAt: string;
}

// --- Documentos / Certificados ---
export interface DocumentoEmpresa {
  id: string;
  constructoraId: string;
  tipo: 'rut' | 'camara_comercio';
  url: string;
  fechaSubida: string;
  fechaVencimiento?: string;
  estado: 'pendiente' | 'aprobado' | 'vencido' | 'rechazado';
}

export interface CertificadoDonacion {
  id: string;
  constructoraId: string;
  periodo: string;
  totalMaterialesDonados: number;
  valorEstimadoCop: number;
  deduccionEstimadaCop: number;
  pdfUrl?: string;
  generatedAt: string;
}

// --- Filtros comunes ---
export interface FiltrosMaterial {
  categoriaId?: number;
  localidadId?: number;
  estado?: EstadoMaterial;
  q?: string;
  page?: number;
  limit?: number;
}

export interface FiltrosEvento {
  tipoEvento?: TipoEvento;
  localidadId?: number;
  estado?: EstadoEvento;
  page?: number;
  limit?: number;
}

// --- Estado del usuario autenticado (para el store) ---
export interface AuthState {
  user: AuthResponse['user'] | null;
  accessToken: string | null;
  isLoading: boolean;
}

// --- Dashboard admin ---
export interface DashboardAdmin {
  totalBeneficiarios: number;
  totalConstructoras: number;
  constructorasVerificadas: number;
  materialesActivos: number;
  totalMateriales: number;
  totalSolicitudes: number;
  solicitudesCompletadas: number;
  eventosActivos: number;
  totalEventos: number;
  publicacionesActivas: number;
  reportesPendientes: number;
  valorTotalDonacionesCop: number;
}
