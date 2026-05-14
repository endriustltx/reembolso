import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase não configurado. Copie .env.example para .env e preencha suas credenciais.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

// Upload de nota fiscal
export async function uploadNotaFiscal(file, userId, lancamentoTipo, lancamentoId) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${lancamentoTipo}/${lancamentoId}_${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('notas-fiscais')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw error

  // Registrar na tabela
  await supabase.from('notas_fiscais').insert({
    user_id: userId,
    lancamento_tipo: lancamentoTipo,
    lancamento_id: lancamentoId,
    nome_arquivo: file.name,
    caminho_storage: data.path,
    tamanho_bytes: file.size,
    mime_type: file.type,
  })

  return data.path
}

// URL temporária para visualizar NF
export async function getNFUrl(path) {
  const { data } = await supabase.storage
    .from('notas-fiscais')
    .createSignedUrl(path, 60 * 60) // 1 hora
  return data?.signedUrl
}
