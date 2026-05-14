import { useAuth } from '../hooks/useAuth'

const admNav = [
  { section: 'Visão Geral' },
  { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { id: 'banco-horas', icon: 'ti-clock', label: 'Banco de Horas' },
  { section: 'Colaboradores' },
  { id: 'todos-lancamentos', icon: 'ti-users', label: 'Todos os Lançamentos' },
  { id: 'notas-fiscais', icon: 'ti-file-invoice', label: 'Notas Fiscais' },
  { id: 'relatorio', icon: 'ti-chart-bar', label: 'Relatório Mensal' },
  { section: 'Administração' },
  { id: 'colaboradores', icon: 'ti-user-cog', label: 'Colaboradores' },
  { section: 'Conta' },
  { id: 'perfil', icon: 'ti-user-circle', label: 'Meu Perfil' },
]

const tecnicoNav = [
  { section: 'Minha Área' },
  { id: 'meus-lancamentos', icon: 'ti-list-check', label: 'Meus Lançamentos' },
  { id: 'banco-horas', icon: 'ti-clock', label: 'Banco de Horas' },
  { id: 'notas-fiscais', icon: 'ti-file-invoice', label: 'Notas Fiscais' },
  { id: 'novo-lancamento', icon: 'ti-plus', label: 'Novo Lançamento', accent: true },
  { section: 'Conta' },
  { id: 'perfil', icon: 'ti-user-circle', label: 'Meu Perfil' },
]

export default function Sidebar({ currentPage, onNavigate }) {
  const { profile, isAdm, signOut } = useAuth()
  const navItems = isAdm ? admNav : tecnicoNav

  const initials = profile?.nome
    ? profile.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoArea}>
        <div style={styles.logoMark}>
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#F56E0F"/>
            <path d="M7 14L12 9L17 14L22 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 19L12 14L17 19L22 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
          </svg>
        </div>
        <div>
          <div style={styles.logoName}>Gate7</div>
          <div style={styles.logoSub}>Portal de Reembolso</div>
        </div>
      </div>

      {/* User badge */}
      <div style={styles.userBadge}>
        <div style={{
          ...styles.avatar,
          background: isAdm ? 'rgba(245,110,15,0.15)' : 'rgba(255,255,255,0.1)',
          color: isAdm ? '#F56E0F' : 'rgba(255,255,255,0.8)',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.userName} className="truncate">{profile?.nome || 'Carregando...'}</div>
          <div style={styles.userRole}>
            {isAdm ? (
              <><span style={styles.roleBadge}>ADM</span> Administrador</>
            ) : 'Técnico(a)'}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} style={styles.section}>{item.section}</div>
            )
          }
          const active = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                ...styles.navItem,
                ...(active ? styles.navItemActive : {}),
                ...(item.accent && !active ? styles.navItemAccent : {}),
              }}
            >
              <i className={`ti ${item.icon}`} style={styles.navIcon} />
              <span>{item.label}</span>
              {active && <div style={styles.activeBar} />}
            </button>
          )
        })}
      </nav>

      {/* Sign out */}
      <div style={styles.bottomArea}>
        <div style={styles.divider} />
        <button onClick={signOut} style={styles.signOutBtn}>
          <i className="ti ti-logout" style={{ fontSize: '16px' }} />
          Sair do sistema
        </button>
      </div>
    </aside>
  )
}

const styles = {
  sidebar: {
    width: '240px',
    background: 'var(--g7-navy)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    height: '100vh',
    position: 'sticky',
    top: 0,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '20px 16px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logoMark: { flexShrink: 0 },
  logoName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '1px',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '12px',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
    flexShrink: 0,
  },
  userName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#fff',
    lineHeight: 1.3,
  },
  userRole: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.45)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '2px',
  },
  roleBadge: {
    fontSize: '10px',
    background: 'rgba(245,110,15,0.2)',
    color: '#F56E0F',
    padding: '1px 5px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  },
  section: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '12px 10px 4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '9px 10px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.55)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 400,
    textAlign: 'left',
    transition: 'all 0.15s',
    position: 'relative',
    marginBottom: '2px',
  },
  navItemActive: {
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontWeight: 500,
  },
  navItemAccent: {
    color: '#F56E0F',
    background: 'rgba(245,110,15,0.08)',
  },
  navIcon: {
    fontSize: '17px',
    flexShrink: 0,
    width: '20px',
  },
  activeBar: {
    position: 'absolute',
    right: '0',
    top: '6px',
    bottom: '6px',
    width: '3px',
    background: 'var(--g7-orange)',
    borderRadius: '3px 0 0 3px',
  },
  bottomArea: {
    padding: '0 12px 16px',
  },
  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.06)',
    marginBottom: '12px',
  },
  signOutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '9px 10px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    fontSize: '13px',
    textAlign: 'left',
    transition: 'all 0.15s',
  },
}
