/**
 * Pruebas de seguridad de caja negra contra la plataforma en ejecución (RNF-007, RNF-008, variable TEA).
 * Cada prueba registra lo esperado, lo obtenido y si cumple.
 */
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.argv[2] || path.join(__dirname, 'resultados');
const ipFija = '10.250.250.250';
const ipAleatoria = () => `10.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}.${(Math.random() * 255) | 0}`;
const resultados = [];

async function pedir(ruta, { metodo = 'GET', cuerpo, token, ip = ipAleatoria(), cabeceras = {} } = {}) {
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers: {
      'content-type': 'application/json', accept: 'application/json', 'x-carga-ip': ip,
      ...(token ? { authorization: `Bearer ${token}` } : {}), ...cabeceras,
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* sin cuerpo JSON */ }
  return { status: res.status, headers: res.headers, json };
}

function registrar(id, prueba, esperado, obtenido, cumple) {
  resultados.push({ id, prueba, esperado, obtenido, cumple });
  console.log(`${cumple ? 'CUMPLE   ' : 'NO CUMPLE'}  ${id}  ${prueba}\n           esperado: ${esperado}\n           obtenido: ${obtenido}`);
}

const login = (email, password, ip) => pedir('/api/v1/auth/login', { metodo: 'POST', cuerpo: { email, password }, ip });

(async () => {
  console.log(`Pruebas de seguridad contra ${BASE}\n`);

  // S1 Cabeceras de seguridad (helmet) y ocultamiento de la tecnología
  const r1 = await pedir('/api/v1/materiales');
  const h = (n) => r1.headers.get(n);
  const cab = {
    'x-content-type-options': h('x-content-type-options'), 'x-frame-options': h('x-frame-options'),
    'strict-transport-security': h('strict-transport-security'), 'referrer-policy': h('referrer-policy'),
    'x-powered-by': h('x-powered-by'),
  };
  registrar('S1', 'Cabeceras de seguridad HTTP',
    'nosniff, X-Frame-Options, HSTS y Referrer-Policy presentes; sin X-Powered-By',
    JSON.stringify(cab),
    cab['x-content-type-options'] === 'nosniff' && !!cab['x-frame-options'] && !!cab['strict-transport-security'] && !!cab['referrer-policy'] && !cab['x-powered-by']);

  // S2 Ruta protegida sin token
  const r2 = await pedir('/api/v1/me');
  registrar('S2', 'Acceso a ruta protegida sin token', 'HTTP 401', `HTTP ${r2.status}`, r2.status === 401);

  // S3 Token manipulado
  const falso = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ4Iiwicm9sIjoiQURNSU5JU1RSQURPUiJ9.firmaInvalida';
  const r3 = await pedir('/api/v1/me', { token: falso });
  registrar('S3', 'Token JWT con firma falsificada (rol ADMINISTRADOR)', 'HTTP 401', `HTTP ${r3.status}`, r3.status === 401);

  // S4 Login válido: sin datos sensibles y cookie de refresh segura
  const r4 = await login('beneficiario1@test.co', 'Test@1234');
  const token = r4.json?.data?.accessToken;
  const cookie = r4.headers.get('set-cookie') || '';
  const cuerpo = JSON.stringify(r4.json || {});
  registrar('S4', 'Inicio de sesión válido (beneficiario)',
    'HTTP 200, token de acceso, sin passwordHash en la respuesta, cookie refresh HttpOnly y SameSite=Strict',
    `HTTP ${r4.status}, token: ${token ? 'sí' : 'no'}, passwordHash expuesto: ${/password/i.test(cuerpo) ? 'sí' : 'no'}, cookie: ${cookie.split(';').slice(1).map((s) => s.trim()).join('; ')}`,
    r4.status === 200 && !!token && !/password/i.test(cuerpo) && /httponly/i.test(cookie) && /samesite=strict/i.test(cookie));

  // S5 Control de acceso por rol (beneficiario → ruta de administrador)
  const r5 = await pedir('/api/v1/admin/usuarios', { token });
  registrar('S5', 'Beneficiario intenta entrar a la administración', 'HTTP 403', `HTTP ${r5.status}`, r5.status === 403);

  // S6 Enumeración de usuarios
  const r6a = await login('no-existe-xyz@test.co', 'Cualquiera@123');
  const r6b = await login('beneficiario1@test.co', 'Incorrecta@123');
  registrar('S6', 'Misma respuesta para correo inexistente y contraseña errada',
    'Mismo código y mismo mensaje en ambos casos',
    `inexistente: ${r6a.status} "${r6a.json?.message}" · errada: ${r6b.status} "${r6b.json?.message}"`,
    r6a.status === r6b.status && r6a.json?.message === r6b.json?.message);

  // S7 MFA obligatorio para administradores
  const r7 = await login('admin@brickbybrick.co', 'Admin@BrickByBrick2024');
  registrar('S7', 'Administrador con credenciales correctas', 'Se exige segundo factor: mfaRequerido=true y sin token de acceso',
    `HTTP ${r7.status}, mfaRequerido=${r7.json?.data?.mfaRequerido}, token: ${r7.json?.data?.accessToken ? 'sí' : 'no'}`,
    r7.status === 200 && r7.json?.data?.mfaRequerido === true && !r7.json?.data?.accessToken);

  // S8 Inyección SQL en la búsqueda
  const r8 = await pedir(`/api/v1/materiales?q=${encodeURIComponent("' OR '1'='1' --")}`);
  const n8 = r8.json?.data?.total ?? r8.json?.data?.items?.length ?? 'n/d';
  registrar('S8', "Inyección SQL en la búsqueda (q=' OR '1'='1' --)", 'Sin error 500 y sin devolver todo el catálogo',
    `HTTP ${r8.status}, resultados: ${n8}`, r8.status < 500 && (n8 === 0 || n8 === 'n/d'));

  // S9 Validación de entradas (Zod): campos no permitidos / tipos inválidos
  const r9 = await pedir('/api/v1/auth/login', { metodo: 'POST', cuerpo: { email: 'no-es-correo', password: 123 } });
  registrar('S9', 'Entrada inválida en el login', 'HTTP 400 con errores de validación', `HTTP ${r9.status}`, r9.status === 400);

  // S10 Limitador de intentos de autenticación (fuerza bruta) desde una misma IP
  let primer429 = null;
  const LIMITE = 260;
  for (let i = 1; i <= LIMITE && !primer429; i += 20) {
    const lote = await Promise.all(Array.from({ length: 20 }, () => login('beneficiario2@test.co', 'Incorrecta@123', ipFija)));
    const idx = lote.findIndex((x) => x.status === 429);
    if (idx >= 0) primer429 = i + idx;
  }
  registrar('S10', 'Fuerza bruta: intentos fallidos repetidos desde una IP',
    'Bloqueo con HTTP 429 al superar el límite (200 en desarrollo / 20 en producción por 15 min)',
    primer429 ? `HTTP 429 a partir del intento ${primer429}` : `sin bloqueo tras ${LIMITE} intentos`, !!primer429);

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'seguridad.json'), JSON.stringify({ base: BASE, fecha: new Date().toISOString(), resultados }, null, 2));
  const ok = resultados.filter((r) => r.cumple).length;
  console.log(`\n${ok}/${resultados.length} pruebas de seguridad cumplen. Guardado en ${path.join(OUT, 'seguridad.json')}`);
})().catch((e) => { console.error(e); process.exit(1); });
