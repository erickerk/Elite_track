/**
 * EliteShield™ - Componente de Laudo Técnico de Blindagem Veicular
 * 
 * Este componente renderiza o laudo completo com 15 seções/telas.
 * Usado em: PublicVerification, ExecutorDashboard, Geração de PDF
 */

import { useState } from 'react'
import { cn } from '../../lib/utils'
import { 
  Shield, User, FileText, CheckCircle, Clock, 
  Camera, Eye, Layers, Settings, QrCode, ChevronDown, ChevronUp,
  Car, Download
} from 'lucide-react'
import type { Project } from '../../types'
import { 
  gerarDadosLaudo,
  LAUDO_TEXTOS, 
  LINHAS_BLINDAGEM,
  ESPECIFICACOES_TECNICAS,
  GARANTIAS_PADRAO,
  TESTES_VERIFICACOES
} from '../../config/eliteshield-laudo-template'

interface EliteShieldLaudoProps {
  project: Project
  onExportPDF?: () => void
  showExportButton?: boolean
  compact?: boolean
}

export function EliteShieldLaudo({ 
  project, 
  onExportPDF, 
  showExportButton = true,
  compact = false 
}: EliteShieldLaudoProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const dados = gerarDadosLaudo(project)
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  // Calcular progresso (não utilizado atualmente)
  // const etapasCompletas = project.timeline?.filter(s => s.status === 'completed').length || 0
  // const totalEtapas = project.timeline?.length || 7
  // const progresso = Math.round((etapasCompletas / totalEtapas) * 100)

  // Status do laudo
  const isFinished = project.status === 'completed' || project.status === 'delivered'

  return (
    <div className="bg-black min-h-screen text-white">
      {/* ================================================================ */}
      {/* TELA 1 - CAPA DO ELITESHIELD */}
      {/* ================================================================ */}
      <section className="relative p-6 border-b border-[#D4AF37]/30">
        {/* Logo Elite Blindagens */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4">
            <img 
              src="/logo-elite.png" 
              alt="Elite Blindagens Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback para ícone se imagem não carregar
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className="hidden w-20 h-20 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] rounded-2xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-black" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#D4AF37] tracking-wider">
            {LAUDO_TEXTOS.titulo}
          </h1>
          <p className="text-sm text-gray-400 mt-1">Laudo Técnico Digital</p>
        </div>

        {/* Foto do Veículo */}
        {dados.fotos.veiculo && (
          <div className="relative rounded-2xl overflow-hidden mb-6 border-2 border-[#D4AF37]/30">
            <img 
              src={dados.fotos.veiculo} 
              alt={`${dados.veiculo.marca} ${dados.veiculo.modelo}`}
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-[#D4AF37] text-sm">Veículo Blindado</p>
              <p className="text-white font-bold text-lg">
                {dados.veiculo.marca} {dados.veiculo.modelo}
              </p>
            </div>
          </div>
        )}

        {/* Dados Resumidos */}
        <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-[#D4AF37]/20">
          <div className="flex justify-between">
            <span className="text-gray-400">Cliente</span>
            <span className="text-white font-semibold">{dados.cliente.nome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Veículo</span>
            <span className="text-white">{dados.veiculo.marca} {dados.veiculo.modelo} / {dados.veiculo.anoModelo}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Status</span>
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-semibold",
              isFinished ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
            )}>
              {isFinished ? '✓ Finalizado' : '⏳ Em Andamento'}
            </span>
          </div>
        </div>

        {/* Linha Dourada */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mt-6" />

        {/* Datas Importantes */}
        <div className="mt-4 space-y-2 text-center text-sm">
          {/* Data de Recebimento */}
          {dados.datas.recebimento && (
            <p className="text-gray-500">
              Recebido em: {new Date(dados.datas.recebimento).toLocaleDateString('pt-BR')}
            </p>
          )}
          
          {/* Data de Conclusão */}
          {dados.datas.conclusao && (
            <p className="text-gray-400">
              Concluído em: {new Date(dados.datas.conclusao).toLocaleDateString('pt-BR')}
            </p>
          )}
          
          {/* Data de Entrega (IMPORTANTE) */}
          {dados.datas.entrega ? (
            <p className="text-green-400 font-semibold">
              ✓ Entregue em: {new Date(dados.datas.entrega).toLocaleDateString('pt-BR')}
            </p>
          ) : dados.datas.previsaoEntrega && (
            <p className="text-yellow-400">
              Previsão de entrega: {new Date(dados.datas.previsaoEntrega).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {/* Botão Exportar PDF */}
        {showExportButton && onExportPDF && (
          <button
            onClick={onExportPDF}
            className="w-full mt-6 bg-[#D4AF37] text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#F4D03F] transition-colors"
          >
            <Download className="w-5 h-5" />
            Baixar Laudo em PDF
          </button>
        )}
      </section>

      {/* ================================================================ */}
      {/* TELA 2 - IDENTIFICAÇÃO DO VEÍCULO */}
      {/* ================================================================ */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <SectionHeader 
          icon={Car} 
          title="Identificação do Veículo" 
          expanded={expandedSection === 'veiculo'}
          onToggle={() => toggleSection('veiculo')}
        />
        
        <div className={cn(
          "mt-4 space-y-3 transition-all",
          expandedSection === 'veiculo' || !compact ? 'block' : 'hidden'
        )}>
          <DataRow label="Marca" value={dados.veiculo.marca} />
          <DataRow label="Modelo" value={dados.veiculo.modelo} />
          <DataRow label="Ano/Modelo" value={dados.veiculo.anoModelo} />
          <DataRow label="Cor" value={dados.veiculo.cor} />
          <DataRow label="Placa" value={dados.veiculo.placa} highlight />
          <DataRow label="Chassi" value={dados.veiculo.chassi} />
          <DataRow label="KM Check-in" value={dados.veiculo.kmCheckin} />
          <DataRow label="Tipo" value={dados.veiculo.tipo} />
        </div>
      </section>

      {/* ================================================================ */}
      {/* TELA 3 - IDENTIFICAÇÃO DO CLIENTE */}
      {/* ================================================================ */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <SectionHeader 
          icon={User} 
          title="Dados do Cliente" 
          expanded={expandedSection === 'cliente'}
          onToggle={() => toggleSection('cliente')}
        />
        
        <div className={cn(
          "mt-4 space-y-3 transition-all",
          expandedSection === 'cliente' || !compact ? 'block' : 'hidden'
        )}>
          <DataRow label="Nome / Razão Social" value={dados.cliente.nome} />
          {dados.cliente.cpfCnpj && <DataRow label="CPF/CNPJ" value={dados.cliente.cpfCnpj} />}
          <DataRow label="Telefone" value={dados.cliente.telefone} />
          <DataRow label="E-mail" value={dados.cliente.email} />
          {dados.cliente.cidade && dados.cliente.estado && (
            <DataRow label="Cidade / Estado" value={`${dados.cliente.cidade} / ${dados.cliente.estado}`} />
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/* TELA 4 - LINHA DE BLINDAGEM */}
      {/* ================================================================ */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <SectionHeader 
          icon={Shield} 
          title="Linha de Blindagem" 
          expanded={expandedSection === 'linha'}
          onToggle={() => toggleSection('linha')}
        />
        
        <div className={cn(
          "mt-4 transition-all",
          expandedSection === 'linha' || !compact ? 'block' : 'hidden'
        )}>
          {/* Card da Linha Selecionada */}
          <div className={cn(
            "p-4 rounded-xl border-2",
            dados.blindagem.linha === 'ultralite' 
              ? "border-[#D4AF37] bg-[#D4AF37]/10" 
              : "border-blue-500 bg-blue-500/10"
          )}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-lg">
                {dados.blindagem.linha === 'ultralite' 
                  ? LINHAS_BLINDAGEM.ultralite.nome 
                  : LINHAS_BLINDAGEM.safecore.nome}
              </h4>
              <span className={cn(
                "px-2 py-1 rounded text-xs font-semibold",
                dados.blindagem.linha === 'ultralite'
                  ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                  : "bg-blue-500/20 text-blue-400"
              )}>
                {dados.blindagem.linha === 'ultralite'
                  ? LINHAS_BLINDAGEM.ultralite.selo
                  : LINHAS_BLINDAGEM.safecore.selo}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-3">
              {dados.blindagem.linha === 'ultralite'
                ? LINHAS_BLINDAGEM.ultralite.descricao
                : LINHAS_BLINDAGEM.safecore.descricao}
            </p>
            <div className="flex gap-4 text-sm">
              <span className="text-[#D4AF37]">Nível: {dados.blindagem.nivel}</span>
              <span className="text-gray-400">Uso: {dados.blindagem.uso}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TELA 5 - ESPECIFICAÇÃO TÉCNICA */}
      {/* ================================================================ */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <SectionHeader 
          icon={Settings} 
          title="Especificação Técnica" 
          expanded={expandedSection === 'specs'}
          onToggle={() => toggleSection('specs')}
        />
        
        <div className={cn(
          "mt-4 space-y-4 transition-all",
          expandedSection === 'specs' || !compact ? 'block' : 'hidden'
        )}>
          {/* Vidros Blindados */}
          <div className="p-4 bg-white/5 rounded-xl border border-[#D4AF37]/20">
            <h4 className="font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Vidros Blindados
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <DataRow label="Fabricante" value={ESPECIFICACOES_TECNICAS.vidros.fabricante} small />
              <DataRow label="Espessura" value={ESPECIFICACOES_TECNICAS.vidros.espessura} small />
              <DataRow label="Tipo" value={ESPECIFICACOES_TECNICAS.vidros.camadas} small />
              <DataRow label="Garantia" value={ESPECIFICACOES_TECNICAS.vidros.garantia} small />
            </div>
          </div>

          {/* Materiais Opacos */}
          <div className="p-4 bg-white/5 rounded-xl border border-[#D4AF37]/20">
            <h4 className="font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Materiais Opacos
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <DataRow label="Material" value={ESPECIFICACOES_TECNICAS.opacos.material} small />
              <DataRow label="Camadas" value={ESPECIFICACOES_TECNICAS.opacos.camadas} small />
              <DataRow label="Complemento" value={ESPECIFICACOES_TECNICAS.opacos.complemento} small />
              <DataRow label="Fabricante" value={ESPECIFICACOES_TECNICAS.opacos.fabricante} small />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TELA 7 - REGISTRO FOTOGRÁFICO */}
      {/* ================================================================ */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <SectionHeader 
          icon={Camera} 
          title="Registro Fotográfico" 
          expanded={expandedSection === 'fotos'}
          onToggle={() => toggleSection('fotos')}
        />
        
        <div className={cn(
          "mt-4 transition-all",
          expandedSection === 'fotos' || !compact ? 'block' : 'hidden'
        )}>
          {/* Grid de Fotos por Etapa - Padrão Uniforme */}
          {project.timeline?.filter(step => step.photos && step.photos.length > 0).map((step) => (
            <div key={step.id} className="mb-4">
              <h4 className="text-sm text-[#D4AF37] mb-2">{step.title}</h4>
              <div className="grid grid-cols-3 gap-2">
                {step.photos?.slice(0, 6).map((photo, photoIdx) => (
                  <div key={photoIdx} className="relative aspect-square rounded-lg overflow-hidden border border-[#D4AF37]/20">
                    <img src={photo} alt={`${step.title} - Foto ${photoIdx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                      <p className="text-xs text-gray-300 truncate">{step.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Aviso se não houver fotos */}
          {(!project.timeline || project.timeline.every(s => !s.photos || s.photos.length === 0)) && (
            <div className="text-center py-8 text-gray-500">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum registro fotográfico disponível</p>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/* TELA 8 - PROCESSO DE EXECUÇÃO (TIMELINE) */}
      {/* ================================================================ */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <SectionHeader 
          icon={Clock} 
          title="Processo de Execução" 
          expanded={expandedSection === 'processo'}
          onToggle={() => toggleSection('processo')}
        />
        
        <div className={cn(
          "mt-4 transition-all",
          expandedSection === 'processo' || !compact ? 'block' : 'hidden'
        )}>
          <div className="space-y-3">
            {project.timeline?.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  step.status === 'completed' ? "bg-green-500" : 
                  step.status === 'in_progress' ? "bg-[#D4AF37]" : "bg-gray-600"
                )}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs text-white font-bold">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-medium",
                    step.status === 'completed' ? "text-green-400" : 
                    step.status === 'in_progress' ? "text-[#D4AF37]" : "text-gray-400"
                  )}>
                    {step.title}
                  </p>
                  {step.date && step.status === 'completed' && (
                    <p className="text-xs text-gray-500">
                      Concluído em {new Date(step.date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                {step.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TELA 9 - TESTES E VERIFICAÇÕES */}
      {/* ================================================================ */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <SectionHeader 
          icon={CheckCircle} 
          title="Testes e Verificações" 
          expanded={expandedSection === 'testes'}
          onToggle={() => toggleSection('testes')}
        />
        
        <div className={cn(
          "mt-4 transition-all",
          expandedSection === 'testes' || !compact ? 'block' : 'hidden'
        )}>
          <div className="space-y-2 mb-4">
            {TESTES_VERIFICACOES.map((teste) => (
              <div key={teste.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                <CheckCircle className={cn(
                  "w-5 h-5",
                  isFinished ? "text-green-500" : "text-gray-500"
                )} />
                <span className={isFinished ? "text-white" : "text-gray-400"}>
                  {teste.nome}
                </span>
              </div>
            ))}
          </div>

          {/* Status Final */}
          <div className={cn(
            "text-center py-4 rounded-xl font-bold text-xl",
            isFinished 
              ? "bg-green-500/20 text-green-400 border-2 border-green-500/50" 
              : "bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50"
          )}>
            {isFinished ? '✓ APROVADO' : '⏳ EM VERIFICAÇÃO'}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TELA 10 - RESPONSÁVEIS TÉCNICOS */}
      {/* ================================================================ */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <SectionHeader 
          icon={User} 
          title="Responsáveis Técnicos" 
          expanded={expandedSection === 'responsaveis'}
          onToggle={() => toggleSection('responsaveis')}
        />
        
        <div className={cn(
          "mt-4 space-y-4 transition-all",
          expandedSection === 'responsaveis' || !compact ? 'block' : 'hidden'
        )}>
          <div className="p-4 bg-white/5 rounded-xl border border-[#D4AF37]/20">
            <p className="text-sm text-gray-400 mb-1">Responsável Técnico</p>
            <p className="font-semibold">{dados.responsaveis.tecnico.nome}</p>
            <p className="text-xs text-gray-500">{dados.responsaveis.tecnico.cargo}</p>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-[#D4AF37]/20">
            <p className="text-sm text-gray-400 mb-1">Supervisor Técnico</p>
            <p className="font-semibold">{dados.responsaveis.supervisor.nome}</p>
            <p className="text-xs text-gray-500">{dados.responsaveis.supervisor.cargo}</p>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TELA 11 - GARANTIAS */}
      {/* ================================================================ */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <SectionHeader 
          icon={Shield} 
          title="Garantias Ativas" 
          expanded={expandedSection === 'garantias'}
          onToggle={() => toggleSection('garantias')}
        />
        
        <div className={cn(
          "mt-4 space-y-3 transition-all",
          expandedSection === 'garantias' || !compact ? 'block' : 'hidden'
        )}>
          {Object.values(GARANTIAS_PADRAO).map((garantia) => (
            <div key={garantia.nome} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-[#D4AF37]/20">
              <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{garantia.nome}</p>
                <p className="text-sm text-[#D4AF37]">{garantia.prazo}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* TELA 12 - ELITETRACE QR CODE */}
      {/* ================================================================ */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <SectionHeader 
          icon={QrCode} 
          title="EliteTrace™" 
          expanded={expandedSection === 'qrcode'}
          onToggle={() => toggleSection('qrcode')}
        />
        
        <div className={cn(
          "mt-4 text-center transition-all",
          expandedSection === 'qrcode' || !compact ? 'block' : 'hidden'
        )}>
          {/* QR Code */}
          <div className="inline-block p-4 bg-white rounded-2xl mb-4">
            {dados.qrCode ? (
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dados.qrCode)}`}
                alt="QR Code EliteTrace"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-gray-200">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>
          
          <h4 className="text-[#D4AF37] font-bold text-lg">EliteTrace™</h4>
          <p className="text-gray-400 text-sm mt-2">
            Escaneie para acessar<br/>
            o histórico completo<br/>
            da blindagem.
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TELA 13 - OBSERVAÇÕES TÉCNICAS */}
      {/* ================================================================ */}
      {dados.observacoes && (
        <section className="p-6 border-b border-[#D4AF37]/30">
          <SectionHeader 
            icon={FileText} 
            title="Observações Técnicas" 
            expanded={expandedSection === 'obs'}
            onToggle={() => toggleSection('obs')}
          />
          
          <div className={cn(
            "mt-4 transition-all",
            expandedSection === 'obs' || !compact ? 'block' : 'hidden'
          )}>
            <div className="p-4 bg-white/5 rounded-xl border border-[#D4AF37]/20">
              <p className="text-gray-300 whitespace-pre-wrap">{dados.observacoes}</p>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* TELA 14 - DECLARAÇÃO FINAL */}
      {/* ================================================================ */}
      <section className="p-6 border-b border-[#D4AF37]/30">
        <SectionHeader 
          icon={FileText} 
          title="Declaração Final" 
          expanded={expandedSection === 'declaracao'}
          onToggle={() => toggleSection('declaracao')}
        />
        
        <div className={cn(
          "mt-4 transition-all",
          expandedSection === 'declaracao' || !compact ? 'block' : 'hidden'
        )}>
          <div className="p-4 bg-white/5 rounded-xl border border-[#D4AF37]/20">
            <p className="text-sm text-gray-400 leading-relaxed">
              {LAUDO_TEXTOS.secao12.texto}
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TELA 15 - STATUS DO DOCUMENTO */}
      {/* ================================================================ */}
      <section className="p-6">
        <div className="text-center">
          <div className={cn(
            "inline-block px-6 py-3 rounded-xl font-bold text-lg mb-4",
            isFinished 
              ? "bg-green-500/20 text-green-400 border-2 border-green-500/50" 
              : "bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50"
          )}>
            Status: {isFinished ? 'FINALIZADO ✓' : 'EM ANDAMENTO'}
          </div>
          
          <p className="text-sm text-gray-500">
            Data de emissão: {new Date().toLocaleDateString('pt-BR')}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Versão do documento: 1.0
          </p>
        </div>

        {/* Rodapé */}
        <div className="mt-8 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-4" />
          <p className="text-[#D4AF37] font-bold">{LAUDO_TEXTOS.rodape.empresa}</p>
          <p className="text-gray-500 text-sm">{LAUDO_TEXTOS.rodape.slogan}</p>
        </div>
      </section>
    </div>
  )
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface SectionHeaderProps {
  icon: any
  title: string
  expanded?: boolean
  onToggle?: () => void
}

function SectionHeader({ icon: Icon, title, expanded, onToggle }: SectionHeaderProps) {
  return (
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      {onToggle && (
        expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />
      )}
    </button>
  )
}

interface DataRowProps {
  label: string
  value: string
  highlight?: boolean
  small?: boolean
}

function DataRow({ label, value, highlight, small }: DataRowProps) {
  return (
    <div className={cn(
      "flex justify-between",
      small ? "text-xs" : ""
    )}>
      <span className="text-gray-400">{label}</span>
      <span className={cn(
        highlight ? "text-[#D4AF37] font-bold" : "text-white"
      )}>{value || '-'}</span>
    </div>
  )
}

export default EliteShieldLaudo
