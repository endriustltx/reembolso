import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError('E-mail ou senha incorretos. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      {/* Background pattern */}
      <div style={styles.bg} />
      <div style={styles.bgLines} />

      <div style={styles.card} className="fade-in">
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoMark}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#F56E0F"/>
              <path d="M7 14L12 9L17 14L22 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 19L12 14L17 19L22 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            </svg>
          </div>
          <div>
            <div style={styles.logoTitle}>Gate7</div>
            <div style={styles.logoSub}>Portal de Reembolso</div>
          </div>
        </div>

        <div style={styles.divider} />

        <h1 style={styles.heading}>Entrar na sua conta</h1>
        <p style={styles.subheading}>Acesse para registrar e acompanhar seus reembolsos</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>E-mail corporativo</label>
            <div style={styles.inputWrap}>
              <i className="ti ti-mail" style={styles.inputIcon} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@gate7.com.br"
                style={styles.input}
                autoComplete="email"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <div style={styles.inputWrap}>
              <i className="ti ti-lock" style={styles.inputIcon} />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <i className="ti ti-alert-circle" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? (
              <><i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite', display:'inline-block' }} /> Entrando...</>
            ) : (
              <><i className="ti ti-login" /> Entrar no Portal</>
            )}
          </button>
        </form>

        <p style={styles.footer}>
          Problemas de acesso? Fale com o administrador do sistema.
        </p>
      </div>

      <div style={styles.copyright}>
        © {new Date().getFullYear()} Gate7 · Portal de Reembolso
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--g7-navy)',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,110,15,0.15) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  bgLines: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.03) 39px, rgba(255,255,255,0.03) 40px),
      repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.03) 39px, rgba(255,255,255,0.03) 40px)`,
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-xl)',
    padding: '36px',
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  logoMark: {
    flexShrink: 0,
  },
  logoTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--g7-navy)',
    letterSpacing: '-0.02em',
  },
  logoSub: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '1px',
  },
  divider: {
    height: '1px',
    background: 'var(--border)',
    marginBottom: '24px',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--g7-navy)',
    marginBottom: '6px',
    letterSpacing: '-0.02em',
  },
  subheading: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '16px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    color: 'var(--text-primary)',
    background: 'var(--surface)',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    outline: 'none',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'var(--red-bg)',
    border: '1px solid var(--red-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--red)',
    fontSize: '13px',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: 'var(--g7-navy)',
    color: 'var(--white)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s, transform 0.1s',
    marginTop: '4px',
  },
  footer: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    marginTop: '20px',
    lineHeight: '1.5',
  },
  copyright: {
    position: 'relative',
    zIndex: 1,
    marginTop: '24px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)',
  },
}
