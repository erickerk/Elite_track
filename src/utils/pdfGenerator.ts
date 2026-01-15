import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import type { Project } from '../types'
import { gerarDadosLaudo, LAUDO_TEXTOS, GARANTIAS_PADRAO, ESPECIFICACOES_TECNICAS } from '../config/eliteshield-laudo-template'
import { COMPANY_INFO, PRODUCTION_URL } from '../constants/companyInfo'

// Logo Elite da pasta public (caminho absoluto para o navegador)
const LOGO_ELITE_URL = '/logo-elite.png'

// Função para gerar QR Code como Data URL
async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 150,
      margin: 1,
      color: { dark: '#D4AF37', light: '#000000' }
    })
  } catch (err) {
    console.error('Erro ao gerar QR Code:', err)
    return ''
  }
}

// Função para carregar imagem como Data URL
async function loadImageAsDataURL(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve('')
    img.src = src
  })
}

export async function generateEliteShieldPDF(project: Project): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const dados = gerarDadosLaudo(project)
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  const m = 20
  let y = m

  const gold = [212, 175, 55]
  const black = [0, 0, 0]
  const gray = [128, 128, 128]

  // URL de verificação PERMANENTE (sempre usar URL de produção para QR codes)
  const verifyUrl = `${PRODUCTION_URL}/verify/${project.id}`
  
  // Usar QR Code permanente do projeto se existir, senão gerar novo
  let qrCodeDataUrl = ''
  if (project.permanentQrCode && project.permanentQrCode.startsWith('data:')) {
    // Usar QR Code permanente do Supabase
    qrCodeDataUrl = project.permanentQrCode
  } else {
    // Gerar novo QR Code com URL de verificação permanente
    qrCodeDataUrl = await generateQRCodeDataURL(verifyUrl)
  }
  
  // Carregar logo Elite da pasta public
  const logoDataUrl = await loadImageAsDataURL(LOGO_ELITE_URL)

  // Logo Elite no topo esquerdo
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', m, y, 25, 25)
  }
  
  // Título ao lado do logo
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(gold[0], gold[1], gold[2])
  doc.text('ELITE BLINDAGENS', m + 30, y + 10)
  doc.setFontSize(10)
  doc.setTextColor(gray[0], gray[1], gray[2])
  doc.text('Excelência em Blindagem Veicular', m + 30, y + 17)
  y += 35

  doc.setFontSize(24)
  doc.setTextColor(gold[0], gold[1], gold[2])
  doc.text('LAUDO TÉCNICO', pw/2, y, { align: 'center' })
  y += 10
  doc.text('ELITESHIELD™', pw/2, y, { align: 'center' })
  y += 8
  doc.setFontSize(10)
  doc.setTextColor(gray[0], gray[1], gray[2])
  doc.text('Laudo Técnico Digital', pw/2, y, { align: 'center' })
  y += 15

  doc.setDrawColor(gold[0], gold[1], gold[2])
  doc.setLineWidth(0.5)
  doc.line(m, y, pw - m, y)
  y += 10

  // SEÇÃO: VEÍCULO
  doc.setFontSize(12)
  doc.setTextColor(black[0], black[1], black[2])
  doc.setFont('helvetica', 'bold')
  doc.text('VEÍCULO', m, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${dados.veiculo.marca} ${dados.veiculo.modelo} - ${dados.veiculo.anoModelo}`, m, y)
  y += 6
  doc.text(`Placa: ${dados.veiculo.placa} | Cor: ${dados.veiculo.cor}`, m, y)
  y += 6
  doc.text(`Chassi: ${dados.veiculo.chassi} | Tipo: ${dados.veiculo.tipo}`, m, y)
  y += 10

  // SEÇÃO: CLIENTE
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('CLIENTE', m, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(dados.cliente.nome, m, y)
  y += 6
  if (dados.cliente.telefone) {
    doc.text(`Tel: ${dados.cliente.telefone} | Email: ${dados.cliente.email}`, m, y)
    y += 6
  }
  y += 4

  // SEÇÃO: STATUS
  const fin = project.status === 'completed' || project.status === 'delivered'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(fin ? 0 : 200, fin ? 128 : 150, fin ? 0 : 0)
  doc.text(`STATUS: ${fin ? 'FINALIZADO' : 'EM ANDAMENTO'}`, pw/2, y, { align: 'center' })
  y += 10

  // SEÇÃO: DATAS IMPORTANTES
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(gray[0], gray[1], gray[2])
  if (dados.datas.recebimento) {
    doc.text(`Recebido: ${new Date(dados.datas.recebimento).toLocaleDateString('pt-BR')}`, m, y)
  }
  if (dados.datas.conclusao) {
    doc.text(`Concluído: ${new Date(dados.datas.conclusao).toLocaleDateString('pt-BR')}`, pw/2, y, { align: 'center' })
  }
  if (dados.datas.entrega) {
    doc.setTextColor(0, 128, 0)
    doc.text(`✓ Entregue: ${new Date(dados.datas.entrega).toLocaleDateString('pt-BR')}`, pw - m, y, { align: 'right' })
  } else if (dados.datas.previsaoEntrega) {
    doc.setTextColor(200, 150, 0)
    doc.text(`Previsão: ${new Date(dados.datas.previsaoEntrega).toLocaleDateString('pt-BR')}`, pw - m, y, { align: 'right' })
  }

  // RODAPÉ DA CAPA
  doc.setFontSize(8)
  doc.setTextColor(gray[0], gray[1], gray[2])
  doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, pw/2, ph - 20, { align: 'center' })
  doc.text(COMPANY_INFO.name, pw/2, ph - 15, { align: 'center' })
  doc.text(`${COMPANY_INFO.phoneFormatted} | ${COMPANY_INFO.websiteDisplay}`, pw/2, ph - 10, { align: 'center' })

  doc.addPage()
  y = m

  doc.setFillColor(212, 175, 55, 0.2)
  doc.roundedRect(m, y - 5, pw - 2*m, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(gold[0], gold[1], gold[2])
  doc.text('IDENTIFICAÇÃO', m + 5, y + 3)
  y += 15

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const vd: Array<[string, string]> = [
    ['Marca:', dados.veiculo.marca],
    ['Modelo:', dados.veiculo.modelo],
    ['Placa:', dados.veiculo.placa]
  ]

  vd.forEach(([label, value]) => {
    doc.setTextColor(gray[0], gray[1], gray[2])
    doc.text(label, m, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(black[0], black[1], black[2])
    doc.text(value || '-', m + 50, y)
    doc.setFont('helvetica', 'normal')
    y += 7
  })

  y += 20
  const qs = 50
  const qx = (pw - qs) / 2
  
  // QR Code REAL gerado pela biblioteca qrcode
  if (qrCodeDataUrl) {
    doc.addImage(qrCodeDataUrl, 'PNG', qx, y, qs, qs)
  } else {
    // Fallback: desenhar retângulo se QR não carregar
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.setLineWidth(2)
    doc.rect(qx, y, qs, qs)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(black[0], black[1], black[2])
    doc.text('QR CODE', pw/2, y + qs/2, { align: 'center' })
  }
  y += qs + 10

  // URL de verificação abaixo do QR
  doc.setFontSize(8)
  doc.setTextColor(gold[0], gold[1], gold[2])
  doc.text(`Verificar: ${verifyUrl}`, pw/2, y, { align: 'center' })
  y += 5
  doc.setTextColor(gray[0], gray[1], gray[2])
  doc.text(`ID: ${project.id}`, pw/2, y, { align: 'center' })

  // ========================================
  // PÁGINA 3: ESPECIFICAÇÕES E GARANTIAS
  // ========================================
  doc.addPage()
  y = m

  // Título da página
  doc.setFillColor(212, 175, 55, 0.2)
  doc.roundedRect(m, y - 5, pw - 2*m, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(gold[0], gold[1], gold[2])
  doc.text('ESPECIFICAÇÕES TÉCNICAS', m + 5, y + 3)
  y += 20

  // Vidros Blindados
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(black[0], black[1], black[2])
  doc.text('Vidros Blindados', m, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(gray[0], gray[1], gray[2])
  doc.text(`Fabricante: ${ESPECIFICACOES_TECNICAS.vidros.fabricante}`, m, y)
  y += 5
  doc.text(`Espessura: ${ESPECIFICACOES_TECNICAS.vidros.espessura}`, m, y)
  y += 5
  doc.text(`Tipo: ${ESPECIFICACOES_TECNICAS.vidros.camadas}`, m, y)
  y += 5
  doc.text(`Garantia: ${ESPECIFICACOES_TECNICAS.vidros.garantia}`, m, y)
  y += 12

  // Materiais Opacos
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(black[0], black[1], black[2])
  doc.text('Materiais Opacos', m, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(gray[0], gray[1], gray[2])
  doc.text(`Material: ${ESPECIFICACOES_TECNICAS.opacos.material}`, m, y)
  y += 5
  doc.text(`Camadas: ${ESPECIFICACOES_TECNICAS.opacos.camadas}`, m, y)
  y += 5
  doc.text(`Complemento: ${ESPECIFICACOES_TECNICAS.opacos.complemento}`, m, y)
  y += 5
  doc.text(`Fabricante: ${ESPECIFICACOES_TECNICAS.opacos.fabricante}`, m, y)
  y += 15

  // Garantias
  doc.setFillColor(212, 175, 55, 0.2)
  doc.roundedRect(m, y - 5, pw - 2*m, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(gold[0], gold[1], gold[2])
  doc.text('GARANTIAS ATIVAS', m + 5, y + 3)
  y += 20

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  Object.values(GARANTIAS_PADRAO).forEach((garantia) => {
    doc.setTextColor(0, 128, 0)
    doc.text('✓', m, y)
    doc.setTextColor(black[0], black[1], black[2])
    doc.text(`${garantia.nome}: ${garantia.prazo}`, m + 8, y)
    y += 7
  })
  y += 10

  // Declaração Final
  doc.setFillColor(212, 175, 55, 0.2)
  doc.roundedRect(m, y - 5, pw - 2*m, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(gold[0], gold[1], gold[2])
  doc.text('DECLARAÇÃO FINAL', m + 5, y + 3)
  y += 15

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(gray[0], gray[1], gray[2])
  const declaracao = LAUDO_TEXTOS.secao12.texto
  const lines = doc.splitTextToSize(declaracao, pw - 2*m)
  doc.text(lines, m, y)
  y += lines.length * 5 + 10

  // Rodapé final
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(gold[0], gold[1], gold[2])
  doc.text(LAUDO_TEXTOS.rodape.empresa, pw/2, ph - 20, { align: 'center' })
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(gray[0], gray[1], gray[2])
  doc.text(LAUDO_TEXTOS.rodape.slogan, pw/2, ph - 14, { align: 'center' })

  return doc.output('blob')
}

export default generateEliteShieldPDF
