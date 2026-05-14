import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Card, PageHeader, FormField, Input, Btn, Alert } from '../components/UI'

export default function PerfilPage() {
  const { profile } = useAuth()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function alterarSenha() {
    setError(''); setSuccess(''); setSaving(true)
    try {
      if (!novaSenha || novaSenha.length < 8) throw new Error('A senha deve ter no mínimo 8 caracteres.')
      if (novaSenha !== confirmarSenha) throw new Error('As senhas não coincidem.')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada. Faça login novamente.')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clever-action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            action: 'change_password',
            nova_senha: novaSenha,
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao alterar senha.')

      setSuccess('Senha alterada com sucesso!')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const initials = profile?.nome?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?'

  return (
    <div className="fade-in">
      <PageHeader title="Meu Perfil" subtitle="Gerencie suas informações e senha de acesso" />

      <div style={{ maxWidth: '560px' }}>
        {/* Info do usuário */}
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'var(--g7-navy)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: 600, flexShrink: 0,
            }}>{initials}</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--g7-navy)' }}>{profile?.nome}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{profile?.email}</div>
              <div style={{ marginTop: '6px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '20px',
                  background: profile?.role === 'adm' ? 'rgba(245,110,15,0.12)' : 'var(--blue-bg)',
                  color: profile?.role === 'adm' ? 'var(--g7-orange)' : 'var(--blue)',
                }}>
                  {profile?.role === 'adm' ? '⚡ Administrador' : '👤 Técnico'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Alterar senha */}
        <Card>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--g7-navy)', marginBottom: '4px' }}>
            <i className="ti ti-key" style={{ marginRight: '6px' }} />
            Alterar Senha
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Escolha uma senha segura com no mínimo 8 caracteres.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <FormField label="Nova senha" required>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
              />
            </FormField>
            <FormField label="Confirmar nova senha" required>
              <Input
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
              />
            </FormField>

            {novaSenha && confirmarSenha && novaSenha !== confirmarSenha && (
              <Alert variant="error">As senhas não coincidem.</Alert>
            )}
            {novaSenha && confirmarSenha && novaSenha === confirmarSenha && novaSenha.length >= 8 && (
              <Alert variant="success">Senhas conferem! Clique em salvar.</Alert>
            )}
            {error && <Alert variant="error">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Btn
                variant="primary"
                onClick={alterarSenha}
                disabled={saving || novaSenha !== confirmarSenha || novaSenha.length < 8}
              >
                {saving
                  ? <><i className="ti ti-loader" style={{animation:'spin 1s linear infinite',display:'inline-block'}} /> Salvando...</>
                  : <><i className="ti ti-key" /> Salvar Nova Senha</>
                }
              </Btn>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
