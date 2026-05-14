import { useState, useEffect } from 'react'
import { supabase, getNFUrl } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Card, Badge, DataTable, Loader, PageHeader, Btn, Alert } from '../components/UI'

const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
const fmtSize = b => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`

const tipoLabel = { km: 'Combustível', horas: 'Horas', noc: 'NOC', alimentacao: 'Alimentação' }
const tipoVariant = { km: 'amber', horas: 'purple', noc: 'red', alimentacao: 'green' }

export default function NotasFiscaisPage() {
  const { profile, isAdm } = useAuth()
  const [nfs, setNfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { loadNFs() }, [profile])

  async function loadNFs() {
    setLoading(true)
    let q = supabase.from('notas_fiscais').select('*, profiles(nome)').order('criado_em', { ascending: false })
    if (!isAdm) q = q.eq('user_id', profile?.id)
    const { data } = await q
    setNfs(data || [])
    setLoading(false)
  }

  async function visualizarNF(path) {
    const url = await getNFUrl(path)
    if (url) window.open(url, '_blank')
  }

  if (loading) return <Loader />

  return (
    <div className="fade-in">
      <PageHeader
        title="Notas Fiscais"
        subtitle="Documentos anexados aos seus lançamentos"
      />

      <Alert variant="info" style={{ marginBottom: '20px' }}>
        As notas fiscais são anexadas diretamente ao criar cada lançamento. Para adicionar uma NF a um lançamento existente, edite o lançamento correspondente.
      </Alert>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {['km','horas','noc','alimentacao'].map(tipo => {
          const count = nfs.filter(n => n.lancamento_tipo === tipo).length
          return (
            <div key={tipo} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', display:'flex',alignItems:'center',gap:'12px' }}>
              <div style={{ width:'36px',height:'36px',borderRadius:'var(--radius-md)',background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0 }}>
                {tipo==='km'?'⛽':tipo==='horas'?'⏰':tipo==='noc'?'🌙':'🍽️'}
              </div>
              <div>
                <div style={{ fontSize:'20px',fontWeight:600,color:'var(--g7-navy)' }}>{count}</div>
                <div style={{ fontSize:'12px',color:'var(--text-muted)' }}>{tipoLabel[tipo]}</div>
              </div>
            </div>
          )
        })}
      </div>

      <Card padding="0">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g7-navy)' }}>
            Todas as Notas Fiscais ({nfs.length})
          </div>
        </div>

        {nfs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px', color:'var(--text-muted)' }}>
            <i className="ti ti-file-off" style={{ fontSize:'40px', display:'block', marginBottom:'12px', opacity:0.4 }} />
            <div style={{ fontSize:'14px' }}>Nenhuma nota fiscal encontrada</div>
            <div style={{ fontSize:'12px', marginTop:'6px' }}>Anexe NFs ao criar novos lançamentos</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px', padding:'16px' }}>
            {nfs.map(nf => {
              const isImage = nf.mime_type?.startsWith('image/')
              const isPdf = nf.mime_type === 'application/pdf'
              return (
                <div key={nf.id} style={{
                  background:'var(--surface)',
                  border:'1px solid var(--border)',
                  borderRadius:'var(--radius-md)',
                  padding:'14px',
                  cursor:'pointer',
                  transition:'all 0.15s',
                }} onClick={() => visualizarNF(nf.caminho_storage)}
                   onMouseEnter={e => { e.currentTarget.style.borderColor='var(--g7-navy)'; e.currentTarget.style.background='var(--white)' }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--surface)' }}>
                  <div style={{ display:'flex',alignItems:'flex-start',gap:'12px' }}>
                    <div style={{ fontSize:'28px', flexShrink:0 }}>{isPdf ? '📄' : isImage ? '🖼️' : '📎'}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:'13px',fontWeight:500,color:'var(--text-primary)',wordBreak:'break-word',lineHeight:1.3 }}>
                        {nf.nome_arquivo}
                      </div>
                      <div style={{ fontSize:'11px',color:'var(--text-muted)',marginTop:'4px' }}>
                        {fmtDate(nf.criado_em)} · {fmtSize(nf.tamanho_bytes || 0)}
                      </div>
                      <div style={{ display:'flex',alignItems:'center',gap:'6px',marginTop:'8px' }}>
                        <Badge variant={tipoVariant[nf.lancamento_tipo] || 'default'}>
                          {tipoLabel[nf.lancamento_tipo] || nf.lancamento_tipo}
                        </Badge>
                        {isAdm && nf.profiles && (
                          <span style={{ fontSize:'11px',color:'var(--text-muted)' }}>{nf.profiles.nome.split(' ')[0]}</span>
                        )}
                      </div>
                    </div>
                    <i className="ti ti-external-link" style={{ fontSize:'16px',color:'var(--text-muted)',flexShrink:0 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
