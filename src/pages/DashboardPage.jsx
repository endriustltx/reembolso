import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { StatCard, Card, Badge, StatusBadge, DataTable, Loader, PageHeader, Btn } from '../components/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const fmt = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtH = min => `${Math.floor((min || 0) / 60)}h ${String((min || 0) % 60).padStart(2, '0')}m`

export default function DashboardPage({ onNavigate }) {
  const [resumo, setResumo] = useState([])
  const [recentes, setRecentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))

  useEffect(() => { loadData() }, [mes])

  async function loadData() {
    setLoading(true)
    // Busca resumo por colaborador (view)
    const { data: r } = await supabase
      .from('resumo_colaboradores')
      .select('*')
    setResumo(r || [])

    // Lançamentos recentes (todos os tipos)
    const { data: km } = await supabase
      .from('lancamentos_km')
      .select('*, profiles(nome)')
      .order('criado_em', { ascending: false })
      .limit(5)
    setRecentes(km || [])
    setLoading(false)
  }

  async function aprovar(tabela, id) {
    await supabase.from(tabela).update({ status: 'aprovado' }).eq('id', id)
    loadData()
  }

  const totalGeral = resumo.reduce((s, r) => s + Number(r.total_combustivel || 0) + Number(r.total_noc || 0) + Number(r.total_alimentacao || 0), 0)
  const totalNoc = resumo.reduce((s, r) => s + Number(r.total_noc || 0), 0)
  const totalComb = resumo.reduce((s, r) => s + Number(r.total_combustivel || 0), 0)
  const totalBancoMin = resumo.reduce((s, r) => s + Number(r.banco_horas_minutos || 0), 0)

  const chartData = resumo.map(r => ({
    nome: r.nome.split(' ')[0],
    combustivel: Number(r.total_combustivel || 0),
    noc: Number(r.total_noc || 0),
    alimentacao: Number(r.total_alimentacao || 0),
  }))

  if (loading) return <Loader />

  return (
    <div className="fade-in">
      <PageHeader
        title="Dashboard Geral"
        subtitle="Visão consolidada de todos os colaboradores"
        actions={
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', fontSize: '13px', background: 'var(--white)', cursor: 'pointer' }} />
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <StatCard label="Total Geral" value={fmt(totalGeral)} icon="ti-cash" sub={`${resumo.length} colaboradores`} color="var(--g7-navy)" />
        <StatCard label="Banco de Horas" value={fmtH(totalBancoMin)} icon="ti-clock" sub="Horas acumuladas" color="var(--purple)" />
        <StatCard label="Combustível" value={fmt(totalComb)} icon="ti-gas-station" sub="Total viagens" color="var(--amber)" />
        <StatCard label="NOC (Pagamento)" value={fmt(totalNoc)} icon="ti-moon" sub="R$ 175,00/dia" color="var(--red)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Gráfico */}
        <Card>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g7-navy)', marginBottom: '16px' }}>Reembolso por Colaborador</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={20}>
              <XAxis dataKey="nome" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }} />
              <Bar dataKey="combustivel" name="Combustível" fill="#FBBF24" radius={[4,4,0,0]} />
              <Bar dataKey="noc" name="NOC" fill="#F87171" radius={[4,4,0,0]} />
              <Bar dataKey="alimentacao" name="Alimentação" fill="#34D399" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Resumo colaboradores */}
        <Card>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g7-navy)', marginBottom: '16px' }}>Resumo por Colaborador</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {resumo.map(r => {
              const total = Number(r.total_combustivel||0)+Number(r.total_noc||0)+Number(r.total_alimentacao||0)
              const initials = r.nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
              return (
                <div key={r.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:'34px',height:'34px',borderRadius:'50%',background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:600,color:'var(--text-secondary)',flexShrink:0 }}>{initials}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'13px',fontWeight:500,color:'var(--text-primary)' }}>{r.nome}</div>
                    <div style={{ fontSize:'11px',color:'var(--text-muted)',marginTop:'2px' }}>
                      Banco: {fmtH(r.banco_horas_minutos)} · NOC: {fmt(r.total_noc)}
                    </div>
                  </div>
                  <div style={{ fontSize:'14px',fontWeight:600,color:'var(--g7-navy)',fontVariantNumeric:'tabular-nums' }}>{fmt(total)}</div>
                </div>
              )
            })}
            {resumo.length === 0 && <p style={{ fontSize:'13px',color:'var(--text-muted)',textAlign:'center',padding:'20px 0' }}>Nenhum dado encontrado para o período.</p>}
          </div>
        </Card>
      </div>

      {/* Lançamentos recentes */}
      <Card>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px' }}>
          <div style={{ fontSize:'14px',fontWeight:600,color:'var(--g7-navy)' }}>Últimos Lançamentos de Km</div>
          <Btn variant="ghost" size="sm" onClick={() => onNavigate('todos-lancamentos')}>Ver todos <i className="ti ti-arrow-right" /></Btn>
        </div>
        <DataTable
          columns={[
            { label: 'Técnico', key: 'profiles', render: r => r.profiles?.nome || '—' },
            { label: 'Data', render: r => new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR') },
            { label: 'Cliente', key: 'cliente' },
            { label: 'Tipo', render: r => <Badge variant={r.tipo==='ida'?'blue':'amber'}>{r.tipo}</Badge> },
            { label: 'Km', render: r => `${r.km_total} km`, align: 'right' },
            { label: 'Valor', render: r => <span style={{fontWeight:500,fontVariantNumeric:'tabular-nums'}}>{fmt(r.valor_combustivel)}</span>, align: 'right' },
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
