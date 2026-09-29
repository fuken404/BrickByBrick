/**
 * Integración — publication-service: publicaciones, comentarios, reposts,
 * moderación, seguidores, grupos y mensajes directos.
 */
const request = require('supertest');
const app = require('../app');
const { prisma, bearer, crearBeneficiario, crearConstructora, crearAdmin } = require('../../../../test/helpers');

afterAll(() => prisma.$disconnect());

const publicar = (token, extra = {}) => request(app).post('/api/v1/publicaciones').set(bearer(token))
  .send({ tipo: 'proyecto', titulo: 'Banca con madera recuperada', contenido: 'Así reutilizamos los tablones donados.', ...extra });

describe('publicaciones', () => {
  it('cualquier usuario autenticado publica; el feed público no expone correos', async () => {
    const b = await crearBeneficiario();
    const c = await crearConstructora();
    await publicar(b.token).expect(201);
    await publicar(c.token, { tipo: 'noticia' }).expect(201);
    await request(app).post('/api/v1/publicaciones').send({ tipo: 'proyecto', contenido: 'Sin sesión' }).expect(401);

    const feed = await request(app).get('/api/v1/publicaciones').query({ autorId: b.usuario.id });
    expect(feed.status).toBe(200);
    expect(feed.body.data.items[0].autor).toMatchObject({ id: b.usuario.id, nombre: expect.any(String) });
    expect(JSON.stringify(feed.body)).not.toMatch(/@test\.co|"email"|"cedula"/);
  });

  it('solo el autor edita y solo autor o admin eliminan', async () => {
    const autor = await crearBeneficiario();
    const otro = await crearBeneficiario();
    const { token: ta } = await crearAdmin();
    const { body } = await publicar(autor.token);
    await request(app).put(`/api/v1/publicaciones/${body.data.id}`).set(bearer(otro.token)).send({ contenido: 'Contenido modificado por otra persona' }).expect(403);
    const edit = await request(app).put(`/api/v1/publicaciones/${body.data.id}`).set(bearer(autor.token)).send({ contenido: 'Contenido corregido' });
    expect(edit.body.data).toMatchObject({ contenido: 'Contenido corregido', editada: true });
    await request(app).delete(`/api/v1/publicaciones/${body.data.id}`).set(bearer(otro.token)).expect(403);
    await request(app).delete(`/api/v1/publicaciones/${body.data.id}`).set(bearer(ta)).expect(200);
  });

  it('likes idempotentes con conteo y estado del visitante', async () => {
    const autor = await crearBeneficiario();
    const fan = await crearBeneficiario();
    const { body } = await publicar(autor.token);
    const like = await request(app).post(`/api/v1/publicaciones/${body.data.id}/like`).set(bearer(fan.token));
    expect(like.body.data).toEqual({ likes: 1, likedByMe: true });
    await request(app).post(`/api/v1/publicaciones/${body.data.id}/like`).set(bearer(fan.token)).expect(409);
    const detalle = await request(app).get(`/api/v1/publicaciones/${body.data.id}`).set(bearer(fan.token));
    expect(detalle.body.data).toMatchObject({ likes: 1, likedByMe: true });
    const unlike = await request(app).delete(`/api/v1/publicaciones/${body.data.id}/like`).set(bearer(fan.token));
    expect(unlike.body.data).toEqual({ likes: 0, likedByMe: false });
  });

  it('repost: no propio, no duplicado y apunta siempre al original', async () => {
    const autor = await crearBeneficiario();
    const a = await crearBeneficiario();
    const b = await crearBeneficiario();
    const original = (await publicar(autor.token)).body.data;
    await request(app).post(`/api/v1/publicaciones/${original.id}/repost`).set(bearer(autor.token)).send({}).expect(400);
    const repostA = await request(app).post(`/api/v1/publicaciones/${original.id}/repost`).set(bearer(a.token)).send({ comentario: '¡Muy bueno!' });
    expect(repostA.status).toBe(201);
    await request(app).post(`/api/v1/publicaciones/${original.id}/repost`).set(bearer(a.token)).send({}).expect(409);

    const repostB = await request(app).post(`/api/v1/publicaciones/${repostA.body.data.id}/repost`).set(bearer(b.token)).send({});
    expect(repostB.body.data.repostDe.id).toBe(original.id);
  });
});

describe('comentarios', () => {
  it('respuestas anidadas, like de comentario y eliminación del comentario correcto', async () => {
    const autor = await crearBeneficiario();
    const c1 = await crearBeneficiario();
    const c2 = await crearBeneficiario();
    const pub = (await publicar(autor.token)).body.data;

    const raiz = (await request(app).post(`/api/v1/publicaciones/${pub.id}/comentarios`).set(bearer(c1.token)).send({ contenido: '¿Qué herramientas usaron?' })).body.data;
    const resp = await request(app).post(`/api/v1/publicaciones/${pub.id}/comentarios`).set(bearer(c2.token)).send({ contenido: 'Sierra y lija', parentId: raiz.id });
    expect(resp.status).toBe(201);
    await request(app).post(`/api/v1/comentarios/${raiz.id}/like`).set(bearer(autor.token)).expect(200);

    const hilo = await request(app).get(`/api/v1/publicaciones/${pub.id}/comentarios`).set(bearer(autor.token));
    const c = hilo.body.data.items.find((x) => x.id === raiz.id);
    expect(c).toMatchObject({ likes: 1, likedByMe: true });
    expect(c.respuestas.map((r) => r.id)).toContain(resp.body.data.id);

    // Un tercero no puede borrar; el autor de la publicación sí puede moderar su hilo
    await request(app).delete(`/api/v1/comentarios/${raiz.id}`).set(bearer(c2.token)).expect(403);
    await request(app).delete(`/api/v1/comentarios/${resp.body.data.id}`).set(bearer(c2.token)).expect(200);
    expect(await prisma.comentario.findUnique({ where: { id: raiz.id } })).not.toBeNull();
    expect(await prisma.publicacion.findUnique({ where: { id: pub.id } })).not.toBeNull();
  });

  it('no permite responder con un comentario de otra publicación', async () => {
    const b = await crearBeneficiario();
    const p1 = (await publicar(b.token)).body.data;
    const p2 = (await publicar(b.token)).body.data;
    const c = (await request(app).post(`/api/v1/publicaciones/${p1.id}/comentarios`).set(bearer(b.token)).send({ contenido: 'Hola' })).body.data;
    await request(app).post(`/api/v1/publicaciones/${p2.id}/comentarios`).set(bearer(b.token)).send({ contenido: 'x', parentId: c.id }).expect(400);
  });
});

describe('moderación y reportes', () => {
  it('solo el administrador oculta y restaura; lo oculto desaparece del feed', async () => {
    const autor = await crearBeneficiario();
    const { token: ta } = await crearAdmin();
    const pub = (await publicar(autor.token)).body.data;

    await request(app).patch(`/api/v1/publicaciones/${pub.id}/moderacion`).set(bearer(autor.token)).send({ estado: 'suspendida', motivo: 'x' }).expect(403);
    await request(app).patch(`/api/v1/publicaciones/${pub.id}/moderacion`).set(bearer(ta)).send({ estado: 'suspendida', motivo: 'Contenido engañoso' }).expect(200);
    await request(app).get(`/api/v1/publicaciones/${pub.id}`).expect(404);
    await request(app).get(`/api/v1/publicaciones/${pub.id}`).set(bearer(autor.token)).expect(200);

    await request(app).patch(`/api/v1/publicaciones/${pub.id}/moderacion`).set(bearer(ta)).send({ estado: 'publicada' }).expect(200);
    await request(app).get(`/api/v1/publicaciones/${pub.id}`).expect(200);
  });

  it('un reporte resuelto con "ocultar" retira el contenido y cierra los reportes', async () => {
    const autor = await crearBeneficiario();
    const denunciante = await crearBeneficiario();
    const { token: ta } = await crearAdmin();
    const pub = (await publicar(autor.token)).body.data;

    const rep = await request(app).post('/api/v1/reportes').set(bearer(denunciante.token))
      .send({ tipoContenido: 'publicacion', contenidoId: pub.id, motivo: 'Publicidad engañosa de venta' });
    expect(rep.status).toBe(201);
    await request(app).post('/api/v1/reportes').set(bearer(denunciante.token))
      .send({ tipoContenido: 'publicacion', contenidoId: pub.id, motivo: 'Otra vez el mismo reporte' }).expect(409);
    await request(app).get('/api/v1/reportes').set(bearer(denunciante.token)).expect(403);

    await request(app).patch(`/api/v1/reportes/${rep.body.data.id}`).set(bearer(ta)).send({ accion: 'ocultar', resolucion: 'Incumple las normas' }).expect(200);
    expect((await prisma.publicacion.findUnique({ where: { id: pub.id } })).estado).toBe('suspendida');
  });
});

describe('seguidores', () => {
  it('seguir, feed de seguidos y no seguirse a sí mismo', async () => {
    const yo = await crearBeneficiario();
    const idolo = await crearBeneficiario();
    const ajeno = await crearBeneficiario();
    await publicar(idolo.token, { titulo: 'De quien sigo' });
    await publicar(ajeno.token, { titulo: 'De alguien más' });

    await request(app).post(`/api/v1/seguidores/${yo.usuario.id}`).set(bearer(yo.token)).expect(400);
    await request(app).post(`/api/v1/seguidores/${idolo.usuario.id}`).set(bearer(yo.token)).expect(200);
    await request(app).post(`/api/v1/seguidores/${idolo.usuario.id}`).set(bearer(yo.token)).expect(409);

    const feed = await request(app).get('/api/v1/publicaciones').set(bearer(yo.token)).query({ feed: 'siguiendo' });
    const autores = new Set(feed.body.data.items.map((p) => p.autor.id));
    expect(autores.has(idolo.usuario.id)).toBe(true);
    expect(autores.has(ajeno.usuario.id)).toBe(false);
  });
});

describe('grupos', () => {
  it('grupo privado: requiere aprobación para leer y escribir mensajes', async () => {
    const creador = await crearBeneficiario();
    const aspirante = await crearBeneficiario();
    const grupo = (await request(app).post('/api/v1/grupos').set(bearer(creador.token)).send({ nombre: 'Huerteros de Bosa', privacidad: 'privado' })).body.data;

    const union = await request(app).post(`/api/v1/grupos/${grupo.id}/unirse`).set(bearer(aspirante.token));
    expect(union.body.data.estado).toBe('pendiente');
    await request(app).get(`/api/v1/grupos/${grupo.id}/mensajes`).set(bearer(aspirante.token)).expect(403);
    await request(app).post(`/api/v1/grupos/${grupo.id}/mensajes`).set(bearer(aspirante.token)).send({ contenido: 'Hola' }).expect(403);

    await request(app).patch(`/api/v1/grupos/${grupo.id}/miembros/${aspirante.usuario.id}`).set(bearer(aspirante.token)).send({ accion: 'aprobar' }).expect(403);
    await request(app).patch(`/api/v1/grupos/${grupo.id}/miembros/${aspirante.usuario.id}`).set(bearer(creador.token)).send({ accion: 'aprobar' }).expect(200);

    await request(app).post(`/api/v1/grupos/${grupo.id}/mensajes`).set(bearer(aspirante.token)).send({ contenido: '¡Gracias por aceptarme!' }).expect(201);
    const msgs = await request(app).get(`/api/v1/grupos/${grupo.id}/mensajes`).set(bearer(creador.token));
    expect(msgs.body.data.items.map((m) => m.contenido)).toContain('¡Gracias por aceptarme!');
  });

  it('grupo público: unión inmediata y el creador no puede ser expulsado', async () => {
    const creador = await crearBeneficiario();
    const miembro = await crearBeneficiario();
    const grupo = (await request(app).post('/api/v1/grupos').set(bearer(creador.token)).send({ nombre: 'Reutilizadores', privacidad: 'publico' })).body.data;
    const union = await request(app).post(`/api/v1/grupos/${grupo.id}/unirse`).set(bearer(miembro.token));
    expect(union.body.data.estado).toBe('activo');
    await request(app).patch(`/api/v1/grupos/${grupo.id}/miembros/${creador.usuario.id}`).set(bearer(creador.token)).send({ accion: 'expulsar' }).expect(403);
  });
});

describe('mensajes directos', () => {
  it('conversación 1 a 1 privada con conteo de no leídos', async () => {
    const ana = await crearBeneficiario();
    const beto = await crearConstructora();
    const intruso = await crearBeneficiario();

    await request(app).post('/api/v1/conversaciones').set(bearer(ana.token)).send({ usuarioId: ana.usuario.id }).expect(400);
    const conv = (await request(app).post('/api/v1/conversaciones').set(bearer(ana.token)).send({ usuarioId: beto.usuario.id })).body.data;
    const again = (await request(app).post('/api/v1/conversaciones').set(bearer(beto.token)).send({ usuarioId: ana.usuario.id })).body.data;
    expect(again.id).toBe(conv.id);

    await request(app).post(`/api/v1/conversaciones/${conv.id}/mensajes`).set(bearer(ana.token)).send({ contenido: 'Hola, ¿aún tienen ladrillo?' }).expect(201);
    const noLeidos = await request(app).get('/api/v1/conversaciones/no-leidos').set(bearer(beto.token));
    expect(noLeidos.body.data.total).toBe(1);

    await request(app).get(`/api/v1/conversaciones/${conv.id}/mensajes`).set(bearer(intruso.token)).expect(403);
    await request(app).patch(`/api/v1/conversaciones/${conv.id}/leer`).set(bearer(beto.token)).expect(200);
    const despues = await request(app).get('/api/v1/conversaciones/no-leidos').set(bearer(beto.token));
    expect(despues.body.data.total).toBe(0);
  });
});
