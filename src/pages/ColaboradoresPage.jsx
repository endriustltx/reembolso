import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, DataTable, Loader, PageHeader, Btn, Badge, Modal, FormField, Input, Select, Alert } from '../components/UI'

async function chamarEdgeFunction(session, body) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clever-action`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erro na operação.')
  return json
}

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [senhaModal, setSenhaModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ nome:'', email:'', role:'tecnico', senha:'' })
  const [editForm, setEditForm] = useState({ nome:'', role:'tecnico' })
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
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
  function setEdit(f,v) { setEditForm(prev=>({...prev,[f]:v})) }

  async function getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Sessão expirada. Faça login novamente.')
    return session
  }

  async function criarUsuario() {
    setError(''); setSaving(true)
    try {
      if (!form.nome || !form.email || !form.senha) throw new Error('Preencha todos os campos.')
      if (form.senha.length < 8) throw new Error('A senha deve ter no mínimo 8 caracteres.')
      const session = await getSession()
      await chamarEdgeFunction(session, { nome: form.nome, email: form.email, senha: form.senha, role: form.role })
      setSuccess(`Usuário ${form.nome} criado com sucesso!`)
      setForm({ nome:'', email:'', role:'tecnico', senha:'' })
      setModal(false)
      load()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function salvarEdicao() {
    setError(''); setSaving(true)
    try {
      if (!editForm.nome) throw new Error('Nome é obrigatório.')
      const { error: e } = await supabase.from('profiles')
        .update({ nome: editForm.nome, role: editForm.role })
        .eq('id', selected.id)
      if (e) throw e
      setSuccess(`Dados de ${editForm.nome} atualizados!`)
      setEditModal(false)
      setSelected(null)
      load()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function alterarSenha() {
    setError(''); setSaving(true)
    try {
      if (!novaSenha || novaSenha.length < 8) throw new Error('A senha deve ter no mínimo 8 caracteres.')
      if (novaSenha !== confirmarSenha) throw new Error('As senhas não coincidem.')
      const session = await getSession()
      await chamarEdgeFunction(session, {
        action: 'change_password',
        target_user_id: selected.id,
        nova_senha: novaSenha,
      })
      setSuccess(`Senha de ${selected.nome} alterada com sucesso!`)
      setSenhaModal(false)
      setNovaSenha('')
      setConfirmarSenha('')
      setSelected(null)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function confirmarDelete() {
    setError(''); setSaving(true)
    try {
      const session = await getSession()
      await chamarEdgeFunction(session, { action: 'delete', user_id: selected.id })
      setSuccess(`Usuário ${selected.nome} removido.`)
      setDeleteModal(false)
      setSelected(null)
      load()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function toggleAtivo(id, ativo) {
    await supabase.from('profiles').update({ ativo: !ativo }).eq('id', id)
    load()
  }

  function abrirEdicao(r) { setSelected(r); setEditForm({ nome: r.nome, role: r.role }); setError(''); setEditModal(true) }
  function abrirSenha(r) { setSelected(r); setNovaSenha(''); setConfirmarSenha(''); setError(''); setSenhaModal(true) }
  function abrirDelete(r) { setSelected(r); setError(''); setDeleteModal(true) }

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
        Técnicos veem apenas seus próprios lançamentos. Administradores têm acesso total.
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
            { label: 'Ações', render: r => (
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                <Btn size="sm" variant="default" onClick={() => abrirEdicao(r)}>
                  <i className="ti ti-pencil" style={{fontSize:'13px'}} /> Editar
                </Btn>
                <Btn size="sm" variant="default" onClick={() => abrirSenha(r)}>
                  <i className="ti ti-key" style={{fontSize:'13px'}} /> Senha
                </Btn>
                <Btn size="sm" variant="default" onClick={() => toggleAtivo(r.id, r.ativo)}>
                  {r.ativo ? 'Desativar' : 'Ativar'}
                </Btn>
                <Btn size="sm" variant="danger" onClick={() => abrirDelete(r)}>
                  <i className="ti ti-trash" style={{fontSize:'13px'}} />
                </Btn>
              </div>
            )},
          ]}
          rows={colaboradores}
          emptyMessage="Nenhum colaborador cadastrado"
        />
      </Card>

      {/* Modal Novo */}
      <Modal open={modal} onClose={() => setModal(false)} title="Novo Colaborador">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <FormField label="Nome completo" required col={2}><Input placeholder="Ex: João da Silva" value={form.nome} onChange={e=>set('nome',e.target.value)} /></FormField>
          <FormField label="E-mail corporativo" required col={2}><Input type="email" placeholder="joao@gate7.com.br" value={form.email} onChange={e=>set('email',e.target.value)} /></FormField>
          <FormField label="Perfil"><Select value={form.role} onChange={e=>set('role',e.target.value)}><option value="tecnico">Técnico</option><option value="adm">Administrador</option></Select></FormField>
          <FormField label="Senha inicial" required><Input type="password" placeholder="Mín. 8 caracteres" value={form.senha} onChange={e=>set('senha',e.target.value)} /></FormField>
        </div>
        {error && <div style={{marginTop:'12px'}}><Alert variant="error">{error}</Alert></div>}
        <div style={{marginTop:'16px'}}><Alert variant="warning">Oriente o colaborador a alterar a senha no primeiro acesso.</Alert></div>
        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'20px',paddingTop:'16px',borderTop:'1px solid var(--border)'}}>
          <Btn variant="default" onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={criarUsuario} disabled={saving}>
            {saving?<><i className="ti ti-loader" style={{animation:'spin 1s linear infinite',display:'inline-block'}} /> Criando...</>:<><i className="ti ti-check" /> Criar Colaborador</>}
          </Btn>
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title={`Editar — ${selected?.nome}`}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <FormField label="Nome completo" required col={2}><Input placeholder="Nome completo" value={editForm.nome} onChange={e=>setEdit('nome',e.target.value)} /></FormField>
          <FormField label="Perfil de acesso" col={2}><Select value={editForm.role} onChange={e=>setEdit('role',e.target.value)}><option value="tecnico">Técnico</option><option value="adm">Administrador</option></Select></FormField>
        </div>
        <div style={{marginTop:'12px'}}><Alert variant="info">O e-mail não pode ser alterado. Use o botão "Senha" para redefinir a senha.</Alert></div>
        {error && <div style={{marginTop:'12px'}}><Alert variant="error">{error}</Alert></div>}
        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'20px',paddingTop:'16px',borderTop:'1px solid var(--border)'}}>
          <Btn variant="default" onClick={() => setEditModal(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={salvarEdicao} disabled={saving}>
            {saving?<><i className="ti ti-loader" style={{animation:'spin 1s linear infinite',display:'inline-block'}} /> Salvando...</>:<><i className="ti ti-check" /> Salvar</>}
          </Btn>
        </div>
      </Modal>

      {/* Modal Alterar Senha */}
      <Modal open={senhaModal} onClose={() => setSenhaModal(false)} title={`Alterar Senha — ${selected?.nome}`}>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <FormField label="Nova senha" required>
            <Input type="password" placeholder="Mín. 8 caracteres" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} />
          </FormField>
          <FormField label="Confirmar nova senha" required>
            <Input type="password" placeholder="Digite a senha novamente" value={confirmarSenha} onChange={e=>setConfirmarSenha(e.target.value)} />
          </FormField>
          {novaSenha && confirmarSenha && novaSenha !== confirmarSenha && (
            <Alert variant="error">As senhas não coincidem.</Alert>
          )}
          {novaSenha && confirmarSenha && novaSenha === confirmarSenha && novaSenha.length >= 8 && (
            <Alert variant="success">Senhas conferem!</Alert>
          )}
        </div>
        {error && <div style={{marginTop:'12px'}}><Alert variant="error">{error}</Alert></div>}
        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'20px',paddingTop:'16px',borderTop:'1px solid var(--border)'}}>
          <Btn variant="default" onClick={() => setSenhaModal(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={alterarSenha} disabled={saving || novaSenha !== confirmarSenha || novaSenha.length < 8}>
            {saving?<><i className="ti ti-loader" style={{animation:'spin 1s linear infinite',display:'inline-block'}} /> Salvando...</>:<><i className="ti ti-key" /> Alterar Senha</>}
          </Btn>
        </div>
      </Modal>

      {/* Modal Delete */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Remover Colaborador" width="420px">
        <Alert variant="error">
          Tem certeza que deseja remover <strong>{selected?.nome}</strong>? Ele perderá o acesso ao sistema. Os lançamentos serão mantidos.
        </Alert>
        {error && <div style={{marginTop:'12px'}}><Alert variant="error">{error}</Alert></div>}
        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'20px',paddingTop:'16px',borderTop:'1px solid var(--border)'}}>
          <Btn variant="default" onClick={() => setDeleteModal(false)}>Cancelar</Btn>
          <Btn variant="danger" onClick={confirmarDelete} disabled={saving}>
            {saving?<><i className="ti ti-loader" style={{animation:'spin 1s linear infinite',display:'inline-block'}} /> Removendo...</>:<><i className="ti ti-trash" /> Confirmar Remoção</>}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}
