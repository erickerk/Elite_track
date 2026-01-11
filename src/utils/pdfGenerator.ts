import jsPDF from 'jspdf'
import type { Project } from '../types'
import { gerarDadosLaudo } from '../config/eliteshield-laudo-template'
import { COMPANY_INFO } from '../constants/companyInfo'

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

  doc.setFillColor(gold[0], gold[1], gold[2])
  doc.roundedRect(pw/2 - 15, y, 30, 30, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(black[0], black[1], black[2])
  doc.text('E', pw/2, y + 20, { align: 'center' })
  y += 40

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

  doc.setFontSize(12)
  doc.setTextColor(black[0], black[1], black[2])
  doc.setFont('helvetica', 'bold')
  doc.text('VEÍCULO', m, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${dados.veiculo.marca} ${dados.veiculo.modelo}`, m, y)
  y += 6
  doc.text(`Placa: ${dados.veiculo.placa}`, m, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('CLIENTE', m, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(dados.cliente.nome, m, y)
  y += 15

  const fin = project.status === 'completed' || project.status === 'delivered'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(fin ? 0 : 200, fin ? 128 : 150, fin ? 0 : 0)
  doc.text(`STATUS: ${fin ? 'FINALIZADO' : 'EM ANDAMENTO'}`, pw/2, y, { align: 'center' })

  doc.setFontSize(8)
  doc.setTextColor(gray[0], gray[1], gray[2])
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pw/2, ph - 20, { align: 'center' })
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
  doc.setDrawColor(gold[0], gold[1], gold[2])
  doc.setLineWidth(2)
  doc.rect(qx, y, qs, qs)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(black[0], black[1], black[2])
  doc.text('QR CODE', pw/2, y + qs/2, { align: 'center' })
  y += qs + 10

  doc.setFontSize(8)
  doc.setTextColor(gold[0], gold[1], gold[2])
  doc.text(dados.qrCode || project.qrCode || `PRJ-${project.id}`, pw/2, y, { align: 'center' })

  return doc.output('blob')
}

export default generateEliteShieldPDF
