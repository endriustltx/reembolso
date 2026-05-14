import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, StatCard, DataTable, Loader, PageHeader, Btn, Badge } from '../components/UI'

const fmt = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtH = min => `${Math.floor((min||0)/60)}h ${String((min||0)%60).padStart(2,'0')}m`

export default function RelatorioPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))

  useEffect(() => { load() }, [mes])

  async function load() {
    setLoading(true)
    const [y, m] = mes.split('-')
    const start = `${y}-${m}-01`
    const end = `${y}-${m}-31`

    const { data: profs } = await supabase.from('profiles').select('*').eq('role','tecnico').eq('ativo',true)
    if (!profs) { setLoading(false); return }

    const results = await Promise.all(profs.map(async p => {
      const [rKm, rH, rNoc, rAlim] = await Promise.all([
        supabase.from('lancamentos_km').select('*').eq('user_id',p.id).gte('data',start).lte('data',end),
        supabase.from('lancamentos_horas').select('*').eq('user_id',p.id).gte('data',start).lte('data',end).eq('tipo','normal'),
        supabase.from('lancamentos_noc').select('*').eq('user_id',p.id).gte('data',start).lte('data',end),
        supabase.from('lancamentos_alimentacao').select('*').eq('user_id',p.id).gte('data',start).lte('data',end),
      ])
      const km = rKm.data || []
      const horas = rH.data || []
      const noc = rNoc.data || []
      const alim = rAlim.data || []

      return {
        id: p.id,
        nome: p.nome,
        email: p.email,
        total_km: km.reduce((s,r) => s+Number(r.km_total||0), 0),
        total_combustivel: km.reduce((s,r) => s+Number(r.valor_combustivel||0), 0),
        total_estacionamento: km.reduce((s,r) => s+Number(r.estacionamento||0), 0),
        banco_horas_min: horas.filter(h=>h.status==='aprovado').reduce((s,h) => s+Number(h.total_minutos||0), 0),
        noc_aprovado: noc.filter(n=>n.status==='aprovado').reduce((s,n) => s+Number(n.valor_dia||0), 0),
        noc_pendente: noc.filter(n=>n.status==='pendente').reduce((s,n) => s+Number(n.valor_dia||0), 0),
        total_alimentacao: alim.filter(a=>a.status==='aprovado').reduce((s,a) => s+Number(a.valor||0), 0),
        nf_count: 0,
        km_lancamentos: km.length,
        noc_dias: noc.filter(n=>n.status==='aprovado').length,
      }
    }))

    setData(results)
    setLoading(false)
  }

  function exportCSV() {
    const [y,m] = mes.split('-')
    const mesLabel = new Date(`${y}-${m}-15`).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
    const header = ['Técnico','Email','Km Total','Combustível','Estacionamento','Banco Horas','NOC Aprovado','NOC Pendente','Alimentação','Total']
    const rows = data.map(d => [
      d.nome, d.email,
      d.total_km.toFixed(1),
      d.total_combustivel.toFixed(2),
      d.total_estacionamento.toFixed(2),
      fmtH(d.banco_horas_min),
      d.noc_aprovado.toFixed(2),
      d.noc_pendente.toFixed(2),
      d.total_alimentacao.toFixed(2),
      (d.total_combustivel+d.noc_aprovado+d.total_alimentacao+d.total_estacionamento).toFixed(2),
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `reembolso_gate7_${y}_${m}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const grandTotal = data.reduce((s,d) => s+d.total_combustivel+d.noc_aprovado+d.total_alimentacao+d.total_estacionamento, 0)
  const totalNoc = data.reduce((s,d) => s+d.noc_aprovado, 0)
  const totalBanco = data.reduce((s,d) => s+d.banco_horas_min, 0)

  if (loading) return <Loader />

  return (
    <div className="fade-in">
      <PageHeader
        title="Relatório Mensal"
        subtitle="Consolidado completo de todos os colaboradores"
        actions={
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)}
              style={{ padding:'7px 12px', border:'1px solid var(--border-strong)', borderRadius:'var(--radius-md)', fontSize:'13px', background:'var(--white)' }} />
            <Btn variant="primary" onClick={exportCSV}>
              <i className="ti ti-download" /> Exportar CSV
            </Btn>
          </div>
        }
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'24px' }}>
        <StatCard label="Total a Reembolsar" value={fmt(grandTotal)} icon="ti-cash" sub="Itens aprovados" color="var(--g7-navy)" />
        <StatCard label="Total NOC" value={fmt(totalNoc)} icon="ti-moon" sub="Pagamento direto" color="var(--red)" />
        <StatCard label="Banco de Horas" value={fmtH(totalBanco)} icon="ti-clock" sub="Total acumulado" color="var(--purple)" />
      </div>

      <Card padding="0">
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ fontSize:'14px',fontWeight:600,color:'var(--g7-navy)' }}>
            Detalhamento por Colaborador
          </div>
          <div style={{ fontSize:'12px',color:'var(--text-muted)' }}>
            {new Date(`${mes}-15`).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}
          </div>
        </div>
        <DataTable
          columns={[
            { label: 'Técnico', render: r => {
              const initials = r.nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
              return (
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:600,color:'var(--text-secondary)'}}>
                    {initials}
                  </div>
                  <div>
                    <div style={{fontWeight:500}}>{r.nome}</div>
                    <div style={{fontSize:'11px',color:'var(--text-muted)'}}>{r.email}</div>
                  </div>
                </div>
              )
            }},
            { label: 'Km', render: r => r.total_km > 0 ? `${r.total_km.toFixed(0)} km` : '—', align:'right' },
            { label: 'Combustível', render: r => r.total_combustivel>0 ? <span style={{fontWeight:500}}>{fmt(r.total_combustivel)}</span> : '—', align:'right' },
            { label: 'Banco h.', render: r => r.banco_horas_min>0 ? <span style={{color:'var(--purple)',fontWeight:500}}>{fmtH(r.banco_horas_min)}</span> : '—', align:'center' },
            { label: 'NOC', render: r => (
              <div style={{textAlign:'right'}}>
                {r.noc_aprovado>0 && <div style={{fontWeight:600,color:'var(--red)'}}>{fmt(r.noc_aprovado)}</div>}
                {r.noc_pendente>0 && <Badge variant="amber">+{fmt(r.noc_pendente)} pend.</Badge>}
                {r.noc_aprovado===0&&r.noc_pendente===0 && '—'}
              </div>
            ), align:'right'},
            { label: 'Alimentação', render: r => r.total_alimentacao>0 ? fmt(r.total_alimentacao) : '—', align:'right' },
            { label: 'Total', render: r => {
              const t = r.total_combustivel+r.noc_aprovado+r.total_alimentacao+r.total_estacionamento
              return <span style={{fontWeight:700,fontSize:'14px',color:'var(--g7-navy)'}}>{t>0?fmt(t):'—'}</span>
            }, align:'right'},
          ]}
          rows={data}
          emptyMessage="Nenhum dado para o período selecionado"
        />

        {/* Totais */}
        {data.length > 0 && (
          <div style={{ padding:'14px 20px', background:'var(--g7-navy)', borderRadius:'0 0 var(--radius-lg) var(--radius-lg)', display:'flex',justifyContent:'flex-end',gap:'32px' }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'11px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.05em' }}>Total Combustível</div>
              <div style={{ fontSize:'15px',fontWeight:600,color:'#fff' }}>{fmt(data.reduce((s,d)=>s+d.total_combustivel+d.total_estacionamento,0))}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'11px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.05em' }}>Total NOC</div>
              <div style={{ fontSize:'15px',fontWeight:600,color:'#F87171' }}>{fmt(totalNoc)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'11px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.05em' }}>Total Alimentação</div>
              <div style={{ fontSize:'15px',fontWeight:600,color:'#fff' }}>{fmt(data.reduce((s,d)=>s+d.total_alimentacao,0))}</div>
            </div>
            <div style={{ textAlign:'right', borderLeft:'1px solid rgba(255,255,255,0.15)', paddingLeft:'32px' }}>
              <div style={{ fontSize:'11px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.05em' }}>TOTAL GERAL</div>
              <div style={{ fontSize:'20px',fontWeight:700,color:'#F56E0F' }}>{fmt(grandTotal)}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
