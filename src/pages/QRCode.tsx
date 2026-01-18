import { useState } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Share2, Download, Copy, Check } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/utils'
import { useTheme } from '../contexts/ThemeContext'
import { useProjects } from '../contexts/ProjectContext'
import { getAppBaseUrl } from '../constants/companyInfo'

export function QRCodePage() {
  const { theme } = useTheme()
  const { projects } = useProjects()
  const project = projects[0]
  const isDark = theme === 'dark'
  const [copied, setCopied] = useState(false)

  const verifyUrl = `${getAppBaseUrl()}/verify/${project?.id || ''}`
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    verifyUrl
  )}&bgcolor=${isDark ? '1A1A1A' : 'FFFFFF'}&color=D4AF37`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(verifyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-h2 font-bold mb-1">EliteTrace™</h1>
        <p className="text-caption text-gray-400">
          QR Code exclusivo do seu veículo
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="elevated" className="text-center">
          <div className="relative inline-block">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/30"
            >
              <div className="p-3 bg-white rounded-xl">
                <img
                  src={qrCodeUrl}
                  alt="QR Code EliteTrace"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-gold rounded-full flex items-center justify-center shadow-gold"
            >
              <QrCode className="w-6 h-6 text-carbon-900" />
            </motion.div>
          </div>

          <div className="mt-6 space-y-2">
            <p className="font-semibold text-body">
              {project?.vehicle.brand} {project?.vehicle.model}
            </p>
            <Badge variant="gold">{project?.vehicle.blindingLevel}</Badge>
            <p className="text-caption text-gray-400 font-mono">
              {project?.qrCode}
            </p>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-3"
      >
        <Button variant="outline" className="flex-col h-auto py-4">
          <Share2 className="w-5 h-5 mb-2" />
          <span className="text-caption">Compartilhar</span>
        </Button>
        
        <Button variant="outline" className="flex-col h-auto py-4">
          <Download className="w-5 h-5 mb-2" />
          <span className="text-caption">Baixar</span>
        </Button>
        
        <Button
          variant="outline"
          className="flex-col h-auto py-4"
          onClick={() => void handleCopy()}
        >
          {copied ? (
            <Check className="w-5 h-5 mb-2 text-status-success" />
          ) : (
            <Copy className="w-5 h-5 mb-2" />
          )}
          <span className="text-caption">{copied ? 'Copiado!' : 'Copiar'}</span>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="bordered">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-gold" />
            Como usar o EliteTrace™
          </h3>
          
          <div className="space-y-3 text-caption text-gray-400">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-micro font-bold flex-shrink-0">
                1
              </span>
              <p>Escaneie o QR Code com qualquer leitor de câmera</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-micro font-bold flex-shrink-0">
                2
              </span>
              <p>Acesse a página de verificação da Elite Blindagens</p>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-micro font-bold flex-shrink-0">
                3
              </span>
              <p>Visualize o certificado de autenticidade e histórico completo</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card
          variant="default"
          className={cn(
            'border-l-4 border-l-gold',
            isDark ? 'bg-gold/5' : 'bg-gold/10'
          )}
        >
          <p className="text-caption">
            <span className="font-semibold text-gold">Dica:</span> Cole o QR Code
            em local visível do veículo para facilitar a verificação de
            autenticidade da blindagem por terceiros.
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
