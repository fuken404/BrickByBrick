// Shared Components: Icons, Layout Shell, Navigation
// Exports to window: Icon, Sidebar, Topbar, AppShell, Toast, Modal, Badge, Avatar, EmptyState, SkeletonCard, StepperHeader

const Icon = ({ name, size = 18, color = 'currentColor', className = '' }) => {
  const icons = {
    home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
    package: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12',
    calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
    users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
    'file-text': 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
    bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
    user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
    building: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    'dollar-sign': 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    'bar-chart': 'M18 20V10M12 20V4M6 20v-6',
    'pie-chart': 'M21.21 15.89A10 10 0 118 2.83 M22 12A10 10 0 0012 2v10z',
    gift: 'M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
    search: 'M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.35-4.35',
    plus: 'M12 5v14M5 12h14',
    x: 'M18 6L6 18M6 6l12 12',
    check: 'M20 6L9 17l-5-5',
    edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
    trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z',
    'eye-off': 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22',
    upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
    download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
    'map-pin': 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z',
    'log-out': 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
    'chevron-right': 'M9 18l6-6-6-6',
    'chevron-down': 'M6 9l6 6 6-6',
    'chevron-left': 'M15 18l-6-6 6-6',
    menu: 'M3 12h18M3 6h18M3 18h18',
    heart: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
    'message-circle': 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
    share: 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    'alert-triangle': 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4M12 17h.01',
    info: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 8h.01M12 12v4',
    'check-circle': 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3',
    'x-circle': 'M22 12a10 10 0 11-20 0 10 10 0 0120 0z M15 9l-6 6M9 9l6 6',
    layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    award: 'M12 15a7 7 0 100-14 7 7 0 000 14z M8.21 13.89L7 23l5-3 5 3-1.21-9.12',
    'trending-up': 'M23 6l-9.5 9.5-5-5L1 18',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
    paperclip: 'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    'file-check': 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M9 15l2 2 4-4',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    'refresh-cw': 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
    database: 'M12 2C6.48 2 2 4.24 2 7s4.48 5 10 5 10-2.24 10-5-4.48-5-10-5zM2 7v5c0 2.76 4.48 5 10 5s10-2.24 10-5V7M2 12v5c0 2.76 4.48 5 10 5s10-2.24 10-5v-5',
    cpu: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01',
    'hard-drive': 'M22 12H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z M6 16h.01M10 16h.01',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    'percent': 'M19 5L5 19M6.5 6.5a1 1 0 100-2 1 1 0 000 2zM17.5 17.5a1 1 0 100-2 1 1 0 000 2z',
  };
  const d = icons[name] || icons['package'];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ flexShrink: 0 }}>
      {d.split('M').filter(Boolean).map((segment, i) => (
        <path key={i} d={'M' + segment} />
      ))}
    </svg>
  );
};

const Avatar = ({ name = 'U', size = 36, src = null }) => {
  const colors = ['#C0392B','#2E86AB','#27AE60','#E67E22','#8E44AD','#16A085'];
  const color = colors[name.charCodeAt(0) % colors.length];
  const initials = name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38,
      fontFamily: 'var(--font-body)', flexShrink: 0,
      overflow: 'hidden',
    }}>
      {src ? <img src={src} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : initials}
    </div>
  );
};

const Badge = ({ type = 'disponible', children }) => {
  const map = {
    disponible: 'badge-disponible', pendiente: 'badge-pendiente',
    entregado: 'badge-entregado', rechazado: 'badge-rechazado',
    aprobado: 'badge-aprobado', verificado: 'badge-verificado',
    'pendiente-verificacion': 'badge-pendiente-verificacion',
    secundario: 'badge-secundario', primary: 'badge-primary',
  };
  return <span className={`badge ${map[type] || 'badge-entregado'}`}>{children}</span>;
};

const Toast = ({ message, type = 'success', onClose }) => {
  const colors = { success: 'var(--accent)', error: 'var(--danger)', warning: 'var(--warning)', info: 'var(--secondary)' };
  const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="toast" style={{ borderLeftColor: colors[type] }}>
      <Icon name={icons[type]} color={colors[type]} size={20} />
      <span style={{ flex: 1, fontSize: 14 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
        <Icon name="x" size={16} color="var(--text-secondary)" />
      </button>
    </div>
  );
};

const Modal = ({ title, children, onClose, footer, size = 'md' }) => {
  const widths = { sm: 400, md: 540, lg: 700 };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: widths[size] }}>
        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon name="x" size={20} color="var(--text-secondary)" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

const EmptyState = ({ icon = 'package', title = 'Sin resultados', description = 'No hay datos para mostrar.' }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
      <Icon name={icon} size={28} color="var(--border)" />
    </div>
    <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{title}</h3>
    <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 320, margin: '0 auto' }}>{description}</p>
  </div>
);

const SkeletonCard = () => (
  <div className="card" style={{ padding: 16, overflow: 'hidden' }}>
    {[1,2,3].map(i => (
      <div key={i} style={{ height: i===1?160:16, background: 'var(--bg-base)', borderRadius: 6, marginBottom: 12, animation: 'pulse 1.5s ease infinite' }} />
    ))}
    <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
  </div>
);

const StepperHeader = ({ steps, current }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
    {steps.map((step, i) => (
      <React.Fragment key={i}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: i < current ? 'var(--accent)' : i === current ? 'var(--primary)' : 'var(--border)',
            color: i < current || i === current ? '#fff' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, transition: 'all 300ms',
          }}>
            {i < current ? <Icon name="check" size={16} color="#fff" /> : i + 1}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: i === current ? 'var(--primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{step}</span>
        </div>
        {i < steps.length - 1 && (
          <div style={{ flex: 1, height: 2, background: i < current ? 'var(--accent)' : 'var(--border)', margin: '0 8px', marginBottom: 24, transition: 'background 300ms' }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// Sidebar Component
const Sidebar = ({ role, activeView, onNavigate }) => {
  const navsByRole = {
    beneficiario: [
      { id: 'beneficiario-inicio', icon: 'home', label: 'Inicio' },
      { id: 'beneficiario-materiales', icon: 'package', label: 'Materiales' },
      { id: 'beneficiario-eventos', icon: 'calendar', label: 'Eventos' },
      { id: 'beneficiario-publicaciones', icon: 'file-text', label: 'Publicaciones' },
      { id: 'beneficiario-solicitudes', icon: 'layers', label: 'Mis Solicitudes' },
      { id: 'beneficiario-grupos', icon: 'users', label: 'Grupos' },
      { id: 'beneficiario-notificaciones', icon: 'bell', label: 'Notificaciones' },
      { id: 'beneficiario-perfil', icon: 'user', label: 'Mi Perfil' },
    ],
    empresa: [
      { id: 'empresa-inicio', icon: 'home', label: 'Inicio' },
      { id: 'empresa-materiales', icon: 'package', label: 'Mis Materiales' },
      { id: 'empresa-eventos', icon: 'calendar', label: 'Eventos' },
      { id: 'empresa-donaciones', icon: 'gift', label: 'Historial Donaciones' },
      { id: 'empresa-tributario', icon: 'percent', label: 'Beneficios Tributarios' },
      { id: 'empresa-notificaciones', icon: 'bell', label: 'Notificaciones' },
      { id: 'empresa-perfil', icon: 'building', label: 'Perfil Empresa' },
    ],
    admin: [
      { id: 'admin-dashboard', icon: 'activity', label: 'Dashboard' },
      { id: 'admin-beneficiarios', icon: 'users', label: 'Beneficiarios' },
      { id: 'admin-constructoras', icon: 'building', label: 'Constructoras' },
      { id: 'admin-materiales', icon: 'package', label: 'Materiales' },
      { id: 'admin-donaciones', icon: 'gift', label: 'Donaciones' },
      { id: 'admin-eventos', icon: 'calendar', label: 'Eventos' },
      { id: 'admin-publicaciones', icon: 'file-text', label: 'Publicaciones' },
      { id: 'admin-reportes', icon: 'bar-chart', label: 'Reportes' },
      { id: 'admin-configuracion', icon: 'settings', label: 'Configuración' },
    ],
  };

  const navs = navsByRole[role] || [];
  const accentColor = role === 'empresa' ? 'var(--secondary)' : role === 'admin' ? 'var(--primary)' : 'var(--primary)';
  const bgColor = role === 'admin' ? 'var(--bg-dark)' : '#fff';
  const textColor = role === 'admin' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)';
  const activeTextColor = role === 'admin' ? '#fff' : 'var(--text-primary)';

  return (
    <aside style={{
      width: 'var(--sidebar-width)', height: '100vh', position: 'fixed', left: 0, top: 0,
      background: bgColor, borderRight: `1px solid ${role === 'admin' ? 'rgba(255,255,255,0.08)' : 'var(--border)'}`,
      display: 'flex', flexDirection: 'column', zIndex: 100,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${role === 'admin' ? 'rgba(255,255,255,0.08)' : 'var(--border)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="layers" size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: role === 'admin' ? '#fff' : 'var(--text-primary)', lineHeight: 1.1 }}>BrickByBrick</div>
            <div style={{ fontSize: 10, color: textColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {role === 'beneficiario' ? 'Beneficiario' : role === 'empresa' ? 'Constructora' : 'Administrador'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        {navs.map(item => {
          const isActive = activeView === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isActive ? (role === 'admin' ? 'rgba(192,57,43,0.2)' : 'rgba(192,57,43,0.08)') : 'transparent',
                color: isActive ? accentColor : textColor,
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: isActive ? 600 : 400,
                transition: 'all var(--transition-fast)', marginBottom: 2, textAlign: 'left',
              }}>
              <Icon name={item.icon} size={18} color={isActive ? accentColor : textColor} />
              {item.label}
              {item.id === 'beneficiario-notificaciones' || item.id === 'empresa-notificaciones' ? (
                <span style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Bottom user card */}
      <div style={{ padding: 16, borderTop: `1px solid ${role === 'admin' ? 'rgba(255,255,255,0.08)' : 'var(--border)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={role === 'empresa' ? 'Conconcreto' : role === 'admin' ? 'Admin' : 'Carlos Rivera'} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: role === 'admin' ? '#fff' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {role === 'empresa' ? 'Conconcreto S.A.' : role === 'admin' ? 'Admin Sistema' : 'Carlos Rivera'}
            </div>
            <div style={{ fontSize: 11, color: textColor }}>{role === 'empresa' ? 'constructora' : role === 'admin' ? 'administrador' : '@carlosrivera'}</div>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon name="log-out" size={16} color={textColor} />
          </button>
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ onNavigate, role }) => {
  const [showNotifMenu, setShowNotifMenu] = React.useState(false);
  return (
    <header style={{
      height: 'var(--topbar-height)', background: '#fff',
      borderBottom: '1px solid var(--border)',
      position: 'fixed', left: 'var(--sidebar-width)', right: 0, top: 0, zIndex: 90,
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
    }}>
      <div style={{ flex: 1, position: 'relative', maxWidth: 400 }}>
        <Icon name="search" size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input placeholder="Buscar materiales, eventos, usuarios..." className="form-input" style={{ paddingLeft: 38, fontSize: 13 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8 }}>
          <Icon name="bell" size={20} color="var(--text-secondary)" />
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', border: '2px solid #fff' }} />
        </button>
        <Avatar name={role === 'empresa' ? 'Conconcreto' : role === 'admin' ? 'Admin' : 'Carlos Rivera'} size={34} />
      </div>
    </header>
  );
};

const AppShell = ({ role, activeView, onNavigate, children }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar role={role} activeView={activeView} onNavigate={onNavigate} />
    <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar onNavigate={onNavigate} role={role} />
      <main style={{ marginTop: 'var(--topbar-height)', padding: '32px', minHeight: 'calc(100vh - var(--topbar-height))' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  </div>
);

Object.assign(window, { Icon, Avatar, Badge, Toast, Modal, EmptyState, SkeletonCard, StepperHeader, Sidebar, Topbar, AppShell });
