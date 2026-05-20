import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { StatCard, Card, Badge, StatusBadge, DataTable, Loader, PageHeader, Btn } from '../components/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const fmt = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtH = min => `${Math.floor((min || 0) / 60)}h ${String((min || 0) % 60).padStart(2, '0')}m`

export default function DashboardPage({ onNavigate }) {
  const [colaboradores, setColaboradores] = useState([])
  const [resumo, setResumo] = useState([])
  const [recentes, setRecentes] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))

  useEffect(() => { loadData() }, [mes])

  async function loadData() {
    setLoading(true)

    // Buscar colaboradores
    const { data: profs } = await supabase.from('profiles').select('id, nome, email').eq('role', 'tecnico').eq('ativo', true)
    const profList = profs || []
    const map = {}
    profList.forEach(p => { map[p.id] = p.nome })
    setProfiles(map)
    setColaboradores(profList)

    // Buscar todos os lançamentos do mês — filtrar no JS para evitar problema com coluna 'data'
    const [rKm, rNoc, rAlim, rHoras] = await Promise.all([
      supabase.from('lancamentos_km').select('*').eq('status', 'aprovado'),
      supabase.from('lancamentos_noc').select('*').eq('status', 'aprovado'),
      supabase.from('lancamentos_alimentacao').select('*').eq('status', 'aprovado'),
      supabase.from('lancamentos_horas').select('*').eq('status', 'aprovado').eq('tipo', 'normal'),
    ])

    const kmMes = (rKm.data || []).filter(r => r.data?.startsWith(mes))
    const nocMes = (rNoc.data || []).filter(r => r.data?.startsWith(mes))
    const alimMes = (rAlim.data || []).filter(r => r.data?.startsWith(mes))
    const horasMes = (rHoras.data || []).filter(r => r.data?.startsWith(mes))

    // Montar resumo por colaborador
    const resumoPorColab = profList.map(p => {
      const totalComb = kmMes.filter(k => k.user_id === p.id).reduce((s, k) => s + Number(k.valor_combustivel || 0), 0)
      const totalNoc = nocMes.filter(n => n.user_id === p.id).reduce((s, n) => s + Number(n.valor_dia || 0), 0)
      const totalAlim = alimMes.filter(a => a.user_id === p.id).reduce((s, a) => s + Number(a.valor || 0), 0)
      const bancoMin = horasMes.filter(h => h.user_id === p.id).reduce((s, h) => s + Number(h.total_minutos || 0), 0)
      return { ...p, total_combustivel: totalComb, total_noc: totalNoc, total_alimentacao: totalAlim, banco_horas_minutos: bancoMin }
    }).filter(r => r.total_combustivel + r.total_noc + r.total_alimentacao + r.banco_horas_minutos > 0 || true)

    setResumo(resumoPorColab)

    // Lançamentos recentes de km
    const { data: km } = await supabase.from('lancamentos_km').select('*').order('criado_em', { ascending: false }).limit(5)
    setRecentes(km || [])
    setLoading(false)
  }

  async function aprovar(tabela, id) {
    await supabase.from(tabela).update({ status: 'aprovado' }).eq('id', id)
    loadData()
  }

  const totalGeral = resumo.reduce((s, r) => s + r.total_combustivel + r.total_noc + r.total_alimentacao, 0)
  const totalNoc = resumo.reduce((s, r) => s + r.total_noc, 0)
  const totalComb = resumo.reduce((s, r) => s + r.total_combustivel, 0)
  const totalBancoMin = resumo.reduce((s, r) => s + r.banco_horas_minutos, 0)

  const chartData = resumo
    .filter(r => r.total_combustivel + r.total_noc + r.total_alimentacao > 0)
    .map(r => ({
      nome: r.nome.split(' ')[0],
      combustivel: r.total_combustivel,
      noc: r.total_noc,
      alimentacao: r.total_alimentacao,
    }))

  const [ano, mesNum] = mes.split('-')
  const mesLabel = new Date(`${ano}-${mesNum}-15`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (loading) return <Loader />

  return (
    <div className="fade-in">
      <PageHeader
        title="Dashboard Geral"
        subtitle={`Visão consolidada — ${mesLabel}`}
        actions={
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', fontSize: '13px', background: 'var(--white)', cursor: 'pointer' }} />
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <StatCard label="Total Geral" value={fmt(totalGeral)} icon="ti-cash" sub={`${colaboradores.length} colaboradores`} color="var(--g7-navy)" />
        <StatCard label="Banco de Horas" value={fmtH(totalBancoMin)} icon="ti-clock" sub="Horas acumuladas" color="var(--purple)" />
        <StatCard label="Combustível" value={fmt(totalComb)} icon="ti-gas-station" sub="Total viagens" color="var(--amber)" />
        <StatCard label="NOC (Pagamento)" value={fmt(totalNoc)} icon="ti-moon" sub="R$ 175,00/dia" color="var(--red)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g7-navy)', marginBottom: '16px' }}>Reembolso por Colaborador</div>
          {chartData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              Nenhum reembolso aprovado em {mesLabel}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={20}>
                <XAxis dataKey="nome" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }} />
                <Bar dataKey="combustivel" name="Combustível" fill="#FBBF24" radius={[4,4,0,0]} />
                <Bar dataKey="noc" name="NOC" fill="#F87171" radius={[4,4,0,0]} />
                <Bar dataKey="alimentacao" name="Alimentação" fill="#34D399" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g7-navy)', marginBottom: '4px' }}>Resumo por Colaborador</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>Clique para ver os lançamentos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '280px', overflowY: 'auto' }}>
            {resumo.map(r => {
              const total = r.total_combustivel + r.total_noc + r.total_alimentacao
              const initials = r.nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
              return (
                <div
                  key={r.id}
                  onClick={() => onNavigate('todos-lancamentos', r.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:'12px',
                    padding:'10px', borderRadius:'var(--radius-md)',
                    cursor:'pointer', transition:'background 0.15s',
                    borderBottom:'1px solid var(--border)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <div style={{ width:'36px',height:'36px',borderRadius:'50%',background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:600,color:'var(--text-secondary)',flexShrink:0 }}>{initials}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'13px',fontWeight:500,color:'var(--text-primary)' }}>{r.nome}</div>
                    <div style={{ fontSize:'11px',color:'var(--text-muted)',marginTop:'2px' }}>
                      Banco: {fmtH(r.banco_horas_minutos)} · NOC: {fmt(r.total_noc)}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ fontSize:'14px',fontWeight:600,color: total > 0 ? 'var(--g7-navy)' : 'var(--text-muted)',fontVariantNumeric:'tabular-nums' }}>{fmt(total)}</div>
                    <i className="ti ti-chevron-right" style={{ fontSize:'14px', color:'var(--text-muted)' }} />
                  </div>
                </div>
              )
            })}
            {resumo.length === 0 && <p style={{ fontSize:'13px',color:'var(--text-muted)',textAlign:'center',padding:'20px 0' }}>Nenhum dado encontrado.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px' }}>
          <div style={{ fontSize:'14px',fontWeight:600,color:'var(--g7-navy)' }}>Últimos Lançamentos de Km</div>
          <Btn variant="ghost" size="sm" onClick={() => onNavigate('todos-lancamentos')}>Ver todos <i className="ti ti-arrow-right" /></Btn>
        </div>
        <DataTable
          columns={[
            { label: 'Técnico', render: r => profiles[r.user_id] || '—' },
            { label: 'Data', render: r => new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR') },
            { label: 'Cliente', key: 'cliente' },
            { label: 'Tipo', render: r => <Badge variant={r.tipo==='ida'?'blue':'amber'}>{r.tipo}</Badge> },
            { label: 'Km', render: r => `${r.km_total} km`, align: 'right' },
            { label: 'Valor', render: r => <span style={{fontWeight:500}}>{fmt(r.valor_combustivel)}</span>, align: 'right' },
            { label: 'Status', render: r => <StatusBadge status={r.status} /> },
            { label: '', render: r => r.status==='pendente' ? (
              <Btn size="sm" variant="orange" onClick={() => aprovar('lancamentos_km', r.id)}>Aprovar</Btn>
            ) : null },
          ]}
          rows={recentes}
          emptyMessage="Nenhum lançamento recente"
        />
      </Card>
    </div>
  )
}
