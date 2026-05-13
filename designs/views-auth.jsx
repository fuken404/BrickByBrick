// Landing Page + Auth Views
// Exports: LandingPage, LoginPage, RegisterBeneficiario, RegisterEmpresa

const LandingPage = ({ onNavigate }) => {
  const stats = [
    { value: '1.240', label: 'Materiales donados' },
    { value: '87', label: 'Constructoras activas' },
    { value: '3.400', label: 'Familias beneficiadas' },
  ];
  const steps = [
    { icon: 'building', title: 'Constructoras publican excedentes', desc: 'Las empresas registran sus materiales sobrantes con fotos, cantidades y condiciones de retiro.' },
    { icon: 'search', title: 'Beneficiarios solicitan lo que necesitan', desc: 'Personas y emprendedores exploran el catálogo y envían solicitudes según su proyecto.' },
    { icon: 'file-check', title: 'Entrega y certificado tributario', desc: 'Se coordina el retiro del material y se genera el certificado de donación para deducciones fiscales.' },
  ];
  const testimonials = [
    { name: 'Constructora Bolívar S.A.', role: 'Empresa constructora', text: 'Gracias a BrickByBrick hemos donado más de 800 sacos de cemento y ladrillos excedentes. El beneficio tributario del Art. 255 fue clave para nuestra decisión. Proceso transparente y organizado.', avatar: 'CB' },
    { name: 'María Elena Rodríguez', role: 'Beneficiaria, Localidad Rafael Uribe', text: 'Con los materiales que conseguí pude terminar de construir el segundo piso de mi casa. Lo que parecía imposible se hizo realidad con el apoyo de esta plataforma. Mil gracias.', avatar: 'MR' },
  ];

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--bg-base)' }}>
      {/* Topbar */}
      <nav style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 5%', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="layers" size={20} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>BrickByBrick</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={() => onNavigate('login')}>Ingresar</button>
          <button className="btn btn-primary" onClick={() => onNavigate('register-beneficiario')}>Registrarse</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '88vh', display: 'flex', alignItems: 'center',
        background: `
          radial-gradient(circle at 20% 80%, rgba(192,57,43,0.06) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(46,134,171,0.06) 0%, transparent 50%),
          var(--bg-base)`,
        position: 'relative', overflow: 'hidden',
        padding: '80px 5%',
      }}>
        {/* Brick pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: `repeating-linear-gradient(0deg, var(--text-primary) 0px, var(--text-primary) 1px, transparent 1px, transparent 30px),
            repeating-linear-gradient(90deg, var(--text-primary) 0px, var(--text-primary) 1px, transparent 1px, transparent 60px)`,
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', width: '100%' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(192,57,43,0.08)', borderRadius: 24, padding: '6px 14px', marginBottom: 24 }}>
              <Icon name="award" size={14} color="var(--primary)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Economía circular · Bogotá, Colombia</span>
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.1, marginBottom: 24, color: 'var(--text-primary)' }}>
              Conectamos lo que <span style={{ color: 'var(--primary)' }}>sobra</span> con quien lo <span style={{ color: 'var(--secondary)' }}>necesita</span>
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
              Plataforma de donación de materiales de construcción excedentes entre constructoras y familias de bajos recursos en Bogotá. Generamos valor social y beneficios tributarios.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => onNavigate('register-beneficiario')} style={{ gap: 10 }}>
                <Icon name="user" size={18} color="#fff" />
                Soy Beneficiario
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('register-empresa')} style={{ gap: 10 }}>
                <Icon name="building" size={18} color="var(--secondary)" />
                Soy Constructora
              </button>
            </div>
          </div>
          {/* Illustration */}
          <div style={{ position: 'relative' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: 'var(--shadow-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { cat: 'Ladrillo', qty: '2.400 unidades', color: 'var(--primary)', icon: 'layers' },
                  { cat: 'Concreto', qty: '15 m³', color: 'var(--secondary)', icon: 'cpu' },
                  { cat: 'Madera', qty: '48 m²', color: 'var(--warning)', icon: 'grid' },
                  { cat: 'Cerámica', qty: '120 m²', color: 'var(--accent)', icon: 'tag' },
                ].map((m, i) => (
                  <div key={i} style={{ background: 'var(--bg-base)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: m.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={m.icon} size={18} color={m.color} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.cat}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.qty}</div>
                    <span className="badge badge-disponible" style={{ fontSize: 11, alignSelf: 'flex-start' }}>Disponible</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(39,174,96,0.06)', borderRadius: 8, border: '1px solid rgba(39,174,96,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="check-circle" size={18} color="var(--accent)" />
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>23 materiales nuevos esta semana cerca de ti</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: 'var(--bg-dark)', padding: '40px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, textAlign: 'center' }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 48, fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, marginBottom: 12 }}>¿Cómo funciona?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>Un proceso simple, transparente y con impacto real.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: i === 0 ? 'rgba(192,57,43,0.08)' : i === 1 ? 'rgba(46,134,171,0.08)' : 'rgba(39,174,96,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Icon name={s.icon} size={32} color={i === 0 ? 'var(--primary)' : i === 1 ? 'var(--secondary)' : 'var(--accent)'} />
                </div>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? 'var(--primary)' : i === 1 ? 'var(--secondary)' : 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '-16px auto 16px', border: '3px solid #fff' }}>{i+1}</div>
                <h3 style={{ fontSize: 18, marginBottom: 12 }}>{s.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tax benefits */}
      <section style={{ background: 'var(--primary)', padding: '72px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 24, padding: '6px 14px', marginBottom: 20 }}>
              <Icon name="percent" size={14} color="#fff" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Beneficio tributario</span>
            </div>
            <h2 style={{ color: '#fff', fontSize: 36, marginBottom: 16, lineHeight: 1.2 }}>Deduce hasta el 25% en impuesto de renta</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>El Artículo 255 de la Ley 1819 de 2016 permite a las empresas constructoras deducir el valor de sus donaciones para obtener una reducción significativa en su declaración de renta.</p>
            <button className="btn btn-lg" style={{ background: '#fff', color: 'var(--primary)' }} onClick={() => onNavigate('register-empresa')}>
              Conocer más
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: 'dollar-sign', title: 'Deducción del 25%', desc: 'Sobre el valor de los materiales donados' },
              { icon: 'file-check', title: 'Certificado digital', desc: 'Generado automáticamente con cada donación' },
              { icon: 'shield', title: 'Cumplimiento legal', desc: 'Proceso verificado y documentado por BrickByBrick' },
            ].map((b, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={b.icon} size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{b.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 5%', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: 48 }}>Lo que dicen nuestros usuarios</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            {testimonials.map((t, i) => (
              <div key={i} className="card" style={{ padding: '32px', position: 'relative' }}>
                <div style={{ fontSize: 48, color: 'var(--border)', fontFamily: 'Georgia', position: 'absolute', top: 16, right: 24, lineHeight: 1 }}>"</div>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 24, fontStyle: 'italic' }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={t.avatar} size={44} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-dark)', padding: '48px 5%', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="layers" size={16} color="#fff" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>BrickByBrick</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 260 }}>Conectando materiales excedentes con quienes más los necesitan. Bogotá, Colombia.</p>
          </div>
          {[
            { title: 'Plataforma', links: ['Materiales disponibles', '¿Cómo funciona?', 'Eventos', 'Comunidad'] },
            { title: 'Empresa', links: ['Registrar empresa', 'Beneficios tributarios', 'Art. 255 Ley 1819', 'Soporte'] },
            { title: 'Legal', links: ['Términos de uso', 'Política de privacidad', 'Ley 1581/2012', 'Cookies'] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>{col.title}</div>
              {col.links.map((link, j) => (
                <div key={j} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10, cursor: 'pointer' }}>{link}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1100, margin: '32px auto 0', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>© 2026 BrickByBrick. Todos los derechos reservados.</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Hecho con propósito social en Bogotá</span>
        </div>
      </footer>
    </div>
  );
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const LoginPage = ({ onNavigate }) => {
  const [role, setRole] = React.useState('beneficiario');
  const [showPass, setShowPass] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [error, setError] = React.useState('');

  const roleColors = { beneficiario: 'var(--primary)', empresa: 'var(--secondary)', admin: 'var(--bg-dark)' };
  const roleLabels = { beneficiario: 'Beneficiario', empresa: 'Constructora', admin: 'Administrador' };

  const handleLogin = () => {
    if (!email || !pass) { setError('Por favor completa todos los campos.'); return; }
    setError('');
    onNavigate(role === 'beneficiario' ? 'beneficiario-inicio' : role === 'empresa' ? 'empresa-inicio' : 'admin-dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '40% 60%', background: '#fff' }}>
      {/* Left panel */}
      <div style={{
        background: `linear-gradient(160deg, var(--primary) 0%, var(--primary-dark) 100%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 48, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: `repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 64px)` }} />
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.15)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Icon name="layers" size={32} color="#fff" />
          </div>
          <h1 style={{ color: '#fff', fontSize: 32, marginBottom: 8 }}>BrickByBrick</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.7, maxWidth: 280, margin: '0 auto 40px' }}>Materiales que sobran, hogares que crecen. Economía circular con propósito social.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: 'check-circle', text: '3.400 familias beneficiadas' },
              { icon: 'building', text: '87 constructoras activas' },
              { icon: 'gift', text: '1.240 materiales donados' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 16px' }}>
                <Icon name={s.icon} size={16} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ marginBottom: 8 }}>Bienvenido de nuevo</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>Ingresa a tu cuenta para continuar</p>

          {/* Role selector */}
          <div style={{ display: 'flex', gap: 6, padding: 4, background: 'var(--bg-base)', borderRadius: 10, marginBottom: 28 }}>
            {['beneficiario','empresa','admin'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                flex: 1, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: role === r ? roleColors[r] : 'transparent',
                color: role === r ? '#fff' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                transition: 'all 200ms',
              }}>{roleLabels[r]}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input className={`form-input${error ? ' error' : ''}`} type="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input className={`form-input${error ? ' error' : ''}`} type={showPass ? 'text' : 'password'} placeholder="Tu contraseña" value={pass} onChange={e => setPass(e.target.value)} style={{ paddingRight: 44 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Icon name={showPass ? 'eye-off' : 'eye'} size={16} color="var(--text-secondary)" />
                </button>
              </div>
            </div>
            {error && <div className="form-error"><Icon name="alert-triangle" size={14} color="var(--danger)" />{error}</div>}
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <span style={{ fontSize: 13, color: 'var(--secondary)', cursor: 'pointer', fontWeight: 500 }}>¿Olvidaste tu contraseña?</span>
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleLogin} style={{ background: roleColors[role], width: '100%', marginTop: 4 }}>
              Ingresar como {roleLabels[role]}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>o</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            ¿No tienes cuenta?{' '}
            <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => onNavigate('register-beneficiario')}>
              Regístrate aquí
            </span>
          </p>

          <button onClick={() => onNavigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, marginTop: 32 }}>
            <Icon name="chevron-left" size={14} color="var(--text-secondary)" />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── REGISTER BENEFICIARIO ────────────────────────────────────────────────────
const RegisterBeneficiario = ({ onNavigate }) => {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({ nombre: '', cedula: '', fechaNac: '', genero: '', estrato: '', localidad: '', correo: '', telefono: '', usuario: '', password: '', confirmPass: '' });

  const steps = ['Datos personales', 'Contacto y cuenta', 'Confirmación'];
  const localidades = ['Usaquén','Chapinero','Santa Fe','San Cristóbal','Usme','Tunjuelito','Bosa','Kennedy','Fontibón','Engativá','Suba','Barrios Unidos','Teusaquillo','Los Mártires','Antonio Nariño','Puente Aranda','La Candelaria','Rafael Uribe Uribe','Ciudad Bolívar','Sumapaz'];

  const upd = (k, v) => setForm(f => ({...f, [k]: v}));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="layers" size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>BrickByBrick</span>
        </div>

        <StepperHeader steps={steps} current={step} />

        <div className="card" style={{ padding: 40 }}>
          {step === 0 && (
            <div>
              <h2 style={{ marginBottom: 6 }}>Datos personales</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Ingresa tus datos para crear tu cuenta de beneficiario.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Nombre completo *</label>
                  <input className="form-input" placeholder="Ej: Carlos Andrés Rivera" value={form.nombre} onChange={e => upd('nombre', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Cédula de ciudadanía *</label>
                    <input className="form-input" placeholder="Ej: 1020304050" value={form.cedula} onChange={e => upd('cedula', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de nacimiento *</label>
                    <input className="form-input" type="date" value={form.fechaNac} onChange={e => upd('fechaNac', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Género *</label>
                    <select className="form-select" value={form.genero} onChange={e => upd('genero', e.target.value)}>
                      <option value="">Seleccionar</option>
                      <option>Masculino</option><option>Femenino</option><option>No binario</option><option>Prefiero no decir</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estrato socioeconómico *</label>
                    <select className="form-select" value={form.estrato} onChange={e => upd('estrato', e.target.value)}>
                      <option value="">Seleccionar</option>
                      {[1,2,3,4,5,6].map(e => <option key={e}>Estrato {e}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Localidad en Bogotá *</label>
                  <select className="form-select" value={form.localidad} onChange={e => upd('localidad', e.target.value)}>
                    <option value="">Seleccionar localidad</option>
                    {localidades.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ marginBottom: 6 }}>Contacto y cuenta</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Datos de contacto y credenciales de acceso.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Correo electrónico *</label>
                    <input className="form-input" type="email" placeholder="correo@ejemplo.com" value={form.correo} onChange={e => upd('correo', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono celular *</label>
                    <input className="form-input" placeholder="Ej: 3001234567" value={form.telefono} onChange={e => upd('telefono', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre de usuario *</label>
                  <input className="form-input" placeholder="Ej: carlosrivera92" value={form.usuario} onChange={e => upd('usuario', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña *</label>
                  <input className="form-input" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => upd('password', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmar contraseña *</label>
                  <input className="form-input" type="password" placeholder="Repite tu contraseña" value={form.confirmPass} onChange={e => upd('confirmPass', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ marginBottom: 6 }}>Confirmación</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Revisa tus datos antes de crear la cuenta.</p>
              <div style={{ background: 'var(--bg-base)', borderRadius: 10, padding: 20, marginBottom: 24 }}>
                {[['Nombre completo', form.nombre || 'Carlos Andrés Rivera'],['Cédula', form.cedula || '1020304050'],['Correo', form.correo || 'carlos@ejemplo.com'],['Teléfono', form.telefono || '3001234567'],['Usuario', form.usuario || '@carlosrivera'],['Localidad', form.localidad || 'Rafael Uribe Uribe'],['Estrato', form.estrato || 'Estrato 2']].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 20 }}>
                <input type="checkbox" style={{ marginTop: 2, accentColor: 'var(--primary)', width: 16, height: 16 }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Acepto los <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Términos de uso</span> y autorizo el tratamiento de mis datos personales según la <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Ley 1581 de 2012</span> de protección de datos de Colombia.
                </span>
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <button className="btn btn-ghost" onClick={() => step > 0 ? setStep(s => s-1) : onNavigate('login')} style={{ color: 'var(--text-secondary)' }}>
              <Icon name="chevron-left" size={16} color="var(--text-secondary)" />
              {step > 0 ? 'Anterior' : 'Volver al login'}
            </button>
            {step < 2 ? (
              <button className="btn btn-primary" onClick={() => setStep(s => s+1)}>
                Siguiente <Icon name="chevron-right" size={16} color="#fff" />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => onNavigate('beneficiario-inicio')}>
                <Icon name="check" size={16} color="#fff" />
                Crear cuenta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── REGISTER EMPRESA ─────────────────────────────────────────────────────────
const RegisterEmpresa = ({ onNavigate }) => {
  const [step, setStep] = React.useState(0);
  const [rutFile, setRutFile] = React.useState(null);
  const [ccFile, setCcFile] = React.useState(null);
  const steps = ['Datos de la empresa', 'Contacto y cuenta', 'Documentación'];
  const localidades = ['Usaquén','Chapinero','Santa Fe','Kennedy','Fontibón','Engativá','Suba','Teusaquillo','Puente Aranda'];

  const FileUpload = ({ label, file, onFile }) => (
    <div>
      <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>{label}</label>
      {!file ? (
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, border: '2px dashed var(--border)', borderRadius: 10, padding: '32px 20px', cursor: 'pointer', transition: 'border-color 200ms', background: 'var(--bg-base)' }}
          onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}>
          <Icon name="upload" size={28} color="var(--text-secondary)" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Arrastra tu archivo aquí</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>o haz clic para seleccionar</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>PDF o imagen, máx. 10 MB</div>
          </div>
          <input type="file" hidden onChange={e => onFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png" />
        </label>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: '1.5px solid var(--accent)', borderRadius: 10, background: 'rgba(39,174,96,0.04)' }}>
          <Icon name="file-check" size={20} color="var(--accent)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name || 'Documento cargado'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{file.size ? `${(file.size/1024).toFixed(0)} KB` : 'Archivo listo'}</div>
          </div>
          <Icon name="check-circle" size={18} color="var(--accent)" />
          <button onClick={() => onFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon name="x" size={16} color="var(--text-secondary)" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 580 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, background: 'var(--secondary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="building" size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>BrickByBrick · Constructoras</span>
        </div>
        <StepperHeader steps={steps} current={step} />
        <div className="card" style={{ padding: 40 }}>
          {step === 0 && (
            <div>
              <h2 style={{ marginBottom: 6 }}>Datos de la empresa</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Información de la empresa constructora.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group"><label className="form-label">Razón social *</label><input className="form-input" placeholder="Ej: Conconcreto S.A.S." /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group"><label className="form-label">NIT *</label><input className="form-input" placeholder="Ej: 890.903.938-1" /></div>
                  <div className="form-group"><label className="form-label">N° de empleados *</label>
                    <select className="form-select"><option value="">Seleccionar</option><option>1 - 10</option><option>11 - 50</option><option>51 - 200</option><option>201 - 1000</option><option>Más de 1000</option></select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group"><label className="form-label">Representante legal *</label><input className="form-input" placeholder="Nombre completo" /></div>
                  <div className="form-group"><label className="form-label">Cargo *</label><input className="form-input" placeholder="Ej: Gerente General" /></div>
                </div>
                <div className="form-group"><label className="form-label">Dirección sede principal *</label><input className="form-input" placeholder="Ej: Carrera 7 # 72-41, Piso 8" /></div>
                <div className="form-group"><label className="form-label">Localidad *</label>
                  <select className="form-select"><option value="">Seleccionar localidad</option>{localidades.map(l => <option key={l}>{l}</option>)}</select>
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <h2 style={{ marginBottom: 6 }}>Contacto y cuenta</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Datos de contacto empresarial y acceso.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group"><label className="form-label">Correo corporativo *</label><input className="form-input" type="email" placeholder="contacto@empresa.com.co" /></div>
                  <div className="form-group"><label className="form-label">Teléfono *</label><input className="form-input" placeholder="Ej: 601 7123456" /></div>
                </div>
                <div className="form-group"><label className="form-label">Sitio web (opcional)</label><input className="form-input" placeholder="https://www.empresa.com.co" /></div>
                <div className="form-group"><label className="form-label">Contraseña *</label><input className="form-input" type="password" placeholder="Mínimo 8 caracteres" /></div>
                <div className="form-group"><label className="form-label">Confirmar contraseña *</label><input className="form-input" type="password" placeholder="Repite la contraseña" /></div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 style={{ marginBottom: 6 }}>Documentación</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Sube los documentos requeridos para verificar tu empresa.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <FileUpload label="RUT (vigente) *" file={rutFile} onFile={setRutFile} />
                <FileUpload label="Cámara de Comercio (vigente) *" file={ccFile} onFile={setCcFile} />
                <div style={{ background: 'rgba(46,134,171,0.06)', borderRadius: 10, padding: 16, border: '1px solid rgba(46,134,171,0.15)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Icon name="info" size={16} color="var(--secondary)" style={{ marginTop: 2 }} />
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Tus documentos serán verificados en 1-3 días hábiles. Recibirás una notificación cuando tu empresa esté activa.</p>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" style={{ marginTop: 2, accentColor: 'var(--secondary)', width: 16, height: 16 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Acepto los <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Términos de uso</span> y autorizo el tratamiento de datos según la <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Ley 1581 de 2012</span>.
                  </span>
                </label>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <button className="btn btn-ghost" onClick={() => step > 0 ? setStep(s => s-1) : onNavigate('login')} style={{ color: 'var(--text-secondary)' }}>
              <Icon name="chevron-left" size={16} color="var(--text-secondary)" />
              {step > 0 ? 'Anterior' : 'Volver al login'}
            </button>
            {step < 2 ? (
              <button className="btn btn-secondary" onClick={() => setStep(s => s+1)}>
                Siguiente <Icon name="chevron-right" size={16} color="var(--secondary)" />
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => onNavigate('empresa-inicio')}>
                <Icon name="check" size={16} color="var(--secondary)" />
                Registrar empresa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { LandingPage, LoginPage, RegisterBeneficiario, RegisterEmpresa });
