/**
 * EliteShield™ - Modelo Padrão do Laudo Técnico de Blindagem Veicular
 * 
 * Este arquivo contém a estrutura e textos padrão do laudo técnico.
 * Qualquer alteração aqui reflete em todas as telas de laudo (público, executor, PDF).
 * 
 * IMPORTANTE: Este é o arquivo ÚNICO de template. Todas as telas devem usar estes textos.
 * Os dados dinâmicos (veículo, cliente, datas) vêm do Supabase via função gerarDadosLaudo().
 * 
 * @version 2.0.0
 * @author Elite Blindagens
 */

// ============================================================================
// TEXTOS JURÍDICOS E DECLARAÇÕES PADRÃO (FIXOS)
// Estes textos são idênticos em todas as telas e no PDF
// ============================================================================

export const LAUDO_TEXTOS = {
  // Cabeçalho
  titulo: 'ELITESHIELD™',
  subtitulo: 'LAUDO TÉCNICO DE BLINDAGEM VEICULAR',
  
  // Seção 1 - Declaração de Execução Técnica
  secao1: {
    titulo: '1. DECLARAÇÃO DE EXECUÇÃO TÉCNICA',
    texto: `A Elite Blindagens, pessoa jurídica devidamente constituída, declara para os devidos fins que o veículo identificado neste documento foi submetido a processo completo de blindagem veicular, executado conforme as especificações técnicas contratadas, utilizando materiais balísticos certificados, mão de obra especializada e procedimentos padronizados, respeitando as normas técnicas aplicáveis ao segmento de blindagem automotiva.`
  },
  
  // Seção 2 - Padrão de Proteção Balística
  secao2: {
    titulo: '2. PADRÃO DE PROTEÇÃO BALÍSTICA',
    texto: `O processo de blindagem descrito neste laudo atende ao nível de proteção balística NIJ III-A, conforme classificação internacional amplamente adotada no setor, sendo projetado para proteção contra ameaças compatíveis com este nível, dentro dos limites técnicos e operacionais estabelecidos pelas normas vigentes.`
  },
  
  // Seção 3 - Materiais e Componentes
  secao3: {
    titulo: '3. MATERIAIS E COMPONENTES UTILIZADOS',
    texto: `A blindagem do veículo foi executada com a aplicação de vidros blindados e materiais opacos balísticos, conforme descrito na seção de especificações técnicas deste laudo, incluindo, quando aplicável:`,
    itens: [
      'Vidros blindados de fabricantes certificados',
      'Mantas balísticas de aramida',
      'Componentes estruturais complementares (polímeros de alta performance ou reforços metálicos específicos)'
    ],
    complemento: 'Os materiais empregados são originais, novos, não reutilizados, e foram aplicados de acordo com as recomendações técnicas dos respectivos fabricantes.'
  },
  
  // Seção 4 - Processo de Execução
  secao4: {
    titulo: '4. PROCESSO DE EXECUÇÃO',
    texto: `O veículo passou por processo técnico controlado, incluindo, mas não se limitando a:`,
    etapas: [
      'Registro fotográfico inicial',
      'Desmontagem técnica',
      'Instalação dos vidros blindados',
      'Aplicação dos materiais balísticos opacos',
      'Montagem e acabamento',
      'Testes funcionais, estruturais e visuais',
      'Inspeção final e liberação técnica'
    ],
    complemento: 'Todas as etapas foram registradas e documentadas, compondo o histórico técnico vinculado a este laudo.'
  },
  
  // Seção 5 - Registro Fotográfico
  secao5: {
    titulo: '5. REGISTRO FOTOGRÁFICO E TRANSPARÊNCIA',
    texto: `Este laudo é acompanhado de registro fotográfico técnico, realizado durante as etapas críticas do processo, com o objetivo de garantir transparência, rastreabilidade e comprovação da correta execução da blindagem, sendo parte integrante e inseparável deste documento.`
  },
  
  // Seção 6 - Responsabilidade Técnica
  secao6: {
    titulo: '6. RESPONSABILIDADE TÉCNICA',
    texto: `A blindagem foi executada sob responsabilidade técnica de profissionais qualificados, devidamente identificados neste laudo, sendo a Elite Blindagens responsável pela conformidade do processo em relação às especificações contratadas e aos materiais utilizados.`
  },
  
  // Seção 7 - Garantia
  secao7: {
    titulo: '7. GARANTIA',
    texto: `A Elite Blindagens concede garantia limitada sobre:`,
    itens: [
      'A integridade dos materiais balísticos aplicados',
      'A correta instalação dos componentes de blindagem',
      'O acabamento interno relacionado diretamente ao processo de blindagem'
    ],
    complemento: 'Os prazos e condições de garantia encontram-se descritos no contrato firmado entre as partes e/ou nos termos específicos de garantia disponibilizados ao cliente, os quais prevalecem em caso de divergência.'
  },
  
  // Seção 8 - Limitações
  secao8: {
    titulo: '8. LIMITAÇÕES E CONDIÇÕES DE USO',
    texto: `A blindagem veicular:`,
    itens: [
      'Não torna o veículo indestrutível ou imune a todos os tipos de ameaças',
      'Possui limitações técnicas inerentes ao nível de proteção contratado',
      'Está condicionada ao uso adequado do veículo e à realização das revisões recomendadas'
    ],
    complemento: 'Modificações estruturais posteriores, intervenções não autorizadas, reparos realizados por terceiros ou uso fora das condições normais de operação podem comprometer a eficácia da blindagem e invalidar garantias.'
  },
  
  // Seção 9 - Manutenção
  secao9: {
    titulo: '9. MANUTENÇÃO E REVISÕES',
    texto: `Recomenda-se a realização de revisões periódicas, conforme orientações da Elite Blindagens, com o objetivo de preservar a integridade dos materiais balísticos, o correto funcionamento dos sistemas do veículo e a validade das garantias concedidas.`
  },
  
  // Seção 10 - EliteTrace
  secao10: {
    titulo: '10. RASTREABILIDADE E ELITETRACE™',
    texto: `Este laudo está vinculado ao sistema EliteTrace™, acessível por meio de QR Code exclusivo, permitindo a consulta ao histórico técnico completo da blindagem, incluindo atualizações, revisões e eventuais complementos de informações, garantindo autenticidade e integridade dos dados.`
  },
  
  // Seção 11 - Validade
  secao11: {
    titulo: '11. VALIDADE DO DOCUMENTO',
    texto: `Este laudo técnico é válido a partir da data de emissão, estando vinculado exclusivamente ao veículo identificado neste documento. Sua autenticidade pode ser verificada por meio do sistema EliteTrace™.`
  },
  
  // Seção 12 - Declaração Final
  secao12: {
    titulo: '12. DECLARAÇÃO FINAL',
    texto: `Declaramos que as informações contidas neste EliteShield™ – Laudo Técnico de Blindagem Veicular refletem fielmente o processo executado e os materiais aplicados, sendo este documento emitido para fins de registro técnico, transparência, garantia e comprovação do serviço prestado.`
  },
  
  // Rodapé
  rodape: {
    empresa: 'Elite Blindagens',
    slogan: 'Proteção elevada ao estado da arte.'
  }
}

// ============================================================================
// ESTRUTURA DAS 15 TELAS DO LAUDO
// Define a ordem e conteúdo de cada tela/seção
// ============================================================================

export const TELAS_LAUDO = {
  // TELA 1 - CAPA
  tela1_capa: {
    id: 'capa',
    titulo: 'EliteShield™',
    subtitulo: 'Laudo Técnico Digital',
    descricao: 'Capa do documento com logo, foto do veículo, cliente e status',
    campos: ['logo', 'fotoVeiculo', 'nomeCliente', 'veiculoModelo', 'veiculoAno', 'status', 'dataConclusao', 'dataEntrega']
  },
  
  // TELA 2 - IDENTIFICAÇÃO DO VEÍCULO
  tela2_veiculo: {
    id: 'veiculo',
    titulo: 'Identificação do Veículo',
    campos: ['marca', 'modelo', 'anoModelo', 'cor', 'placa', 'chassi', 'kmCheckin', 'tipo']
  },
  
  // TELA 3 - IDENTIFICAÇÃO DO CLIENTE
  tela3_cliente: {
    id: 'cliente',
    titulo: 'Dados do Cliente',
    campos: ['nomeRazaoSocial', 'cpfCnpj', 'telefone', 'email', 'cidadeEstado']
  },
  
  // TELA 4 - LINHA DE BLINDAGEM
  tela4_linha: {
    id: 'linha',
    titulo: 'Linha de Blindagem',
    campos: ['linhaBlindagem', 'nivelProtecao', 'tipoUso']
  },
  
  // TELA 5 - ESPECIFICAÇÃO TÉCNICA
  tela5_specs: {
    id: 'specs',
    titulo: 'Especificação Técnica',
    campos: ['vidrosFabricante', 'vidrosEspessura', 'vidrosGarantia', 'opacosAramida', 'opacosComplemento', 'opacosFabricante']
  },
  
  // TELA 6 - MAPA DA BLINDAGEM
  tela6_mapa: {
    id: 'mapa',
    titulo: 'Mapa da Blindagem',
    campos: ['areasBlindadas'],
    descricao: 'Silhueta do carro com áreas blindadas destacadas'
  },
  
  // TELA 7 - REGISTRO FOTOGRÁFICO
  tela7_fotos: {
    id: 'fotos',
    titulo: 'Registro Fotográfico',
    campos: ['fotosDesmontagem', 'fotosVidros', 'fotosOpacos', 'fotosFechamento'],
    descricao: 'Grid 2x2 com data, etapa e técnico'
  },
  
  // TELA 8 - PROCESSO DE EXECUÇÃO
  tela8_processo: {
    id: 'processo',
    titulo: 'Processo de Execução',
    campos: ['timeline'],
    descricao: 'Timeline vertical com etapas'
  },
  
  // TELA 9 - TESTES E VERIFICAÇÕES
  tela9_testes: {
    id: 'testes',
    titulo: 'Testes e Verificações',
    campos: ['checklistTestes', 'statusAprovacao']
  },
  
  // TELA 10 - RESPONSÁVEIS TÉCNICOS
  tela10_responsaveis: {
    id: 'responsaveis',
    titulo: 'Responsáveis Técnicos',
    campos: ['tecnicoNome', 'tecnicoCargo', 'supervisorNome', 'supervisorCargo']
  },
  
  // TELA 11 - GARANTIAS
  tela11_garantias: {
    id: 'garantias',
    titulo: 'Garantias Ativas',
    campos: ['garantiaVidros', 'garantiaOpacos', 'garantiaAcabamento']
  },
  
  // TELA 12 - ELITETRACE QR CODE
  tela12_qrcode: {
    id: 'qrcode',
    titulo: 'EliteTrace™',
    campos: ['qrCode', 'urlVerificacao']
  },
  
  // TELA 13 - OBSERVAÇÕES TÉCNICAS
  tela13_observacoes: {
    id: 'observacoes',
    titulo: 'Observações Técnicas',
    campos: ['observacoes', 'recomendacoes']
  },
  
  // TELA 14 - DECLARAÇÃO FINAL
  tela14_declaracao: {
    id: 'declaracao',
    titulo: 'Declaração Final',
    campos: ['textoDeclaracao']
  },
  
  // TELA 15 - STATUS DO DOCUMENTO
  tela15_status: {
    id: 'status',
    titulo: 'Status do Documento',
    campos: ['statusFinal', 'dataEmissao', 'versaoDocumento']
  }
}

// ============================================================================
// LINHAS DE BLINDAGEM DISPONÍVEIS
// ============================================================================

export const LINHAS_BLINDAGEM = {
  ultralite: {
    id: 'ultralite',
    nome: 'UltraLite Armor™',
    descricao: 'Blindagem Ultra Leve',
    selo: 'Premium Technology',
    caracteristicas: [
      'Peso reduzido em até 40%',
      'Materiais de última geração',
      'Ideal para veículos esportivos e executivos'
    ]
  },
  safecore: {
    id: 'safecore',
    nome: 'SafeCore™',
    descricao: 'Segurança Inteligente',
    selo: 'Smart Balance',
    caracteristicas: [
      'Equilíbrio entre proteção e custo',
      'Materiais certificados',
      'Ideal para uso urbano'
    ]
  }
}

// ============================================================================
// NÍVEIS DE PROTEÇÃO
// ============================================================================

export const NIVEIS_PROTECAO = {
  'NIJ II': {
    nivel: 'NIJ II',
    descricao: 'Proteção contra calibres de baixa velocidade',
    calibres: ['.22 LR', '.380 ACP', '9mm']
  },
  'NIJ III-A': {
    nivel: 'NIJ III-A',
    descricao: 'Proteção contra calibres de mão de alta velocidade',
    calibres: ['.357 Magnum', '.44 Magnum', '9mm +P+']
  },
  'NIJ III': {
    nivel: 'NIJ III',
    descricao: 'Proteção contra rifles',
    calibres: ['7.62x51mm NATO', '.308 Winchester']
  }
}

// ============================================================================
// ETAPAS DO PROCESSO DE BLINDAGEM
// ============================================================================

export const ETAPAS_PROCESSO = [
  { id: 1, nome: 'Check-in', icone: 'clipboard-check' },
  { id: 2, nome: 'Liberação do Exército', icone: 'file-shield' },
  { id: 3, nome: 'Desmontagem', icone: 'tools' },
  { id: 4, nome: 'Vidros Blindados', icone: 'shield' },
  { id: 5, nome: 'Materiais Opacos', icone: 'layers' },
  { id: 6, nome: 'Montagem', icone: 'settings' },
  { id: 7, nome: 'Acabamento', icone: 'brush' },
  { id: 8, nome: 'Testes', icone: 'check-circle' },
  { id: 9, nome: 'Liberação do Exército', icone: 'file-shield' },
  { id: 10, nome: 'Liberação', icone: 'award' }
]

// ============================================================================
// TESTES E VERIFICAÇÕES
// ============================================================================

export const TESTES_VERIFICACOES = [
  { id: 'portas', nome: 'Ajuste de portas', obrigatorio: true },
  { id: 'vidros', nome: 'Funcionamento dos vidros', obrigatorio: true },
  { id: 'vedacao', nome: 'Vedação', obrigatorio: true },
  { id: 'acabamento', nome: 'Acabamento', obrigatorio: true },
  { id: 'rodagem', nome: 'Rodagem de teste', obrigatorio: true },
  { id: 'ruidos', nome: 'Ausência de ruídos', obrigatorio: true }
]

// ============================================================================
// GARANTIAS PADRÃO
// ============================================================================

export const GARANTIAS_PADRAO = {
  vidros: {
    nome: 'Vidros Blindados',
    prazo: '10 anos',
    icone: 'shield'
  },
  opacos: {
    nome: 'Materiais Opacos',
    prazo: '10 anos',
    icone: 'layers'
  },
  acabamento: {
    nome: 'Acabamento',
    prazo: '12 meses',
    icone: 'brush'
  }
}

// ============================================================================
// ESPECIFICAÇÕES TÉCNICAS PADRÃO
// ============================================================================

export const ESPECIFICACOES_TECNICAS = {
  vidros: {
    fabricante: 'SafeMax',
    espessura: '21mm',
    camadas: 'Multi-laminado',
    garantia: '10 anos'
  },
  opacos: {
    material: 'Aramida',
    camadas: '8-11 camadas',
    complemento: 'Tensylon',
    fabricante: 'NextOne'
  }
}

// Especificações condicionais por tipo de blindagem
export const ESPECIFICACOES_POR_LINHA = {
  'Safe Core': {
    vidros: {
      modelo: 'Millenium',
      fabricante: 'Argus',
      espessura: '21mm ±1mm',
      pesoM2: '42 kg',
      garantia: '10 anos contra delaminação',
    },
    opacos: {
      material: 'Aramida',
      camadas: '8-11 camadas',
      complemento: 'Tensylon',
      fabricante: 'NextOne',
      garantia: '10 anos',
    },
  },
  'Ultra Lite Armor': {
    vidros: {
      modelo: 'SafeMax',
      fabricante: 'CrystalGard',
      espessura: '-',
      pesoM2: '30 kg',
      garantia: '10 anos contra delaminação',
    },
    opacos: {
      material: 'Aramida',
      camadas: '8-11 camadas',
      complemento: 'Tensylon',
      fabricante: 'NextOne',
      garantia: '10 anos',
    },
  },
} as const

export type BlindingLineKey = keyof typeof ESPECIFICACOES_POR_LINHA

export function getEspecificacoesPorLinha(linha: string) {
  if (linha === 'UltraLite Armor™' || linha === 'Ultra Lite Armor') {
    return ESPECIFICACOES_POR_LINHA['Ultra Lite Armor']
  }
  return ESPECIFICACOES_POR_LINHA['Safe Core']
}

// ============================================================================
// CORES DO TEMA ELITESHIELD
// ============================================================================

export const CORES_LAUDO = {
  fundo: '#000000',
  dourado: '#D4AF37',
  douradoClaro: '#F4D03F',
  verde: '#22C55E',
  branco: '#FFFFFF',
  cinzaClaro: '#9CA3AF',
  cinzaEscuro: '#374151'
}

// ============================================================================
// TIPO DE DADOS DO LAUDO (para TypeScript)
// ============================================================================

export interface DadosLaudo {
  // Dados do Veículo
  veiculo: {
    marca: string
    modelo: string
    anoModelo: string
    cor: string
    placa: string
    chassi: string
    kmCheckin: string
    tipo: 'SUV' | 'Sedan' | 'Hatch' | 'Picape' | 'Outro'
  }
  
  // Dados do Cliente
  cliente: {
    nome: string
    cpfCnpj?: string
    telefone: string
    email: string
    cidade?: string
    estado?: string
  }
  
  // Dados da Blindagem
  blindagem: {
    linha: 'ultralite' | 'safecore'
    linhaNome: string
    nivel: 'NIJ II' | 'NIJ III-A' | 'NIJ III'
  }
  
  // Datas (IMPORTANTE: sincronizadas com Supabase)
  datas: {
    recebimento: string      // Data de recebimento do veículo (vehicle_received_date)
    conclusao: string        // Data de conclusão do processo (completed_date)
    entrega: string          // Data de entrega ao cliente (actual_delivery)
    emissao: string          // Data de emissão do laudo (gerada automaticamente)
    previsaoEntrega: string  // Previsão de entrega (estimated_delivery)
  }
  
  // Fotos (URLs)
  fotos: {
    veiculo?: string
    desmontagem?: string[]
    vidros?: string[]
    opacos?: string[]
    montagem?: string[]
    final?: string[]
  }
  
  // Responsáveis
  responsaveis: {
    tecnico: { nome: string; cargo: string }
    supervisor: { nome: string; cargo: string }
  }
  
  // QR Code
  qrCode: string
  
  // Status
  status: 'em_andamento' | 'finalizado' | 'entregue'
  
  // Observações
  observacoes?: string
}

// ============================================================================
// FUNÇÃO PARA GERAR DADOS DO LAUDO A PARTIR DO PROJETO
// ============================================================================

export function gerarDadosLaudo(project: any): DadosLaudo {
  return {
    veiculo: {
      marca: project.vehicle?.brand || '',
      modelo: project.vehicle?.model || '',
      anoModelo: project.vehicle?.year?.toString() || '',
      cor: project.vehicle?.color || '',
      placa: project.vehicle?.plate || '',
      chassi: project.vehicle?.chassis ? `****${project.vehicle.chassis.slice(-4)}` : '****0000',
      kmCheckin: project.vehicle?.kmCheckin || '0',
      tipo: project.vehicle?.type || 'SUV'
    },
    cliente: {
      nome: project.user?.name || '',
      cpfCnpj: project.user?.cpfCnpj ? `***.***.***-${project.user.cpfCnpj.slice(-2)}` : undefined,
      telefone: project.user?.phone || '',
      email: project.user?.email || '',
      cidade: project.user?.city,
      estado: project.user?.state
    },
    blindagem: {
      linha: (project.blindingLine === 'UltraLite Armor™' || project.blindingLine === 'Ultra Lite Armor') ? 'ultralite' : 'safecore',
      linhaNome: project.blindingLine || 'Safe Core',
      nivel: project.protectionLevel || 'NIJ III-A',
    },
    datas: {
      recebimento: project.vehicleReceivedDate || project.startDate || '',
      conclusao: project.completedDate || '',
      entrega: project.actualDelivery || '',
      emissao: new Date().toISOString(),
      previsaoEntrega: project.estimatedDelivery || ''
    },
    fotos: {
      veiculo: project.vehicle?.images?.[0],
      desmontagem: project.timeline?.find((s: any) => s.title === 'Desmontagem')?.photos,
      vidros: project.timeline?.find((s: any) => s.title === 'Vidros Blindados')?.photos,
      opacos: project.timeline?.find((s: any) => s.title === 'Instalação de Blindagem')?.photos,
      montagem: project.timeline?.find((s: any) => s.title === 'Montagem Final')?.photos,
      final: project.timeline?.find((s: any) => s.title === 'Entrega')?.photos
    },
    responsaveis: {
      tecnico: { 
        nome: project.blindingSpecs?.technicalResponsible || project.laudoData?.technicalResponsible || 'Técnico Responsável', 
        cargo: project.laudoData?.technicalResponsibleRole || 'Técnico de Blindagem' 
      },
      supervisor: { 
        nome: project.laudoData?.supervisorName || 'Supervisor Técnico', 
        cargo: 'Supervisor de Qualidade' 
      }
    },
    qrCode: project.qrCode || '',
    status: project.status === 'completed' || project.status === 'delivered' ? 'finalizado' : 'em_andamento',
    observacoes: project.notes
  }
}
