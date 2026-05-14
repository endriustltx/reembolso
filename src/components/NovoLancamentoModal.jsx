import { useState } from 'react'
import { supabase, uploadNotaFiscal } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Modal, FormField, Input, Select, Textarea, Btn, Alert, UploadArea } from './UI'

const TIPOS = [
  { id: 'km',   label: 'Km / Combustível', icon: 'ti-gas-station', color: '#D97706' },
  { id: 'hora', label: 'Horas (Banco)',     icon: 'ti-clock',       color: '#7C3AED' },
  { id: 'noc',  label: 'NOC (Pagamento)',   icon: 'ti-moon',        color: '#DC2626' },
  { id: 'alim', label: 'Alimentação',       icon: 'ti-fork',        color: '#16A34A' },
]

export default function NovoLancamentoModal({ open, onClose, onSaved }) {
  const { profile } = useAuth()
  const [tipo, setTipo] = useState('km')
  const [form, setForm] = useState({})
  const [nfFile, setNfFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function reset() {
    setForm({})
    setNfFile(null)
    setError('')
    setTipo('km')
  }

  function handleClose() { reset(); onClose() }

  async function handleSave() {
    setError('')
    setLoading(true)
    try {
      let insertedId = null

      if (tipo === 'km') {
        if (!form.data || !form.cliente || !form.partida || !form.destino1 || !form.km_total) {
          throw new Error('Preencha todos os campos obrigatórios.')
        }
        const { data, error: e } = await supabase.from('lancamentos_km').insert({
          user_id: profile.id,
          data: form.data,
          cliente: form.cliente,
          tipo: form.tipo_viagem || 'ida',
          partida: form.partida,
          destino1: form.destino1,
          destino2: form.destino2 || null,
          destino_final: form.destino1,
          km_total: Number(form.km_total),
          valor_combustivel: form.valor_combustivel ? Number(form.valor_combustivel) : null,
          estacionamento: form.estacionamento ? Number(form.estacionamento) : 0,
          observacao: form.observacao || null,
        }).select().single()
        if (e) throw e
        insertedId = data.id

      } else if (tipo === 'hora') {
        if (!form.data || !form.cliente || !form.hora_inicio || !form.hora_termino) {
          throw new Error('Preencha todos os campos obrigatórios.')
        }
        const { data, error: e } = await supabase.from('lancamentos_horas').insert({
          user_id: profile.id,
          data: form.data,
          cliente: form.cliente,
          modalidade: form.modalidade || 'presencial',
          hora_inicio: form.hora_inicio,
          hora_termino: form.hora_termino,
          chamado_numero: form.chamado || null,
          tipo: 'normal',
          observacao: form.observacao || null,
        }).select().single()
        if (e) throw e
        insertedId = data.id

      } else if (tipo === 'noc') {
        if (!form.data || !form.cliente) throw new Error('Preencha data e cliente.')
        const { data, error: e } = await supabase.from('lancamentos_noc').insert({
          user_id: profile.id,
          data: form.data,
          cliente: form.cliente,
          hora_inicio: form.hora_inicio || '07:00',
          hora_termino: form.hora_termino || '19:00',
          valor_dia: 175.00,
          autorizado_por: form.autorizado || null,
          observacao: form.observacao || null,
        }).select().single()
        if (e) throw e
        insertedId = data.id

      } else if (tipo === 'alim') {
        if (!form.data || !form.cliente || !form.valor) throw new Error('Preencha todos os campos obrigatórios.')
        if (!nfFile) throw new Error('Nota fiscal é obrigatória para alimentação.')
        const { data, error: e } = await supabase.from('lancamentos_alimentacao').insert({
          user_id: profile.id,
          data: form.data,
          cliente: form.cliente,
          valor: Number(form.valor),
          descricao: form.descricao || null,
        }).select().single()
        if (e) throw e
        insertedId = data.id
      }

      // Upload NF se houver
      if (nfFile && insertedId) {
        await uploadNotaFiscal(nfFile, profile.id, tipo === 'hora' ? 'horas' : tipo === 'alim' ? 'alimentacao' : tipo, insertedId)
      }

      onSaved?.()
      handleClose()
    } catch (err) {
      setError(err.message || 'Erro ao salvar lançamento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Novo Lançamento" width="600px">
      {/* Seletor de tipo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
        {TIPOS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTipo(t.id); setForm({}); setNfFile(null) }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 8px',
              borderRadius: 'var(--radius-md)',
              border: tipo === t.id ? `2px solid ${t.color}` : '1px solid var(--border)',
              background: tipo === t.id ? `${t.color}12` : 'var(--surface)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              color: tipo === t.id ? t.color : 'var(--text-muted)',
            }}
          >
            <i className={`ti ${t.icon}`} style={{ fontSize: '20px' }} />
            <span style={{ fontSize: '11px', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Formulário por tipo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* KM */}
        {tipo === 'km' && <>
          <FormField label="Data" required><Input type="date" value={form.data||''} onChange={e=>set('data',e.target.value)} /></FormField>
          <FormField label="Cliente" required><Input placeholder="Nome do cliente" value={form.cliente||''} onChange={e=>set('cliente',e.target.value)} /></FormField>
          <FormField label="Tipo de viagem" required>
            <Select value={form.tipo_viagem||'ida'} onChange={e=>set('tipo_viagem',e.target.value)}>
              <option value="ida">Ida</option>
              <option value="volta">Volta</option>
            </Select>
          </FormField>
          <FormField label="Km rodados" required><Input type="number" min="0" step="0.1" placeholder="0" value={form.km_total||''} onChange={e=>set('km_total',e.target.value)} /></FormField>
          <FormField label="Endereço de partida" required col={2}><Input placeholder="Rua, número, cidade" value={form.partida||''} onChange={e=>set('partida',e.target.value)} /></FormField>
          <FormField label="Destino 1" required col={2}><Input placeholder="Rua, número, cidade" value={form.destino1||''} onChange={e=>set('destino1',e.target.value)} /></FormField>
          <FormField label="Destino 2 (opcional)" col={2}><Input placeholder="Rua, número, cidade" value={form.destino2||''} onChange={e=>set('destino2',e.target.value)} /></FormField>
          <FormField label="Valor combustível (R$)"><Input type="number" min="0" step="0.01" placeholder="0,00" value={form.valor_combustivel||''} onChange={e=>set('valor_combustivel',e.target.value)} /></FormField>
          <FormField label="Estacionamento (R$)"><Input type="number" min="0" step="0.01" placeholder="0,00" value={form.estacionamento||''} onChange={e=>set('estacionamento',e.target.value)} /></FormField>
          <FormField label="Observações" col={2}><Textarea placeholder="Informações adicionais..." value={form.observacao||''} onChange={e=>set('observacao',e.target.value)} /></FormField>
          <FormField label="Nota Fiscal" col={2}><UploadArea onFile={setNfFile} fileName={nfFile?.name} /></FormField>
        </>}

        {/* HORAS */}
        {tipo === 'hora' && <>
          <Alert variant="info">As horas lançadas aqui vão para o <strong>banco de horas</strong>. Para NOC, use a aba NOC.</Alert>
          <FormField label="Data" required><Input type="date" value={form.data||''} onChange={e=>set('data',e.target.value)} /></FormField>
          <FormField label="Cliente" required><Input placeholder="Nome do cliente" value={form.cliente||''} onChange={e=>set('cliente',e.target.value)} /></FormField>
          <FormField label="Modalidade">
            <Select value={form.modalidade||'presencial'} onChange={e=>set('modalidade',e.target.value)}>
              <option value="presencial">Presencial</option>
              <option value="remoto">Remoto</option>
            </Select>
          </FormField>
          <FormField label="Nº Chamado"><Input placeholder="Ex: 5182" value={form.chamado||''} onChange={e=>set('chamado',e.target.value)} /></FormField>
          <FormField label="Hora de início" required><Input type="time" value={form.hora_inicio||''} onChange={e=>set('hora_inicio',e.target.value)} /></FormField>
          <FormField label="Hora de término" required><Input type="time" value={form.hora_termino||''} onChange={e=>set('hora_termino',e.target.value)} /></FormField>
          <FormField label="Observações" col={2}><Textarea placeholder="Descreva a atividade realizada..." value={form.observacao||''} onChange={e=>set('observacao',e.target.value)} /></FormField>
        </>}

        {/* NOC */}
        {tipo === 'noc' && <>
          <Alert variant="warning">NOC é pago à parte: <strong>R$ 175,00 por dia trabalhado</strong>. Não entra no banco de horas.</Alert>
          <FormField label="Data" required><Input type="date" value={form.data||''} onChange={e=>set('data',e.target.value)} /></FormField>
          <FormField label="Cliente" required><Input placeholder="Nome do cliente" value={form.cliente||''} onChange={e=>set('cliente',e.target.value)} /></FormField>
          <FormField label="Hora de início"><Input type="time" value={form.hora_inicio||'07:00'} onChange={e=>set('hora_inicio',e.target.value)} /></FormField>
          <FormField label="Hora de término"><Input type="time" value={form.hora_termino||'19:00'} onChange={e=>set('hora_termino',e.target.value)} /></FormField>
          <FormField label="Valor por dia" col={2}>
            <div style={{ padding:'9px 12px',background:'var(--green-bg)',border:'1px solid var(--green-border)',borderRadius:'var(--radius-md)',fontSize:'14px',fontWeight:600,color:'var(--green)' }}>
              R$ 175,00 (fixo)
            </div>
          </FormField>
          <FormField label="Autorizado por" col={2}><Input placeholder="Nome do gestor que autorizou" value={form.autorizado||''} onChange={e=>set('autorizado',e.target.value)} /></FormField>
          <FormField label="Observações" col={2}><Textarea placeholder="Informações adicionais..." value={form.observacao||''} onChange={e=>set('observacao',e.target.value)} /></FormField>
        </>}

        {/* ALIMENTAÇÃO */}
        {tipo === 'alim' && <>
          <FormField label="Data" required><Input type="date" value={form.data||''} onChange={e=>set('data',e.target.value)} /></FormField>
          <FormField label="Cliente" required><Input placeholder="Nome do cliente" value={form.cliente||''} onChange={e=>set('cliente',e.target.value)} /></FormField>
          <FormField label="Valor (R$)" required col={2}><Input type="number" min="0" step="0.01" placeholder="0,00" value={form.valor||''} onChange={e=>set('valor',e.target.value)} /></FormField>
          <FormField label="Descrição" col={2}><Textarea placeholder="Ex: Almoço durante atendimento..." value={form.descricao||''} onChange={e=>set('descricao',e.target.value)} /></FormField>
          <FormField label="Nota Fiscal" required col={2}>
            <UploadArea onFile={setNfFile} fileName={nfFile?.name} />
          </FormField>
        </>}
      </div>

      {error && (
        <div style={{ marginTop: '16px' }}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'24px', paddingTop:'20px', borderTop:'1px solid var(--border)' }}>
        <Btn variant="default" onClick={handleClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? <><i className="ti ti-loader" style={{animation:'spin 1s linear infinite',display:'inline-block'}} /> Salvando...</> : <><i className="ti ti-check" /> Salvar Lançamento</>}
        </Btn>
      </div>
    </Modal>
  )
}
