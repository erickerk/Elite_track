/**
 * EliteShield - Página de Visualização do Laudo Técnico para Clientes
 * 
 * Esta página exibe o laudo técnico completo usando o componente padrão EliteShieldLaudo.
 * Sincronizado com PublicVerification e ExecutorDashboard.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, ArrowLeft, Shield, Loader2 } from 'lucide-react'
import { useProjects } from '../contexts/ProjectContext'
import { EliteShieldLaudo } from '../components/laudo/EliteShieldLaudo'
import { useNotifications } from '../contexts/NotificationContext'
import { generateEliteShieldPDF } from '../utils/pdfGenerator'

export function EliteShield() {
  const navigate = useNavigate()
  const { projects } = useProjects()
  const { addNotification } = useNotifications()
  const project = projects[0]
  const [isExporting, setIsExporting] = useState(false)

  // Função para exportar PDF completo usando pdfGenerator
  const handleExportPDF = async () => {
    if (!project) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Nenhum projeto encontrado para gerar o PDF'
      })
      return
    }

    setIsExporting(true)
    addNotification({
      type: 'info',
      title: 'Gerando PDF',
      message: 'Seu laudo EliteShield está sendo gerado...'
    })

    try {
      // Gerar PDF com todas as informações e QR code funcional
      const pdfBlob = await generateEliteShieldPDF(project)
      
      // Download do PDF
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Laudo_EliteShield_${project.vehicle.plate}_${new Date().getTime()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addNotification({
        type: 'success',
        title: 'PDF Gerado',
        message: 'Laudo EliteShield gerado com sucesso!'
      })
      setIsExporting(false)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      addNotification({
        type: 'error',
        title: 'Erro ao gerar PDF',
        message: 'Ocorreu um erro ao gerar o PDF do laudo'
      })
      setIsExporting(false)
    }
  }

  // Se não houver projeto, exibir mensagem
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Nenhum Projeto Encontrado</h2>
          <p className="text-gray-400 mb-6">Você ainda não possui nenhum projeto de blindagem</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header com botão voltar */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-[#D4AF37]/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          
          <button
            onClick={() => void handleExportPDF()}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Baixar PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Laudo Completo usando o componente padrão */}
      <EliteShieldLaudo 
        project={project}
        onExportPDF={() => void handleExportPDF()}
        showExportButton={false}
      />
    </div>
  )
}
