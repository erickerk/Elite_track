import type { Project, Notification, TimelineStep, User } from '../types'

export const mockClients: User[] = [
  {
    id: '1',
    name: 'Ricardo Mendes',
    email: 'cliente@elite.com',
    phone: '(11) 99999-9999',
    role: 'client',
    vipLevel: 'platinum',
  },
  {
    id: '4',
    name: 'Fernanda Costa',
    email: 'fernanda@email.com',
    phone: '(11) 98765-4321',
    role: 'client',
    vipLevel: 'gold',
  },
  {
    id: '5',
    name: 'João Paulo Santos',
    email: 'joao@email.com',
    phone: '(11) 91234-5678',
    role: 'client',
    vipLevel: 'platinum',
  },
  {
    id: '6',
    name: 'Maria Silva',
    email: 'maria@email.com',
    phone: '(11) 99876-5432',
    role: 'client',
    vipLevel: 'standard',
  },
]

export const mockTimeline: TimelineStep[] = [
  {
    id: '1',
    title: 'Check-in do Veículo',
    description: 'Veículo recebido e documentado. Inspeção inicial realizada com registro fotográfico completo.',
    status: 'completed',
    date: '2024-12-10T09:00:00',
    technician: 'Carlos Silva',
    photos: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400',
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400',
    ],
    notes: 'Veículo em excelente estado. Sem avarias pré-existentes.',
  },
  {
    id: '2',
    title: 'Desmontagem',
    description: 'Remoção completa de painéis internos, forros, bancos e componentes para acesso às áreas de blindagem.',
    status: 'completed',
    date: '2024-12-11T14:30:00',
    technician: 'Roberto Almeida',
    photos: [
      'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400',
    ],
  },
  {
    id: '3',
    title: 'Instalação dos Vidros',
    description: 'Instalação dos vidros balísticos certificados com espessura de 21mm a 42mm conforme nível de proteção.',
    status: 'completed',
    date: '2024-12-12T10:00:00',
    technician: 'Fernando Costa',
    photos: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400',
    ],
  },
  {
    id: '4',
    title: 'Instalação da Manta Opaca',
    description: 'Aplicação de mantas aramidas (Kevlar) e aço balístico em portas, colunas A/B/C, teto e assoalho.',
    status: 'in_progress',
    estimatedDate: '2024-12-16T16:00:00',
    technician: 'Equipe Técnica A',
    photos: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400',
    ],
    notes: 'Processo em andamento. Manta das portas concluída, faltam colunas e teto.',
  },
  {
    id: '5',
    title: 'Montagem',
    description: 'Remontagem de todos os componentes internos: painéis, forros, bancos e sistemas elétricos.',
    status: 'pending',
    estimatedDate: '2024-12-18T09:00:00',
    photos: [],
  },
  {
    id: '6',
    title: 'Acabamento',
    description: 'Ajustes finos de acabamento, vedações, borrachas e alinhamento de portas e vidros.',
    status: 'pending',
    estimatedDate: '2024-12-20T14:00:00',
    photos: [],
  },
  {
    id: '7',
    title: 'Vistoria',
    description: 'Inspeção de qualidade completa por supervisor técnico certificado.',
    status: 'pending',
    estimatedDate: '2024-12-21T10:00:00',
    photos: [],
  },
  {
    id: '8',
    title: 'Laudo EliteShield™',
    description: 'Emissão do laudo técnico oficial com registro de materiais, lotes e certificações.',
    status: 'pending',
    estimatedDate: '2024-12-22T11:00:00',
    photos: [],
  },
  {
    id: '9',
    title: 'Testes',
    description: 'Testes de rodagem, funcionamento de vidros elétricos, travas e sistemas de segurança.',
    status: 'pending',
    estimatedDate: '2024-12-23T09:00:00',
    photos: [],
  },
  {
    id: '10',
    title: 'Higienização',
    description: 'Limpeza completa interna e externa, polimento e preparação para entrega.',
    status: 'pending',
    estimatedDate: '2024-12-24T14:00:00',
    photos: [],
  },
  {
    id: '11',
    title: 'Pronto para Entrega',
    description: 'Veículo finalizado, documentação preparada e agendamento com cliente para retirada.',
    status: 'pending',
    estimatedDate: '2024-12-26T10:00:00',
    photos: [],
  },
]

export const mockProject: Project = {
  id: 'PRJ-2024-001',
  vehicle: {
    id: 'VH-001',
    brand: 'Mercedes-Benz',
    model: 'GLE 450',
    year: 2024,
    color: 'Preto Obsidiana',
    plate: 'ABC-1234',
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800',
    ],
    blindingLevel: 'Nível III-A',
  },
  user: mockClients[0],
  status: 'in_progress',
  progress: 36,
  timeline: mockTimeline,
  startDate: '2024-01-15',
  estimatedDelivery: '2024-02-08',
  qrCode: 'ELITE-PRJ-2024-001-QR',
}

// Timeline padrão para novos projetos
const createDefaultTimeline = (startDate: string, status: 'pending' | 'in_progress' = 'pending'): TimelineStep[] => {
  const steps = [
    { title: 'Check-in do Veículo', description: 'Veículo recebido e documentado. Inspeção inicial realizada com registro fotográfico completo.' },
    { title: 'Desmontagem', description: 'Remoção completa de painéis internos, forros, bancos e componentes para acesso às áreas de blindagem.' },
    { title: 'Instalação dos Vidros', description: 'Instalação dos vidros balísticos certificados com espessura de 21mm a 42mm conforme nível de proteção.' },
    { title: 'Instalação da Manta Opaca', description: 'Aplicação de mantas aramidas (Kevlar) e aço balístico em portas, colunas A/B/C, teto e assoalho.' },
    { title: 'Montagem', description: 'Remontagem de todos os componentes internos: painéis, forros, bancos e sistemas elétricos.' },
    { title: 'Acabamento', description: 'Ajustes finos de acabamento, vedações, borrachas e alinhamento de portas e vidros.' },
    { title: 'Vistoria', description: 'Inspeção de qualidade completa por supervisor técnico certificado.' },
    { title: 'Laudo EliteShield™', description: 'Emissão do laudo técnico oficial com registro de materiais, lotes e certificações.' },
    { title: 'Testes', description: 'Testes de rodagem, funcionamento de vidros elétricos, travas e sistemas de segurança.' },
    { title: 'Higienização', description: 'Limpeza completa interna e externa, polimento e preparação para entrega.' },
    { title: 'Pronto para Entrega', description: 'Veículo finalizado, documentação preparada e agendamento com cliente para retirada.' },
  ]
  
  const baseDate = new Date(startDate)
  return steps.map((step, index) => {
    const estimatedDate = new Date(baseDate)
    estimatedDate.setDate(baseDate.getDate() + (index * 3))
    
    return {
      id: String(index + 1),
      title: step.title,
      description: step.description,
      status: status === 'pending' ? 'pending' : (index === 0 ? 'pending' : 'pending'),
      estimatedDate: estimatedDate.toISOString(),
      photos: [],
    } as TimelineStep
  })
}

export const mockProjects: Project[] = [
  mockProject,
  {
    id: 'PRJ-2024-002',
    vehicle: {
      id: 'VH-002',
      brand: 'BMW',
      model: 'X5 M50i',
      year: 2024,
      color: 'Branco Mineral',
      plate: 'DEF-5678',
      images: [
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
      ],
      blindingLevel: 'Nível III-A',
    },
    user: mockClients[1],
    status: 'pending',
    progress: 0,
    timeline: createDefaultTimeline('2024-02-01'),
    startDate: '2024-02-01',
    estimatedDelivery: '2024-02-28',
    qrCode: 'ELITE-PRJ-2024-002-QR',
  },
  {
    id: 'PRJ-2024-003',
    vehicle: {
      id: 'VH-003',
      brand: 'Audi',
      model: 'Q7 55 TFSI',
      year: 2023,
      color: 'Cinza Daytona',
      plate: 'GHI-9012',
      images: [
        'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
      ],
      blindingLevel: 'Nível III',
    },
    user: mockClients[2],
    status: 'completed',
    progress: 100,
    timeline: createDefaultTimeline('2024-01-02').map(step => ({
      ...step,
      status: 'completed' as const,
      date: step.estimatedDate,
      technician: 'Carlos Silva',
      photos: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400'],
    })),
    startDate: '2024-01-02',
    estimatedDelivery: '2024-01-20',
    actualDelivery: '2024-01-20',
    qrCode: 'ELITE-PRJ-2024-003-QR',
    blindingSpecs: {
      level: 'Nível III',
      certification: 'ABNT NBR 15000',
      certificationNumber: 'CERT-2024-003-ELITE',
      validUntil: '2029-01-20',
      materials: [
        {
          name: 'Manta Aramida Kevlar',
          type: 'Proteção Balística',
          thickness: '12mm',
          certification: 'NIJ 0108.01',
          area: 'Portas, Colunas A/B/C, Teto',
        },
        {
          name: 'Aço Balístico Hardox 500',
          type: 'Reforço Estrutural',
          thickness: '3mm',
          certification: 'EN 1063',
          area: 'Assoalho, Firewall',
        },
        {
          name: 'Vidro Laminado Multilayer',
          type: 'Proteção Transparente',
          thickness: '42mm',
          certification: 'EN 1063 BR4',
          area: 'Para-brisa, Laterais, Traseiro',
        },
        {
          name: 'Polietileno UHMWPE',
          type: 'Absorção de Impacto',
          thickness: '8mm',
          certification: 'NIJ Level IIIA',
          area: 'Painéis Internos',
        },
      ],
      glassType: 'Vidro Laminado Multilayer com Policarbonato',
      glassThickness: '42mm (para-brisa) / 38mm (laterais)',
      bodyProtection: [
        'Portas dianteiras e traseiras',
        'Colunas A, B e C',
        'Teto completo',
        'Assoalho reforçado',
        'Firewall blindado',
        'Tanque de combustível protegido',
        'Bateria com proteção balística',
      ],
      additionalFeatures: [
        'Sistema de run-flat nos pneus',
        'Sirene e giroflex ocultos',
        'Sistema de comunicação de emergência',
        'Extintor de incêndio automático',
        'Fechaduras elétricas reforçadas',
        'Vidros com acionamento elétrico reforçado',
      ],
      warranty: '5 anos de garantia contra defeitos de fabricação',
      technicalResponsible: 'Eng. Carlos Roberto Silva - CREA 123456/SP',
      installationDate: '2024-01-20',
      totalWeight: '+280kg adicionados ao peso original',
    },
    deliveryChecklist: [
      { id: 'DC001', item: 'Laudo EliteShield™ impresso e digital', checked: true, category: 'documents' },
      { id: 'DC002', item: 'Certificado ABNT NBR 15000', checked: true, category: 'documents' },
      { id: 'DC003', item: 'Manual do proprietário blindado', checked: true, category: 'documents' },
      { id: 'DC004', item: 'Termo de garantia assinado', checked: true, category: 'documents' },
      { id: 'DC005', item: 'Nota fiscal de serviço', checked: true, category: 'documents' },
      { id: 'DC006', item: 'Veículo higienizado internamente', checked: true, category: 'vehicle' },
      { id: 'DC007', item: 'Veículo polido externamente', checked: true, category: 'vehicle' },
      { id: 'DC008', item: 'Vidros funcionando corretamente', checked: true, category: 'vehicle' },
      { id: 'DC009', item: 'Travas e fechaduras testadas', checked: true, category: 'vehicle' },
      { id: 'DC010', item: 'Sistema elétrico verificado', checked: true, category: 'vehicle' },
      { id: 'DC011', item: 'Pneus run-flat calibrados', checked: true, category: 'accessories' },
      { id: 'DC012', item: 'Kit de emergência Elite', checked: true, category: 'accessories' },
      { id: 'DC013', item: 'Cartão Elite Member entregue', checked: true, category: 'accessories' },
      { id: 'DC014', item: 'Chaves reserva entregues', checked: true, category: 'accessories' },
      { id: 'DC015', item: 'Cliente orientado sobre uso', checked: true, category: 'final' },
      { id: 'DC016', item: 'Test drive realizado', checked: true, category: 'final' },
      { id: 'DC017', item: 'Fotos de entrega registradas', checked: true, category: 'final' },
      { id: 'DC018', item: 'Termo de recebimento assinado', checked: true, category: 'final' },
    ],
    deliverySchedule: {
      date: '2024-01-20',
      time: '10:00',
      location: 'Elite Blindagens - Sede Principal',
      contactPerson: 'Carlos Silva',
      contactPhone: '(11) 3456-7890',
      confirmed: true,
      notes: 'Cliente chegou pontualmente. Entrega realizada com sucesso.',
    },
    deliveryMedia: {
      finalVideo: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      finalPhotos: [
        'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
        'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800',
        'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
      ],
      certificateUrl: '/documents/certificate-PRJ-2024-003.pdf',
      manualUrl: '/documents/manual-blindagem.pdf',
    },
    eliteCard: {
      cardNumber: 'ELITE-2024-003-PLATINUM',
      issueDate: '2024-01-20',
      expiryDate: '2029-01-20',
      memberSince: '2024-01-02',
      benefits: [
        'Suporte 24/7 prioritário',
        'Elite Rescue (guincho) ilimitado',
        'Revisões anuais gratuitas por 2 anos',
        'Desconto de 15% em serviços adicionais',
        'Acesso VIP à área de clientes',
        'Seguro de vidros blindados incluso',
      ],
      rescuePhone: '0800-ELITE-SOS',
      supportPhone: '(11) 3456-7890',
    },
    tickets: [
      {
        id: 'TKT-001',
        title: 'Dúvida sobre manutenção dos vidros',
        description: 'Gostaria de saber qual a frequência recomendada para verificação dos vidros blindados.',
        status: 'resolved',
        priority: 'low',
        category: 'general',
        createdAt: '2024-01-25T10:00:00',
        updatedAt: '2024-01-25T14:30:00',
        messages: [
          { id: 'MSG001', sender: 'client', message: 'Qual a frequência de verificação dos vidros?', timestamp: '2024-01-25T10:00:00' },
          { id: 'MSG002', sender: 'support', message: 'Recomendamos verificação semestral. Agende sua revisão conosco!', timestamp: '2024-01-25T14:30:00' },
        ],
      },
    ],
  },
  {
    id: 'PRJ-2024-004',
    vehicle: {
      id: 'VH-004',
      brand: 'Range Rover',
      model: 'Sport HSE',
      year: 2024,
      color: 'Verde British Racing',
      plate: 'JKL-3456',
      images: [
        'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
      ],
      blindingLevel: 'Nível II',
    },
    user: mockClients[3],
    status: 'in_progress',
    progress: 18,
    timeline: createDefaultTimeline('2024-01-25').map((step, index) => {
      if (index === 0) {
        return {
          ...step,
          status: 'completed' as const,
          date: '2024-01-25T09:00:00',
          technician: 'Roberto Almeida',
          photos: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400'],
        }
      }
      if (index === 1) {
        return {
          ...step,
          status: 'in_progress' as const,
          technician: 'Roberto Almeida',
        }
      }
      return step
    }),
    startDate: '2024-01-25',
    estimatedDelivery: '2024-02-20',
    qrCode: 'ELITE-PRJ-2024-004-QR',
  },
]

export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Nova atualização disponível',
    message: 'A etapa "Blindagem de Carroceria" foi iniciada. Acompanhe o progresso em tempo real.',
    type: 'info',
    read: false,
    createdAt: '2024-01-25T10:30:00',
    projectId: 'PRJ-2024-001',
  },
  {
    id: '2',
    title: 'Fotos adicionadas',
    message: 'Novas fotos foram adicionadas à etapa de instalação de vidros blindados.',
    type: 'success',
    read: false,
    createdAt: '2024-01-22T16:45:00',
    projectId: 'PRJ-2024-001',
  },
  {
    id: '3',
    title: 'Previsão de entrega atualizada',
    message: 'A data estimada de entrega foi confirmada para 08/02/2024.',
    type: 'info',
    read: true,
    createdAt: '2024-01-20T09:00:00',
    projectId: 'PRJ-2024-001',
  },
]
