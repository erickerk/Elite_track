/**
 * Utilitário para exportar dados para Excel (formato CSV compatível)
 */

interface ExportColumn {
  header: string
  key: string
  formatter?: (value: unknown) => string
}

/**
 * Exporta dados para arquivo CSV (abre no Excel)
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (data.length === 0) {
    alert('Não há dados para exportar')
    return
  }

  // Criar cabeçalho
  const headers = columns.map(col => `"${col.header}"`).join(';')

  // Criar linhas de dados
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key]
      const formatted = col.formatter ? col.formatter(value) : String(value ?? '')
      // Escapar aspas duplas e envolver em aspas
      return `"${formatted.replace(/"/g, '""')}"`
    }).join(';')
  })

  // Montar CSV com BOM para UTF-8 (compatibilidade Excel)
  const BOM = '\uFEFF'
  const csvContent = BOM + headers + '\n' + rows.join('\n')

  // Criar blob e download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Formata data para exibição brasileira
 */
export function formatDateBR(date: string | Date | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR')
}

/**
 * Formata moeda para exibição brasileira
 */
export function formatCurrencyBR(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return ''
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) : value
  if (isNaN(num)) return String(value)
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Formata telefone
 */
export function formatPhone(phone: string | undefined): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`
  }
  return phone
}
