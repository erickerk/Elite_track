/**
 * PublicLaudo - Laudo PÚBLICO com Whitelist de Dados
 * 
 * Esta é a versão SEGURA do laudo para consulta pública.
 * Exibe APENAS os dados permitidos pela whitelist.
 * 
 * NUNCA DEVE EXIBIR:
 * - Nome do cliente, email, telefone
 * - ID do executor, nome do executor
 * - Timeline interna, fotos do processo
 * - Notas técnicas, valores
 */

import { Shield, CheckCircle, Calendar, Award, QrCode } from 'lucide-react'
import type { PublicProjectData } from '../../utils/publicDataFilter'
import { getQrImageUrl } from '../../utils/qrUtils'

interface PublicLaudoProps {
  data: PublicProjectData
}

export function PublicLaudo({ data }: PublicLaudoProps) {
  const isAuthentic = data.status === 'authentic'

  if (!isAuthentic) {
    return (
      <div className="bg-black min-h-screen text-white p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Projeto Não Encontrado</h1>
          <p className="text-gray-400">
            O código consultado não corresponde a nenhum projeto registrado em nosso sistema.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen text-white">
      {/* CAPA - Identificação Pública */}
      <section className="relative p-6 border-b border-[#D4AF37]/30">
        {/* Logo Elite */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4">
            <img 
              src="/logo-elite.png" 
              alt="Elite Blindagens"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className="hidden w-20 h-20 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] rounded-2xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-black" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#D4AF37] tracking-wider mb-2">
            EliteShield™
          </h1>
          <p className="text-sm text-gray-400">Verificação Pública de Autenticidade</p>
        </div>

        {/* Status de Autenticidade */}
        <div className="p-6 bg-green-500/10 border-2 border-green-500/30 rounded-2xl mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <h2 className="text-2xl font-bold text-green-400">
              {data.statusLabel}
            </h2>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-white font-semibold">✔ Executada pela Elite Blindagens</p>
            <p className="text-white font-semibold">✔ Processo certificado</p>
            <p className="text-white font-semibold">✔ Registro ativo no sistema</p>
          </div>
        </div>

        {/* Dados do Veículo (PARCIAIS) */}
        <div className="p-4 bg-white/5 rounded-xl border border-[#D4AF37]/20 space-y-3">
          <h3 className="text-[#D4AF37] font-bold text-lg mb-3">Identificação do Veículo</h3>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Marca</span>
              <p className="text-white font-semibold">{data.vehicle.brand}</p>
            </div>
            <div>
              <span className="text-gray-400">Modelo</span>
              <p className="text-white font-semibold">{data.vehicle.model}</p>
            </div>
            <div>
              <span className="text-gray-400">Ano</span>
              <p className="text-white font-semibold">{data.vehicle.year}</p>
            </div>
            <div>
              <span className="text-gray-400">Cor</span>
              <p className="text-white font-semibold">{data.vehicle.color}</p>
            </div>
            <div>
              <span className="text-gray-400">Placa</span>
              <p className="text-white font-semibold font-mono">{data.vehicle.platePartial}</p>
            </div>
            <div>
              <span className="text-gray-400">Chassi (últimos 4)</span>
              <p className="text-white font-semibold font-mono">{data.vehicle.chassiLast4}</p>
            </div>
          </div>
        </div>
      </section>

      {/* NÍVEL DE PROTEÇÃO */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-[#D4AF37]" />
          <h2 className="text-xl font-bold text-[#D4AF37]">Nível de Proteção</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="text-sm text-gray-400 mb-1">Certificação</div>
            <div className="text-2xl font-bold text-white">{data.protectionLevel}</div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl">
            <div className="text-sm text-gray-400 mb-1">Linha de Blindagem</div>
            <div className="text-xl font-bold text-[#D4AF37]">{data.blindingLine}</div>
            <div className="text-xs text-gray-500 mt-2">
              {data.blindingLine === 'SafeCore™' && 'Proteção balística de alta performance'}
              {data.blindingLine === 'UltraLite™' && 'Tecnologia ultra-leve premium'}
            </div>
          </div>
        </div>
      </section>

      {/* DATAS E VALIDADE */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-[#D4AF37]" />
          <h2 className="text-xl font-bold text-[#D4AF37]">Data e Validade</h2>
        </div>

        <div className="space-y-3">
          {data.executionDate && (
            <div className="flex justify-between p-3 bg-white/5 rounded-xl">
              <span className="text-gray-400">Data de Execução</span>
              <span className="text-white font-semibold">
                {new Date(data.executionDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}

          {data.completedDate && (
            <div className="flex justify-between p-3 bg-white/5 rounded-xl">
              <span className="text-gray-400">Concluído em</span>
              <span className="text-green-400 font-semibold">
                {new Date(data.completedDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* GARANTIAS */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-[#D4AF37]" />
          <h2 className="text-xl font-bold text-[#D4AF37]">Garantias Ativas</h2>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-white/5 rounded-xl border-l-4 border-green-500">
            <div className="font-semibold text-white mb-1">
              ✓ Vidros Blindados
            </div>
            <div className="text-sm text-gray-400">
              {data.warranties.glass.description}
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border-l-4 border-green-500">
            <div className="font-semibold text-white mb-1">
              ✓ Materiais Balísticos
            </div>
            <div className="text-sm text-gray-400">
              {data.warranties.materials.description}
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border-l-4 border-yellow-500">
            <div className="font-semibold text-white mb-1">
              ✓ Acabamento
            </div>
            <div className="text-sm text-gray-400">
              {data.warranties.finishing.description}
            </div>
          </div>
        </div>
      </section>

      {/* MANUTENÇÃO */}
      {data.maintenance?.hasHistory && (
        <section className="p-6 border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-xl font-bold text-[#D4AF37]">Manutenção</h2>
          </div>

          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-400 mb-1">Status</div>
                <div className="text-white font-semibold">Manutenção em Dia</div>
              </div>
              {data.maintenance.lastDate && (
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1">Última Manutenção</div>
                  <div className="text-green-400 font-semibold">
                    {new Date(data.maintenance.lastDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* AUTENTICIDADE - QR CODE E ID */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <div className="flex items-center gap-3 mb-4">
          <QrCode className="w-6 h-6 text-[#D4AF37]" />
          <h2 className="text-xl font-bold text-[#D4AF37]">Autenticidade</h2>
        </div>

        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-2xl">
              <img
                src={getQrImageUrl(data.id, { size: 200 })}
                alt="QR Code EliteTrace"
                className="w-48 h-48"
              />
            </div>
          </div>

          {/* ID EliteTrace */}
          <div className="p-4 bg-white/5 rounded-xl border border-[#D4AF37]/30">
            <div className="text-sm text-gray-400 mb-2 text-center">
              ID EliteTrace™
            </div>
            <div className="font-mono text-[#D4AF37] text-center break-all text-sm">
              {data.eliteTraceId}
            </div>
          </div>

          {/* Aviso de Autenticidade */}
          <div className="p-4 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/30">
            <p className="text-sm text-center text-gray-300">
              ✓ Este registro é protegido por ID único EliteTrace™
            </p>
            <p className="text-xs text-center text-gray-500 mt-2">
              Documento autêntico e não editável
            </p>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="p-6 text-center text-sm text-gray-500">
        <p className="mb-2">© Elite Blindagens - Todos os direitos reservados</p>
        <p className="text-xs">
          Este documento foi gerado automaticamente pelo sistema EliteTrack™
        </p>
        <p className="text-xs text-[#D4AF37] mt-3">
          Para mais informações, entre em contato conosco
        </p>
      </footer>
    </div>
  )
}
