// URL base da aplicação para QR Codes e links externos
// Prioridade: VITE_APP_URL > window.location.origin
export const getAppBaseUrl = (): string => {
  // Em produção, usar a variável de ambiente
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL
  }
  // Fallback para o domínio atual (development)
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Fallback absoluto para SSR ou testes
  return 'https://app.eliteblindagens.com.br'
}

// URL canônica de produção (para QR Codes permanentes)
export const PRODUCTION_URL = 'https://app.eliteblindagens.com.br'

// Dados de contato da Elite Blindagens
export const COMPANY_INFO = {
  name: 'Elite Blindagens',
  whatsapp: '5511913123071',
  whatsappFormatted: '(11) 9.1312-3071',
  phone: '5511913123071',
  phoneFormatted: '(11) 9.1312-3071',
  website: 'https://www.eliteblindagens.com.br',
  websiteDisplay: 'www.eliteblindagens.com.br',
  appUrl: PRODUCTION_URL,
  address: {
    street: 'R. Doutor Ulisses Guimaraes, 874',
    neighborhood: 'Loteamento Industrial',
    city: 'Mauá',
    state: 'SP',
    zip: '09372-050',
    full: 'R. Doutor Ulisses Guimaraes, 874 - Loteamento Industrial, Mauá - SP, 09372-050',
  },
  googleMapsUrl: 'https://maps.google.com/?q=R.+Doutor+Ulisses+Guimaraes,+874+-+Loteamento+Industrial,+Maua+-+SP',
}

// Funções para gerar links de contato
export const getWhatsAppLink = (message?: string) => {
  const baseUrl = `https://wa.me/${COMPANY_INFO.whatsapp}`
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl
}

export const getPhoneLink = () => {
  return `tel:+${COMPANY_INFO.phone}`
}

export const getEmailLink = (subject?: string, body?: string) => {
  let url = 'mailto:contato@eliteblindagens.com.br'
  const params = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  if (params.length > 0) url += '?' + params.join('&')
  return url
}
