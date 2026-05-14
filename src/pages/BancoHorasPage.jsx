import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Card, StatCard, Badge, DataTable, Loader, PageHeader, Btn, Modal, FormField, Input, Select, Alert } from '../components/UI'

const fmt = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
const fmtH = min => {
  const m = Math.abs(min || 0)
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
}

export default function BancoHorasPage() {
  const { profile, isAdm } = useAuth()
  const [horas, setHoras] = useState([])
  const [noc, setNoc] = useState([])
  const [usos, setUsos] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ user_id: '', data: '', motivo: '', horas: '', minutos: '0', aprovado_por: '', observacao: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))

  useEffect(() => { loadData() }, [mes, profile])

  async function loadData() {
    setLoading(true)

    if (isAdm) {
      const { data: profs } = await supabase.from('profiles').select('*').eq('role', 'tecnico')
      setColaboradores(profs || [])

      const [rH, rN, rU] = await Promise.all([
        supabase.from('lancamentos_horas').select('*').order('criado_em', { ascending: false }),
        supabase.from('lancamentos_noc').select('*').order('criado_em', { ascending: false }),
        supabase.from('uso_banco_horas').select('*').order('criado_em', { ascending: false }),
      ])
      setHoras(rH.data || [])
      setNoc(rN.data || [])
      setUsos(rU.data || [])
    } else {
      const [rH, rN, rU] = await Promise.all([
        supabase.from('lancamentos_horas').select('*').eq('user_id', profile?.id).order('criado_em', { ascending: false }),
        supabase.from('lancamentos_noc').select('*').eq('user_id', profile?.id).order('criado_em', { ascending: false }),
        supabase.from('uso_banco_horas').select('*').eq('user_id', profile?.id).order('criado_em', { ascending: false }),
      ])
      setHoras(rH.data || [])
      setNoc(rN.data || [])
      setUsos(rU.data || [])
    }

    setLoading(false)
  }

  function filtrarMes(rows) {
    return (rows || []).filter(r => (r.data || r.criado_em || '').startsWith(mes))
  }

  function getBancoMinutos(userId) {
    const acumulado = horas
      .filter(h => h.user_id === userId && h.tipo === 'normal' && h.status === 'aprovado')
      .reduce((s, h) => s + Number(h.total_minutos || 0), 0)
    const usado = usos
      .filter(u => u.user_id === userId)
      .reduce((s, u) => s + (Number(u.horas_usadas || 0) * 60) + Number(u.minutos_usados || 0), 0)
    return acumulado - usado
  }

  function set(f, v) { setForm(prev => ({ ...prev, [f]: v })) }

  async function salvarUso() {
    setError(''); setSaving(true)
    try {
      if (!form.user_id || !form.data || !form.motivo || !form.horas) {
        throw new Error('Preencha todos os campos obrigatórios.')
      }
      const totalMin = (Number(form.horas) * 60) + Number(form.minutos || 0)
      const saldo = getBancoMinutos(form.user_id)
      if (totalMin > saldo) {
        throw new Error(`Saldo insuficiente. Técnico tem apenas ${fmtH(saldo)} disponível.`)
      }
      const { error: e } = await supabase.from('uso_banco_horas').insert({
        user_id: form.user_id,
        data: form.data,
        motivo: form.motivo,
        horas_usadas: Number(form.horas),
        minutos_usados: Number(form.minutos || 0),
        aprovado_por: form.aprovado_por || null,
        observacao: form.observacao || null,
      })
      if (e) throw e
      setModalOpen(false)
      setForm({ user_id: '', data: '', motivo: '', horas: '', minutos: '0', aprovado_por: '', observacao: '' })
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const bancoMin = isAdm
    ? colaboradores.reduce((s, c) => s + Math.max(0, getBancoMinutos(c.id)), 0)
    : getBancoMinutos(profile?.id)

  const totalNoc = (isAdm ? noc : noc.filter(n => n.user_id === profile?.id))
    .filter(n => n.status === 'aprovado')
    .reduce((s, n) => s + Number(n.valor_dia || 0), 0)

  const totalUsado = (isAdm ? usos : usos.filter(u => u.user_id === profile?.id))
    .reduce((s, u) => s + (Number(u.horas_usadas || 0) * 60) + Number(u.minutos_usados || 0), 0)

  if (loading) return <Loader />

  return (
    <div className="fade-in">
      <PageHeader
        title="Banco de Horas e NOC"
        subtitle="Controle de horas acumuladas, uso e pagamentos NOC"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', fontSize: '13px', background: 'var(--white)' }} />
            {isAdm && (
              <Btn variant="primary" onClick={() => { setModalOpen(true); setError('') }}>
                <i className="ti ti-minus" /> Descontar Horas
              </Btn>
            )}
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <StatCard label="Saldo Banco de Horas" value={fmtH(bancoMin)} icon="ti-clock" sub="Horas disponíveis" color="var(--purple)" />
        <StatCard label="Horas Usadas" value={fmtH(totalUsado)} icon="ti-clock-minus" sub="Descontadas" color="var(--amber)" />
        <StatCard label="NOC a Pagar" value={fmt(totalNoc)} icon="ti-moon" sub="Aprovados" color="var(--red)" />
      </div>

      {/* ADM: visão por colaborador */}
      {isAdm && colaboradores.length > 0 && (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g7-navy)', marginBottom: '16px' }}>
            Saldo por Colaborador
          </div>
          <DataTable
            columns={[
              { label: 'Técnico', render: r => {
                const initials = r.nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
                return (
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:600,color:'var(--text-secondary)'}}>
                      {initials}
                    </div>
                    {r.nome}
                  </div>
                )
              }},
              { label: 'Acumulado', align: 'center', render: r => {
                const acum = horas.filter(h => h.user_id === r.id && h.tipo === 'normal' && h.status === 'aprovado').reduce((s,h) => s+Number(h.total_minutos||0), 0)
                return <span style={{fontWeight:500,color:'var(--purple)'}}>{fmtH(acum)}</span>
              }},
              { label: 'Usado', align: 'center', render: r => {
                const usado = usos.filter(u => u.user_id === r.id).reduce((s,u) => s+(Number(u.horas_usadas||0)*60)+Number(u.minutos_usados||0), 0)
                return usado > 0 ? <span style={{color:'var(--amber)',fontWeight:500}}>- {fmtH(usado)}</span> : <span style={{color:'var(--text-muted)'}}>—</span>
              }},
              { label: 'Saldo', align: 'center', render: r => {
                const saldo = getBancoMinutos(r.id)
                return (
                  <span style={{fontWeight:700, fontSize:'15px', color: saldo < 0 ? 'var(--red)' : saldo === 0 ? 'var(--text-muted)' : 'var(--green)'}}>
                    {saldo < 0 ? '-' : ''}{fmtH(Math.abs(saldo))}
                  </span>
                )
              }},
              { label: 'NOC', align: 'right', render: r => {
                const total = noc.filter(n => n.user_id === r.id && n.status === 'aprovado').reduce((s,n) => s+Number(n.valor_dia||0), 0)
                return total > 0 ? <span style={{fontWeight:600,color:'var(--red)'}}>{fmt(total)}</span> : <span style={{color:'var(--text-muted)'}}>—</span>
              }},
              { label: '', render: r => (
                <Btn size="sm" variant="orange" onClick={() => {
                  setForm(prev => ({ ...prev, user_id: r.id }))
                  setModalOpen(true)
                  setError('')
                }}>
                  <i className="ti ti-minus" /> Descontar
                </Btn>
              )},
            ]}
            rows={colaboradores}
          />
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Histórico de uso */}
        <Card>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g7-navy)', marginBottom: '16px', display:'flex',alignItems:'center',gap:'8px' }}>
            <i className="ti ti-clock-minus" style={{ color: 'var(--amber)' }} /> Descontos Realizados
          </div>
          {usos.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              Nenhum desconto registrado
            </p>
          ) : (
            <DataTable
              columns={[
                ...(isAdm ? [{ label: 'Técnico', render: r => {
                  const c = colaboradores.find(c => c.id === r.user_id)
                  return c?.nome?.split(' ')[0] || '—'
                }}] : []),
                { label: 'Data', render: r => fmtDate(r.data) },
                { label: 'Motivo', key: 'motivo' },
                { label: 'Horas', render: r => <span style={{fontWeight:500,color:'var(--amber)'}}>- {fmtH((Number(r.horas_usadas||0)*60)+Number(r.minutos_usados||0))}</span> },
              ]}
              rows={usos}
            />
          )}
        </Card>

        {/* NOC */}
        <Card>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g7-navy)', marginBottom: '12px', display:'flex',alignItems:'center',gap:'8px' }}>
            <i className="ti ti-moon" style={{ color: 'var(--red)' }} /> NOC (Pagamento)
          </div>
          <Alert variant="warning" style={{ marginBottom: '12px' }}>
            R$ 175,00 por dia • não entra no banco de horas
          </Alert>
          <DataTable
            columns={[
              ...(isAdm ? [{ label: 'Técnico', render: r => {
                const c = colaboradores.find(c => c.id === r.user_id)
                return c?.nome?.split(' ')[0] || '—'
              }}] : []),
              { label: 'Data', render: r => fmtDate(r.data) },
              { label: 'Cliente', key: 'cliente' },
              { label: 'Valor', render: r => <span style={{fontWeight:600,color:'var(--red)'}}>{fmt(r.valor_dia)}</span>, align: 'right' },
              { label: 'Status', render: r => <Badge variant={r.status==='aprovado'?'green':r.status==='rejeitado'?'red':'amber'}>{r.status}</Badge> },
            ]}
            rows={isAdm ? noc : noc.filter(n => n.user_id === profile?.id)}
            emptyMessage="Nenhum NOC registrado"
          />
        </Card>
      </div>

      {/* Modal desconto */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Descontar Horas do Banco">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {isAdm && (
            <FormField label="Técnico" required col={2}>
              <Select value={form.user_id} onChange={e => set('user_id', e.target.value)}>
                <option value="">Selecione o técnico...</option>
                {colaboradores.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} — Saldo: {fmtH(getBancoMinutos(c.id))}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
          <FormField label="Data" required>
            <Input type="date" value={form.data} onChange={e => set('data', e.target.value)} />
          </FormField>
          <FormField label="Motivo" required>
            <Select value={form.motivo} onChange={e => set('motivo', e.target.value)}>
              <option value="">Selecione...</option>
              <option value="Folga compensatória">Folga compensatória</option>
              <option value="Saída antecipada">Saída antecipada</option>
              <option value="Dia livre">Dia livre</option>
              <option value="Meio período">Meio período</option>
              <option value="Outro">Outro</option>
            </Select>
          </FormField>
          <FormField label="Horas a descontar" required>
            <Input type="number" min="0" max="24" placeholder="0" value={form.horas} onChange={e => set('horas', e.target.value)} />
          </FormField>
          <FormField label="Minutos">
            <Select value={form.minutos} onChange={e => set('minutos', e.target.value)}>
              <option value="0">00 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
            </Select>
          </FormField>
          <FormField label="Aprovado por" col={2}>
            <Input placeholder="Nome do gestor" value={form.aprovado_por} onChange={e => set('aprovado_por', e.target.value)} />
          </FormField>
          <FormField label="Observações" col={2}>
            <Input placeholder="Informações adicionais..." value={form.observacao} onChange={e => set('observacao', e.target.value)} />
          </FormField>
        </div>

        {form.user_id && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--purple-bg)', border: '1px solid var(--purple-border)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--purple)' }}>
            <i className="ti ti-clock" /> Saldo atual: <strong>{fmtH(getBancoMinutos(form.user_id))}</strong>
            {form.horas && (
              <> → Após desconto: <strong>{fmtH(getBancoMinutos(form.user_id) - (Number(form.horas)*60) - Number(form.minutos||0))}</strong></>
            )}
          </div>
        )}

        {error && (
          <div style={{ marginTop: '12px' }}>
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <div style={{ display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'20px',paddingTop:'16px',borderTop:'1px solid var(--border)' }}>
          <Btn variant="default" onClick={() => setModalOpen(false)}>Cancelar</Btn>
          <Btn variant="orange" onClick={salvarUso} disabled={saving}>
            {saving ? <><i className="ti ti-loader" style={{animation:'spin 1s linear infinite',display:'inline-block'}} /> Salvando...</> : <><i className="ti ti-minus" /> Confirmar Desconto</>}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}
