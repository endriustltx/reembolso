import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, DataTable, Loader, PageHeader, Btn, Badge, Modal, FormField, Input, Select, Alert } from '../components/UI'

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome:'', email:'', role:'tecnico', senha:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('nome')
    setColaboradores(data || [])
    setLoading(false)
  }

  function set(f,v) { setForm(prev=>({...prev,[f]:v})) }

  async function criarUsuario() {
    setError(''); setSaving(true)
    try {
      if (!form.nome || !form.email || !form.senha) throw new Error('Preencha todos os campos.')
      if (form.senha.length < 8) throw new Error('A senha deve ter no mínimo 8 caracteres.')

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
            nome: form.nome,
            email: form.email,
            senha: form.senha,
            role: form.role,
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao criar usuário.')

      setSuccess(`Usuário ${form.nome} criado com sucesso!`)
      setForm({ nome:'', email:'', role:'tecnico', senha:'' })
      setModal(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo(id, ativo) {
    await supabase.from('profiles').update({ ativo: !ativo }).eq('id', id)
    load()
  }

  if (loading) return <Loader />

  return (
    <div className="fade-in">
      <PageHeader
        title="Colaboradores"
        subtitle="Gerencie os técnicos e administradores do sistema"
        actions={
          <Btn variant="primary" onClick={() => { setModal(true); setError(''); setSuccess('') }}>
            <i className="ti ti-user-plus" /> Novo Colaborador
          </Btn>
        }
      />
      {success && <div style={{ marginBottom:'16px' }}><Alert variant="success">{success}</Alert></div>}
      <Alert variant="info" style={{ marginBottom:'20px' }}>
        Ao criar um colaborador, ele receberá acesso ao portal com o e-mail e senha definidos.
      </Alert>
      <Card padding="0">
        <DataTable
          columns={[
            { label: 'Nome', render: r => {
              const initials = r.nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
              return (
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'50%',background:r.role==='adm'?'rgba(245,110,15,0.12)':'var(--surface-2)',color:r.role==='adm'?'var(--g7-orange)':'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:600}}>{initials}</div>
                  <div><div style={{fontWeight:500}}>{r.nome}</div><div style={{fontSize:'11px',color:'var(--text-muted)'}}>{r.email}</div></div>
                </div>
              )
            }},
            { label: 'Perfil', render: r => <Badge variant={r.role==='adm'?'orange':'blue'}><i className={`ti ${r.role==='adm'?'ti-shield':'ti-user'}`} style={{fontSize:'11px'}} />{r.role==='adm'?'Administrador':'Técnico'}</Badge> },
            { label: 'Status', render: r => <Badge variant={r.ativo?'green':'red'}><i className={`ti ${r.ativo?'ti-check':'ti-x'}`} style={{fontSize:'11px'}} />{r.ativo?'Ativo':'Inativo'}</Badge> },
            { label: 'Criado em', render: r => r.criado_em ? new Date(r.criado_em).toLocaleDateString('pt-BR') : '—' },
            { label: 'Ações', render: r => <Btn size="sm" variant={r.ativo?'danger':'default'} onClick={()=>toggleAtivo(r.id,r.ativo)}>{r.ativo?'Desativar':'Ativar'}</Btn> },
          ]}
          rows={colaboradores}
          emptyMessage="Nenhum colaborador cadastrado"
        />
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="Novo Colaborador">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <FormField label="Nome completo" required col={2}><Input placeholder="Ex: João da Silva" value={form.nome} onChange={e=>set('nome',e.target.value)} /></FormField>
          <FormField label="E-mail corporativo" required col={2}><Input type="email" placeholder="joao@gate7.com.br" value={form.email} onChange={e=>set('email',e.target.value)} /></FormField>
          <FormField label="Perfil de acesso"><Select value={form.role} onChange={e=>set('role',e.target.value)}><option value="tecnico">Técnico</option><option value="adm">Administrador</option></Select></FormField>
          <FormField label="Senha inicial" required><Input type="password" placeholder="Mín. 8 caracteres" value={form.senha} onChange={e=>set('senha',e.target.value)} /></FormField>
        </div>
        {error && <div style={{marginTop:'12px'}}><Alert variant="error">{error}</Alert></div>}
        <div style={{ marginTop:'16px' }}><Alert variant="warning">A senha inicial será fornecida ao colaborador. Oriente-o a alterá-la no primeiro acesso.</Alert></div>
        <div style={{ display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'20px',paddingTop:'16px',borderTop:'1px solid var(--border)' }}>
          <Btn variant="default" onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={criarUsuario} disabled={saving}>
            {saving ? <><i className="ti ti-loader" style={{animation:'spin 1s linear infinite',display:'inline-block'}} /> Criando...</> : <><i className="ti ti-check" /> Criar Colaborador</>}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}
