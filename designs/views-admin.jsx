// Admin Views
// V-A01 through V-A09

const AdminDashboard = ({ onNavigate }) => {
  const kpis = [
    { icon: 'users', label: 'Beneficiarios activos', value: '3.412', color: 'var(--primary)', trend: 8 },
    { icon: 'building', label: 'Constructoras', value: '87', color: 'var(--secondary)', trend: 5 },
    { icon: 'package', label: 'Materiales publicados', value: '142', color: 'var(--accent)', trend: 12 },
    { icon: 'gift', label: 'Donaciones completadas', value: '89', color: 'var(--warning)', trend: -2 },
    { icon: 'calendar', label: 'Eventos activos', value: '14', color: '#8E44AD', trend: 0 },
    { icon: 'alert-triangle', label: 'Reportes pendientes', value: '6', color: 'var(--danger)', trend: 3 },
  ];

  const topConstructoras = [
    { name: 'Conconcreto S.A.S.', materiales: 31, valor: '$16.8M', verified: true },
    { name: 'Constructora Bolívar S.A.', materiales: 24, valor: '$12.1M', verified: true },
    { name: 'Amarilo S.A.S.', materiales: 18, valor: '$9.4M', verified: true },
    { name: 'Construcciones Ospina', materiales: 12, valor: '$5.7M', verified: false },
    { name: 'Constructora Capital', materiales: 9, valor: '$3.2M', verified: true },
  ];

  const alerts = [
    { type: 'warning', text: '4 empresas pendientes de verificación', icon: 'building', action: 'Revisar' },
    { type: 'danger', text: '3 publicaciones reportadas por usuarios', icon: 'alert-triangle', action: 'Ver' },
    { type: 'warning', text: '6 materiales vencen esta semana sin entregas', icon: 'package', action: 'Ver' },
  ];

  // Mini sparkline line chart
  const lineData = [12,18,15,24,21,28,19,31];
  const maxL = Math.max(...lineData);
  const points = lineData.map((v, i) => `${(i / (lineData.length - 1)) * 100},${100 - (v / maxL) * 80}`).join(' ');

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 4 }}>Dashboard Administrador</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Resumen general de la plataforma BrickByBrick · Mayo 2026</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {kpis.map((k, i) => <KPICard key={i} {...k} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Line chart */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Nuevos registros por semana</h3>
          <div style={{ position: 'relative', height: 120 }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={`0,100 ${points} 100,100`} fill="url(#lineGrad)" />
              <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {lineData.map((v, i) => (
                <circle key={i} cx={(i / (lineData.length - 1)) * 100} cy={100 - (v / maxL) * 80} r="2" fill="var(--primary)" vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              {['W1','W2','W3','W4','W5','W6','W7','W8'].map(w => (
                <span key={w} style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{w}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bar chart materials by category */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Materiales por categoría</h3>
          {[
            { cat: 'Ladrillo', pct: 78, color: 'var(--primary)' },
            { cat: 'Madera', pct: 54, color: 'var(--warning)' },
            { cat: 'Cerámica', pct: 42, color: '#8E44AD' },
            { cat: 'Concreto', pct: 38, color: 'var(--secondary)' },
            { cat: 'Pintura', pct: 27, color: 'var(--accent)' },
          ].map(b => (
            <div key={b.cat} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{b.cat}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{b.pct}</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-base)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: b.color, width: `${b.pct}%`, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Top constructoras */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16 }}>Top 5 constructoras por donación</h3>
          </div>
          <table className="data-table">
            <thead><tr><th>#</th><th>Constructora</th><th>Materiales</th><th>Valor donado</th><th>Estado</th></tr></thead>
            <tbody>
              {topConstructoras.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: i < 3 ? 'var(--warning)' : 'var(--text-secondary)' }}>#{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Avatar name={c.name} size={28} />
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--secondary)' }}>{c.materiales}</td>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--accent)', fontSize: 13 }}>{c.valor}</td>
                  <td><Badge type={c.verified ? 'verificado' : 'pendiente-verificacion'}>{c.verified ? 'Verificada' : 'Pendiente'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Alertas del sistema</h3>
            {alerts.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: a.type === 'danger' ? 'var(--danger-light)' : 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={a.icon} size={16} color={a.type === 'danger' ? 'var(--danger)' : 'var(--warning)'} />
                </div>
                <span style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>{a.text}</span>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, color: 'var(--secondary)' }}>{a.action}</button>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Acciones rápidas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Gestionar beneficiarios', view: 'admin-beneficiarios', icon: 'users' },
                { label: 'Verificar constructoras', view: 'admin-constructoras', icon: 'building' },
                { label: 'Ver publicaciones reportadas', view: 'admin-publicaciones', icon: 'alert-triangle' },
                { label: 'Ver reportes', view: 'admin-reportes', icon: 'bar-chart' },
              ].map((a, i) => (
                <button key={i} className="btn btn-ghost btn-sm" onClick={() => onNavigate(a.view)} style={{ justifyContent: 'flex-start', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <Icon name={a.icon} size={14} color="var(--text-secondary)" />{a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// V-A02: Gestión de Beneficiarios
const AdminBeneficiarios = ({ onNavigate }) => {
  const [profileModal, setProfileModal] = React.useState(null);
  const beneficiarios = [
    { name: 'Carlos Rivera', cedula: '1020304050', email: 'carlos@gmail.com', localidad: 'Rafael Uribe', estrato: 2, fecha: '12 Feb 2025', estado: 'activo', alimentador: true },
    { name: 'María Rodríguez', cedula: '1032456789', email: 'maria.r@hotmail.com', localidad: 'Bosa', estrato: 1, fecha: '3 Mar 2025', estado: 'activo', alimentador: false },
    { name: 'Jorge Peñaloza', cedula: '79456123', email: 'jorge.p@gmail.com', localidad: 'Kennedy', estrato: 3, fecha: '15 Abr 2025', estado: 'suspendido', alimentador: false },
    { name: 'Luz Marina Castro', cedula: '51234678', email: 'luz.castro@yahoo.com', localidad: 'Suba', estrato: 2, fecha: '20 May 2025', estado: 'activo', alimentador: true },
    { name: 'Ricardo Sánchez', cedula: '80123456', email: 'rsanchez@gmail.com', localidad: 'Ciudad Bolívar', estrato: 1, fecha: '8 Jun 2025', estado: 'pendiente', alimentador: false },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div><h1 style={{ marginBottom: 4 }}>Gestión de Beneficiarios</h1><p style={{ color: 'var(--text-secondary)' }}>Administra cuentas de beneficiarios registrados.</p></div>
        <button className="btn btn-primary"><Icon name="plus" size={16} color="#fff" />Crear beneficiario</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Icon name="search" size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="form-input" placeholder="Buscar por nombre, cédula o correo..." style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-select" style={{ width: 160 }}><option>Todas las localidades</option><option>Kennedy</option><option>Bosa</option><option>Suba</option></select>
        <select className="form-select" style={{ width: 120 }}><option>Todo estrato</option>{[1,2,3,4,5,6].map(e => <option key={e}>Estrato {e}</option>)}</select>
        <select className="form-select" style={{ width: 140 }}><option>Todo estado</option><option>Activo</option><option>Suspendido</option><option>Pendiente</option></select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" style={{ accentColor: 'var(--primary)' }} />Solo Alimentadores
        </label>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Usuario</th><th>Cédula</th><th>Correo</th><th>Localidad</th><th>Estrato</th><th>Registro</th><th>Estado</th><th>Alimentador</th><th>Acciones</th></tr></thead>
          <tbody>
            {beneficiarios.map((b, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Avatar name={b.name} size={30} />
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{b.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.cedula}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.email}</td>
                <td style={{ fontSize: 13 }}>{b.localidad}</td>
                <td style={{ fontSize: 13, textAlign: 'center' }}>{b.estrato}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.fecha}</td>
                <td><Badge type={b.estado === 'activo' ? 'disponible' : b.estado === 'suspendido' ? 'rechazado' : 'pendiente'}>{b.estado.charAt(0).toUpperCase() + b.estado.slice(1)}</Badge></td>
                <td style={{ textAlign: 'center' }}>
                  {b.alimentador ? <Icon name="check-circle" size={18} color="var(--accent)" /> : <Icon name="x-circle" size={18} color="var(--border)" />}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setProfileModal(b)} title="Ver perfil"><Icon name="eye" size={14} /></button>
                    <button className="btn btn-ghost btn-sm" title="Editar"><Icon name="edit" size={14} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: b.estado === 'activo' ? 'var(--warning)' : 'var(--accent)' }} title="Suspender/Activar">
                      <Icon name={b.estado === 'activo' ? 'x-circle' : 'check-circle'} size={14} color={b.estado === 'activo' ? 'var(--warning)' : 'var(--accent)'} />
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Eliminar"><Icon name="trash" size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {profileModal && (
        <Modal title={`Perfil: ${profileModal.name}`} onClose={() => setProfileModal(null)} size="lg"
          footer={<><button className="btn btn-ghost" onClick={() => setProfileModal(null)}>Cerrar</button><button className="btn btn-primary">Editar cuenta</button></>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[['Nombre completo', profileModal.name], ['Cédula', profileModal.cedula], ['Correo', profileModal.email], ['Localidad', profileModal.localidad], ['Estrato', `Estrato ${profileModal.estrato}`], ['Fecha de registro', profileModal.fecha], ['Estado', profileModal.estado], ['Alimentador Web', profileModal.alimentador ? 'Sí' : 'No']].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>ACTIVIDAD RECIENTE</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[['Solicitudes', '5'], ['Eventos', '2'], ['Publicaciones', '1']].map(([l, v]) => (
                <div key={l} style={{ flex: 1, background: 'var(--bg-base)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>{v}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// V-A03: Gestión de Constructoras
const AdminConstructoras = ({ onNavigate }) => {
  const [verifyModal, setVerifyModal] = React.useState(null);
  const constructoras = [
    { name: 'Conconcreto S.A.S.', nit: '890.903.938-1', rep: 'Álvaro Jaramillo', estado: 'activo', verificada: true, materiales: 31 },
    { name: 'Constructora Bolívar S.A.', nit: '800.123.456-7', rep: 'Diana Gómez', estado: 'activo', verificada: true, materiales: 24 },
    { name: 'Constructora Capital Ltda.', nit: '901.234.567-2', rep: 'Hernán López', estado: 'pendiente', verificada: false, materiales: 0 },
    { name: 'Obras Civiles del Sur S.A.S.', nit: '900.876.543-9', rep: 'Claudia Martínez', estado: 'activo', verificada: false, materiales: 3 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div><h1 style={{ marginBottom: 4 }}>Gestión de Constructoras</h1><p style={{ color: 'var(--text-secondary)' }}>Verifica y administra empresas constructoras registradas.</p></div>
      </div>

      <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Icon name="search" size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="form-input" placeholder="Buscar por razón social o NIT..." style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-select" style={{ width: 160 }}><option>Verificación: todas</option><option>Verificadas</option><option>Pendientes</option></select>
        <select className="form-select" style={{ width: 140 }}><option>Estado: todos</option><option>Activo</option><option>Suspendido</option></select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Empresa</th><th>NIT</th><th>Representante</th><th>Estado</th><th>Verificada</th><th>Materiales</th><th>Acciones</th></tr></thead>
          <tbody>
            {constructoras.map((c, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(46,134,171,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="building" size={16} color="var(--secondary)" />
                    </div>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.nit}</td>
                <td style={{ fontSize: 13 }}>{c.rep}</td>
                <td><Badge type={c.estado === 'activo' ? 'disponible' : 'pendiente'}>{c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}</Badge></td>
                <td>
                  {c.verificada
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}><Icon name="check-circle" size={15} color="var(--accent)" />Verificada</span>
                    : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)', fontSize: 13, fontWeight: 600 }}><Icon name="alert-triangle" size={15} color="var(--warning)" />Pendiente</span>}
                </td>
                <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--secondary)' }}>{c.materiales}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" title="Ver detalle"><Icon name="eye" size={14} /></button>
                    {!c.verificada && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} onClick={() => setVerifyModal(c)} title="Verificar"><Icon name="check-circle" size={14} color="var(--accent)" /></button>}
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--warning)' }} title="Suspender"><Icon name="x-circle" size={14} color="var(--warning)" /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Eliminar"><Icon name="trash" size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {verifyModal && (
        <Modal title="Verificar empresa" onClose={() => setVerifyModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setVerifyModal(null)}>Cancelar</button>
            <button className="btn btn-danger" style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}>Rechazar con motivo</button>
            <button className="btn btn-accent" onClick={() => setVerifyModal(null)}>Aprobar verificación</button>
          </>}>
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Revisa los documentos de <strong>{verifyModal.name}</strong> antes de aprobar.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {['RUT (vigente)', 'Cámara de Comercio'].map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 8 }}>
                  <Icon name="file-check" size={20} color="var(--secondary)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{doc}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cargado el 1 Feb 2026</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--secondary)' }}><Icon name="eye" size={14} color="var(--secondary)" />Ver</button>
                </div>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Motivo de rechazo (si aplica)</label>
              <textarea className="form-textarea" style={{ minHeight: 70 }} placeholder="Ej: El RUT no coincide con la razón social registrada..." />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// V-A04: Gestión de Materiales Admin
const AdminMateriales = ({ onNavigate }) => {
  const [tab, setTab] = React.useState('todos');
  const materiales = [
    { mat: 'Ladrillo Prensado Estándar', empresa: 'Constructora Bolívar', cat: 'Ladrillo', qty: '2.400 und', solicitudes: 8, estado: 'disponible', fecha: '30 Ene 2026' },
    { mat: 'Tablón de Madera Pino', empresa: 'Conconcreto S.A.S.', cat: 'Madera', qty: '48 m²', solicitudes: 3, estado: 'disponible', fecha: '31 Ene 2026' },
    { mat: 'Cerámica Piso Bavarian', empresa: 'Amarilo S.A.S.', cat: 'Cerámica', qty: '120 m²', solicitudes: 0, estado: 'entregado', fecha: '10 Ene 2026' },
    { mat: 'Arena Río Lavada', empresa: 'Const. Ospina', cat: 'Concreto', qty: '15 m³', solicitudes: 1, estado: 'disponible', fecha: '5 Feb 2026' },
    { mat: 'Vidrio Templado 6mm', empresa: 'Const. Capital', cat: 'Vidrio', qty: '25 m²', solicitudes: 2, estado: 'reportado', fecha: '28 Ene 2026' },
  ];
  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Gestión de Materiales</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Todas las publicaciones de materiales del sistema.</p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-base)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {['todos', 'reportados'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: tab === t ? 'var(--bg-dark)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, transition: 'all 200ms', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Icon name="search" size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="form-input" placeholder="Buscar material, constructora..." style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-select" style={{ width: 140 }}><option>Categoría: todas</option><option>Ladrillo</option><option>Madera</option></select>
        <select className="form-select" style={{ width: 140 }}><option>Estado: todos</option><option>Disponible</option><option>Entregado</option><option>Reportado</option></select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Material</th><th>Constructora</th><th>Categoría</th><th>Cantidad</th><th>Solicitudes</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
          <tbody>
            {(tab === 'reportados' ? materiales.filter(m => m.estado === 'reportado') : materiales).map((m, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500, fontSize: 13 }}>{m.mat}</td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.empresa}</td>
                <td><span className="badge badge-secundario" style={{ fontSize: 11 }}>{m.cat}</span></td>
                <td style={{ fontSize: 13 }}>{m.qty}</td>
                <td style={{ textAlign: 'center', fontWeight: 600, color: m.solicitudes > 0 ? 'var(--primary)' : 'var(--text-secondary)' }}>{m.solicitudes}</td>
                <td><Badge type={m.estado === 'disponible' ? 'disponible' : m.estado === 'reportado' ? 'rechazado' : 'entregado'}>{m.estado.charAt(0).toUpperCase() + m.estado.slice(1)}</Badge></td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.fecha}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" title="Ver"><Icon name="eye" size={13} /></button>
                    <button className="btn btn-ghost btn-sm" title="Editar"><Icon name="edit" size={13} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--warning)' }} title="Pausar"><Icon name="x-circle" size={13} color="var(--warning)" /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Eliminar"><Icon name="trash" size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// V-A07: Gestión de Publicaciones
const AdminPublicaciones = ({ onNavigate }) => {
  const [tab, setTab] = React.useState('todas');
  const [reportModal, setReportModal] = React.useState(null);
  const pubs = [
    { title: 'Mesa de Madera Reciclada', autor: 'Ana Forero', tipo: 'Proyecto', fecha: '1 Feb 2026', likes: 24, comments: 6, reports: 0, estado: 'activo' },
    { title: 'Tutorial: mezcla de concreto', autor: 'Diego Morales', tipo: 'Tutorial', fecha: '2 Feb 2026', likes: 18, comments: 9, reports: 0, estado: 'activo' },
    { title: 'Contenido inapropiado detectado', autor: 'Unknown User', tipo: 'Otro', fecha: '3 Feb 2026', likes: 0, comments: 1, reports: 4, estado: 'reportado' },
    { title: 'Noticias del sector construcción', autor: 'Esperanza Calderón', tipo: 'Noticia', fecha: '28 Ene 2026', likes: 45, comments: 12, reports: 0, estado: 'activo' },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Gestión de Publicaciones</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Modera el contenido de la comunidad.</p>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-base)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {['todas', 'reportadas', 'eliminadas'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: tab === t ? 'var(--bg-dark)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, transition: 'all 200ms', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Título</th><th>Autor</th><th>Tipo</th><th>Fecha</th><th>Likes</th><th>Comentarios</th><th>Reportes</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {(tab === 'reportadas' ? pubs.filter(p => p.reports > 0) : pubs).map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</td>
                <td style={{ fontSize: 13 }}>{p.autor}</td>
                <td><span className="badge badge-secundario" style={{ fontSize: 11 }}>{p.tipo}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.fecha}</td>
                <td style={{ textAlign: 'center' }}>{p.likes}</td>
                <td style={{ textAlign: 'center' }}>{p.comments}</td>
                <td style={{ textAlign: 'center' }}>
                  {p.reports > 0 ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{p.reports}</span> : <span style={{ color: 'var(--text-secondary)' }}>0</span>}
                </td>
                <td><Badge type={p.estado === 'activo' ? 'disponible' : 'rechazado'}>{p.estado === 'activo' ? 'Activo' : 'Reportado'}</Badge></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" title="Ver"><Icon name="eye" size={13} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} title="Destacar"><Icon name="award" size={13} color="var(--accent)" /></button>
                    {p.reports > 0 && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--warning)' }} onClick={() => setReportModal(p)}><Icon name="alert-triangle" size={13} color="var(--warning)" /></button>}
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Eliminar"><Icon name="trash" size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reportModal && (
        <Modal title="Publicación reportada" onClose={() => setReportModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setReportModal(null)}>Ignorar reporte</button>
            <button className="btn btn-danger" onClick={() => setReportModal(null)}>Eliminar publicación</button>
          </>}>
          <div>
            <div style={{ background: 'var(--danger-light)', borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', gap: 10 }}>
              <Icon name="alert-triangle" size={18} color="var(--danger)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--danger)' }}>{reportModal.reports} reportes recibidos</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Razón principal: Contenido inapropiado</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{reportModal.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Por {reportModal.autor} · {reportModal.fecha}</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Contenido de la publicación aquí... [Vista previa del contenido reportado]</p>
            </div>
            <div className="form-group">
              <label className="form-label">Notificar al autor (opcional)</label>
              <textarea className="form-textarea" style={{ minHeight: 70 }} placeholder="Escribe el motivo para notificar al autor..." />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// V-A08: Reportes
const AdminReportes = ({ onNavigate }) => {
  const [activeReport, setActiveReport] = React.useState('donaciones');
  const metrics = [
    { label: 'TRP (Tiempo Respuesta Prom.)', value: '1.4 días', icon: 'activity' },
    { label: 'TEA (Tasa Autent. Exitosa)', value: '98.2%', icon: 'check-circle' },
    { label: 'IPE (Índice Participación Eventos)', value: '74%', icon: 'calendar' },
    { label: 'TPA (Tiempo Asign. Materiales)', value: '2.1 días', icon: 'package' },
  ];
  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Reportes y Estadísticas</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Genera y exporta reportes de la plataforma.</p>

      {/* Platform metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {metrics.map((m, i) => <KPICard key={i} icon={m.icon} label={m.label} value={m.value} color={['var(--primary)', 'var(--accent)', 'var(--secondary)', 'var(--warning)'][i]} />)}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['donaciones', 'usuarios', 'eventos'].map(r => (
          <button key={r} onClick={() => setActiveReport(r)} className="btn btn-sm" style={{ background: activeReport === r ? 'var(--bg-dark)' : 'transparent', color: activeReport === r ? '#fff' : 'var(--text-secondary)', border: `1px solid ${activeReport === r ? 'var(--bg-dark)' : 'var(--border)'}`, textTransform: 'capitalize' }}>{r}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, textTransform: 'capitalize' }}>Reporte de {activeReport}</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="form-input" type="date" style={{ width: 140 }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>—</span>
            <input className="form-input" type="date" style={{ width: 140 }} />
            <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}><Icon name="download" size={14} />CSV</button>
            <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}><Icon name="file-text" size={14} />PDF</button>
          </div>
        </div>

        {activeReport === 'donaciones' && (
          <table className="data-table">
            <thead><tr><th>Material</th><th>Constructora</th><th>Beneficiario</th><th>Fecha</th><th>Valor estimado</th><th>Estado</th></tr></thead>
            <tbody>
              {[
                ['Ladrillo Prensado', 'Const. Bolívar', 'Carlos Rivera', '28 Ene 2026', '$4.800.000', 'entregado'],
                ['Madera Pino', 'Conconcreto', 'María Rodríguez', '15 Ene 2026', '$1.920.000', 'entregado'],
                ['Cerámica Bavarian', 'Amarilo S.A.S.', 'Jorge Peñaloza', '10 Ene 2026', '$3.600.000', 'entregado'],
                ['Arena de Río', 'Const. Ospina', 'Luz Castro', '5 Feb 2026', '$450.000', 'pendiente'],
              ].map(([m, e, b, f, v, s], i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{m}</td>
                  <td style={{ fontSize: 13 }}>{e}</td>
                  <td style={{ fontSize: 13 }}>{b}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f}</td>
                  <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--accent)', fontSize: 13 }}>{v}</td>
                  <td><Badge type={s === 'entregado' ? 'entregado' : 'pendiente'}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeReport === 'usuarios' && (
          <table className="data-table">
            <thead><tr><th>Semana</th><th>Nuevos beneficiarios</th><th>Nuevas constructoras</th><th>Total activos</th></tr></thead>
            <tbody>
              {[['W1 Ene','45','2','3.280'],['W2 Ene','52','3','3.332'],['W3 Ene','38','1','3.370'],['W4 Ene','42','4','3.412']].map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} style={{ fontWeight: j > 0 ? 600 : 400, color: j === 0 ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        )}
        {activeReport === 'eventos' && (
          <table className="data-table">
            <thead><tr><th>Evento</th><th>Constructora</th><th>Fecha</th><th>Inscritos</th><th>Asistentes</th><th>Materiales distribuidos</th></tr></thead>
            <tbody>
              {[['Donación Masiva Ene','Const. Bolívar','15 Ene 2026','75','68','Ladrillo, Madera'],['Taller Reutilización','Conconcreto','22 Ene 2026','35','31','Cerámica']].map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} style={{ fontSize: 13 }}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// V-A09: Configuración
const AdminConfiguracion = ({ onNavigate }) => {
  const [section, setSection] = React.useState('notificaciones');
  const sections = [
    { id: 'notificaciones', label: 'Notificaciones', icon: 'bell' },
    { id: 'parametros', label: 'Parámetros', icon: 'settings' },
    { id: 'categorias', label: 'Categorías', icon: 'tag' },
    { id: 'seguridad', label: 'Seguridad', icon: 'shield' },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: 'hard-drive' },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Configuración del sistema</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Ajusta los parámetros globales de la plataforma.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sidebar nav */}
        <div className="card" style={{ padding: 8 }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: section === s.id ? 'rgba(192,57,43,0.08)' : 'transparent', color: section === s.id ? 'var(--primary)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: section === s.id ? 600 : 400, transition: 'all 200ms', marginBottom: 2, textAlign: 'left' }}>
              <Icon name={s.icon} size={16} color={section === s.id ? 'var(--primary)' : 'var(--text-secondary)'} />{s.label}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 28 }}>
          {section === 'notificaciones' && (
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 20 }}>Notificaciones globales</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {['Nuevas solicitudes de material', 'Eventos próximos', 'Materiales por vencer', 'Nuevos registros de empresa', 'Reportes de contenido', 'Alertas del sistema'].map(n => (
                  <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14 }}>{n}</span>
                    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', inset: 0, background: 'var(--accent)', borderRadius: 24, transition: '200ms' }} />
                      <span style={{ position: 'absolute', height: 18, width: 18, left: 23, bottom: 3, background: '#fff', borderRadius: '50%', transition: '200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {section === 'parametros' && (
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 20 }}>Parámetros de la plataforma</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[['Tiempo máximo disponibilidad materiales (días)', '30'], ['Cupos máximos por defecto para eventos', '100'], ['Límite solicitudes simultáneas por beneficiario', '3']].map(([l, v]) => (
                  <div key={l} className="form-group">
                    <label className="form-label">{l}</label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <input className="form-input" type="number" defaultValue={v} style={{ maxWidth: 120 }} />
                      <button className="btn btn-primary btn-sm">Guardar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {section === 'categorias' && (
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 20 }}>Gestión de categorías</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Ladrillo', 'Concreto', 'Madera', 'Cerámica', 'Hierro', 'Vidrio', 'Pintura', 'Acero', 'Otro'].map((c, i) => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-base)', borderRadius: 8 }}>
                    <Icon name="menu" size={14} color="var(--text-secondary)" style={{ cursor: 'grab' }} />
                    <span style={{ width: 24, height: 24, background: Object.values(catColors || {})[i] || 'var(--border)', borderRadius: 4, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontWeight: 500 }}>{c}</span>
                    <button className="btn btn-ghost btn-sm"><Icon name="edit" size={13} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Icon name="trash" size={13} /></button>
                  </div>
                ))}
                <button className="btn btn-ghost" style={{ border: '1px dashed var(--border)', marginTop: 8 }}>
                  <Icon name="plus" size={16} color="var(--text-secondary)" />Agregar categoría
                </button>
              </div>
            </div>
          )}
          {section === 'seguridad' && (
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 20 }}>Configuración de seguridad</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[['Expiración de tokens JWT (horas)', '24'], ['Intentos máximos de login', '5'], ['Bloqueo temporal de cuenta (minutos)', '30']].map(([l, v]) => (
                  <div key={l} className="form-group">
                    <label className="form-label">{l}</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input className="form-input" type="number" defaultValue={v} style={{ maxWidth: 120 }} />
                      <button className="btn btn-primary btn-sm">Guardar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {section === 'mantenimiento' && (
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 20 }}>Mantenimiento del sistema</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Limpiar caché del sistema', icon: 'refresh-cw', color: 'var(--secondary)', desc: 'Elimina archivos temporales y caché de sesión' },
                  { label: 'Exportar backup de base de datos', icon: 'database', color: 'var(--accent)', desc: 'Genera un respaldo completo de todos los datos' },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--bg-base)', borderRadius: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: a.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name={a.icon} size={20} color={a.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.desc}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>{a.label.split(' ')[0]}</button>
                  </div>
                ))}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Logs de errores recientes</div>
                  <div style={{ background: '#0d1117', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 12 }}>
                    {['[2026-02-03 08:12] WARN: Material ID#432 expirado sin notificar', '[2026-02-03 07:45] INFO: Backup automático completado', '[2026-02-02 22:30] ERROR: Timeout en carga de imagen usuario #1201', '[2026-02-02 14:11] INFO: 3 cuentas bloqueadas por intentos fallidos'].map((log, i) => (
                      <div key={i} style={{ color: log.includes('ERROR') ? '#ff6b6b' : log.includes('WARN') ? '#ffa500' : '#7ec8e3', marginBottom: 6 }}>{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  AdminDashboard, AdminBeneficiarios, AdminConstructoras,
  AdminMateriales, AdminPublicaciones, AdminReportes, AdminConfiguracion,
});
