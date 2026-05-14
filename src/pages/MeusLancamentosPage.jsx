import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Card, Badge, StatusBadge, DataTable, Loader, PageHeader, Btn, StatCard, Alert } from '../components/UI'
import NovoLancamentoModal from '../components/NovoLancamentoModal'

const fmt = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
const fmtH = min => `${Math.floor((min || 0) / 60)}h ${String((min || 0) % 60).padStart(2, '0')}m`

const TABS = [
  { id: 'km',   label: 'Km / Combustível', icon: 'ti-gas-station' },
  { id: 'hora', label: 'Horas',            icon: 'ti-clock' },
  { id: 'noc',  label: 'NOC',              icon: 'ti-moon' },
  { id: 'alim', label: 'Alimentação',      icon: 'ti-fork' },
]

function filtrarMes(rows, mes) {
  if (!rows) return []
  return rows.filter(r => r.data && r.data.startsWith(mes))
}

export default function MeusLancamentosPage({ isAdm, userId: filterUserId }) {
  const { profile } = useAuth()
  const [tab, setTab] = useState('km')
  const [km, setKm] = useState([])
  const [horas, setHoras] = useState([])
  const [noc, setNoc] = useState([])
  const [alim, setAlim] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))

  const targetId = filterUserId || profile?.id

  useEffect(() => { if (isAdm || targetId) loadAll() }, [targetId, isAdm])

  async function loadAll() {
    setLoading(true)

    if (isAdm) {
      const { data: profs } = await supabase.from('profiles').select('id, nome')
      if (profs) {
        const map = {}
        profs.forEach(p => { map[p.id] = p.nome })
        setProfiles(map)
      }
    }

    let q1 = supabase.from('lancamentos_km').select('*').order('criado_em', { ascending: false })
    let q2 = supabase.from('lancamentos_horas').select('*').order('criado_em', { ascending: false })
    let q3 = supabase.from('lancamentos_noc').select('*').order('criado_em', { ascending: false })
    let q4 = supabase.from('lancamentos_alimentacao').select('*').order('criado_em', { ascending: false })

    if (!isAdm) {
      q1 = q1.eq('user_id', targetId)
      q2 = q2.eq('user_id', targetId)
      q3 = q3.eq('user_id', targetId)
      q4 = q4.eq('user_id', targetId)
    }

    const [r1, r2, r3, r4] = await Promise.all([q1, q2, q3, q4])

    setKm(r1.data || [])
    setHoras(r2.data || [])
    setNoc(r3.data || [])
    setAlim(r4.data || [])
    setLoading(false)
  }

  async function aprovar(tabela, id) {
    await supabase.from(tabela).update({ status: 'aprovado' }).eq('id', id)
    loadAll()
  }

  async function rejeitar(tabela, id) {
    await supabase.from(tabela).update({ status: 'rejeitado' }).eq('id', id)
    loadAll()
  }

  const getNome = (user_id) => profiles[user_id] || '—'

  // Filtrar por mês no frontend
  const kmMes = filtrarMes(km, mes)
  const horasMes = filtrarMes(horas, mes)
  const nocMes = filtrarMes(noc, mes)
  const alimMes = filtrarMes(alim, mes)

  const totalKm = kmMes.reduce((s, r) => s + Number(r.km_total || 0), 0)
  const totalComb = kmMes.reduce((s, r) => s + Number(r.valor_combustivel || 0), 0)
  const totalBancoMin = horasMes.filter(h => h.tipo === 'normal').reduce((s, h) => s + Number(h.total_minutos || 0), 0)
  const totalNoc = nocMes.reduce((s, r) => s + Number(r.valor_dia || 0), 0)
  const totalAlim = alimMes.reduce((s, r) => s + Number(r.valor || 0), 0)

  if (loading) return <Loader />

  return (
    <div className="fade-in">
      <PageHeader
        title={isAdm ? 'Todos os Lançamentos' : 'Meus Lançamentos'}
        subtitle="Gerencie seus registros de reembolso"
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', fontSize: '13px', background: 'var(--white)' }} />
            {!isAdm && (
              <Btn variant="primary" onClick={() => setModalOpen(true)}>
                <i className="ti ti-plus" /> Novo Lançamento
              </Btn>
            )}
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Combustível" value={fmt(totalComb)} icon="ti-gas-station" sub={`${totalKm.toFixed(0)} km rodados`} color="var(--amber)" />
        <StatCard label="Banco de Horas" value={fmtH(totalBancoMin)} icon="ti-clock" sub="Acumulado no mês" color="var(--purple)" />
        <StatCard label="NOC" value={fmt(totalNoc)} icon="ti-moon" sub={`${nocMes.length} dia(s)`} color="var(--red)" />
        <StatCard label="Alimentação" value={fmt(totalAlim)} icon="ti-fork" sub={`${alimMes.length} registro(s)`} color="var(--green)" />
      </div>

      <Card padding="0">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '14px 16px', border: 'none', background: 'transparent',
              cursor: 'pointer', fontSize: '13px', fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--g7-navy)' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--g7-navy)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 0.15s',
            }}>
              <i className={`ti ${t.icon}`} style={{ fontSize: '16px' }} />
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '4px 0' }}>
          {tab === 'km' && (
            <DataTable
              columns={[
                ...(isAdm ? [{ label: 'Técnico', render: r => getNome(r.user_id) }] : []),
                { label: 'Data', render: r => fmtDate(r.data) },
                { label: 'Cliente', key: 'cliente' },
                { label: 'Tipo', render: r => <Badge variant={r.tipo==='ida'?'blue':'amber'}>{r.tipo}</Badge> },
                { label: 'Partida', render: r => <span style={{maxWidth:'120px',display:'inline-block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.partida}</span> },
                { label: 'Destino', render: r => <span style={{maxWidth:'120px',display:'inline-block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.destino1}</span> },
                { label: 'Km', render: r => `${r.km_total} km`, align: 'right' },
                { label: 'Combustível', render: r => <span style={{fontWeight:500}}>{fmt(r.valor_combustivel)}</span>, align: 'right' },
                { label: 'Status', render: r => <StatusBadge status={r.status} /> },
                ...(isAdm ? [{ label: 'Ações', render: r => r.status === 'pendente' ? (
                  <div style={{display:'flex',gap:'4px'}}>
                    <Btn size="sm" variant="orange" onClick={()=>aprovar('lancamentos_km',r.id)}>✓</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>rejeitar('lancamentos_km',r.id)}>✕</Btn>
                  </div>
                ) : null }] : []),
              ]}
              rows={kmMes}
            />
          )}

          {tab === 'hora' && (
            <>
              <div style={{padding:'16px 16px 0'}}>
                <Alert variant="info">Horas do tipo <strong>Normal</strong> acumulam no banco de horas. Para NOC, use a aba NOC.</Alert>
              </div>
              <DataTable
                columns={[
                  ...(isAdm ? [{ label: 'Técnico', render: r => getNome(r.user_id) }] : []),
                  { label: 'Data', render: r => fmtDate(r.data) },
                  { label: 'Cliente', key: 'cliente' },
                  { label: 'Modalidade', render: r => <Badge variant={r.modalidade==='remoto'?'purple':'blue'}>{r.modalidade}</Badge> },
                  { label: 'Início', key: 'hora_inicio' },
                  { label: 'Término', key: 'hora_termino' },
                  { label: 'Total', render: r => <span style={{fontWeight:500,color:'var(--purple)'}}>{fmtH(r.total_minutos)}</span> },
                  { label: 'Chamado', render: r => r.chamado_numero || '—' },
                  { label: 'Status', render: r => <StatusBadge status={r.status} /> },
                  ...(isAdm ? [{ label: 'Ações', render: r => r.status === 'pendente' ? (
                    <div style={{display:'flex',gap:'4px'}}>
                      <Btn size="sm" variant="orange" onClick={()=>aprovar('lancamentos_horas',r.id)}>✓</Btn>
                      <Btn size="sm" variant="danger" onClick={()=>rejeitar('lancamentos_horas',r.id)}>✕</Btn>
                    </div>
                  ) : null }] : []),
                ]}
                rows={horasMes}
              />
            </>
          )}

          {tab === 'noc' && (
            <>
              <div style={{padding:'16px 16px 0'}}>
                <Alert variant="warning">Plantões NOC são pagos diretamente — <strong>R$ 175,00 por dia</strong> — e não entram no banco de horas.</Alert>
              </div>
              <DataTable
                columns={[
                  ...(isAdm ? [{ label: 'Técnico', render: r => getNome(r.user_id) }] : []),
                  { label: 'Data', render: r => fmtDate(r.data) },
                  { label: 'Cliente', key: 'cliente' },
                  { label: 'Início', key: 'hora_inicio' },
                  { label: 'Término', key: 'hora_termino' },
                  { label: 'Valor', render: r => <span style={{fontWeight:600,color:'var(--red)'}}>{fmt(r.valor_dia)}</span>, align: 'right' },
                  { label: 'Autorizado por', render: r => r.autorizado_por || '—' },
                  { label: 'Status', render: r => <StatusBadge status={r.status} /> },
                  ...(isAdm ? [{ label: 'Ações', render: r => r.status === 'pendente' ? (
                    <div style={{display:'flex',gap:'4px'}}>
                      <Btn size="sm" variant="orange" onClick={()=>aprovar('lancamentos_noc',r.id)}>✓</Btn>
                      <Btn size="sm" variant="danger" onClick={()=>rejeitar('lancamentos_noc',r.id)}>✕</Btn>
                    </div>
                  ) : null }] : []),
                ]}
                rows={nocMes}
              />
            </>
          )}

          {tab === 'alim' && (
            <DataTable
              columns={[
                ...(isAdm ? [{ label: 'Técnico', render: r => getNome(r.user_id) }] : []),
                { label: 'Data', render: r => fmtDate(r.data) },
                { label: 'Cliente', key: 'cliente' },
                { label: 'Valor', render: r => <span style={{fontWeight:500}}>{fmt(r.valor)}</span>, align: 'right' },
                { label: 'Descrição', render: r => r.descricao || '—' },
                { label: 'Nota Fiscal', render: () => <Badge variant="green"><i className="ti ti-paperclip" style={{fontSize:'11px'}} /> Ver NF</Badge> },
                { label: 'Status', render: r => <StatusBadge status={r.status} /> },
                ...(isAdm ? [{ label: 'Ações', render: r => r.status === 'pendente' ? (
                  <div style={{display:'flex',gap:'4px'}}>
                    <Btn size="sm" variant="orange" onClick={()=>aprovar('lancamentos_alimentacao',r.id)}>✓</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>rejeitar('lancamentos_alimentacao',r.id)}>✕</Btn>
                  </div>
                ) : null }] : []),
              ]}
              rows={alimMes}
            />
          )}
        </div>
      </Card>

      <NovoLancamentoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { loadAll(); setModalOpen(false) }}
      />
    </div>
  )
}
