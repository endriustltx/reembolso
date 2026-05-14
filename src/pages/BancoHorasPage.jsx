import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Card, StatCard, Badge, DataTable, Loader, PageHeader, Alert } from '../components/UI'

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
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))

  useEffect(() => { loadData() }, [mes, profile])

  async function loadData() {
    setLoading(true)
    const [y, m] = mes.split('-')
    const start = `${y}-${m}-01`
    const end = `${y}-${m}-31`

    if (isAdm) {
      // ADM: todos os colaboradores
      const { data: profs } = await supabase.from('profiles').select('*').eq('role', 'tecnico')
      const { data: h } = await supabase.from('lancamentos_horas').select('*, profiles(nome)').gte('data', start).lte('data', end).order('data', { ascending: false })
      const { data: n } = await supabase.from('lancamentos_noc').select('*, profiles(nome)').gte('data', start).lte('data', end).order('data', { ascending: false })
      setColaboradores(profs || [])
      setHoras(h || [])
      setNoc(n || [])
    } else {
      const { data: h } = await supabase.from('lancamentos_horas').select('*').eq('user_id', profile?.id).gte('data', start).lte('data', end).order('data', { ascending: false })
      const { data: n } = await supabase.from('lancamentos_noc').select('*').eq('user_id', profile?.id).gte('data', start).lte('data', end).order('data', { ascending: false })
      setHoras(h || [])
      setNoc(n || [])
    }
    setLoading(false)
  }

  const bancoMin = horas.filter(h => h.tipo === 'normal' && h.status === 'aprovado').reduce((s, h) => s + Number(h.total_minutos || 0), 0)
  const totalNoc = noc.filter(n => n.status === 'aprovado').reduce((s, n) => s + Number(n.valor_dia || 0), 0)
  const pendentes = [...horas, ...noc].filter(h => h.status === 'pendente').length

  if (loading) return <Loader />

  return (
    <div className="fade-in">
      <PageHeader
        title="Banco de Horas e NOC"
        subtitle="Controle de horas acumuladas e pagamentos NOC"
        actions={
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', fontSize: '13px', background: 'var(--white)' }} />
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <StatCard label="Banco de Horas" value={fmtH(bancoMin)} icon="ti-clock" sub="Horas aprovadas" color="var(--purple)" />
        <StatCard label="NOC a Pagar" value={fmt(totalNoc)} icon="ti-moon" sub="Aprovados" color="var(--red)" />
        <StatCard label="Pendentes" value={pendentes} icon="ti-hourglass" sub="Aguardando aprovação" color="var(--amber)" />
      </div>

      {/* ADM: visão consolidada por colaborador */}
      {isAdm && colaboradores.length > 0 && (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g7-navy)', marginBottom: '16px' }}>
            Resumo por Colaborador
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
              { label: 'Banco de Horas', align: 'center', render: r => {
                const min = horas.filter(h => h.user_id === r.id && h.tipo === 'normal' && h.status === 'aprovado').reduce((s,h) => s + Number(h.total_minutos||0), 0)
                return <span style={{fontWeight:500,color:'var(--purple)'}}>{fmtH(min)}</span>
              }},
              { label: 'Horas Pendentes', align: 'center', render: r => {
                const pend = horas.filter(h => h.user_id === r.id && h.status === 'pendente').length
                return pend > 0 ? <Badge variant="amber">{pend} pendente{pend>1?'s':''}</Badge> : <span style={{color:'var(--text-muted)'}}>—</span>
              }},
              { label: 'NOC Aprovado', align: 'right', render: r => {
                const total = noc.filter(n => n.user_id === r.id && n.status === 'aprovado').reduce((s,n) => s + Number(n.valor_dia||0), 0)
                return total > 0 ? <span style={{fontWeight:600,color:'var(--red)'}}>{fmt(total)}</span> : <span style={{color:'var(--text-muted)'}}>—</span>
              }},
              { label: 'NOC Pendente', align: 'center', render: r => {
                const pend = noc.filter(n => n.user_id === r.id && n.status === 'pendente').length
                return pend > 0 ? <Badge variant="amber">{pend} pendente{pend>1?'s':''}</Badge> : <span style={{color:'var(--text-muted)'}}>—</span>
              }},
              { label: 'Total NOC', align: 'right', render: r => {
                const total = noc.filter(n => n.user_id === r.id).reduce((s,n) => s + Number(n.valor_dia||0), 0)
                return total > 0 ? <span style={{fontWeight:600}}>{fmt(total)}</span> : '—'
              }},
            ]}
            rows={colaboradores}
          />
        </Card>
      )}

      {/* Detalhamento horas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g7-navy)', marginBottom: '16px', display:'flex',alignItems:'center',gap:'8px' }}>
            <i className="ti ti-clock" style={{ color: 'var(--purple)' }} /> Horas (Banco)
          </div>
          <DataTable
            columns={[
              ...(isAdm ? [{ label: 'Técnico', render: r => r.profiles?.nome?.split(' ')[0] || '—' }] : []),
              { label: 'Data', render: r => fmtDate(r.data) },
              { label: 'Cliente', key: 'cliente' },
              { label: 'Total', render: r => <span style={{fontWeight:500,color:'var(--purple)'}}>{fmtH(r.total_minutos)}</span> },
              { label: 'Status', render: r => <Badge variant={r.status==='aprovado'?'green':r.status==='rejeitado'?'red':'amber'}>{r.status}</Badge> },
            ]}
            rows={horas.filter(h => h.tipo === 'normal')}
            emptyMessage="Nenhuma hora registrada"
          />
        </Card>

        <Card>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g7-navy)', marginBottom: '16px', display:'flex',alignItems:'center',gap:'8px' }}>
            <i className="ti ti-moon" style={{ color: 'var(--red)' }} /> NOC (Pagamento)
          </div>
          <Alert variant="warning" style={{ marginBottom: '12px' }}>
            R$ 175,00 por dia • não entra no banco de horas
          </Alert>
          <DataTable
            columns={[
              ...(isAdm ? [{ label: 'Técnico', render: r => r.profiles?.nome?.split(' ')[0] || '—' }] : []),
              { label: 'Data', render: r => fmtDate(r.data) },
              { label: 'Cliente', key: 'cliente' },
              { label: 'Valor', render: r => <span style={{fontWeight:600,color:'var(--red)'}}>{fmt(r.valor_dia)}</span>, align: 'right' },
              { label: 'Status', render: r => <Badge variant={r.status==='aprovado'?'green':r.status==='rejeitado'?'red':'amber'}>{r.status}</Badge> },
            ]}
            rows={noc}
            emptyMessage="Nenhum NOC registrado"
          />
        </Card>
      </div>
    </div>
  )
}
