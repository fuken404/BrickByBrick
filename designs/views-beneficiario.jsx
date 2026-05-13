// Beneficiary Views
// V-B01 through V-B10

const SAMPLE_MATERIALS = [
  { id:1, name:'Ladrillo Prensado Estándar', cat:'Ladrillo', qty:2400, unit:'unidades', state:'Nuevo', empresa:'Constructora Bolívar S.A.', localidad:'Kennedy', days:'hace 2 días', img:null, desc:'Ladrillos prensados de alta resistencia, perfectos para muros y fachadas. Excedente de obra Torre Bolívar III.' },
  { id:2, name:'Tablón de Madera Pino', cat:'Madera', qty:48, unit:'m²', state:'Buen estado', empresa:'Conconcreto S.A.S.', localidad:'Suba', days:'hace 1 día', img:null, desc:'Tablones de pino ciprés de 1" de grosor, sin hongos ni daños. Ideal para pisos y cielos rasos.' },
  { id:3, name:'Cerámica Piso Bavarian', cat:'Cerámica', qty:120, unit:'m²', state:'Nuevo', empresa:'Amarilo S.A.S.', localidad:'Chapinero', days:'hace 3 días', img:null, desc:'Cerámica para piso referencia Bavarian 45x45, color beige. Caja sellada.' },
  { id:4, name:'Arena de Río Lavada', cat:'Concreto', qty:15, unit:'m³', state:'Nuevo', empresa:'Construcciones Ospina', localidad:'Bosa', days:'hace 5 días', img:null, desc:'Arena de río limpia y cernida para mezclas de concreto y mortero.' },
  { id:5, name:'Tubo Galvanizado 2"', cat:'Hierro', qty:200, unit:'unidades', state:'Buen estado', empresa:'Constructora Capital', localidad:'Fontibón', days:'hace 1 semana', img:null, desc:'Tubos galvanizados de 2 pulgadas de 6 metros de longitud.' },
  { id:6, name:'Pintura de Caucho Blanca', cat:'Pintura', qty:80, unit:'litros', state:'Nuevo', empresa:'Conconcreto S.A.S.', localidad:'Usaquén', days:'hace 4 días', img:null, desc:'Pintura de caucho color blanco hueso, marca Pintuco. Para interiores.' },
];

const catColors = { Ladrillo:'var(--primary)', Madera:'var(--warning)', Cerámica:'#8E44AD', Concreto:'var(--text-secondary)', Hierro:'var(--secondary)', Pintura:'#16A085', Vidrio:'#2980B9', Otro:'var(--text-secondary)' };

const MaterialCard = ({ mat, onDetail }) => (
  <div className="card" style={{ overflow:'hidden', cursor:'pointer', transition:'transform 200ms, box-shadow 200ms' }}
    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-elevated)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='var(--shadow-card)'; }}
    onClick={() => onDetail && onDetail(mat)}>
    <div style={{ height:160, background:`linear-gradient(135deg, ${catColors[mat.cat] || 'var(--border)'}22, ${catColors[mat.cat] || 'var(--border)'}44)`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      <Icon name="package" size={48} color={catColors[mat.cat] || 'var(--text-secondary)'} />
      <div style={{ position:'absolute', top:12, left:12 }}>
        <span className="badge" style={{ background: catColors[mat.cat]+'22', color: catColors[mat.cat], fontSize:11 }}>{mat.cat}</span>
      </div>
      <div style={{ position:'absolute', top:12, right:12 }}>
        <Badge type="disponible">Disponible</Badge>
      </div>
    </div>
    <div style={{ padding:16 }}>
      <h3 style={{ fontSize:15, marginBottom:6, lineHeight:1.3 }}>{mat.name}</h3>
      <div style={{ fontSize:22, fontFamily:'var(--font-display)', fontWeight:700, color:'var(--primary)', marginBottom:12 }}>
        {mat.qty.toLocaleString()} <span style={{ fontSize:14, fontWeight:400, color:'var(--text-secondary)' }}>{mat.unit}</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-secondary)' }}>
          <Icon name="building" size={14} color="var(--text-secondary)" />{mat.empresa}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-secondary)' }}>
          <Icon name="map-pin" size={14} color="var(--text-secondary)" />{mat.localidad}
        </div>
        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{mat.days}</div>
      </div>
      <button className="btn btn-primary" style={{ width:'100%', marginTop:14 }} onClick={e => { e.stopPropagation(); onDetail && onDetail(mat); }}>
        Ver detalle
      </button>
    </div>
  </div>
);

// V-B01: Dashboard Beneficiario
const BeneficiarioDashboard = ({ onNavigate }) => {
  const events = [
    { id:1, title:'Donación Masiva Feb 2026', empresa:'Constructora Bolívar', date:'Sáb 15 Feb, 9:00 AM', localidad:'Kennedy', cupos:45, total:80 },
    { id:2, title:'Taller: Construye tu hogar', empresa:'Amarilo S.A.S.', date:'Dom 23 Feb, 10:00 AM', localidad:'Bosa', cupos:12, total:40 },
  ];
  const notifications = [
    { icon:'package', text:'Constructora Bolívar publicó 200 ladrillos en Kennedy', time:'hace 30 min', unread:true },
    { icon:'check-circle', text:'Tu solicitud de madera fue aprobada por Conconcreto', time:'hace 2 h', unread:true },
    { icon:'calendar', text:'Tu inscripción al evento del 15 feb fue confirmada', time:'ayer', unread:false },
  ];

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:32, alignItems:'start' }}>
        <div>
          {/* Banner */}
          <div style={{ background:'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', borderRadius:12, padding:'28px 32px', marginBottom:28, color:'#fff', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', right:24, top:-10, fontSize:80, opacity:0.08, fontFamily:'Georgia' }}>🧱</div>
            <h2 style={{ color:'#fff', marginBottom:6 }}>Hola, Carlos 👋</h2>
            <p style={{ color:'rgba(255,255,255,0.85)', fontSize:15 }}>Hay <strong>23 materiales nuevos</strong> esta semana cerca de ti en Kennedy.</p>
            <button className="btn btn-sm" style={{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', marginTop:16 }} onClick={() => onNavigate('beneficiario-materiales')}>
              Explorar materiales
            </button>
          </div>

          {/* Materiales recientes */}
          <div style={{ marginBottom:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h2>Materiales recientes</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('beneficiario-materiales')}>Ver todos <Icon name="chevron-right" size={14} color="var(--primary)" /></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
              {SAMPLE_MATERIALS.slice(0,3).map(m => (
                <MaterialCard key={m.id} mat={m} onDetail={() => onNavigate('beneficiario-material-detalle')} />
              ))}
            </div>
          </div>

          {/* Eventos próximos */}
          <div style={{ marginBottom:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h2>Eventos próximos</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('beneficiario-eventos')}>Ver todos <Icon name="chevron-right" size={14} color="var(--primary)" /></button>
            </div>
            <div style={{ display:'flex', gap:16 }}>
              {events.map(ev => (
                <div key={ev.id} className="card" style={{ flex:1, padding:20 }}>
                  <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                    <div style={{ width:52, textAlign:'center', background:'rgba(192,57,43,0.08)', borderRadius:10, padding:'8px 0', flexShrink:0 }}>
                      <div style={{ fontSize:20, fontWeight:700, color:'var(--primary)', lineHeight:1 }}>{ev.date.split(' ')[1]}</div>
                      <div style={{ fontSize:11, color:'var(--primary)', textTransform:'uppercase' }}>{ev.date.split(' ')[2]}</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <h3 style={{ fontSize:15, marginBottom:4 }}>{ev.title}</h3>
                      <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:8 }}>{ev.empresa} · {ev.localidad}</div>
                      <div style={{ height:4, background:'var(--bg-base)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:'100%', background:'var(--accent)', width:`${(ev.cupos/ev.total)*100}%`, borderRadius:2 }} />
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:4 }}>{ev.cupos}/{ev.total} cupos</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feed preview */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h2>Publicaciones recientes</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('beneficiario-publicaciones')}>Ver todas <Icon name="chevron-right" size={14} color="var(--primary)" /></button>
            </div>
            {[
              { user:'Ana Lucía Forero', badge:true, time:'hace 3 h', type:'Proyecto', text:'Terminé de construir el piso de mi cocina con los tablones que conseguí por BrickByBrick. Increíble plataforma! 🙌 El proceso fue muy fácil y la gente de Conconcreto super amable.' },
              { user:'Diego Morales', badge:false, time:'hace 5 h', type:'Tutorial', text:'Tutorial: Cómo hacer mezcla de concreto en casa con los materiales donados. Paso 1: Asegúrate de tener...' },
            ].map((p, i) => (
              <div key={i} className="card" style={{ padding:20, marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <Avatar name={p.user} size={36} />
                    <div>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <span style={{ fontWeight:600, fontSize:14 }}>{p.user}</span>
                        {p.badge && <Badge type="aprobado">✓ Alimentador</Badge>}
                      </div>
                      <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.time}</span>
                    </div>
                  </div>
                  <Badge type={p.type === 'Proyecto' ? 'primary' : 'secundario'}>{p.type}</Badge>
                </div>
                <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.6 }}>{p.text}</p>
                <div style={{ display:'flex', gap:16, marginTop:14, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                  {[{icon:'heart',label:'24'},{icon:'message-circle',label:'6'},{icon:'share',label:''}].map((a,j) => (
                    <button key={j} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:13 }}>
                      <Icon name={a.icon} size={16} color="var(--text-secondary)" />{a.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontSize:16, marginBottom:16 }}>Mi actividad</h3>
            {[{label:'Materiales solicitados',val:5,icon:'layers'},{label:'Eventos inscritos',val:2,icon:'calendar'},{label:'Publicaciones creadas',val:1,icon:'file-text'}].map((a,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i<2?'1px solid var(--border)':'none' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', fontSize:14, color:'var(--text-secondary)' }}>
                  <Icon name={a.icon} size={16} color="var(--text-secondary)" />{a.label}
                </div>
                <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:20, color:'var(--primary)' }}>{a.val}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontSize:16, marginBottom:16 }}>Grupos sugeridos</h3>
            {['Constructores Kennedy','Madera Reciclada Bogotá'].map((g,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i===0?'1px solid var(--border)':'none' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:'rgba(192,57,43,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon name="users" size={16} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{g}</div>
                    <div style={{ fontSize:11, color:'var(--text-secondary)' }}>124 miembros</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('beneficiario-grupos')}>Unirse</button>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontSize:16 }}>Notificaciones</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('beneficiario-notificaciones')}>Ver todas</button>
            </div>
            {notifications.map((n,i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom: i<2?'1px solid var(--border)':'none' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(192,57,43,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon name={n.icon} size={14} color="var(--primary)" />
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:12, lineHeight:1.5, color: n.unread?'var(--text-primary)':'var(--text-secondary)' }}>{n.text}</p>
                  <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{n.time}</span>
                </div>
                {n.unread && <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--secondary)', flexShrink:0, marginTop:4 }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// V-B03: Explorador de Materiales
const BeneficiarioMateriales = ({ onNavigate }) => {
  const [search, setSearch] = React.useState('');
  const [cats, setCats] = React.useState([]);
  const [sortBy, setSortBy] = React.useState('reciente');
  const cats_list = ['Ladrillo','Concreto','Madera','Cerámica','Hierro','Vidrio','Pintura','Otro'];

  const toggleCat = c => setCats(prev => prev.includes(c) ? prev.filter(x => x!==c) : [...prev, c]);
  const filtered = SAMPLE_MATERIALS.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (cats.length > 0 && !cats.includes(m.cat)) return false;
    return true;
  });

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ marginBottom:4 }}>Explorador de materiales</h1>
        <p style={{ color:'var(--text-secondary)' }}>Encuentra materiales de construcción donados por empresas en Bogotá.</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:28, alignItems:'start' }}>
        {/* Filters sidebar */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <h3 style={{ fontSize:16 }}>Filtros</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => { setCats([]); setSearch(''); }}>Limpiar todo</button>
          </div>
          <div className="form-group" style={{ marginBottom:20 }}>
            <div style={{ position:'relative' }}>
              <Icon name="search" size={15} color="var(--text-secondary)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
              <input className="form-input" placeholder="Buscar material..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:36 }} />
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-secondary)', marginBottom:12 }}>Categoría</div>
            {cats_list.map(c => (
              <label key={c} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, cursor:'pointer', fontSize:14 }}>
                <input type="checkbox" checked={cats.includes(c)} onChange={() => toggleCat(c)} style={{ accentColor:'var(--primary)', width:15, height:15 }} />
                <span style={{ width:10, height:10, borderRadius:2, background:catColors[c] || 'var(--border)', display:'inline-block' }} />
                {c}
              </label>
            ))}
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-secondary)', marginBottom:12 }}>Estado</div>
            {['Nuevo','Buen estado','Usado'].map(s => (
              <label key={s} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, cursor:'pointer', fontSize:14 }}>
                <input type="radio" name="estado" style={{ accentColor:'var(--primary)' }} />{s}
              </label>
            ))}
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-secondary)', marginBottom:10 }}>Localidad</div>
            <select className="form-select"><option value="">Todas las localidades</option>
              {['Kennedy','Suba','Bosa','Fontibón','Usaquén','Chapinero'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-secondary)', marginBottom:10 }}>Ordenar por</div>
            <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="reciente">Más reciente</option>
              <option value="cantidad">Más cantidad</option>
              <option value="expira">Próximo a expirar</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width:'100%' }}>
            <Icon name="filter" size={15} color="#fff" /> Aplicar filtros
          </button>
        </div>

        {/* Grid */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <span style={{ fontSize:14, color:'var(--text-secondary)' }}>Mostrando <strong>{filtered.length}</strong> de <strong>89</strong> materiales</span>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost btn-sm"><Icon name="grid" size={16} color="var(--text-secondary)" /></button>
              <button className="btn btn-ghost btn-sm"><Icon name="list" size={16} color="var(--text-secondary)" /></button>
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon="package" title="Sin materiales" description="No encontramos materiales con esos filtros. Intenta con otros criterios." />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:20 }}>
              {filtered.map(m => <MaterialCard key={m.id} mat={m} onDetail={() => onNavigate('beneficiario-material-detalle')} />)}
            </div>
          )}
          {/* Pagination */}
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:32 }}>
            <button className="btn btn-ghost btn-sm"><Icon name="chevron-left" size={14} /></button>
            {[1,2,3,4,5].map(p => (
              <button key={p} className="btn btn-sm" style={{ background: p===1?'var(--primary)':'transparent', color: p===1?'#fff':'var(--text-secondary)', border: p===1?'none':'1px solid var(--border)', minWidth:36 }}>{p}</button>
            ))}
            <button className="btn btn-ghost btn-sm"><Icon name="chevron-right" size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

// V-B04: Detalle de Material
const BeneficiarioMaterialDetalle = ({ onNavigate }) => {
  const [qty, setQty] = React.useState(50);
  const [purpose, setPurpose] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const mat = SAMPLE_MATERIALS[0];

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('beneficiario-materiales')} style={{ marginBottom:24, color:'var(--text-secondary)' }}>
        <Icon name="chevron-left" size={14} color="var(--text-secondary)" /> Volver a materiales
      </button>
      <div style={{ display:'grid', gridTemplateColumns:'60% 40%', gap:28, alignItems:'start' }}>
        {/* Left */}
        <div>
          <div style={{ height:280, background:`linear-gradient(135deg, ${catColors[mat.cat]}22, ${catColors[mat.cat]}44)`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, border:'1px solid var(--border)' }}>
            <Icon name="package" size={72} color={catColors[mat.cat]} />
          </div>
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            <span className="badge" style={{ background:catColors[mat.cat]+'22', color:catColors[mat.cat] }}>{mat.cat}</span>
            <Badge type="disponible">Disponible</Badge>
            <Badge type="aprobado">Nuevo</Badge>
          </div>
          <h1 style={{ marginBottom:12 }}>{mat.name}</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:15, lineHeight:1.8, marginBottom:24 }}>{mat.desc}</p>

          <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:20 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <tbody>
                {[['Tipo','Ladrillo prensado'],['Cantidad disponible','2.400 unidades'],['Estado','Nuevo'],['Fecha publicación','30 Ene 2026'],['Válido hasta','28 Feb 2026']].map(([k,v],i) => (
                  <tr key={i} style={{ borderBottom: i<4?'1px solid var(--border)':'none' }}>
                    <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-secondary)', fontWeight:600, width:'40%' }}>{k}</td>
                    <td style={{ padding:'12px 16px', fontSize:14 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontSize:16, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
              <Icon name="info" size={18} color="var(--secondary)" /> Condiciones de retiro
            </h3>
            <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.7 }}>
              <strong>Dirección:</strong> Cra. 68 #13-30, Kennedy Central<br/>
              <strong>Horario:</strong> Lunes a viernes 7:00 AM – 4:00 PM<br/>
              <strong>Requisitos:</strong> Presentar cédula original y copia, autorización de retiro aprobada por la plataforma. Vehículo de carga por cuenta del solicitante.
            </p>
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Solicitar */}
          <div className="card" style={{ padding:24, border:'2px solid var(--primary)' }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:48, fontFamily:'var(--font-display)', fontWeight:700, color:'var(--primary)' }}>2.400</div>
              <div style={{ fontSize:14, color:'var(--text-secondary)' }}>unidades disponibles</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Cantidad a solicitar *</label>
                <input className="form-input" type="number" min={1} max={2400} value={qty} onChange={e => setQty(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Propósito de uso *</label>
                <select className="form-select" value={purpose} onChange={e => setPurpose(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option>Vivienda propia</option><option>Emprendimiento</option><option>Proyecto comunitario</option><option>Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Describe tu proyecto (opcional)</label>
                <textarea className="form-textarea" style={{ minHeight:80 }} placeholder="Cuéntanos brevemente para qué usarás estos materiales..." />
              </div>
              <button className="btn btn-primary btn-lg" style={{ width:'100%' }} onClick={() => setShowModal(true)}>
                <Icon name="send" size={18} color="#fff" /> Solicitar ahora
              </button>
              <p style={{ fontSize:11, color:'var(--text-secondary)', textAlign:'center', lineHeight:1.5 }}>Al solicitar confirmas la veracidad de tu proyecto. La aprobación está sujeta a disponibilidad.</p>
            </div>
          </div>

          {/* Empresa */}
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontSize:15, marginBottom:14 }}>Constructora donante</h3>
            <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:14 }}>
              <Avatar name="Constructora Bolívar" size={44} />
              <div>
                <div style={{ fontWeight:600 }}>Constructora Bolívar S.A.</div>
                <Badge type="verificado">✓ Verificada</Badge>
              </div>
            </div>
            {[['Localidad','Kennedy'],['Teléfono','601 741 2300']].map(([k,v]) => (
              <div key={k} style={{ display:'flex', gap:8, alignItems:'center', fontSize:13, color:'var(--text-secondary)', marginBottom:8 }}>
                <Icon name={k==='Localidad'?'map-pin':'activity'} size={14} color="var(--text-secondary)" /><strong>{k}:</strong> {v}
              </div>
            ))}
          </div>

          {/* Similares */}
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontSize:15, marginBottom:14 }}>Materiales similares</h3>
            {SAMPLE_MATERIALS.filter(m => m.cat==='Ladrillo').slice(0,2).map((m,i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom: i===0?'1px solid var(--border)':'none', cursor:'pointer' }}>
                <div style={{ width:44, height:44, borderRadius:8, background:catColors[m.cat]+'22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon name="layers" size={18} color={catColors[m.cat]} />
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{m.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{m.qty.toLocaleString()} {m.unit} · {m.empresa}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && !sent && (
        <Modal title="Confirmar solicitud" onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => { setSent(true); setShowModal(false); }}>Confirmar solicitud</button>
          </>}>
          <div>
            <p style={{ marginBottom:16, color:'var(--text-secondary)' }}>Estás por solicitar:</p>
            <div style={{ background:'var(--bg-base)', borderRadius:10, padding:16, marginBottom:16 }}>
              <div style={{ fontWeight:600, fontSize:16, marginBottom:4 }}>{mat.name}</div>
              <div style={{ fontSize:14, color:'var(--text-secondary)' }}><strong>{qty}</strong> unidades · {purpose || 'Vivienda propia'}</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:8 }}>Constructora Bolívar S.A. · Kennedy</div>
            </div>
            <div style={{ background:'rgba(46,134,171,0.06)', borderRadius:8, padding:14, border:'1px solid rgba(46,134,171,0.15)' }}>
              <div style={{ display:'flex', gap:8 }}>
                <Icon name="info" size={16} color="var(--secondary)" />
                <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>La constructora revisará tu solicitud y recibirás una notificación con la decisión en 1-3 días hábiles.</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {sent && (
        <div style={{ position:'fixed', bottom:32, right:32, background:'var(--accent)', color:'#fff', borderRadius:12, padding:'16px 24px', display:'flex', gap:12, alignItems:'center', boxShadow:'var(--shadow-elevated)', animation:'slideInRight 300ms ease', zIndex:200 }}>
          <Icon name="check-circle" size={20} color="#fff" />
          <span style={{ fontWeight:600 }}>¡Solicitud enviada exitosamente!</span>
        </div>
      )}
    </div>
  );
};

// V-B05: Eventos
const BeneficiarioEventos = ({ onNavigate }) => {
  const [tab, setTab] = React.useState('proximos');
  const [inscribeModal, setInscribeModal] = React.useState(null);
  const [inscribed, setInscribed] = React.useState([]);

  const events = [
    { id:1, title:'Donación Masiva Feb 2026', empresa:'Constructora Bolívar S.A.', date:'Sáb 15 Feb 2026, 9:00 AM', endDate:'Sáb 15 Feb, 1:00 PM', dir:'Cra. 68 #13-30, Kennedy Central', localidad:'Kennedy', cupos:45, total:80, mats:['Ladrillo','Concreto','Madera'], img:null },
    { id:2, title:'Taller: Construye tu hogar', empresa:'Amarilo S.A.S.', date:'Dom 23 Feb 2026, 10:00 AM', endDate:'Dom 23 Feb, 2:00 PM', dir:'Av. El Dorado #69C-03, Bosa', localidad:'Bosa', cupos:12, total:40, mats:['Cerámica','Pintura'], img:null },
    { id:3, title:'Feria de Donación Masiva', empresa:'Conconcreto S.A.S.', date:'Sáb 7 Mar 2026, 8:00 AM', endDate:'Sáb 7 Mar, 3:00 PM', dir:'Cl. 26 #92-32, Fontibón', localidad:'Fontibón', cupos:60, total:150, mats:['Ladrillo','Cerámica','Vidrio','Hierro'], img:null },
  ];

  return (
    <div>
      <h1 style={{ marginBottom:4 }}>Eventos</h1>
      <p style={{ color:'var(--text-secondary)', marginBottom:24 }}>Ferias, talleres y entregas masivas de materiales.</p>
      <div style={{ display:'flex', gap:4, marginBottom:28, background:'var(--bg-base)', borderRadius:10, padding:4, width:'fit-content' }}>
        {[{id:'proximos',label:'Próximos'},{id:'inscritos',label:'Mis inscripciones'},{id:'pasados',label:'Pasados'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'8px 20px', borderRadius:8, border:'none', cursor:'pointer',
            background: tab===t.id ? '#fff' : 'transparent',
            color: tab===t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontFamily:'var(--font-body)', fontSize:14, fontWeight:600,
            boxShadow: tab===t.id ? 'var(--shadow-card)' : 'none', transition:'all 200ms',
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:20 }}>
        {events.map(ev => {
          const isInscribed = inscribed.includes(ev.id);
          const isFull = ev.cupos >= ev.total;
          const pct = (ev.cupos / ev.total) * 100;
          return (
            <div key={ev.id} className="card" style={{ overflow:'hidden' }}>
              <div style={{ height:140, background:`linear-gradient(135deg, var(--primary)22, var(--secondary)22)`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                <Icon name="calendar" size={48} color="var(--primary)" />
                <div style={{ position:'absolute', top:12, left:12 }}>
                  <Badge type={isInscribed ? 'aprobado' : 'secundario'}>{isInscribed ? '✓ Inscrito' : 'Abierto'}</Badge>
                </div>
              </div>
              <div style={{ padding:20 }}>
                <div style={{ fontSize:13, color:'var(--primary)', fontWeight:600, marginBottom:4 }}>{ev.date}</div>
                <h3 style={{ fontSize:17, marginBottom:6, lineHeight:1.3 }}>{ev.title}</h3>
                <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:12 }}>{ev.empresa}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-secondary)', marginBottom:12 }}>
                  <Icon name="map-pin" size={14} color="var(--text-secondary)" />{ev.dir}
                </div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>
                    <span>Cupos disponibles</span><span>{ev.total - ev.cupos} de {ev.total}</span>
                  </div>
                  <div style={{ height:6, background:'var(--bg-base)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', background: pct > 80 ? 'var(--warning)' : 'var(--accent)', width:`${pct}%`, borderRadius:3 }} />
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
                  {ev.mats.map(m => <span key={m} style={{ fontSize:11, padding:'3px 8px', borderRadius:12, background:'rgba(192,57,43,0.08)', color:'var(--primary)', fontWeight:600 }}>{m}</span>)}
                </div>
                {isInscribed ? (
                  <button className="btn btn-sm" style={{ width:'100%', background:'rgba(39,174,96,0.1)', color:'var(--accent)', border:'1.5px solid var(--accent)' }}>
                    <Icon name="check-circle" size={14} color="var(--accent)" /> Ya inscrito ✓
                  </button>
                ) : isFull ? (
                  <button className="btn btn-sm" disabled style={{ width:'100%' }}>Cupos agotados</button>
                ) : (
                  <button className="btn btn-primary btn-sm" style={{ width:'100%' }} onClick={() => setInscribeModal(ev)}>
                    Inscribirme
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {inscribeModal && (
        <Modal title="Confirmar inscripción" onClose={() => setInscribeModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setInscribeModal(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => { setInscribed(p => [...p, inscribeModal.id]); setInscribeModal(null); }}>Confirmar inscripción</button>
          </>}>
          <div>
            <div style={{ background:'var(--bg-base)', borderRadius:10, padding:16, marginBottom:16 }}>
              <div style={{ fontWeight:600, fontSize:16, marginBottom:6 }}>{inscribeModal.title}</div>
              <div style={{ fontSize:14, color:'var(--text-secondary)', display:'flex', flexDirection:'column', gap:4 }}>
                <span>{inscribeModal.empresa}</span>
                <span>{inscribeModal.date}</span>
                <span>{inscribeModal.dir}</span>
              </div>
            </div>
            <div style={{ background:'rgba(230,126,34,0.08)', borderRadius:8, padding:14, border:'1px solid rgba(230,126,34,0.2)' }}>
              <div style={{ display:'flex', gap:8 }}>
                <Icon name="alert-triangle" size={16} color="var(--warning)" />
                <p style={{ fontSize:13, color:'var(--warning)', lineHeight:1.6, fontWeight:500 }}>Al inscribirte confirmas tu asistencia. La no asistencia puede limitar futuras solicitudes de materiales.</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// V-B09: Mis Solicitudes
const BeneficiarioSolicitudes = ({ onNavigate }) => {
  const [filterState, setFilterState] = React.useState('todas');
  const [ratingModal, setRatingModal] = React.useState(null);
  const [rating, setRating] = React.useState(0);
  const [instrModal, setInstrModal] = React.useState(false);

  const solicitudes = [
    { id:1, material:'Ladrillo Prensado Estándar', qty:'100 unidades', empresa:'Constructora Bolívar', fecha:'28 Ene 2026', estado:'aprobada' },
    { id:2, material:'Tablón de Madera Pino', qty:'12 m²', empresa:'Conconcreto S.A.S.', fecha:'2 Feb 2026', estado:'pendiente' },
    { id:3, material:'Cerámica Piso Bavarian', qty:'30 m²', empresa:'Amarilo S.A.S.', fecha:'18 Ene 2026', estado:'entregado' },
    { id:4, material:'Arena de Río Lavada', qty:'2 m³', empresa:'Construcciones Ospina', fecha:'15 Ene 2026', estado:'rechazado' },
    { id:5, material:'Pintura de Caucho', qty:'20 litros', empresa:'Conconcreto S.A.S.', fecha:'5 Feb 2026', estado:'pendiente' },
  ];

  const filtered = filterState === 'todas' ? solicitudes : solicitudes.filter(s => s.estado === filterState);
  const estadoMap = { aprobada:'aprobado', pendiente:'pendiente', entregado:'entregado', rechazado:'rechazado' };

  return (
    <div>
      <h1 style={{ marginBottom:4 }}>Mis Solicitudes</h1>
      <p style={{ color:'var(--text-secondary)', marginBottom:24 }}>Historial de todas tus solicitudes de materiales.</p>

      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {['todas','pendiente','aprobada','entregado','rechazado'].map(s => (
          <button key={s} onClick={() => setFilterState(s)} className="btn btn-sm" style={{
            background: filterState===s ? 'var(--primary)' : 'transparent',
            color: filterState===s ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${filterState===s ? 'var(--primary)' : 'var(--border)'}`,
          }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        {filtered.length === 0 ? <EmptyState icon="layers" title="Sin solicitudes" description="No tienes solicitudes con este estado." /> : (
          <table className="data-table">
            <thead><tr>
              <th>#</th><th>Material</th><th>Cantidad</th><th>Constructora</th><th>Fecha</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td style={{ color:'var(--text-secondary)', fontWeight:600 }}>#{s.id}</td>
                  <td style={{ fontWeight:500 }}>{s.material}</td>
                  <td>{s.qty}</td>
                  <td>{s.empresa}</td>
                  <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{s.fecha}</td>
                  <td><Badge type={estadoMap[s.estado]}>{s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}</Badge></td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      {s.estado === 'aprobada' && <button className="btn btn-sm btn-accent" onClick={() => setInstrModal(true)}>Ver instrucciones</button>}
                      {s.estado === 'pendiente' && <button className="btn btn-sm btn-danger" style={{ background:'transparent', color:'var(--danger)', border:'1px solid var(--danger)' }}>Cancelar</button>}
                      {s.estado === 'entregado' && <button className="btn btn-sm" style={{ background:'transparent', color:'var(--secondary)', border:'1px solid var(--secondary)' }} onClick={() => setRatingModal(s)}>Calificar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {instrModal && (
        <Modal title="Instrucciones de retiro" onClose={() => setInstrModal(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[['Dirección','Cra. 68 #13-30, Kennedy Central, Bogotá'],['Horario','Lun – Vie 7:00 AM a 4:00 PM'],['Contacto','Ing. Manuel Torres · 300 456 7890'],['Material confirmado','100 ladrillos prensados estándar']].map(([k,v]) => (
              <div key={k} style={{ display:'flex', gap:10 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'var(--text-secondary)', width:120, flexShrink:0 }}>{k}</div>
                <div style={{ fontSize:14 }}>{v}</div>
              </div>
            ))}
            <div style={{ background:'var(--bg-base)', borderRadius:8, padding:14, display:'flex', alignItems:'center', justifyContent:'center', height:100, border:'1px dashed var(--border)', fontSize:13, color:'var(--text-secondary)' }}>
              [Mapa estático — Kennedy]
            </div>
          </div>
        </Modal>
      )}

      {ratingModal && (
        <Modal title="Calificar experiencia" onClose={() => setRatingModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setRatingModal(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => setRatingModal(null)}>Enviar calificación</button>
          </>}>
          <div>
            <p style={{ marginBottom:20, color:'var(--text-secondary)', fontSize:14 }}>¿Cómo fue tu experiencia con <strong>{ratingModal.empresa}</strong>?</p>
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:20 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:36, color: s <= rating ? '#E67E22' : 'var(--border)', transition:'color 200ms' }}>★</button>
              ))}
            </div>
            <textarea className="form-textarea" placeholder="Cuéntanos tu experiencia (opcional)..." style={{ minHeight:80 }} />
          </div>
        </Modal>
      )}
    </div>
  );
};

// V-B10: Notificaciones
const BeneficiarioNotificaciones = ({ onNavigate }) => {
  const [notifs, setNotifs] = React.useState([
    { id:1, icon:'package', text:'Constructora Bolívar publicó 200 ladrillos disponibles en tu zona (Kennedy)', time:'hace 30 min', unread:true, group:'Hoy' },
    { id:2, icon:'calendar', text:'Tu inscripción al evento "Donación Masiva Feb 2026" fue confirmada', time:'hace 1 h', unread:true, group:'Hoy' },
    { id:3, icon:'check-circle', text:'Tu solicitud de madera fue aprobada por Conconcreto. Ver instrucciones de retiro.', time:'hace 2 h', unread:true, group:'Hoy' },
    { id:4, icon:'message-circle', text:'Juan Pérez comentó en tu publicación "Mesa de Madera Reciclada"', time:'ayer 3:45 PM', unread:false, group:'Ayer' },
    { id:5, icon:'x-circle', text:'Tu solicitud de cerámica fue rechazada — materiales ya agotados por Amarilo S.A.S.', time:'ayer 10:00 AM', unread:false, group:'Ayer' },
    { id:6, icon:'package', text:'Conconcreto publicó 80 litros de pintura de caucho en Suba', time:'hace 3 días', unread:false, group:'Esta semana' },
  ]);

  const groups = ['Hoy','Ayer','Esta semana'];
  const dismiss = id => setNotifs(n => n.filter(x => x.id !== id));
  const markAll = () => setNotifs(n => n.map(x => ({...x, unread:false})));

  return (
    <div style={{ maxWidth:680 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ marginBottom:4 }}>Notificaciones</h1>
          <p style={{ color:'var(--text-secondary)' }}>{notifs.filter(n => n.unread).length} sin leer</p>
        </div>
        <button className="btn btn-ghost" onClick={markAll}>Marcar todo como leído</button>
      </div>
      {groups.map(g => {
        const items = notifs.filter(n => n.group === g);
        if (!items.length) return null;
        return (
          <div key={g} style={{ marginBottom:24 }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-secondary)', marginBottom:12 }}>{g}</div>
            <div className="card" style={{ overflow:'hidden' }}>
              {items.map((n,i) => (
                <div key={n.id} style={{ display:'flex', gap:14, padding:'16px 20px', background: n.unread ? 'rgba(46,134,171,0.04)' : 'transparent', borderBottom: i<items.length-1?'1px solid var(--border)':'none', position:'relative' }}>
                  {n.unread && <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--secondary)', position:'absolute', left:8, top:20, flexShrink:0 }} />}
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--bg-base)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon name={n.icon} size={18} color={n.unread ? 'var(--secondary)' : 'var(--text-secondary)'} />
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, lineHeight:1.5, fontWeight: n.unread ? 500 : 400 }}>{n.text}</p>
                    <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{n.time}</span>
                  </div>
                  <button onClick={() => dismiss(n.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:4, flexShrink:0 }}>
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

// V-B02: Perfil Beneficiario
const BeneficiarioPerfil = ({ onNavigate }) => {
  const [tab, setTab] = React.useState('info');
  return (
    <div>
      <div className="card" style={{ padding:0, marginBottom:24, overflow:'hidden' }}>
        <div style={{ height:120, background:'linear-gradient(135deg, var(--primary)22, var(--secondary)22)' }} />
        <div style={{ padding:'0 32px 24px', marginTop:-40 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <div style={{ position:'relative' }}>
              <Avatar name="Carlos Rivera" size={80} />
              <button style={{ position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:'50%', background:'var(--primary)', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <Icon name="edit" size={12} color="#fff" />
              </button>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginBottom:8 }}>Editar perfil</button>
          </div>
          <div style={{ marginTop:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <h2 style={{ fontSize:22 }}>Carlos Andrés Rivera</h2>
              <Badge type="aprobado">✓ Alimentador Web</Badge>
            </div>
            <div style={{ display:'flex', gap:16, fontSize:13, color:'var(--text-secondary)' }}>
              <span>@carlosrivera</span>
              <span><Icon name="map-pin" size={13} /> Rafael Uribe Uribe</span>
              <span>Miembro desde Feb 2025</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
        {[{id:'info',label:'Información Personal'},{id:'solicitudes',label:'Mis Solicitudes'},{id:'publicaciones',label:'Mis Publicaciones'},{id:'eventos',label:'Historial Eventos'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'10px 20px', background:'none', border:'none', cursor:'pointer',
            fontFamily:'var(--font-body)', fontSize:14, fontWeight:600,
            color: tab===t.id ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: tab===t.id ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom:-1, transition:'color 200ms',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>
          <div className="card" style={{ padding:24 }}>
            <h3 style={{ fontSize:16, marginBottom:20 }}>Datos personales</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[['Nombre completo','Carlos Andrés Rivera'],['Cédula','1020304050'],['Fecha de nacimiento','15 Mar 1992'],['Género','Masculino'],['Estrato','Estrato 2'],['Localidad','Rafael Uribe Uribe']].map(([l,v]) => (
                <div key={l} className="form-group">
                  <label className="form-label">{l}</label>
                  <input className="form-input" defaultValue={v} />
                </div>
              ))}
              <button className="btn btn-primary" style={{ alignSelf:'flex-start' }}>Guardar cambios</button>
            </div>
          </div>
          <div className="card" style={{ padding:24 }}>
            <h3 style={{ fontSize:16, marginBottom:20 }}>Cambiar contraseña</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {['Contraseña actual','Nueva contraseña','Confirmar nueva contraseña'].map(l => (
                <div key={l} className="form-group">
                  <label className="form-label">{l}</label>
                  <input className="form-input" type="password" placeholder="••••••••" />
                </div>
              ))}
              <button className="btn btn-secondary" style={{ alignSelf:'flex-start' }}>Actualizar contraseña</button>
            </div>
          </div>
        </div>
      )}
      {tab === 'solicitudes' && <BeneficiarioSolicitudes onNavigate={onNavigate} />}
      {tab === 'publicaciones' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {['Mesa de Madera Reciclada','Instalación cerámica','Tutorial mezcla'].map((p,i) => (
            <div key={i} className="card" style={{ padding:16 }}>
              <div style={{ height:120, background:'var(--bg-base)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                <Icon name="file-text" size={32} color="var(--border)" />
              </div>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:8 }}>{p}</div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-ghost btn-sm"><Icon name="edit" size={14} /> Editar</button>
                <button className="btn btn-ghost btn-sm" style={{ color:'var(--danger)' }}><Icon name="trash" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// V-B06: Publicaciones
const BeneficiarioPublicaciones = ({ onNavigate }) => {
  const [liked, setLiked] = React.useState([]);
  const posts = [
    { id:1, user:'Ana Lucía Forero', badge:true, time:'hace 3 h', type:'Proyecto', text:'Terminé de construir el piso de mi cocina con los tablones que conseguí por BrickByBrick. El proceso fue muy sencillo y en menos de una semana tenía los materiales. La gente de Conconcreto fue super amable y profesional. ¡Gracias a todos los que hacen esto posible!', likes:24, comments:6 },
    { id:2, user:'Diego Morales', badge:false, time:'hace 5 h', type:'Tutorial', text:'Tutorial completo: Cómo hacer mezcla de concreto en casa con los materiales donados. Paso 1: Verifica que la arena esté limpia y seca. Paso 2: Proporciones 1:2:3 (cemento:arena:gravilla)...', likes:18, comments:9 },
    { id:3, user:'Esperanza Calderón', badge:true, time:'hace 1 día', type:'Noticia', text:'El Distrito anunció nuevas zonas de Kennedy y Bosa habilitadas para beneficiarios de BrickByBrick. ¡Más familias podrán acceder a materiales de construcción gratuitos este año!', likes:45, comments:12 },
  ];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:28, alignItems:'start' }}>
      <div>
        <h1 style={{ marginBottom:4 }}>Publicaciones</h1>
        <p style={{ color:'var(--text-secondary)', marginBottom:24 }}>Comunidad de construcción circular en Bogotá.</p>
        <div style={{ maxWidth:680 }}>
          {posts.map(p => (
            <div key={p.id} className="card" style={{ padding:24, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <Avatar name={p.user} size={40} />
                  <div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontWeight:600 }}>{p.user}</span>
                      {p.badge && <Badge type="aprobado">✓ Alimentador</Badge>}
                    </div>
                    <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.time}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <Badge type={p.type==='Proyecto'?'primary':p.type==='Tutorial'?'secundario':'entregado'}>{p.type}</Badge>
                  <button style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                    <Icon name="chevron-down" size={16} color="var(--text-secondary)" />
                  </button>
                </div>
              </div>
              <p style={{ fontSize:14, lineHeight:1.7, color:'var(--text-secondary)', marginBottom:16 }}>{p.text}</p>
              <div style={{ display:'flex', gap:20, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                <button onClick={() => setLiked(l => l.includes(p.id) ? l.filter(x=>x!==p.id) : [...l, p.id])} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color: liked.includes(p.id)?'var(--danger)':'var(--text-secondary)', fontSize:13, fontWeight: liked.includes(p.id)?600:400 }}>
                  <Icon name="heart" size={16} color={liked.includes(p.id)?'var(--danger)':'var(--text-secondary)'} />
                  {p.likes + (liked.includes(p.id)?1:0)}
                </button>
                <button style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:13 }}>
                  <Icon name="message-circle" size={16} color="var(--text-secondary)" />{p.comments}
                </button>
                <button style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:13 }}>
                  <Icon name="share" size={16} color="var(--text-secondary)" />Compartir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div className="card" style={{ padding:20 }}>
          <div className="form-group">
            <div style={{ position:'relative' }}>
              <Icon name="search" size={15} color="var(--text-secondary)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
              <input className="form-input" placeholder="Buscar publicaciones..." style={{ paddingLeft:36 }} />
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--text-secondary)', marginBottom:10 }}>Tipo</div>
            {['Proyecto','Tutorial','Noticia','Recurso'].map(t => (
              <label key={t} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, cursor:'pointer', fontSize:14 }}>
                <input type="checkbox" style={{ accentColor:'var(--primary)' }} />{t}
              </label>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding:20 }}>
          <h3 style={{ fontSize:15, marginBottom:14 }}>Alimentadores destacados</h3>
          {['Ana Lucía Forero','Esperanza Calderón','Rodrigo Vargas'].map((u,i) => (
            <div key={u} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 0', borderBottom: i<2?'1px solid var(--border)':'none' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--text-secondary)', width:16 }}>{i+1}</span>
              <Avatar name={u} size={32} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{u}</div>
                <div style={{ fontSize:11, color:'var(--text-secondary)' }}>{[12,8,6][i]} publicaciones</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => onNavigate('beneficiario-nueva-publicacion')} style={{ position:'fixed', bottom:32, right:32, width:56, height:56, borderRadius:'50%', background:'var(--primary)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--shadow-elevated)', zIndex:50 }}>
        <Icon name="plus" size={24} color="#fff" />
      </button>
    </div>
  );
};

// V-B08: Grupos
const BeneficiarioGrupos = ({ onNavigate }) => {
  const [tab, setTab] = React.useState('mis');
  const [chatMsg, setChatMsg] = React.useState('');
  const [messages, setMessages] = React.useState([
    { id:1, user:'Ana Forero', text:'Alguien sabe si ya tienen el ladrillo de Constructora Bolívar disponible?', time:'10:22 AM', mine:false },
    { id:2, user:'Carlos Rivera', text:'Sí! Acabo de solicitar 200 unidades. El proceso fue muy rápido.', time:'10:25 AM', mine:true },
    { id:3, user:'Diego Morales', text:'Excelente! ¿Cuánto tardó en aprobar la solicitud?', time:'10:28 AM', mine:false },
  ]);
  const [viewGroup, setViewGroup] = React.useState(null);

  const grupos = [
    { id:1, name:'Constructores Kennedy', desc:'Grupo de beneficiarios en la localidad de Kennedy compartiendo tips y materiales.', members:124, topics:['Ladrillo','Concreto','Kennedy'] },
    { id:2, name:'Madera Reciclada Bogotá', desc:'Comunidad de artesanos y constructores que trabajan con madera reciclada y reutilizada.', members:89, topics:['Madera','Reciclaje','Bogotá'] },
    { id:3, name:'Red de Emprendedores Bosa', desc:'Emprendedores de Bosa que usan materiales donados para sus proyectos productivos.', members:67, topics:['Emprendimiento','Bosa','Pintura'] },
  ];

  if (viewGroup) {
    const g = grupos.find(x => x.id === viewGroup);
    return (
      <div>
        <button className="btn btn-ghost btn-sm" onClick={() => setViewGroup(null)} style={{ marginBottom:20, color:'var(--text-secondary)' }}>
          <Icon name="chevron-left" size={14} color="var(--text-secondary)" /> Volver a grupos
        </button>
        <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:24 }}>
          <div style={{ height:100, background:'linear-gradient(135deg, var(--primary)22, var(--secondary)22)' }} />
          <div style={{ padding:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h2 style={{ marginBottom:4 }}>{g.name}</h2>
              <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{g.desc}</div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ color:'var(--danger)', border:'1px solid var(--danger)' }}>Salir del grupo</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
          {['Feed','Miembros','Chat grupal'].map(t => (
            <button key={t} style={{ padding:'8px 18px', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', fontSize:14, fontWeight:600, color:'var(--text-secondary)', borderBottom:'2px solid transparent' }}>{t}</button>
          ))}
        </div>
        {/* Chat */}
        <div className="card" style={{ display:'flex', flexDirection:'column', height:400 }}>
          <div style={{ flex:1, overflow:'auto', padding:20, display:'flex', flexDirection:'column', gap:12 }}>
            {messages.map(m => (
              <div key={m.id} style={{ display:'flex', flexDirection:'column', alignItems: m.mine?'flex-end':'flex-start' }}>
                {!m.mine && <span style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4 }}>{m.user}</span>}
                <div style={{ maxWidth:'75%', background: m.mine?'var(--primary)':'var(--bg-base)', color: m.mine?'#fff':'var(--text-primary)', borderRadius:12, padding:'10px 14px', fontSize:14, lineHeight:1.5 }}>{m.text}</div>
                <span style={{ fontSize:11, color:'var(--text-secondary)', marginTop:4 }}>{m.time}</span>
              </div>
            ))}
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:10 }}>
            <input className="form-input" placeholder="Escribe un mensaje..." value={chatMsg} onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter' && chatMsg.trim()) { setMessages(m => [...m, {id:m.length+1, user:'Carlos Rivera', text:chatMsg, time:'Ahora', mine:true}]); setChatMsg(''); }}} />
            <button className="btn btn-primary" onClick={() => { if(chatMsg.trim()) { setMessages(m => [...m, {id:m.length+1, user:'Carlos Rivera', text:chatMsg, time:'Ahora', mine:true}]); setChatMsg(''); }}}>
              <Icon name="send" size={16} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom:4 }}>Grupos</h1>
      <p style={{ color:'var(--text-secondary)', marginBottom:24 }}>Comunidades de beneficiarios y constructores.</p>
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--bg-base)', borderRadius:10, padding:4, width:'fit-content' }}>
        {[{id:'mis',label:'Mis grupos'},{id:'explorar',label:'Explorar grupos'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'8px 20px', borderRadius:8, border:'none', cursor:'pointer', background: tab===t.id?'#fff':'transparent', color: tab===t.id?'var(--text-primary)':'var(--text-secondary)', fontFamily:'var(--font-body)', fontSize:14, fontWeight:600, boxShadow: tab===t.id?'var(--shadow-card)':'none', transition:'all 200ms' }}>{t.label}</button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20 }}>
        {grupos.map(g => (
          <div key={g.id} className="card" style={{ padding:20 }}>
            <div style={{ height:80, background:'linear-gradient(135deg, var(--primary)15, var(--secondary)15)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
              <Avatar name={g.name} size={48} />
            </div>
            <h3 style={{ fontSize:16, marginBottom:6 }}>{g.name}</h3>
            <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:12 }}>{g.desc}</p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
              {g.topics.map(t => <span key={t} style={{ fontSize:11, padding:'3px 8px', borderRadius:12, background:'var(--bg-base)', color:'var(--text-secondary)', fontWeight:600 }}>{t}</span>)}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--text-secondary)' }}><Icon name="users" size={14} /> {g.members} miembros</span>
              <button className="btn btn-primary btn-sm" onClick={() => setViewGroup(g.id)}>Ver grupo</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, {
  BeneficiarioDashboard, BeneficiarioMateriales, BeneficiarioMaterialDetalle,
  BeneficiarioEventos, BeneficiarioSolicitudes, BeneficiarioNotificaciones,
  BeneficiarioPerfil, BeneficiarioPublicaciones, BeneficiarioGrupos,
  MaterialCard, catColors,
});
