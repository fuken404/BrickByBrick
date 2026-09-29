const { prisma } = require('@brickbybrick/shared');

const num = (v) => (v === null || v === undefined ? 0 : Number(v));

/**
 * Consultas de indicadores (IPE, TPA, TEA, impacto) usadas por el panel
 * de administración y por la sección de resultados de la tesis.
 */
const metricasRepository = {
  async conteos() {
    const [
      beneficiarios, constructoras, constructorasVerificadas, constructorasPendientes,
      materialesActivos, totalMateriales, solicitudesPendientes, totalSolicitudes, solicitudesEntregadas,
      eventosActivos, totalEventos, publicaciones, reportesPendientes, usuariosSuspendidos,
    ] = await prisma.$transaction([
      prisma.beneficiario.count({ where: { usuario: { estado: { not: 'inactivo' } } } }),
      prisma.constructora.count(),
      prisma.constructora.count({ where: { verificada: true } }),
      prisma.constructora.count({ where: { verificada: false, motivoRechazo: null } }),
      prisma.material.count({ where: { estadoPublicacion: 'activo', eliminadoEn: null } }),
      prisma.material.count({ where: { eliminadoEn: null } }),
      prisma.solicitudMaterial.count({ where: { estado: 'pendiente' } }),
      prisma.solicitudMaterial.count(),
      prisma.solicitudMaterial.count({ where: { estado: 'entregada' } }),
      prisma.evento.count({ where: { estado: { in: ['publicado', 'en_curso'] } } }),
      prisma.evento.count(),
      prisma.publicacion.count({ where: { estado: 'publicada' } }),
      prisma.reporte.count({ where: { estado: 'pendiente' } }),
      prisma.usuario.count({ where: { estado: 'suspendido' } }),
    ]);
    return {
      beneficiarios, constructoras, constructorasVerificadas, constructorasPendientes,
      materialesActivos, totalMateriales, solicitudesPendientes, totalSolicitudes, solicitudesEntregadas,
      eventosActivos, totalEventos, publicaciones, reportesPendientes, usuariosSuspendidos,
    };
  },

  /** IPE = inscripciones vigentes / cupos ofrecidos × 100 (eventos con cupo definido). */
  async ipe() {
    const [fila] = await prisma.$queryRaw`
      SELECT COALESCE(SUM(t.cap), 0) AS cupos, COALESCE(SUM(t.ins), 0) AS inscripciones, COUNT(*) AS eventos
      FROM (
        SELECT e.capacidad_maxima AS cap,
               COUNT(i.id) FILTER (WHERE i.estado IN ('inscrito', 'asistio')) AS ins
        FROM eventos e
        LEFT JOIN inscripciones_evento i ON i.evento_id = e.id
        WHERE e.capacidad_maxima IS NOT NULL AND e.estado IN ('publicado', 'en_curso', 'finalizado')
        GROUP BY e.id
      ) t`;
    const [asistencia] = await prisma.$queryRaw`
      SELECT COUNT(*) FILTER (WHERE estado = 'asistio') AS asistieron,
             COUNT(*) FILTER (WHERE estado IN ('asistio', 'no_asistio')) AS registradas
      FROM inscripciones_evento`;
    const cupos = num(fila.cupos);
    const inscripciones = num(fila.inscripciones);
    return {
      eventos: num(fila.eventos),
      cupos,
      inscripciones,
      ipe: cupos ? Math.round((inscripciones / cupos) * 1000) / 10 : 0,
      tasaAsistencia: num(asistencia.registradas)
        ? Math.round((num(asistencia.asistieron) / num(asistencia.registradas)) * 1000) / 10
        : 0,
    };
  },

  /** TPA = promedio de días entre publicación del material y entrega al beneficiario. */
  async tpa() {
    const [fila] = await prisma.$queryRaw`
      SELECT
        AVG(EXTRACT(EPOCH FROM (s.fecha_entrega - COALESCE(m.publicado_en, m.created_at))) / 86400) AS dias_entrega,
        AVG(EXTRACT(EPOCH FROM (s.fecha_respuesta - s.fecha_solicitud)) / 86400)
          FILTER (WHERE s.fecha_respuesta IS NOT NULL) AS dias_respuesta,
        COUNT(*) AS entregas
      FROM solicitudes_material s
      JOIN materiales m ON m.id = s.material_id
      WHERE s.estado = 'entregada' AND s.fecha_entrega IS NOT NULL`;
    const redondear = (v) => Math.round(num(v) * 10) / 10;
    return { tpaDias: redondear(fila.dias_entrega), respuestaDias: redondear(fila.dias_respuesta), entregas: num(fila.entregas) };
  },

  /** TEA = intentos con credenciales válidas / intentos totales × 100. */
  async tea(desde) {
    const [fila] = await prisma.$queryRaw`
      SELECT
        COUNT(*) FILTER (WHERE motivo IN ('ok', 'mfa_pendiente')) AS validos,
        COUNT(*) FILTER (WHERE motivo IN ('ok', 'mfa_pendiente', 'credenciales', 'suspendido', 'inactivo')) AS totales,
        COUNT(*) FILTER (WHERE motivo = 'mfa_ok') AS mfa_ok,
        COUNT(*) FILTER (WHERE motivo = 'mfa_fallido') AS mfa_fallido
      FROM intentos_login
      WHERE created_at >= ${desde}`;
    const totales = num(fila.totales);
    return {
      intentos: totales,
      validos: num(fila.validos),
      tea: totales ? Math.round((num(fila.validos) / totales) * 1000) / 10 : 0,
      mfaExitosos: num(fila.mfa_ok),
      mfaFallidos: num(fila.mfa_fallido),
    };
  },

  async impacto() {
    const agregado = await prisma.solicitudMaterial.aggregate({
      where: { estado: 'entregada' },
      _sum: { valorDonadoCop: true },
      _avg: { calificacion: true },
      _count: { calificacion: true },
    });
    const [beneficiarios] = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT beneficiario_id) AS total FROM solicitudes_material WHERE estado = 'entregada'`;
    const [constructorasActivas] = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT m.constructora_id) AS total FROM materiales m
      WHERE m.publicado_en >= date_trunc('month', now())`;
    return {
      valorDonadoCop: num(agregado._sum.valorDonadoCop),
      beneficiariosAtendidos: num(beneficiarios.total),
      calificacionPromedio: agregado._avg.calificacion ? Math.round(agregado._avg.calificacion * 10) / 10 : null,
      calificaciones: agregado._count.calificacion,
      constructorasActivasMes: num(constructorasActivas.total),
    };
  },

  async solicitudesPorEstado() {
    const filas = await prisma.solicitudMaterial.groupBy({ by: ['estado'], _count: { _all: true } });
    return Object.fromEntries(filas.map((f) => [f.estado, f._count._all]));
  },

  /** Series de los últimos `meses` meses (incluye el actual). */
  async seriesMensuales(meses = 6) {
    const filas = await prisma.$queryRaw`
      WITH meses AS (
        SELECT generate_series(date_trunc('month', now()) - (${meses - 1}::int * interval '1 month'),
                               date_trunc('month', now()), interval '1 month') AS mes
      )
      SELECT
        to_char(meses.mes, 'YYYY-MM') AS mes,
        (SELECT COUNT(*) FROM usuarios u WHERE date_trunc('month', u.created_at) = meses.mes) AS usuarios,
        (SELECT COUNT(*) FROM materiales m WHERE date_trunc('month', m.publicado_en) = meses.mes) AS materiales,
        (SELECT COUNT(*) FROM solicitudes_material s WHERE date_trunc('month', s.fecha_solicitud) = meses.mes) AS solicitudes,
        (SELECT COUNT(*) FROM solicitudes_material s WHERE s.estado = 'entregada' AND date_trunc('month', s.fecha_entrega) = meses.mes) AS entregas,
        (SELECT COALESCE(SUM(s.valor_donado_cop), 0) FROM solicitudes_material s WHERE s.estado = 'entregada' AND date_trunc('month', s.fecha_entrega) = meses.mes) AS valor
      FROM meses ORDER BY meses.mes`;
    return filas.map((f) => ({
      mes: f.mes,
      usuarios: num(f.usuarios),
      materiales: num(f.materiales),
      solicitudes: num(f.solicitudes),
      entregas: num(f.entregas),
      valorDonadoCop: num(f.valor),
    }));
  },

  async topConstructoras(limite = 5) {
    const filas = await prisma.$queryRaw`
      SELECT c.id, c.razon_social AS "razonSocial",
             COUNT(s.id) AS entregas, COALESCE(SUM(s.valor_donado_cop), 0) AS valor
      FROM constructoras c
      JOIN materiales m ON m.constructora_id = c.id
      JOIN solicitudes_material s ON s.material_id = m.id AND s.estado = 'entregada'
      GROUP BY c.id ORDER BY valor DESC LIMIT ${limite}`;
    return filas.map((f) => ({ id: f.id, razonSocial: f.razonSocial, entregas: num(f.entregas), valorDonadoCop: num(f.valor) }));
  },

  async topCategorias(limite = 6) {
    const filas = await prisma.$queryRaw`
      SELECT cat.nombre, cat.color_hex AS "colorHex", COUNT(s.id) AS entregas
      FROM categorias_material cat
      JOIN materiales m ON m.categoria_id = cat.id
      JOIN solicitudes_material s ON s.material_id = m.id AND s.estado = 'entregada'
      GROUP BY cat.id ORDER BY entregas DESC LIMIT ${limite}`;
    return filas.map((f) => ({ nombre: f.nombre, colorHex: f.colorHex, entregas: num(f.entregas) }));
  },

  async publicas() {
    const [materialesDonados, beneficiarios, constructoras, materialesDisponibles, eventos] = await prisma.$transaction([
      prisma.solicitudMaterial.count({ where: { estado: 'entregada' } }),
      prisma.solicitudMaterial.findMany({ where: { estado: 'entregada' }, distinct: ['beneficiarioId'], select: { beneficiarioId: true } }),
      prisma.constructora.count({ where: { verificada: true } }),
      prisma.material.count({ where: { estadoPublicacion: 'activo', eliminadoEn: null } }),
      prisma.evento.count({ where: { estado: { in: ['publicado', 'en_curso', 'finalizado'] } } }),
    ]);
    return {
      entregasRealizadas: materialesDonados,
      beneficiariosAtendidos: beneficiarios.length,
      constructorasVerificadas: constructoras,
      materialesDisponibles,
      eventosRealizados: eventos,
    };
  },

  auditoria({ entidad, usuarioId }, { skip, limit }) {
    const where = {};
    if (entidad) where.entidad = entidad;
    if (usuarioId) where.usuarioId = usuarioId;
    return prisma.$transaction([
      prisma.auditoria.count({ where }),
      prisma.auditoria.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { usuario: { select: { id: true, email: true, rol: true } } },
      }),
    ]);
  },
};

module.exports = metricasRepository;
