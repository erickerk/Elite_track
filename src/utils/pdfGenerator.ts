import jsPDF from 'jspdf'
import type { Project } from '../types'
import { gerarDadosLaudo, LAUDO_TEXTOS, GARANTIAS_PADRAO, getEspecificacoesPorLinha, LINHAS_BLINDAGEM } from '../config/eliteshield-laudo-template'
import { COMPANY_INFO } from '../constants/companyInfo'
import { getVerifyUrl, generateQrDataUrl } from './qrUtils'

// Logo Elite da pasta public
const LOGO_ELITE_URL = '/logo-elite.png'

// Cores do tema Elite
const COLORS = {
  gold: [212, 175, 55] as [number, number, number],
  goldLight: [244, 208, 63] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  darkGray: [30, 30, 30] as [number, number, number],
  gray: [128, 128, 128] as [number, number, number],
  lightGray: [200, 200, 200] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  greenDark: [22, 163, 74] as [number, number, number],
  yellow: [234, 179, 8] as [number, number, number],
}


// Função para carregar imagem como Data URL com proporções corretas
async function loadImageAsDataURL(src: string): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0)
      resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.width, height: img.height })
    }
    img.onerror = () => resolve({ dataUrl: '', width: 0, height: 0 })
    img.src = src
  })
}

// Função auxiliar para adicionar header em cada página
function addPageHeader(doc: jsPDF, logoDataUrl: string, pageNum: number, totalPages: number) {
  const pw = doc.internal.pageSize.getWidth()
  const m = 15
  
  // Linha dourada no topo
  doc.setDrawColor(...COLORS.gold)
  doc.setLineWidth(1)
  doc.line(0, 0, pw, 0)
  
  // Logo pequeno no header (proporções corretas)
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', m, 5, 20, 10)
  }
  
  // Texto ELITESHIELD no header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.gold)
  doc.text('ELITESHIELD™', m + 25, 11)
  
  // Número da página
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.gray)
  doc.text(`${pageNum}/${totalPages}`, pw - m, 11, { align: 'right' })
}

// Função auxiliar para adicionar footer em cada página
function addPageFooter(doc: jsPDF) {
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  
  // Linha dourada no rodapé
  doc.setDrawColor(...COLORS.gold)
  doc.setLineWidth(0.5)
  doc.line(15, ph - 15, pw - 15, ph - 15)
  
  // Informações da empresa
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.gray)
  doc.text(`${COMPANY_INFO.name} | ${COMPANY_INFO.phoneFormatted} | ${COMPANY_INFO.websiteDisplay}`, pw/2, ph - 10, { align: 'center' })
  doc.text('Proteção elevada ao estado da arte.', pw/2, ph - 6, { align: 'center' })
}

// Função auxiliar para criar seção com título
function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  const pw = doc.internal.pageSize.getWidth()
  const m = 15
  
  // Background dourado semi-transparente
  doc.setFillColor(212, 175, 55)
  doc.setGState(new (doc as any).GState({ opacity: 0.15 }))
  doc.roundedRect(m, y - 2, pw - 2*m, 10, 2, 2, 'F')
  doc.setGState(new (doc as any).GState({ opacity: 1 }))
  
  // Borda dourada
  doc.setDrawColor(...COLORS.gold)
  doc.setLineWidth(0.3)
  doc.roundedRect(m, y - 2, pw - 2*m, 10, 2, 2, 'S')
  
  // Título
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.gold)
  doc.text(title.toUpperCase(), m + 5, y + 5)
  
  return y + 15
}

// Função auxiliar para criar campo label/valor
function addField(doc: jsPDF, label: string, value: string, x: number, y: number, labelWidth: number = 35): number {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.gray)
  doc.text(label, x, y)
  
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.white)
  doc.text(value || '-', x + labelWidth, y)
  
  return y + 6
}

// Função auxiliar para criar card
function addCard(doc: jsPDF, x: number, y: number, w: number, h: number) {
  // Fundo do card
  doc.setFillColor(25, 25, 25)
  doc.roundedRect(x, y, w, h, 3, 3, 'F')
  
  // Borda dourada sutil
  doc.setDrawColor(...COLORS.gold)
  doc.setLineWidth(0.2)
  doc.roundedRect(x, y, w, h, 3, 3, 'S')
}

export async function generateEliteShieldPDF(project: Project): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const dados = gerarDadosLaudo(project)
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  const m = 15
  let y = m
  const hasPhotos = project.timeline?.some(step => step.photos && step.photos.length > 0)
  const totalPages = hasPhotos ? 9 : 8

  // URL de verificação permanente (domínio de produção para PDF)
  const verifyUrl = getVerifyUrl(project.id, true)
  
  // Specs condicionais por tipo de blindagem
  const specsCondicionais = getEspecificacoesPorLinha(project.blindingLine || 'Safe Core')

  // Gerar QR Code
  let qrCodeDataUrl = ''
  if (project.permanentQrCode?.startsWith('data:')) {
    qrCodeDataUrl = project.permanentQrCode
  } else {
    qrCodeDataUrl = await generateQrDataUrl(project.id)
  }
  
  // Carregar logo com proporções corretas
  const logoData = await loadImageAsDataURL(LOGO_ELITE_URL)
  const logoDataUrl = logoData.dataUrl

  // Calcular proporção do logo
  const logoW = 50
  const logoH = logoData.height > 0 ? (logoW * logoData.height) / logoData.width : 25

  const isFinished = project.status === 'completed' || project.status === 'delivered'
  const linhaBlindagem = dados.blindagem.linha === 'ultralite' ? LINHAS_BLINDAGEM.ultralite : LINHAS_BLINDAGEM.safecore

  // ========================================
  // PÁGINA 1: CAPA PREMIUM
  // ========================================
  
  // Fundo preto
  doc.setFillColor(...COLORS.black)
  doc.rect(0, 0, pw, ph, 'F')
  
  // Gradiente dourado no topo (simulado com linhas)
  for (let i = 0; i < 3; i++) {
    doc.setDrawColor(212, 175, 55)
    doc.setLineWidth(1 - i * 0.3)
    doc.line(0, i, pw, i)
  }
  
  // Logo centralizado (proporções corretas)
  y = 30
  if (logoDataUrl) {
    const logoX = (pw - logoW) / 2
    doc.addImage(logoDataUrl, 'PNG', logoX, y, logoW, logoH)
    y += logoH + 10
  }
  
  // Título ELITESHIELD™
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...COLORS.gold)
  doc.text('ELITESHIELD™', pw/2, y, { align: 'center' })
  y += 8
  
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.gray)
  doc.text('Laudo Técnico Digital', pw/2, y, { align: 'center' })
  y += 20
  
  // Linha decorativa
  doc.setDrawColor(...COLORS.gold)
  doc.setLineWidth(0.5)
  doc.line(pw/4, y, 3*pw/4, y)
  y += 15
  
  // Card do veículo
  addCard(doc, m, y, pw - 2*m, 45)
  
  // Título do veículo
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...COLORS.white)
  doc.text(`${dados.veiculo.marca} ${dados.veiculo.modelo}`, pw/2, y + 12, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.gray)
  doc.text('Veículo Blindado', pw/2, y + 20, { align: 'center' })
  
  // Dados do veículo em 3 colunas
  const cardY = y + 28
  doc.setFontSize(8)
  
  // Coluna 1: Cliente
  doc.setTextColor(...COLORS.gray)
  doc.text('Cliente', m + 10, cardY)
  doc.setTextColor(...COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.text(dados.cliente.nome, m + 10, cardY + 5)
  
  // Coluna 2: Veículo
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.gray)
  doc.text('Veículo', pw/2, cardY, { align: 'center' })
  doc.setTextColor(...COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.text(`${dados.veiculo.marca} ${dados.veiculo.modelo} / ${dados.veiculo.anoModelo}`, pw/2, cardY + 5, { align: 'center' })
  
  // Coluna 3: Status
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.gray)
  doc.text('Status', pw - m - 10, cardY, { align: 'right' })
  doc.setTextColor(...(isFinished ? COLORS.green : COLORS.yellow))
  doc.setFont('helvetica', 'bold')
  doc.text(isFinished ? 'FINALIZADO' : 'EM ANDAMENTO', pw - m - 10, cardY + 5, { align: 'right' })
  
  y += 55
  
  // Datas importantes
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  
  if (dados.datas.recebimento) {
    doc.setTextColor(...COLORS.gray)
    doc.text(`Recebido em: ${new Date(dados.datas.recebimento).toLocaleDateString('pt-BR')}`, pw/2, y, { align: 'center' })
    y += 6
  }
  
  if (dados.datas.conclusao) {
    doc.setTextColor(...COLORS.lightGray)
    doc.text(`Concluído em: ${new Date(dados.datas.conclusao).toLocaleDateString('pt-BR')}`, pw/2, y, { align: 'center' })
    y += 6
  }
  
  if (dados.datas.entrega) {
    doc.setTextColor(...COLORS.green)
    doc.text(`Entregue em: ${new Date(dados.datas.entrega).toLocaleDateString('pt-BR')}`, pw/2, y, { align: 'center' })
  } else if (dados.datas.previsaoEntrega) {
    doc.setTextColor(...COLORS.yellow)
    doc.text(`Previsão de entrega: ${new Date(dados.datas.previsaoEntrega).toLocaleDateString('pt-BR')}`, pw/2, y, { align: 'center' })
  }
  
  // Rodapé da capa
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.gold)
  doc.text('Elite Blindagens', pw/2, ph - 25, { align: 'center' })
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.gray)
  doc.text('Proteção elevada ao estado da arte.', pw/2, ph - 20, { align: 'center' })
  
  // Linha dourada no rodapé
  doc.setDrawColor(...COLORS.gold)
  doc.setLineWidth(0.5)
  doc.line(pw/4, ph - 12, 3*pw/4, ph - 12)

  // ========================================
  // PÁGINA 2: IDENTIFICAÇÃO DO VEÍCULO E CLIENTE
  // ========================================
  doc.addPage()
  doc.setFillColor(...COLORS.black)
  doc.rect(0, 0, pw, ph, 'F')
  
  addPageHeader(doc, logoDataUrl, 2, totalPages)
  y = 25
  
  // Seção: Identificação do Veículo
  y = addSectionTitle(doc, 'Identificação do Veículo', y)
  
  // Card de dados do veículo
  addCard(doc, m, y, pw - 2*m, 50)
  
  const vY = y + 8
  const col1 = m + 5
  const col2 = pw/2 + 5
  
  // Coluna 1
  let vy1 = addField(doc, 'Marca', dados.veiculo.marca, col1, vY)
  vy1 = addField(doc, 'Modelo', dados.veiculo.modelo, col1, vy1)
  vy1 = addField(doc, 'Ano/Modelo', dados.veiculo.anoModelo, col1, vy1)
  vy1 = addField(doc, 'Cor', dados.veiculo.cor, col1, vy1)
  void vy1
  
  // Coluna 2
  let vy2 = addField(doc, 'Placa', dados.veiculo.placa, col2, vY)
  vy2 = addField(doc, 'Chassi', dados.veiculo.chassi ? `****${dados.veiculo.chassi.slice(-4)}` : '-', col2, vy2)
  vy2 = addField(doc, 'KM Check-in', dados.veiculo.kmCheckin || '0', col2, vy2)
  vy2 = addField(doc, 'Tipo', dados.veiculo.tipo, col2, vy2)
  void vy2
  
  y += 58
  
  // Seção: Dados do Cliente
  y = addSectionTitle(doc, 'Dados do Cliente', y)
  
  addCard(doc, m, y, pw - 2*m, 30)
  
  const cY = y + 8
  let cy1 = addField(doc, 'Nome / Razão Social', dados.cliente.nome, col1, cY, 45)
  cy1 = addField(doc, 'Telefone', dados.cliente.telefone || '-', col1, cy1, 45)
  addField(doc, 'E-mail', dados.cliente.email || '-', col1, cy1, 45)
  
  y += 40
  
  // Seção: Linha de Blindagem
  y = addSectionTitle(doc, 'Linha de Blindagem', y)
  
  addCard(doc, m, y, pw - 2*m, 35)
  
  // Nome da linha
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.gold)
  doc.text(linhaBlindagem.nome, m + 10, y + 12)
  
  // Subtítulo
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.gray)
  doc.text(linhaBlindagem.selo, m + 10, y + 18)
  doc.text(linhaBlindagem.descricao, m + 10, y + 24)
  
  // Nível
  doc.setTextColor(...COLORS.white)
  doc.text(`Nível: ${dados.blindagem.nivel}`, pw - m - 10, y + 15, { align: 'right' })
  
  y += 45
  
  // Seção: Especificação Técnica
  y = addSectionTitle(doc, 'Especificação Técnica', y)
  
  // Card Vidros
  addCard(doc, m, y, (pw - 2*m - 5)/2, 40)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.gold)
  doc.text('Vidros Blindados', m + 5, y + 8)
  
  let specY = y + 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  specY = addField(doc, 'Fabricante', specsCondicionais.vidros.fabricante, m + 5, specY, 30)
  specY = addField(doc, 'Espessura', specsCondicionais.vidros.espessura, m + 5, specY, 30)
  specY = addField(doc, 'Peso/m²', specsCondicionais.vidros.pesoM2, m + 5, specY, 30)
  addField(doc, 'Garantia', specsCondicionais.vidros.garantia, m + 5, specY, 30)
  
  // Card Opacos
  const opacosX = pw/2 + 2.5
  addCard(doc, opacosX, y, (pw - 2*m - 5)/2, 40)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.gold)
  doc.text('Materiais Opacos', opacosX + 5, y + 8)
  
  specY = y + 14
  doc.setFontSize(8)
  specY = addField(doc, 'Material', specsCondicionais.opacos.material, opacosX + 5, specY, 30)
  specY = addField(doc, 'Camadas', specsCondicionais.opacos.camadas, opacosX + 5, specY, 30)
  specY = addField(doc, 'Complemento', specsCondicionais.opacos.complemento, opacosX + 5, specY, 30)
  addField(doc, 'Fabricante', specsCondicionais.opacos.fabricante, opacosX + 5, specY, 30)
  
  addPageFooter(doc)

  // ========================================
  // PÁGINA 3: PROCESSO DE EXECUÇÃO (TIMELINE)
  // ========================================
  doc.addPage()
  doc.setFillColor(...COLORS.black)
  doc.rect(0, 0, pw, ph, 'F')
  
  addPageHeader(doc, logoDataUrl, 3, totalPages)
  y = 25
  
  y = addSectionTitle(doc, 'Processo de Execução', y)
  
  // Timeline
  const timeline = project.timeline || []
  const timelineX = m + 15
  
  timeline.forEach((step, index) => {
    const isCompleted = step.status === 'completed'
    const isLast = index === timeline.length - 1
    
    // Linha vertical conectora
    if (!isLast) {
      doc.setDrawColor(...(isCompleted ? COLORS.green : COLORS.gray))
      doc.setLineWidth(0.5)
      doc.line(m + 5, y + 4, m + 5, y + 18)
    }
    
    // Círculo do ponto
    if (isCompleted) {
      doc.setFillColor(...COLORS.green)
    } else {
      doc.setFillColor(...COLORS.gray)
    }
    doc.circle(m + 5, y + 2, 3, 'F')
    
    // Nome da etapa
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.white)
    doc.text(step.title, timelineX, y + 4)
    
    // Data de conclusão
    if (step.date && isCompleted) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.gray)
      doc.text(`Concluído em ${new Date(step.date).toLocaleDateString('pt-BR')}`, timelineX, y + 10)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.yellow)
      doc.text('Pendente', timelineX, y + 10)
    }
    
    y += 18
    
    // Quebra de página se necessário
    if (y > ph - 40) {
      addPageFooter(doc)
      doc.addPage()
      doc.setFillColor(...COLORS.black)
      doc.rect(0, 0, pw, ph, 'F')
      addPageHeader(doc, logoDataUrl, 3, totalPages)
      y = 25
    }
  })
  
  y += 10
  
  // Seção: Testes e Verificações
  if (y < ph - 80) {
    y = addSectionTitle(doc, 'Testes e Verificações', y)
    
    addCard(doc, m, y, pw - 2*m, 45)
    
    const testes = [
      'Ajuste de portas',
      'Funcionamento dos vidros',
      'Vedação',
      'Acabamento',
      'Rodagem de teste',
      'Ausência de ruídos'
    ]
    
    const testY = y + 8
    const testCol1 = m + 10
    const testCol2 = pw/2 + 5
    
    testes.forEach((teste, index) => {
      const x = index < 3 ? testCol1 : testCol2
      const ty = testY + (index % 3) * 10
      
      doc.setFillColor(...COLORS.green)
      doc.circle(x - 3, ty - 1.5, 1.5, 'F')
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...COLORS.white)
      doc.text(teste, x + 2, ty)
    })
    
    y += 55
  }
  
  addPageFooter(doc)

  // ========================================
  // PÁGINA 4: RESPONSÁVEIS E GARANTIAS
  // ========================================
  doc.addPage()
  doc.setFillColor(...COLORS.black)
  doc.rect(0, 0, pw, ph, 'F')
  
  addPageHeader(doc, logoDataUrl, 4, totalPages)
  y = 25
  
  // Seção: Responsáveis Técnicos
  y = addSectionTitle(doc, 'Responsáveis Técnicos', y)
  
  addCard(doc, m, y, (pw - 2*m - 5)/2, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.gold)
  doc.text('Responsável Técnico', m + 5, y + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.white)
  doc.text(typeof dados.responsaveis.tecnico === 'string' ? dados.responsaveis.tecnico : (dados.responsaveis.tecnico?.nome || 'Técnico Responsável'), m + 5, y + 18)
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(8)
  doc.text('Técnico de Blindagem', m + 5, y + 24)
  
  addCard(doc, pw/2 + 2.5, y, (pw - 2*m - 5)/2, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.gold)
  doc.text('Supervisor Técnico', pw/2 + 7.5, y + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.white)
  doc.text(typeof dados.responsaveis.supervisor === 'string' ? dados.responsaveis.supervisor : (dados.responsaveis.supervisor?.nome || 'Supervisor Técnico'), pw/2 + 7.5, y + 18)
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(8)
  doc.text('Supervisor de Qualidade', pw/2 + 7.5, y + 24)
  
  y += 40
  
  // Seção: Garantias Ativas
  y = addSectionTitle(doc, 'Garantias Ativas', y)
  
  const garantias = Object.values(GARANTIAS_PADRAO)
  const garantiaW = (pw - 2*m - 10) / 3
  
  garantias.forEach((garantia, index) => {
    const gx = m + index * (garantiaW + 5)
    addCard(doc, gx, y, garantiaW, 25)
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.white)
    doc.text(garantia.nome, gx + garantiaW/2, y + 10, { align: 'center' })
    
    doc.setFontSize(11)
    doc.setTextColor(...COLORS.green)
    doc.text(garantia.prazo, gx + garantiaW/2, y + 18, { align: 'center' })
  })
  
  y += 35
  
  // Seção: EliteTrace QR Code
  y = addSectionTitle(doc, 'EliteTrace™', y)
  
  addCard(doc, m, y, pw - 2*m, 70)
  
  // QR Code
  const qrSize = 45
  const qrX = m + 15
  const qrY = y + 12
  
  if (qrCodeDataUrl) {
    doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
  }
  
  // Texto ao lado do QR
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.gold)
  doc.text('EliteTrace™', qrX + qrSize + 15, qrY + 10)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.gray)
  doc.text('Escaneie para acessar', qrX + qrSize + 15, qrY + 20)
  doc.text('o histórico completo', qrX + qrSize + 15, qrY + 26)
  doc.text('da blindagem.', qrX + qrSize + 15, qrY + 32)
  
  // URL
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.gold)
  doc.text(verifyUrl, qrX + qrSize + 15, qrY + 42)
  
  addPageFooter(doc)

  // ========================================
  // PÁGINA 5: TERMOS JURÍDICOS (Seções 1-4)
  // ========================================
  doc.addPage()
  doc.setFillColor(...COLORS.black)
  doc.rect(0, 0, pw, ph, 'F')
  
  addPageHeader(doc, logoDataUrl, 5, totalPages)
  y = 25
  
  // Seção 1 - Declaração de Execução Técnica
  y = addSectionTitle(doc, 'Declaração de Execução Técnica', y)
  addCard(doc, m, y, pw - 2*m, 35)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  const sec1Lines = doc.splitTextToSize(LAUDO_TEXTOS.secao1.texto, pw - 2*m - 10)
  doc.text(sec1Lines, m + 5, y + 8)
  y += 42
  
  // Seção 2 - Padrão de Proteção Balística
  y = addSectionTitle(doc, 'Padrão de Proteção Balística', y)
  addCard(doc, m, y, pw - 2*m, 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  const sec2Lines = doc.splitTextToSize(LAUDO_TEXTOS.secao2.texto, pw - 2*m - 10)
  doc.text(sec2Lines, m + 5, y + 8)
  y += 37
  
  // Seção 3 - Materiais e Componentes
  y = addSectionTitle(doc, 'Materiais e Componentes Utilizados', y)
  addCard(doc, m, y, pw - 2*m, 50)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  const sec3Lines = doc.splitTextToSize(LAUDO_TEXTOS.secao3.texto, pw - 2*m - 10)
  doc.text(sec3Lines, m + 5, y + 8)
  
  let bulletY = y + 18
  LAUDO_TEXTOS.secao3.itens.forEach((item) => {
    doc.setTextColor(...COLORS.gold)
    doc.text('•', m + 5, bulletY)
    doc.setTextColor(...COLORS.white)
    doc.text(item, m + 10, bulletY)
    bulletY += 5
  })
  
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(7)
  const sec3Comp = doc.splitTextToSize(LAUDO_TEXTOS.secao3.complemento, pw - 2*m - 10)
  doc.text(sec3Comp, m + 5, bulletY + 3)
  y += 57
  
  // Seção 4 - Processo de Execução
  y = addSectionTitle(doc, 'Processo de Execução', y)
  addCard(doc, m, y, pw - 2*m, 55)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  const sec4Lines = doc.splitTextToSize(LAUDO_TEXTOS.secao4.texto, pw - 2*m - 10)
  doc.text(sec4Lines, m + 5, y + 8)
  
  bulletY = y + 15
  LAUDO_TEXTOS.secao4.etapas.forEach((etapa) => {
    doc.setTextColor(...COLORS.gold)
    doc.text('•', m + 5, bulletY)
    doc.setTextColor(...COLORS.white)
    doc.text(etapa, m + 10, bulletY)
    bulletY += 5
  })
  
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(7)
  const sec4Comp = doc.splitTextToSize(LAUDO_TEXTOS.secao4.complemento, pw - 2*m - 10)
  doc.text(sec4Comp, m + 5, bulletY + 3)
  
  addPageFooter(doc)

  // ========================================
  // PÁGINA 6: TERMOS JURÍDICOS (Seções 5-8)
  // ========================================
  doc.addPage()
  doc.setFillColor(...COLORS.black)
  doc.rect(0, 0, pw, ph, 'F')
  
  addPageHeader(doc, logoDataUrl, 6, totalPages)
  y = 25
  
  // Seção 5 - Registro Fotográfico e Transparência
  y = addSectionTitle(doc, 'Registro Fotográfico e Transparência', y)
  addCard(doc, m, y, pw - 2*m, 28)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  const sec5Lines = doc.splitTextToSize(LAUDO_TEXTOS.secao5.texto, pw - 2*m - 10)
  doc.text(sec5Lines, m + 5, y + 8)
  y += 35
  
  // Seção 6 - Responsabilidade Técnica
  y = addSectionTitle(doc, 'Responsabilidade Técnica', y)
  addCard(doc, m, y, pw - 2*m, 25)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  const sec6Lines = doc.splitTextToSize(LAUDO_TEXTOS.secao6.texto, pw - 2*m - 10)
  doc.text(sec6Lines, m + 5, y + 8)
  y += 32
  
  // Seção 7 - Garantia
  y = addSectionTitle(doc, 'Garantia', y)
  addCard(doc, m, y, pw - 2*m, 45)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  const sec7Lines = doc.splitTextToSize(LAUDO_TEXTOS.secao7.texto, pw - 2*m - 10)
  doc.text(sec7Lines, m + 5, y + 8)
  
  bulletY = y + 15
  LAUDO_TEXTOS.secao7.itens.forEach((item) => {
    doc.setTextColor(...COLORS.gold)
    doc.text('•', m + 5, bulletY)
    doc.setTextColor(...COLORS.white)
    doc.text(item, m + 10, bulletY)
    bulletY += 5
  })
  
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(7)
  const sec7Comp = doc.splitTextToSize(LAUDO_TEXTOS.secao7.complemento, pw - 2*m - 10)
  doc.text(sec7Comp, m + 5, bulletY + 3)
  y += 52
  
  // Seção 8 - Limitações e Condições de Uso
  y = addSectionTitle(doc, 'Limitações e Condições de Uso', y)
  addCard(doc, m, y, pw - 2*m, 50)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  const sec8Lines = doc.splitTextToSize(LAUDO_TEXTOS.secao8.texto, pw - 2*m - 10)
  doc.text(sec8Lines, m + 5, y + 8)
  
  bulletY = y + 15
  LAUDO_TEXTOS.secao8.itens.forEach((item) => {
    doc.setTextColor(...COLORS.gold)
    doc.text('•', m + 5, bulletY)
    doc.setTextColor(...COLORS.white)
    const itemLines = doc.splitTextToSize(item, pw - 2*m - 20)
    doc.text(itemLines, m + 10, bulletY)
    bulletY += itemLines.length * 4 + 2
  })
  
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(7)
  const sec8Comp = doc.splitTextToSize(LAUDO_TEXTOS.secao8.complemento, pw - 2*m - 10)
  doc.text(sec8Comp, m + 5, bulletY + 3)
  
  addPageFooter(doc)

  // ========================================
  // PÁGINA 7: TERMOS JURÍDICOS (Seções 9-12)
  // ========================================
  doc.addPage()
  doc.setFillColor(...COLORS.black)
  doc.rect(0, 0, pw, ph, 'F')
  
  addPageHeader(doc, logoDataUrl, 7, totalPages)
  y = 25
  
  // Seção 9 - Manutenção e Revisões
  y = addSectionTitle(doc, 'Manutenção e Revisões', y)
  addCard(doc, m, y, pw - 2*m, 25)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  const sec9Lines = doc.splitTextToSize(LAUDO_TEXTOS.secao9.texto, pw - 2*m - 10)
  doc.text(sec9Lines, m + 5, y + 8)
  y += 32
  
  // Seção 10 - Rastreabilidade e EliteTrace
  y = addSectionTitle(doc, 'Rastreabilidade e EliteTrace™', y)
  addCard(doc, m, y, pw - 2*m, 28)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  const sec10Lines = doc.splitTextToSize(LAUDO_TEXTOS.secao10.texto, pw - 2*m - 10)
  doc.text(sec10Lines, m + 5, y + 8)
  y += 35
  
  // Seção 11 - Validade do Documento
  y = addSectionTitle(doc, 'Validade do Documento', y)
  addCard(doc, m, y, pw - 2*m, 22)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  const sec11Lines = doc.splitTextToSize(LAUDO_TEXTOS.secao11.texto, pw - 2*m - 10)
  doc.text(sec11Lines, m + 5, y + 8)
  y += 29
  
  // Seção 12 - Declaração Final
  y = addSectionTitle(doc, 'Declaração Final', y)
  addCard(doc, m, y, pw - 2*m, 28)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  const sec12Lines = doc.splitTextToSize(LAUDO_TEXTOS.secao12.texto, pw - 2*m - 10)
  doc.text(sec12Lines, m + 5, y + 8)
  y += 35
  
  // Rodapé institucional
  y = addSectionTitle(doc, 'Elite Blindagens', y)
  addCard(doc, m, y, pw - 2*m, 30)
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.gold)
  doc.text(LAUDO_TEXTOS.rodape.empresa, pw/2, y + 12, { align: 'center' })
  
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.gray)
  doc.text(LAUDO_TEXTOS.rodape.slogan, pw/2, y + 20, { align: 'center' })
  
  addPageFooter(doc)

  // ========================================
  // PÁGINA 8: STATUS DO DOCUMENTO
  // ========================================
  doc.addPage()
  doc.setFillColor(...COLORS.black)
  doc.rect(0, 0, pw, ph, 'F')
  
  addPageHeader(doc, logoDataUrl, 8, totalPages)
  y = 25
  
  // Status do documento
  y = addSectionTitle(doc, 'Status do Documento', y)
  
  addCard(doc, m, y, pw - 2*m, 50)
  
  // Status badge
  const statusY = y + 20
  doc.setFillColor(...(isFinished ? COLORS.green : COLORS.yellow))
  doc.roundedRect(pw/2 - 30, statusY - 8, 60, 16, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.black)
  doc.text(isFinished ? 'FINALIZADO' : 'EM ANDAMENTO', pw/2, statusY + 2, { align: 'center' })
  
  // Data de emissão
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.gray)
  doc.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')}`, pw/2, statusY + 18, { align: 'center' })
  doc.text(`Versão do documento: 1.0`, pw/2, statusY + 26, { align: 'center' })
  doc.text(`ID: ${project.id}`, pw/2, statusY + 34, { align: 'center' })
  
  y += 60
  
  // Assinatura final
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...COLORS.gold)
  doc.text('Elite Blindagens', pw/2, y + 15, { align: 'center' })
  
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.gray)
  doc.text('Proteção elevada ao estado da arte.', pw/2, y + 25, { align: 'center' })
  
  // Linha decorativa final
  doc.setDrawColor(...COLORS.gold)
  doc.setLineWidth(0.5)
  doc.line(pw/3, y + 35, 2*pw/3, y + 35)
  
  addPageFooter(doc)

  // ========================================
  // PÁGINA 9: REGISTRO FOTOGRÁFICO (se houver fotos)
  // ========================================
  if (hasPhotos) {
    doc.addPage()
    doc.setFillColor(...COLORS.black)
    doc.rect(0, 0, pw, ph, 'F')
    
    addPageHeader(doc, logoDataUrl, 9, totalPages)
    y = 25
    
    y = addSectionTitle(doc, 'Registro Fotográfico', y)
    
    // Lista de etapas com fotos
    project.timeline?.forEach((step) => {
      if (step.photos && step.photos.length > 0) {
        if (y > ph - 30) {
          addPageFooter(doc)
          doc.addPage()
          doc.setFillColor(...COLORS.black)
          doc.rect(0, 0, pw, ph, 'F')
          addPageHeader(doc, logoDataUrl, 9, totalPages)
          y = 25
        }
        
        // Nome da etapa
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(...COLORS.gold)
        doc.text(`• ${step.title}`, m + 5, y)
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...COLORS.gray)
        doc.text(`${step.photos.length} foto(s) registrada(s)`, m + 50, y)
        
        if (step.date && step.status === 'completed') {
          doc.text(`- ${new Date(step.date).toLocaleDateString('pt-BR')}`, m + 100, y)
        }
        
        y += 10
      }
    })
    
    y += 10
    
    // Nota sobre fotos
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.gray)
    doc.text('As fotos do registro fotográfico podem ser visualizadas no laudo digital online.', m, y)
    doc.text(`Acesse: ${verifyUrl}`, m, y + 6)
    
    addPageFooter(doc)
  }

  return doc.output('blob')
}

export default generateEliteShieldPDF
