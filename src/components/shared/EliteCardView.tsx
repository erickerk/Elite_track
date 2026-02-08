import { cn } from '../../lib/utils'
import { getQrImageUrl } from '../../utils/qrUtils'
import type { Project } from '../../types'

interface EliteCardViewProps {
  project: Project
  clientName: string
  className?: string
  showQrCode?: boolean
  compact?: boolean
}

export function EliteCardView({ project, clientName, className, showQrCode = true, compact = false }: EliteCardViewProps) {
  const eliteCard = project.eliteCard
  const cardNumber = eliteCard?.cardNumber || `ELITE-${project.id.slice(-8).toUpperCase()}`
  const expiryDate = eliteCard?.expiryDate
    ? new Date(eliteCard.expiryDate).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
    : '01/2029'
  const qrUrl = getQrImageUrl(project.id, { size: 80 })

  return (
    <div className={cn(
      'rounded-3xl relative overflow-hidden',
      'bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#1a1a1a]',
      'border border-[#D4AF37]/30',
      compact ? 'p-5' : 'p-8',
      className
    )}>
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />

      <div className="relative z-10">
        {/* Header: Logo + Badge */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <img src="/logo-elite.png" alt="Elite Blindagens" className={cn(compact ? 'h-8' : 'h-10', 'w-auto mb-1')} />
            <div className="text-[10px] text-gray-400 tracking-widest">MEMBER CARD</div>
          </div>
          <div className="text-right">
            <div className={cn(
              'bg-gradient-to-r from-[#D4AF37]/80 to-[#D4AF37] rounded-md flex items-center justify-center',
              compact ? 'w-12 h-8' : 'w-16 h-10'
            )}>
              <i className={cn('ri-shield-star-line text-black', compact ? 'text-xl' : 'text-2xl')} />
            </div>
          </div>
        </div>

        {/* Card Number + Client */}
        <div className="mb-4">
          <div className={cn('font-mono tracking-widest mb-1', compact ? 'text-lg' : 'text-2xl')}>
            {cardNumber}
          </div>
          <div className={cn('font-semibold', compact ? 'text-sm' : 'text-lg')}>
            {clientName}
          </div>
        </div>

        {/* Vehicle + Plate */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-[10px] text-gray-400 mb-0.5">VEÍCULO</div>
            <div className="text-sm font-semibold">{project.vehicle.brand} {project.vehicle.model}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-400 mb-0.5">PLACA</div>
            <div className="text-sm font-mono font-semibold">{project.vehicle.plate}</div>
          </div>
        </div>

        {/* Validity + Level + QR/Circles */}
        <div className="flex justify-between items-end pt-3 border-t border-white/10">
          <div>
            <div className="text-[10px] text-gray-400 mb-0.5">VÁLIDO ATÉ</div>
            <div className="text-sm font-semibold">{expiryDate}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-400 mb-0.5">BLINDAGEM</div>
            <div className="text-sm font-semibold text-[#D4AF37]">{project.vehicle.blindingLevel || 'N3-A'}</div>
          </div>
          {showQrCode ? (
            <div className="w-14 h-14 bg-white rounded-lg p-0.5 flex items-center justify-center">
              <img src={qrUrl} alt="QR Code" className="w-full h-full rounded" />
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <div className="w-7 h-7 bg-red-500 rounded-full" />
              <div className="w-7 h-7 bg-yellow-500 rounded-full -ml-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EliteCardView
