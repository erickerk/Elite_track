import QRCode from 'qrcode'
import { getAppBaseUrl, PRODUCTION_URL } from '../constants/companyInfo'
// getAppBaseUrl: para links clicáveis internos
// PRODUCTION_URL: para QR Codes escaneáveis por câmeras externas

// ============================================================================
// QR CODE UTILITIES — Centraliza toda geração de URL e imagem QR do sistema
// ============================================================================

/**
 * Retorna a URL de verificação pública do projeto.
 * - Links clicáveis no app: usa domínio dinâmico (getAppBaseUrl)
 * - QR Codes / PDF / export: usa PRODUCTION_URL fixo (escaneáveis externamente)
 */
export function getVerifyUrl(projectId: string, forPdf = false): string {
  const base = forPdf ? PRODUCTION_URL : getAppBaseUrl()
  return `${base}/verify/${projectId}`
}

/**
 * Retorna a URL de verificação SEMPRE usando PRODUCTION_URL.
 * Usada em QR Codes que serão escaneados por câmeras externas.
 */
export function getQrVerifyUrl(projectId: string): string {
  return `${PRODUCTION_URL}/verify/${projectId}`
}

/**
 * Retorna a URL da imagem QR gerada pela API externa (api.qrserver.com).
 * Usada em componentes React que renderizam <img>.
 */
export function getQrImageUrl(
  projectId: string,
  options?: {
    size?: number
    bgColor?: string
    fgColor?: string
  }
): string {
  const { size = 200, bgColor = '1A1A1A', fgColor = 'D4AF37' } = options || {}
  const verifyUrl = getQrVerifyUrl(projectId)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(verifyUrl)}&bgcolor=${bgColor}&color=${fgColor}`
}

/**
 * Gera QR Code como Data URL (base64 PNG).
 * Usada no PDF (jsPDF addImage).
 */
export async function generateQrDataUrl(
  projectId: string,
  options?: { width?: number; darkColor?: string; lightColor?: string }
): Promise<string> {
  const { width = 200, darkColor = '#D4AF37', lightColor = '#1a1a1a' } = options || {}
  const verifyUrl = getQrVerifyUrl(projectId)
  try {
    return await QRCode.toDataURL(verifyUrl, {
      width,
      margin: 1,
      color: { dark: darkColor, light: lightColor },
    })
  } catch (err) {
    console.error('[qrUtils] Erro ao gerar QR Code DataURL:', err)
    return ''
  }
}
