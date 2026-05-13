// Empresa (Constructora) Views
// V-E01 through V-E11

const KPICard = ({ icon, label, value, sub, color = 'var(--primary)', trend }) => (
  <div className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name={icon} size={22} color={color} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
    </div>
    {trend && <div style={{ fontSize: 12, color: trend > 0 ? 'var(--accent)' : 'var(--danger)', fontWeight: 600, alignSelf: 'flex-start' }}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</div>}
  </div>
);

const MiniBarChart = ({ data, color = 'var(--secondary)' }) => {
  const max = Math.max(...data.map(d => Math.max(d.a, d.b)));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 70 }}>
            <div style={{ flex: 1, background: color, borderRadius: '3px 3px 0 0', height: `${(d.a / max) * 100}%`, minHeight: 4 }} />
            <div style={{ flex: 1, background: color + '55', borderRadius: '3px 3px 0 0', height: `${(d.b / max) * 100}%`, minHeight: 4 }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

// V-E01: Dashboard Empresa
const EmpresaDashboard = ({ onNavigate }) => {
  const chartData = [
    { label: 'Ago', a: 12, b: 8 }, { label: 'Sep', a: 18, b: 14 },
    { label: 'Oct', a: 9, b: 7 }, { label: 'Nov', a: 24, b: 20 },
    { label: 'Dic', a: 15, b: 12 }, { label: 'Ene', a: 31, b: 27 },
  ];

  const solicitudes = [
    { beneficiario: 'Carlos Rivera', material: 'Ladrillo Prensado', qty: '100 und', localidad: 'Rafael Uribe', fecha: '1 Feb 2026', estado: 'pendiente' },
    { beneficiario: 'María Rodríguez', material: 'Tablón de Madera', qty: '8 m²', localidad: 'Bosa', fecha: '2 Feb 2026', estado: 'pendiente' },
    { beneficiario: 'Jorge Peñaloza', material: 'Ladrillo Prensado', qty: '200 und', localidad: 'Kennedy', fecha: '2 Feb 2026', estado: 'aprobada' },
    { beneficiario: 'Luz Marina Castro', material: 'Pintura Caucho', qty: '10 L', localidad: 'Suba', fecha: '3 Feb 2026', estado: 'pendiente' },
    { beneficiario: 'Ricardo Sánchez', material: 'Arena de Río', qty: '1 m³', localidad: 'Bosa', fecha: '3 Feb 2026', estado: 'rechazado' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 4 }}>Panel de control</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Conconcreto S.A.S. — Resumen de actividad</p>
      </div>

      {/* Alert */}
      <div style={{ background: 'var(--warning-light)', border: '1px solid rgba(230,126,34,0.25)', borderRadius: 10, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <Icon name="alert-triangle" size={18} color="var(--warning)" />
        <span style={{ fontSize: 14, color: 'var(--warning)', fontWeight: 500 }}>
          <strong>Alerta:</strong> 2 materiales vencen en menos de 7 días — "Ladrillo Prensado" y "Pintura Caucho". Tienes 8 solicitudes pendientes.
        </span>
        <button className="btn btn-sm" style={{ background: 'var(--warning)', color: '#fff', marginLeft: 'auto', flexShrink: 0 }} onClick={() => onNavigate('empresa-materiales')}>
          Revisar
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <KPICard icon="package" label="Materiales publicados" value="14" sub="Este mes" color="var(--secondary)" trend={12} />
        <KPICard icon="layers" label="Solicitudes pendientes" value="8" sub="Sin gestionar" color="var(--warning)" />
        <KPICard icon="calendar" label="Eventos activos" value="2" sub="En curso" color="var(--accent)" trend={0} />
        <KPICard icon="percent" label="Deducción tributaria" value="$4.2M" sub="Estimado COP 2026" color="var(--primary)" trend={8} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div>
          {/* Chart */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16 }}>Materiales donados vs solicitados</h3>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--secondary)', display: 'inline-block' }} />Donados</span>
                <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(46,134,171,0.35)', display: 'inline-block' }} />Solicitados</span>
              </div>
            </div>
            <MiniBarChart data={chartData} color="var(--secondary)" />
          </div>

          {/* Solicitudes recientes */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16 }}>Solicitudes recientes</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('empresa-materiales')}>Ver todas</button>
            </div>
            <table className="data-table">
              <thead><tr><th>Beneficiario</th><th>Material</th><th>Cantidad</th><th>Localidad</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
                {solicitudes.map((s, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Avatar name={s.beneficiario} size={28} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{s.beneficiario}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{s.material}</td>
                    <td style={{ fontSize: 13 }}>{s.qty}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.localidad}</td>
                    <td><Badge type={s.estado === 'aprobada' ? 'aprobado' : s.estado === 'rechazado' ? 'rechazado' : 'pendiente'}>{s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}</Badge></td>
                    <td>
                      {s.estado === 'pendiente' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-accent" style={{ height: 28, fontSize: 12 }}>Aprobar</button>
                          <button className="btn btn-sm" style={{ height: 28, fontSize: 12, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}>Rechazar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Próximos eventos</h3>
            {[
              { title: 'Donación Masiva Feb', date: '15 Feb', cupos: 45, total: 80 },
              { title: 'Taller Reutilización', date: '23 Feb', cupos: 12, total: 40 },
            ].map((ev, i) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{ev.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{ev.date} · {ev.cupos}/{ev.total} cupos</div>
                <div style={{ height: 4, background: 'var(--bg-base)', borderRadius: 2 }}>
                  <div style={{ height: '100%', background: 'var(--secondary)', width: `${(ev.cupos / ev.total) * 100}%`, borderRadius: 2 }} />
                </div>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 16 }} onClick={() => onNavigate('empresa-eventos')}>
              Ver todos los eventos
            </button>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Acciones rápidas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => onNavigate('empresa-nuevo-material')} style={{ justifyContent: 'flex-start' }}>
                <Icon name="plus" size={16} color="var(--secondary)" />Publicar material
              </button>
              <button className="btn btn-ghost" onClick={() => onNavigate('empresa-nuevo-evento')} style={{ justifyContent: 'flex-start', border: '1px solid var(--border)' }}>
                <Icon name="calendar" size={16} color="var(--text-secondary)" />Crear evento
              </button>
              <button className="btn btn-ghost" onClick={() => onNavigate('empresa-tributario')} style={{ justifyContent: 'flex-start', border: '1px solid var(--border)' }}>
                <Icon name="percent" size={16} color="var(--text-secondary)" />Beneficios tributarios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// V-E03: Gestión de Materiales
const EmpresaMateriales = ({ onNavigate }) => {
  const [filterTab, setFilterTab] = React.useState('todos');
  const materiales = [
    { name: 'Ladrillo Prensado Estándar', cat: 'Ladrillo', qty: '2.400 und', solicitudes: 8, estado: 'disponible', fecha: '30 Ene 2026', vence: '28 Feb 2026' },
    { name: 'Tablón de Madera Pino', cat: 'Madera', qty: '48 m²', solicitudes: 3, estado: 'disponible', fecha: '31 Ene 2026', vence: '20 Feb 2026' },
    { name: 'Pintura Caucho Blanca', cat: 'Pintura', qty: '80 L', solicitudes: 2, estado: 'pendiente', fecha: '1 Feb 2026', vence: '8 Feb 2026' },
    { name: 'Cerámica Piso Bavarian', cat: 'Cerámica', qty: '120 m²', solicitudes: 0, estado: 'entregado', fecha: '10 Ene 2026', vence: '10 Feb 2026' },
  ];
  const tabs = ['todos', 'disponibles', 'con solicitudes', 'entregados', 'vencidos'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Mis materiales publicados</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gestiona tus publicaciones de materiales excedentes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('empresa-nuevo-material')}>
          <Icon name="plus" size={16} color="#fff" />Publicar material
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setFilterTab(t)} className="btn btn-sm" style={{
            background: filterTab === t ? 'var(--secondary)' : 'transparent',
            color: filterTab === t ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${filterTab === t ? 'var(--secondary)' : 'var(--border)'}`,
            textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Nombre</th><th>Categoría</th><th>Cantidad</th><th>Solicitudes</th><th>Estado</th><th>Publicado</th><th>Válido hasta</th><th>Acciones</th></tr></thead>
          <tbody>
            {materiales.map((m, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{m.name}</td>
                <td><span className="badge" style={{ background: 'rgba(46,134,171,0.1)', color: 'var(--secondary)' }}>{m.cat}</span></td>
                <td>{m.qty}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {m.solicitudes > 0 && <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.solicitudes}</span>}
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.solicitudes} recibidas</span>
                  </div>
                </td>
                <td><Badge type={m.estado === 'disponible' ? 'disponible' : m.estado === 'entregado' ? 'entregado' : 'pendiente'}>{m.estado.charAt(0).toUpperCase() + m.estado.slice(1)}</Badge></td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.fecha}</td>
                <td style={{ fontSize: 13, color: m.vence === '8 Feb 2026' ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: m.vence === '8 Feb 2026' ? 600 : 400 }}>{m.vence}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('empresa-material-detalle')}><Icon name="eye" size={14} /></button>
                    <button className="btn btn-ghost btn-sm"><Icon name="edit" size={14} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Icon name="trash" size={14} /></button>
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

// V-E04: Publicar Material
const EmpresaNuevoMaterial = ({ onNavigate }) => {
  const [files, setFiles] = React.useState([]);
  return (
    <div style={{ maxWidth: 720 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('empresa-materiales')} style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
        <Icon name="chevron-left" size={14} color="var(--text-secondary)" /> Volver a materiales
      </button>
      <h1 style={{ marginBottom: 4 }}>Publicar nuevo material</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Completa la información del material excedente que deseas donar.</p>

      <div className="card" style={{ padding: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Nombre del material *</label>
            <input className="form-input" placeholder="Ej: Ladrillo prensado estándar" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select className="form-select">
                <option value="">Seleccionar categoría</option>
                {['Ladrillo','Concreto','Madera','Cerámica','Hierro','Vidrio','Pintura','Acero','Otro'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado del material *</label>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {['Nuevo','Buen estado','Usado'].map(s => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                    <input type="radio" name="estado_mat" style={{ accentColor: 'var(--secondary)' }} />{s}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Cantidad disponible *</label>
              <input className="form-input" type="number" placeholder="Ej: 2400" />
            </div>
            <div className="form-group">
              <label className="form-label">Unidad de medida *</label>
              <select className="form-select">
                <option value="">Seleccionar</option>
                {['unidades','m²','m³','kg','toneladas','litros'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción detallada *</label>
            <textarea className="form-textarea" placeholder="Describe el material, sus características, condiciones, procedencia..." />
          </div>
          <div className="form-group">
            <label className="form-label">Condiciones de retiro</label>
            <textarea className="form-textarea" style={{ minHeight: 80 }} placeholder="Horario disponible para retiro, dirección exacta, requisitos del beneficiario, equipos necesarios..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Fecha límite de disponibilidad *</label>
              <input className="form-input" type="date" />
            </div>
            <div className="form-group">
              <label className="form-label">Máximo de solicitudes a aprobar</label>
              <input className="form-input" type="number" placeholder="Ej: 3 (dejar vacío = ilimitado)" />
            </div>
          </div>
          {/* Fotos */}
          <div>
            <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Fotos del material (hasta 5 imágenes)</label>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, border: '2px dashed var(--border)', borderRadius: 10, padding: '28px 20px', cursor: 'pointer', background: 'var(--bg-base)' }}>
              <Icon name="upload" size={28} color="var(--text-secondary)" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Arrastra tus fotos aquí</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>o haz clic para seleccionar · JPG, PNG, máx. 5MB c/u</div>
              </div>
              <input type="file" hidden multiple accept="image/*" onChange={e => setFiles(Array.from(e.target.files).slice(0, 5))} />
            </label>
            {files.length > 0 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', padding: 4 }}>
                    <span>{f.name.substring(0, 12)}...</span>
                    <button onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--danger)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="x" size={10} color="#fff" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost" style={{ border: '1px solid var(--border)' }}>Guardar borrador</button>
            <button className="btn btn-secondary" onClick={() => onNavigate('empresa-materiales')}>
              <Icon name="check" size={16} color="#fff" />Publicar material
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// V-E06: Eventos Empresa
const EmpresaEventos = ({ onNavigate }) => {
  const [tab, setTab] = React.useState('proximos');
  const events = [
    { title: 'Donación Masiva Feb 2026', date: 'Sáb 15 Feb 2026', dir: 'Kennedy Central', cupos: 45, total: 80, estado: 'activo' },
    { title: 'Taller: Construye tu hogar', date: 'Dom 23 Feb 2026', dir: 'Bosa', cupos: 12, total: 40, estado: 'activo' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div><h1 style={{ marginBottom: 4 }}>Mis eventos</h1><p style={{ color: 'var(--text-secondary)' }}>Gestiona ferias y talleres de donación.</p></div>
        <button className="btn btn-primary" onClick={() => onNavigate('empresa-nuevo-evento')}><Icon name="plus" size={16} color="#fff" />Crear evento</button>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-base)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {['proximos', 'pasados', 'borradores'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: tab === t ? '#fff' : 'transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, boxShadow: tab === t ? 'var(--shadow-card)' : 'none', transition: 'all 200ms', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {events.map((ev, i) => (
          <div key={i} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ height: 120, background: 'linear-gradient(135deg, rgba(46,134,171,0.15), rgba(46,134,171,0.25))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Icon name="calendar" size={40} color="var(--secondary)" />
              <div style={{ position: 'absolute', top: 12, left: 12 }}>
                <Badge type="aprobado">Activo</Badge>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 6 }}>{ev.title}</h3>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{ev.date} · {ev.dir}</div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span>Inscritos</span><span>{ev.cupos}/{ev.total}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-base)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--secondary)', width: `${(ev.cupos / ev.total) * 100}%`, borderRadius: 3 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onNavigate('empresa-evento-detalle')}>Ver detalle</button>
                <button className="btn btn-ghost btn-sm"><Icon name="edit" size={14} /></button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Icon name="x" size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// V-E07: Crear Evento
const EmpresaNuevoEvento = ({ onNavigate }) => (
  <div style={{ maxWidth: 680 }}>
    <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('empresa-eventos')} style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
      <Icon name="chevron-left" size={14} color="var(--text-secondary)" /> Volver a eventos
    </button>
    <h1 style={{ marginBottom: 4 }}>Crear evento</h1>
    <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Publica una feria, taller o entrega masiva de materiales.</p>
    <div className="card" style={{ padding: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-group"><label className="form-label">Nombre del evento *</label><input className="form-input" placeholder="Ej: Feria de donación masiva Bogotá Sur" /></div>
        <div className="form-group">
          <label className="form-label">Tipo de evento *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
            {['Entrega masiva de materiales','Taller de reutilización','Feria de donación','Otro'].map((t, i) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                <input type="radio" name="tipo_evento" style={{ accentColor: 'var(--secondary)' }} defaultChecked={i === 0} />{t}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group"><label className="form-label">Descripción *</label><textarea className="form-textarea" placeholder="Describe el evento, qué materiales se distribuirán, a quién va dirigido..." /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group"><label className="form-label">Fecha y hora de inicio *</label><input className="form-input" type="datetime-local" /></div>
          <div className="form-group"><label className="form-label">Fecha y hora de fin *</label><input className="form-input" type="datetime-local" /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div className="form-group"><label className="form-label">Dirección exacta *</label><input className="form-input" placeholder="Cra. 68 #13-30, Kennedy Central" /></div>
          <div className="form-group"><label className="form-label">Localidad *</label><select className="form-select"><option>Kennedy</option><option>Bosa</option><option>Suba</option><option>Fontibón</option></select></div>
        </div>
        <div className="form-group"><label className="form-label">Capacidad máxima de cupos *</label><input className="form-input" type="number" placeholder="Ej: 80" /></div>
        <div className="form-group">
          <label className="form-label">Materiales a distribuir</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {['Ladrillo Prensado','Tablón Madera','Pintura Caucho','Cerámica Bavarian'].map(m => (
              <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" style={{ accentColor: 'var(--secondary)' }} />{m}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group"><label className="form-label">Instrucciones especiales</label><textarea className="form-textarea" style={{ minHeight: 80 }} placeholder="Indicaciones para los asistentes, documentos requeridos, etc." /></div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" style={{ border: '1px solid var(--border)' }}>Guardar borrador</button>
          <button className="btn btn-secondary" onClick={() => onNavigate('empresa-eventos')}><Icon name="check" size={16} color="#fff" />Publicar evento</button>
        </div>
      </div>
    </div>
  </div>
);

// V-E10: Beneficios Tributarios
const EmpresaTributario = ({ onNavigate }) => {
  const [donado, setDonado] = React.useState(16800000);
  const [renta, setRenta] = React.useState(450000000);
  const deduccion = Math.min(donado * 0.25, renta * 0.25);
  const ahorro = deduccion * 0.32; // 32% renta empresas

  const fmt = n => '$' + Math.round(n).toLocaleString('es-CO');

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Beneficios tributarios</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Aprovecha el Art. 255 de la Ley 1819 de 2016.</p>

      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--secondary), var(--secondary-dark))', borderRadius: 12, padding: '28px 32px', marginBottom: 28, color: '#fff' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="shield" size={28} color="#fff" />
          </div>
          <div>
            <h2 style={{ color: '#fff', marginBottom: 8 }}>Art. 255 — Ley 1819 de 2016</h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 1.7, maxWidth: 640 }}>
              Las empresas que donen materiales de construcción a entidades sin ánimo de lucro o comunidades vulnerables pueden deducir hasta el <strong>25% del valor donado</strong> de su renta líquida gravable. BrickByBrick genera automáticamente los certificados necesarios para aplicar este beneficio.
            </p>
            <a style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textDecoration: 'underline', cursor: 'pointer', marginTop: 8, display: 'inline-block' }}>Ver texto completo del artículo →</a>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Calculadora */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="percent" size={20} color="var(--secondary)" />Calculadora tributaria
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Valor total materiales donados este año (COP)</label>
              <input className="form-input" type="number" value={donado} onChange={e => setDonado(+e.target.value || 0)} />
            </div>
            <div className="form-group">
              <label className="form-label">Renta líquida gravable estimada (COP)</label>
              <input className="form-input" type="number" value={renta} onChange={e => setRenta(+e.target.value || 0)} />
            </div>
            <div style={{ background: 'rgba(46,134,171,0.06)', borderRadius: 10, padding: 20, border: '1px solid rgba(46,134,171,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Deducción aplicable (25%)</span>
                <span style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--secondary)' }}>{fmt(deduccion)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(46,134,171,0.15)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Ahorro estimado en renta</span>
                <span style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)' }}>{fmt(ahorro)}</span>
              </div>
            </div>
            <div style={{ background: 'var(--warning-light)', borderRadius: 8, padding: 12, border: '1px solid rgba(230,126,34,0.2)', fontSize: 13, color: 'var(--warning)' }}>
              <Icon name="info" size={14} color="var(--warning)" /> Este cálculo es orientativo. Consulta con tu contador para la aplicación exacta.
            </div>
          </div>
        </div>

        {/* Pasos */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 18, marginBottom: 20 }}>Pasos para aplicar el beneficio</h3>
          {[
            { step: '01', title: 'Publica y dona materiales', desc: 'Registra tus excedentes en BrickByBrick y completa las entregas.' },
            { step: '02', title: 'Descarga certificados', desc: 'BrickByBrick genera automáticamente el certificado de donación por cada entrega.' },
            { step: '03', title: 'Presenta a tu contador', desc: 'Entrega los certificados junto con tu declaración de renta.' },
            { step: '04', title: 'Aplica la deducción', desc: 'Tu contador deducirá el 25% del valor donado de tu renta líquida gravable.' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--secondary)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificados */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16 }}>Mis certificados de donación</h3>
          <button className="btn btn-secondary btn-sm"><Icon name="download" size={14} color="var(--secondary)" />Descargar todo (ZIP)</button>
        </div>
        <table className="data-table">
          <thead><tr><th>Material</th><th>Beneficiarios</th><th>Fecha</th><th>Valor estimado</th><th>Certificado</th></tr></thead>
          <tbody>
            {[
              { mat: 'Ladrillo Prensado Estándar', ben: 3, fecha: '28 Ene 2026', valor: '$4.800.000' },
              { mat: 'Tablón de Madera Pino', ben: 1, fecha: '15 Ene 2026', valor: '$1.920.000' },
              { mat: 'Cerámica Piso Bavarian', ben: 2, fecha: '10 Ene 2026', valor: '$3.600.000' },
            ].map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{r.mat}</td>
                <td>{r.ben} beneficiarios</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.fecha}</td>
                <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--accent)' }}>{r.valor}</td>
                <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--secondary)' }}><Icon name="download" size={14} color="var(--secondary)" />PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// V-E02: Perfil Empresa
const EmpresaPerfil = ({ onNavigate }) => {
  const [tab, setTab] = React.useState('info');
  return (
    <div>
      <div className="card" style={{ padding: 0, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ height: 100, background: 'linear-gradient(135deg, rgba(46,134,171,0.15), rgba(46,134,171,0.3))' }} />
        <div style={{ padding: '0 32px 28px', marginTop: -32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', boxShadow: 'var(--shadow-card)' }}>
              <Icon name="building" size={32} color="#fff" />
            </div>
            <div style={{ paddingBottom: 4 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                <h2 style={{ fontSize: 22 }}>Conconcreto S.A.S.</h2>
                <Badge type="verificado">✓ Empresa verificada</Badge>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 16 }}>
                <span>NIT: 890.903.938-1</span>
                <span>Rep. Legal: Ing. Álvaro Jaramillo</span>
                <span>Miembro desde Mar 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {[{ id: 'info', label: 'Información' }, { id: 'estadisticas', label: 'Estadísticas' }, { id: 'documentos', label: 'Documentos' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: tab === t.id ? 'var(--secondary)' : 'var(--text-secondary)', borderBottom: tab === t.id ? '2px solid var(--secondary)' : '2px solid transparent', marginBottom: -1, transition: 'color 200ms' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={{ maxWidth: 600 }}>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[['Razón social','Conconcreto S.A.S.'],['Dirección','Cl. 26 #92-32, Fontibón, Bogotá'],['Teléfono','601 742 0000'],['Sitio web','www.conconcreto.com'],['Descripción','Empresa constructora de infraestructura y edificaciones con más de 70 años de experiencia en Colombia.']].map(([l, v]) => (
                <div key={l} className="form-group">
                  <label className="form-label">{l}</label>
                  {l === 'Descripción' ? <textarea className="form-textarea" defaultValue={v} style={{ minHeight: 80 }} /> : <input className="form-input" defaultValue={v} />}
                </div>
              ))}
              <button className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
      {tab === 'estadisticas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Materiales donados', value: '1.240 und', icon: 'package', color: 'var(--secondary)' },
            { label: 'Eventos realizados', value: '14', icon: 'calendar', color: 'var(--accent)' },
            { label: 'Beneficiarios alcanzados', value: '312', icon: 'users', color: 'var(--primary)' },
            { label: 'Deducción acumulada', value: '$4.2M', icon: 'dollar-sign', color: 'var(--warning)' },
          ].map((k, i) => <KPICard key={i} {...k} />)}
        </div>
      )}
      {tab === 'documentos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 540 }}>
          {[{ name: 'RUT', state: 'vigente', exp: '31 Dic 2026' }, { name: 'Cámara de Comercio', state: 'vence-pronto', exp: '28 Feb 2026' }].map((d, i) => (
            <div key={i} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: d.state === 'vigente' ? 'var(--accent-light)' : 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="file-check" size={22} color={d.state === 'vigente' ? 'var(--accent)' : 'var(--warning)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{d.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Vence: {d.exp}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge type={d.state === 'vigente' ? 'aprobado' : 'pendiente'}>{d.state === 'vigente' ? 'Vigente' : 'Por vencer'}</Badge>
                <button className="btn btn-ghost btn-sm">Actualizar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// V-E09: Historial Donaciones
const EmpresaDonaciones = ({ onNavigate }) => (
  <div>
    <h1 style={{ marginBottom: 4 }}>Historial de donaciones</h1>
    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Registro completo de todas tus donaciones y entregas.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
      <KPICard icon="package" label="Total donado 2026" value="1.240 und" color="var(--secondary)" />
      <KPICard icon="dollar-sign" label="Valor estimado" value="$16.8M" sub="COP 2026" color="var(--accent)" />
      <KPICard icon="percent" label="Deducción tributaria" value="$4.2M" sub="25% aplicable" color="var(--primary)" />
    </div>
    <div className="card" style={{ overflow: 'hidden' }}>
      <table className="data-table">
        <thead><tr><th>#</th><th>Material</th><th>Cantidad</th><th>Beneficiarios</th><th>Fecha</th><th>Valor estimado</th><th>Certificado</th></tr></thead>
        <tbody>
          {[
            { mat: 'Ladrillo Prensado', qty: '2.400 und', ben: 3, fecha: '28 Ene 2026', val: '$4.800.000' },
            { mat: 'Tablón Madera Pino', qty: '48 m²', ben: 1, fecha: '15 Ene 2026', val: '$1.920.000' },
            { mat: 'Cerámica Bavarian', qty: '120 m²', ben: 2, fecha: '10 Ene 2026', val: '$3.600.000' },
            { mat: 'Pintura Caucho', qty: '80 L', ben: 4, fecha: '5 Dic 2025', val: '$1.200.000' },
          ].map((r, i) => (
            <tr key={i}>
              <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>#{i + 1}</td>
              <td style={{ fontWeight: 500 }}>{r.mat}</td>
              <td>{r.qty}</td>
              <td>{r.ben}</td>
              <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.fecha}</td>
              <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--accent)' }}>{r.val}</td>
              <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--secondary)' }}><Icon name="download" size={14} color="var(--secondary)" />PDF</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// V-E11: Notificaciones Empresa
const EmpresaNotificaciones = ({ onNavigate }) => {
  const [notifs, setNotifs] = React.useState([
    { id: 1, icon: 'layers', text: 'Nueva solicitud de Carlos Rivera para "Ladrillo Prensado Estándar" (100 unidades)', time: 'hace 20 min', unread: true, group: 'Hoy' },
    { id: 2, icon: 'alert-triangle', text: 'El material "Pintura Caucho Blanca" vence en 3 días — 2 solicitudes pendientes sin gestionar', time: 'hace 1 h', unread: true, group: 'Hoy' },
    { id: 3, icon: 'calendar', text: 'Tu evento "Donación Masiva Feb 2026" tiene solo 5 cupos restantes', time: 'hace 3 h', unread: true, group: 'Hoy' },
    { id: 4, icon: 'check-circle', text: 'Tu empresa Conconcreto S.A.S. fue verificada exitosamente ✓', time: 'ayer 2:00 PM', unread: false, group: 'Ayer' },
    { id: 5, icon: 'user', text: 'Nuevo beneficiario inscrito a tu evento "Taller: Construye tu hogar"', time: 'ayer 10:30 AM', unread: false, group: 'Ayer' },
  ]);
  const groups = ['Hoy', 'Ayer'];
  const dismiss = id => setNotifs(n => n.filter(x => x.id !== id));

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div><h1 style={{ marginBottom: 4 }}>Notificaciones</h1><p style={{ color: 'var(--text-secondary)' }}>{notifs.filter(n => n.unread).length} sin leer</p></div>
        <button className="btn btn-ghost" onClick={() => setNotifs(n => n.map(x => ({ ...x, unread: false })))}>Marcar todo como leído</button>
      </div>
      {groups.map(g => {
        const items = notifs.filter(n => n.group === g);
        if (!items.length) return null;
        return (
          <div key={g} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: 12 }}>{g}</div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {items.map((n, i) => (
                <div key={n.id} style={{ display: 'flex', gap: 14, padding: '16px 20px', background: n.unread ? 'rgba(46,134,171,0.04)' : 'transparent', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', position: 'relative' }}>
                  {n.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)', position: 'absolute', left: 8, top: 22 }} />}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(46,134,171,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={n.icon} size={18} color={n.unread ? 'var(--secondary)' : 'var(--text-secondary)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, lineHeight: 1.5, fontWeight: n.unread ? 500 : 400 }}>{n.text}</p>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{n.time}</span>
                  </div>
                  <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <Icon name="x" size={16} color="var(--text-secondary)" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

Object.assign(window, {
  KPICard, MiniBarChart,
  EmpresaDashboard, EmpresaMateriales, EmpresaNuevoMaterial,
  EmpresaEventos, EmpresaNuevoEvento, EmpresaTributario,
  EmpresaPerfil, EmpresaDonaciones, EmpresaNotificaciones,
});
