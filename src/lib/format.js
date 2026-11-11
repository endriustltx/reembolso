// Formata datas vindas do banco em dd/mm/aaaa, aceitando vários formatos:
// '2026-11-10', '2026-11-10T03:00:00+00:00', '2026-11-10 03:00:00', '10/11/2026'
export function fmtDate(d) {
  if (!d) return '—'
  const s = String(d).trim()

  // aaaa-mm-dd no início (date ou timestamp) — usa as partes direto, sem fuso
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`

  // já em dd/mm/aaaa
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) return `${m[1]}/${m[2]}/${m[3]}`

  const dt = new Date(s)
  return isNaN(dt) ? '—' : dt.toLocaleDateString('pt-BR')
}
