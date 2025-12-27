import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, Download, Share2, Shield, Award, Calendar,
  User, Car, CheckCircle, QrCode, Printer, Eye, Upload
} from 'lucide-react'
import { COMPANY_INFO } from '../constants/companyInfo'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { cn } from '../lib/utils'
import { useTheme } from '../contexts/ThemeContext'
import { useProjects } from '../contexts/ProjectContext'

export function EliteShield() {
  const { theme } = useTheme()
  const { projects } = useProjects()
  const project = projects[0]
  const isDark = theme === 'dark'
  const [showPreview, setShowPreview] = useState(false)
  const [stampImage, setStampImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const stampInputRef = useRef<HTMLInputElement>(null)

  const laudoData = {
    numero: `LAUDO-${project?.id || 'XXX'}-${new Date().getFullYear()}`,
    dataEmissao: project?.actualDelivery || new Date().toISOString().split('T')[0],
    validade: '5 anos',
    tecnicoResponsavel: 'Eng. Carlos Roberto Silva',
    crea: 'CREA 123456/SP',
  }

  const handleStampUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        setStampImage(reader.result as string)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateLaudoHTML = () => {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Laudo EliteShield™ - ${project.vehicle.brand} ${project.vehicle.model}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { width: 60px; height: 60px; background: linear-gradient(135deg, #D4AF37, #FFD700); border-radius: 12px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; }
          h1 { color: #333; margin: 10px 0; }
          .gold { color: #D4AF37; }
          .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
          .section h3 { color: #D4AF37; margin-bottom: 10px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .item { margin: 5px 0; }
          .item label { color: #666; font-size: 12px; }
          .item p { margin: 2px 0; font-weight: 500; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; align-items: flex-end; }
          .stamp { width: 100px; height: 100px; border: 2px dashed #D4AF37; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
          .stamp img { max-width: 90%; max-height: 90%; object-fit: contain; }
          .qr { text-align: center; }
          .qr img { width: 80px; height: 80px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">⚡</div>
          <h1>LAUDO TÉCNICO DE BLINDAGEM</h1>
          <p class="gold"><strong>EliteShield™</strong></p>
          <p style="font-size: 12px; color: #666;">Documento Nº ${laudoData.numero}</p>
        </div>
        
        <div class="grid">
          <div class="section">
            <h3>🚗 Dados do Veículo</h3>
            <div class="item"><label>Marca:</label><p>${project.vehicle.brand}</p></div>
            <div class="item"><label>Modelo:</label><p>${project.vehicle.model}</p></div>
            <div class="item"><label>Ano:</label><p>${project.vehicle.year}</p></div>
            <div class="item"><label>Cor:</label><p>${project.vehicle.color}</p></div>
            <div class="item"><label>Placa:</label><p>${project.vehicle.plate}</p></div>
          </div>
          
          <div class="section">
            <h3>👤 Dados do Cliente</h3>
            <div class="item"><label>Nome:</label><p>${project.user.name}</p></div>
            <div class="item"><label>E-mail:</label><p>${project.user.email}</p></div>
            <div class="item"><label>Telefone:</label><p>${project.user.phone}</p></div>
          </div>
        </div>
        
        <div class="section">
          <h3>🛡️ Especificações da Blindagem</h3>
          <div class="grid">
            <div class="item"><label>Nível de Proteção:</label><p>${project.vehicle.blindingLevel}</p></div>
            <div class="item"><label>Certificação:</label><p>ABNT NBR 15000</p></div>
            <div class="item"><label>Data de Instalação:</label><p>${new Date(project.startDate).toLocaleDateString('pt-BR')}</p></div>
            <div class="item"><label>Data de Conclusão:</label><p>${project.actualDelivery ? new Date(project.actualDelivery).toLocaleDateString('pt-BR') : 'Em andamento'}</p></div>
            <div class="item"><label>Validade:</label><p>${laudoData.validade}</p></div>
          </div>
        </div>
        
        <div class="section">
          <h3>🏆 Materiais Utilizados</h3>
          <ul>
            <li>Manta Aramida Kevlar - LOT-2025-K001 (Portas e Colunas)</li>
            <li>Aço Balístico Hardox 500 - LOT-2025-H002 (Assoalho)</li>
            <li>Vidro Laminado Multilayer - LOT-2025-V003 (Todos os vidros)</li>
          </ul>
        </div>
        
        <div class="footer">
          <div>
            <p><strong>${laudoData.tecnicoResponsavel}</strong></p>
            <p style="font-size: 12px; color: #666;">${laudoData.crea}</p>
            <p style="font-size: 12px; color: #666;">Responsável Técnico</p>
          </div>
          <div class="stamp">
            ${stampImage ? `<img src="${stampImage}" alt="Carimbo" />` : '<span style="color: #999; font-size: 10px; text-align: center;">Carimbo<br/>Elite</span>'}
          </div>
          <div class="qr">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${window.location.origin}/verify/${project.id}`)}&color=D4AF37" alt="QR Code" />
            <p style="font-size: 10px; color: #666;">Verifique a autenticidade</p>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #999;">
          <p>${COMPANY_INFO.name} - ${COMPANY_INFO.address.full}</p>
          <p>Tel: ${COMPANY_INFO.phoneFormatted} | ${COMPANY_INFO.websiteDisplay}</p>
        </div>
      </body>
      </html>
    `
  }

  const handleDownload = () => {
    const htmlContent = generateLaudoHTML()
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Laudo_EliteShield_${project.vehicle.plate}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    alert('Laudo EliteShield™ baixado com sucesso!\n\nAbra o arquivo HTML no navegador e use Ctrl+P para salvar como PDF.')
  }

  const handleShare = () => {
    const laudoText = `
🛡️ LAUDO ELITESHIELD™

Veículo: ${project.vehicle.brand} ${project.vehicle.model}
Placa: ${project.vehicle.plate}
Nível: ${project.vehicle.blindingLevel}
Nº Laudo: ${laudoData.numero}
Validade: ${laudoData.validade}

Técnico: ${laudoData.tecnicoResponsavel}
${laudoData.crea}

✅ Blindagem certificada ABNT NBR 15000

${COMPANY_INFO.name}
${COMPANY_INFO.phoneFormatted}
${COMPANY_INFO.websiteDisplay}
    `.trim()

    if (navigator.share) {
      navigator.share({
        title: 'Laudo EliteShield™',
        text: laudoText,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(laudoText)
      alert('Informações do laudo copiadas para a área de transferência!')
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(generateLaudoHTML())
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-gold flex items-center justify-center">
          <Shield className="w-8 h-8 text-carbon-900" />
        </div>
        <h1 className="text-h2 font-bold mb-1">EliteShield™</h1>
        <p className="text-caption text-gray-400">
          Laudo Técnico de Blindagem
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="elevated" className="border-2 border-gold/30">
          <div className="text-center mb-6">
            <Badge variant="success" className="mb-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              Laudo Disponível
            </Badge>
            <p className="text-micro text-gray-400">
              Emitido em {new Date(laudoData.dataEmissao).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className={cn(
            'p-4 rounded-xl mb-6',
            isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
          )}>
            <div className="flex items-center gap-4">
              <div className="w-20 h-16 rounded-xl overflow-hidden bg-carbon-700">
                <img
                  src={project.vehicle.images[0]}
                  alt={project.vehicle.model}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold">
                  {project.vehicle.brand} {project.vehicle.model}
                </p>
                <p className="text-caption text-gray-400">
                  {project.vehicle.year} • {project.vehicle.color}
                </p>
                <p className="text-caption text-gray-400">
                  Placa: {project.vehicle.plate}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className={cn(
              'p-3 rounded-xl text-center',
              isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
            )}>
              <FileText className="w-5 h-5 mx-auto mb-1 text-gold" />
              <p className="text-micro text-gray-400">Nº do Laudo</p>
              <p className="font-mono text-sm font-semibold">{laudoData.numero}</p>
            </div>
            
            <div className={cn(
              'p-3 rounded-xl text-center',
              isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
            )}>
              <Award className="w-5 h-5 mx-auto mb-1 text-gold" />
              <p className="text-micro text-gray-400">Nível</p>
              <p className="font-semibold">{project.vehicle.blindingLevel}</p>
            </div>
            
            <div className={cn(
              'p-3 rounded-xl text-center',
              isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
            )}>
              <Calendar className="w-5 h-5 mx-auto mb-1 text-gold" />
              <p className="text-micro text-gray-400">Validade</p>
              <p className="font-semibold">{laudoData.validade}</p>
            </div>
            
            <div className={cn(
              'p-3 rounded-xl text-center',
              isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
            )}>
              <User className="w-5 h-5 mx-auto mb-1 text-gold" />
              <p className="text-micro text-gray-400">Técnico</p>
              <p className="font-semibold text-sm">{laudoData.tecnicoResponsavel.split(' ').slice(-1)[0]}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Button className="w-full" onClick={() => setShowPreview(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Visualizar Laudo Completo
            </Button>
            
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="w-5 h-5 text-gold" />
              QR Code do Laudo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                    `${window.location.origin}/verify/${project.id}`
                  )}&color=D4AF37`}
                  alt="QR Code"
                  className="w-20 h-20"
                />
              </div>
              <div>
                <p className="text-caption text-gray-400 mb-1">
                  Escaneie para verificar autenticidade
                </p>
                <p className="font-mono text-micro text-gold">
                  {project.qrCode}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="default" className={cn(
          'border-l-4 border-l-gold',
          isDark ? 'bg-gold/5' : 'bg-gold/10'
        )}>
          <p className="text-caption">
            <span className="font-semibold text-gold">Importante:</span> Este laudo 
            certifica que a blindagem foi realizada conforme as normas técnicas 
            vigentes e padrões de qualidade Elite Blindagens.
          </p>
        </Card>
      </motion.div>

      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Laudo EliteShield™"
        size="lg"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="text-center border-b border-carbon-700 pb-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-gold flex items-center justify-center">
              <Shield className="w-8 h-8 text-carbon-900" />
            </div>
            <h2 className="text-h2 font-bold">LAUDO TÉCNICO DE BLINDAGEM</h2>
            <p className="text-gold font-semibold">EliteShield™</p>
            <p className="text-micro text-gray-400 mt-2">
              Documento Nº {laudoData.numero}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Car className="w-4 h-4 text-gold" />
                Dados do Veículo
              </h3>
              <div className={cn(
                'p-3 rounded-xl space-y-1',
                isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
              )}>
                <p><span className="text-gray-400">Marca:</span> {project.vehicle.brand}</p>
                <p><span className="text-gray-400">Modelo:</span> {project.vehicle.model}</p>
                <p><span className="text-gray-400">Ano:</span> {project.vehicle.year}</p>
                <p><span className="text-gray-400">Cor:</span> {project.vehicle.color}</p>
                <p><span className="text-gray-400">Placa:</span> {project.vehicle.plate}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-gold" />
                Dados do Cliente
              </h3>
              <div className={cn(
                'p-3 rounded-xl space-y-1',
                isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
              )}>
                <p><span className="text-gray-400">Nome:</span> {project.user.name}</p>
                <p><span className="text-gray-400">E-mail:</span> {project.user.email}</p>
                <p><span className="text-gray-400">Telefone:</span> {project.user.phone}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" />
              Especificações da Blindagem
            </h3>
            <div className={cn(
              'p-4 rounded-xl',
              isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
            )}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-micro text-gray-400">Nível de Proteção</p>
                  <p className="font-semibold">{project.vehicle.blindingLevel}</p>
                </div>
                <div>
                  <p className="text-micro text-gray-400">Certificação</p>
                  <p className="font-semibold">ABNT NBR 15000</p>
                </div>
                <div>
                  <p className="text-micro text-gray-400">Data de Instalação</p>
                  <p className="font-semibold">{new Date(project.startDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-micro text-gray-400">Data de Conclusão</p>
                  <p className="font-semibold">{project.actualDelivery ? new Date(project.actualDelivery).toLocaleDateString('pt-BR') : 'Em andamento'}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-gold" />
              Materiais Utilizados
            </h3>
            <div className="space-y-2">
              {[
                { nome: 'Manta Aramida Kevlar', lote: 'LOT-2025-K001', area: 'Portas e Colunas' },
                { nome: 'Aço Balístico Hardox 500', lote: 'LOT-2025-H002', area: 'Assoalho' },
                { nome: 'Vidro Laminado Multilayer', lote: 'LOT-2025-V003', area: 'Todos os vidros' },
              ].map((material, index) => (
                <div key={index} className={cn(
                  'p-3 rounded-xl flex justify-between items-center',
                  isDark ? 'bg-carbon-700/30' : 'bg-gray-50'
                )}>
                  <div>
                    <p className="font-medium">{material.nome}</p>
                    <p className="text-micro text-gray-400">{material.area}</p>
                  </div>
                  <Badge variant="gold" size="sm">{material.lote}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-carbon-700 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{laudoData.tecnicoResponsavel}</p>
                <p className="text-micro text-gray-400">{laudoData.crea}</p>
                <p className="text-micro text-gray-400">Responsável Técnico</p>
              </div>
              <div className="text-right">
                <input
                  type="file"
                  ref={stampInputRef}
                  onChange={handleStampUpload}
                  accept="image/*"
                  className="hidden"
                  title="Upload de carimbo ou assinatura"
                  aria-label="Upload de carimbo ou assinatura"
                />
                <div 
                  onClick={() => stampInputRef.current?.click()}
                  className={cn(
                    "w-24 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-gold hover:bg-gold/5",
                    stampImage ? "border-gold bg-gold/10" : "border-gold/50"
                  )}
                  title="Clique para adicionar carimbo ou assinatura"
                >
                  {isUploading ? (
                    <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full"></div>
                  ) : stampImage ? (
                    <img src={stampImage} alt="Carimbo" className="w-20 h-20 object-contain rounded" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gold/60 mb-1" />
                      <p className="text-micro text-gray-400 text-center">Carimbo<br/>Elite</p>
                    </>
                  )}
                </div>
                {stampImage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setStampImage(null); }}
                    className="text-micro text-red-400 hover:text-red-300 mt-1"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Aviso de campo obrigatório */}
          {!stampImage && (
            <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center gap-2">
              <i className="ri-alert-line text-yellow-400"></i>
              <p className="text-sm text-yellow-400">
                <strong>Campo obrigatório:</strong> O carimbo/assinatura do executor é necessário para validar o laudo.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleDownload}
              disabled={!stampImage}
              title={!stampImage ? "Adicione o carimbo para baixar o PDF" : "Baixar PDF do laudo"}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
