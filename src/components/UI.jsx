// ============================================================
// COMPONENTES REUTILIZÁVEIS — Gate7 Portal
// ============================================================

export function Badge({ variant = 'default', children, size = 'sm' }) {
  const variants = {
    default:   { bg: 'var(--surface-2)',    color: 'var(--text-secondary)',  border: 'var(--border)' },
    green:     { bg: 'var(--green-bg)',     color: 'var(--green)',           border: 'var(--green-border)' },
    red:       { bg: 'var(--red-bg)',       color: 'var(--red)',             border: 'var(--red-border)' },
    amber:     { bg: 'var(--amber-bg)',     color: 'var(--amber)',           border: 'var(--amber-border)' },
    blue:      { bg: 'var(--blue-bg)',      color: 'var(--blue)',            border: 'var(--blue-border)' },
    purple:    { bg: 'var(--purple-bg)',    color: 'var(--purple)',          border: 'var(--purple-border)' },
    orange:    { bg: 'rgba(245,110,15,0.1)', color: 'var(--g7-orange)',     border: 'var(--g7-orange-border)' },
    navy:      { bg: 'var(--g7-navy)',      color: '#fff',                   border: 'var(--g7-navy)' },
  }
  const v = variants[variant] || variants.default
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius: '20px',
      fontSize: size === 'sm' ? '11px' : '12px',
      fontWeight: 500,
      background: v.bg,
      color: v.color,
      border: `1px solid ${v.border}`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    pendente:  { variant: 'amber',  label: 'Pendente',  icon: 'ti-clock' },
    aprovado:  { variant: 'green',  label: 'Aprovado',  icon: 'ti-check' },
    rejeitado: { variant: 'red',    label: 'Rejeitado', icon: 'ti-x' },
  }
  const s = map[status] || map.pendente
  return (
    <Badge variant={s.variant}>
      <i className={`ti ${s.icon}`} style={{ fontSize: '11px' }} />
      {s.label}
    </Badge>
  )
}

export function Btn({ children, variant = 'default', size = 'md', onClick, disabled, type = 'button', style: extra }) {
  const variants = {
    default:  { bg: 'var(--white)',    color: 'var(--text-primary)', border: 'var(--border-strong)' },
    primary:  { bg: 'var(--g7-navy)', color: '#fff',                border: 'var(--g7-navy)' },
    orange:   { bg: 'var(--g7-orange)', color: '#fff',              border: 'var(--g7-orange)' },
    danger:   { bg: 'var(--red-bg)',  color: 'var(--red)',           border: 'var(--red-border)' },
    ghost:    { bg: 'transparent',    color: 'var(--text-secondary)', border: 'transparent' },
  }
  const v = variants[variant]
  const sizes = {
    sm: { padding: '5px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '13px' },
    lg: { padding: '11px 24px', fontSize: '14px' },
  }
  const sz = sizes[size]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        fontWeight: 500,
        transition: 'all 0.15s',
        ...sz,
        ...extra,
      }}
    >
      {children}
    </button>
  )
}

export function Card({ children, style: extra, padding = '20px' }) {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding,
      boxShadow: 'var(--shadow-sm)',
      ...extra,
    }}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, icon, sub, color = 'var(--g7-navy)' }) {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 20px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ${icon}`} style={{ fontSize: '17px', color }} />
        </div>
      </div>
      <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{sub}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, width = '560px' }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(11,22,40,0.6)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backdropFilter: 'blur(3px)',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px',
        width: '100%',
        maxWidth: width,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
      }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--g7-navy)', letterSpacing: '-0.02em' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '16px' }}>
            <i className="ti ti-x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FormField({ label, required, children, col = 1, error }) {
  return (
    <div style={{ gridColumn: `span ${col}`, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}{required && <span style={{ color: 'var(--red)', marginLeft: '2px' }}>*</span>}
        </label>
      )}
      {children}
      {error && <span style={{ fontSize: '11px', color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}

export function Input({ ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '9px 12px',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        fontSize: '13px',
        color: 'var(--text-primary)',
        background: 'var(--surface)',
        outline: 'none',
        ...props.style,
      }}
    />
  )
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        padding: '9px 12px',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        fontSize: '13px',
        color: 'var(--text-primary)',
        background: 'var(--surface)',
        outline: 'none',
        cursor: 'pointer',
        ...props.style,
      }}
    >
      {children}
    </select>
  )
}

export function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%',
        padding: '9px 12px',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        fontSize: '13px',
        color: 'var(--text-primary)',
        background: 'var(--surface)',
        outline: 'none',
        resize: 'vertical',
        minHeight: '80px',
        lineHeight: 1.5,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        ...props.style,
      }}
    />
  )
}

export function DataTable({ columns, rows, emptyMessage = 'Nenhum registro encontrado' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{
                textAlign: col.align || 'left',
                padding: '10px 14px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid var(--border)',
                whiteSpace: 'nowrap',
                background: 'var(--surface)',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <i className="ti ti-inbox" style={{ display: 'block', fontSize: '28px', marginBottom: '8px', opacity: 0.5 }} />
                {emptyMessage}
              </td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map((col, j) => (
                <td key={j} style={{
                  padding: '11px 14px',
                  color: 'var(--text-primary)',
                  textAlign: col.align || 'left',
                  verticalAlign: 'middle',
                }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-muted)', gap: '10px' }}>
      <i className="ti ti-loader" style={{ fontSize: '20px', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
      Carregando...
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--g7-navy)', letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>{actions}</div>}
    </div>
  )
}

export function Alert({ variant = 'info', children }) {
  const variants = {
    info:    { bg: 'var(--blue-bg)',   color: 'var(--blue)',  border: 'var(--blue-border)',  icon: 'ti-info-circle' },
    warning: { bg: 'var(--amber-bg)',  color: 'var(--amber)', border: 'var(--amber-border)', icon: 'ti-alert-triangle' },
    success: { bg: 'var(--green-bg)',  color: 'var(--green)', border: 'var(--green-border)', icon: 'ti-check-circle' },
    error:   { bg: 'var(--red-bg)',    color: 'var(--red)',   border: 'var(--red-border)',   icon: 'ti-x-circle' },
  }
  const v = variants[variant]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: v.bg, border: `1px solid ${v.border}`, borderRadius: 'var(--radius-md)', color: v.color, fontSize: '13px', lineHeight: 1.5 }}>
      <i className={`ti ${v.icon}`} style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }} />
      <div>{children}</div>
    </div>
  )
}

export function UploadArea({ onFile, fileName, accept = '.pdf,.jpg,.jpeg,.png' }) {
  return (
    <label style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '20px',
      border: '1px dashed var(--border-strong)',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      transition: 'all 0.15s',
      background: fileName ? 'var(--green-bg)' : 'var(--surface)',
      color: fileName ? 'var(--green)' : 'var(--text-muted)',
    }}>
      <i className={`ti ${fileName ? 'ti-check-circle' : 'ti-cloud-upload'}`} style={{ fontSize: '24px' }} />
      <div style={{ fontSize: '13px', fontWeight: 500 }}>
        {fileName || 'Clique para anexar nota fiscal'}
      </div>
      <div style={{ fontSize: '11px' }}>{fileName ? '' : 'PDF, JPG, PNG — máx. 10MB'}</div>
      <input type="file" accept={accept} style={{ display: 'none' }} onChange={e => onFile(e.target.files[0])} />
    </label>
  )
}
