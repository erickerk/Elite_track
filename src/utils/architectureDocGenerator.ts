import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, Packer } from 'docx'
import { saveAs } from 'file-saver'
import { COMPANY_INFO } from '../constants/companyInfo'

/**
 * Gera documento Word explicando a arquitetura completa do Elite Track
 * para gestores e leigos, incluindo fluxograma, custos e plano de escala
 */
export async function generateArchitectureDoc(): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // CAPA
          new Paragraph({
            text: 'ELITE BLINDAGENS',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Manual de Arquitetura Técnica',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Elite Track - Sistema de Acompanhamento de Blindagem',
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: `Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),

          // INTRODUÇÃO
          new Paragraph({
            text: 'O que é o Elite Track?',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: 'O Elite Track é uma aplicação web mobile-first que permite clientes e executores acompanharem em tempo real o processo de blindagem automotiva. O sistema é composto por várias tecnologias integradas que trabalham em conjunto para entregar uma experiência premium.',
            spacing: { after: 400 },
          }),

          // FLUXOGRAMA - PÁGINA 2
          new Paragraph({
            text: 'Como Funciona a Infraestrutura',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            pageBreakBefore: true,
          }),
          new Paragraph({
            text: 'A aplicação usa 5 serviços principais que se comunicam em sequência:',
            spacing: { after: 200 },
          }),

          // Fluxograma em texto
          new Paragraph({
            text: '1. HOSTINGER → Registrador de Domínio',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: 'O domínio eliteblindagens.com.br foi comprado na Hostinger. Sua única função é apontar o DNS (sistema de nomes) para o Cloudflare. Custo: ~R$ 30/ano.',
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: '2. CLOUDFLARE → CDN e Proteção',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: 'O Cloudflare atua como uma camada intermediária que:',
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: '• Cacheia (guarda cópias) dos arquivos para acelerar o carregamento',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Protege contra ataques DDoS (quando alguém tenta derrubar o site)',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Fornece certificado SSL gratuito (cadeado verde no navegador)',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Distribui o conteúdo por vários servidores ao redor do mundo',
            bullet: { level: 0 },
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Plano atual: Free (suficiente para até 100 mil acessos/dia). Custo: R$ 0/mês',
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: '3. VERCEL → Hospedagem do Frontend',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: 'A Vercel hospeda o site (os arquivos HTML, CSS e JavaScript que aparecem no navegador). Toda vez que você faz uma alteração no código e envia para o GitHub, a Vercel automaticamente rebuilda o site em poucos segundos.',
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Plano atual: Hobby (gratuito até 100 GB de tráfego/mês). Custo: R$ 0/mês',
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: '4. GITHUB → Repositório de Código',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: 'O GitHub é onde fica guardado todo o código-fonte da aplicação. É como um "Google Drive" para programadores, mas com controle de versão (histórico completo de todas as mudanças). Custo: R$ 0/mês',
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: '5. SUPABASE → Backend (Banco de Dados)',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: 'O Supabase é o "cérebro" do sistema. Ele guarda:',
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: '• Dados dos clientes e executores',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Projetos de blindagem e suas etapas',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Fotos das etapas (storage de arquivos)',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Sistema de autenticação (login/senha)',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Notificações em tempo real',
            bullet: { level: 0 },
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Plano atual: Free (500 MB banco de dados, 1 GB storage, 50 mil usuários/mês). Custo: R$ 0/mês',
            spacing: { after: 400 },
          }),

          // CUSTOS - PÁGINA 3
          new Paragraph({
            text: 'Custos Atuais e Previstos',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            pageBreakBefore: true,
          }),

          // Tabela de custos atuais
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Serviço', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Plano', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Custo/mês', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Limite', bold: true })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Hostinger')] }),
                  new TableCell({ children: [new Paragraph('Domínio')] }),
                  new TableCell({ children: [new Paragraph('~R$ 2,50')] }),
                  new TableCell({ children: [new Paragraph('Ilimitado')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Cloudflare')] }),
                  new TableCell({ children: [new Paragraph('Free')] }),
                  new TableCell({ children: [new Paragraph('R$ 0')] }),
                  new TableCell({ children: [new Paragraph('100k requests/dia')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Vercel')] }),
                  new TableCell({ children: [new Paragraph('Hobby')] }),
                  new TableCell({ children: [new Paragraph('R$ 0')] }),
                  new TableCell({ children: [new Paragraph('100 GB bandwidth')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('GitHub')] }),
                  new TableCell({ children: [new Paragraph('Free')] }),
                  new TableCell({ children: [new Paragraph('R$ 0')] }),
                  new TableCell({ children: [new Paragraph('Ilimitado')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Supabase', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Free', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'R$ 0', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '500 MB DB, 1 GB storage', bold: true })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph('')] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '~R$ 2,50/mês', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph('')] }),
                ],
              }),
            ],
          }),

          new Paragraph({
            text: '',
            spacing: { after: 400 },
          }),

          // Quando migrar
          new Paragraph({
            text: 'Quando Migrar para Planos Pagos?',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: 'O único serviço que provavelmente precisará de upgrade é o SUPABASE. Migre para o plano Pro (US$ 25/mês = ~R$ 125) quando:',
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: '• Storage de fotos ultrapassar 800 MB (sistema vai alertar)',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Mais de 150 usuários ativos por mês',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Banco de dados ficar lento (queries demorando >2 segundos)',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Necessidade de backups automáticos diários',
            bullet: { level: 0 },
            spacing: { after: 400 },
          }),

          // Plano de escala - PÁGINA 4
          new Paragraph({
            text: 'Plano de Escala (500+ usuários)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            pageBreakBefore: true,
          }),
          new Paragraph({
            text: 'Se a aplicação crescer muito (mais de 500 usuários ativos), os custos estimados serão:',
            spacing: { after: 200 },
          }),

          // Tabela de custos futuros
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Serviço', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Upgrade necessário', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Custo/mês', bold: true })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Hostinger')] }),
                  new TableCell({ children: [new Paragraph('Sem mudança')] }),
                  new TableCell({ children: [new Paragraph('~R$ 2,50')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Cloudflare')] }),
                  new TableCell({ children: [new Paragraph('Pro (opcional, cache mais agressivo)')] }),
                  new TableCell({ children: [new Paragraph('R$ 100')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Vercel')] }),
                  new TableCell({ children: [new Paragraph('Pro (se bandwidth > 100 GB)')] }),
                  new TableCell({ children: [new Paragraph('R$ 100')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('GitHub')] }),
                  new TableCell({ children: [new Paragraph('Sem mudança')] }),
                  new TableCell({ children: [new Paragraph('R$ 0')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Supabase Pro', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '8 GB DB, 100 GB storage, backups', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'R$ 125', bold: true })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('CDN Imagens (Cloudinary)') ]} ),
                  new TableCell({ children: [new Paragraph('Compressão e otimização avançada')] }),
                  new TableCell({ children: [new Paragraph('R$ 150')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL ESTIMADO', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph('')] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '~R$ 475/mês', bold: true })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({
            text: '',
            spacing: { after: 400 },
          }),

          // Sinais de necessidade de upgrade
          new Paragraph({
            text: 'Como Saber Quando Fazer Upgrade?',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: 'O sistema possui alertas automáticos que notificam quando algum limite está próximo de ser atingido:',
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: '• Dashboard do Supabase mostra uso de storage e database em tempo real',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Alertas por email quando atingir 80% de qualquer limite',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Vercel envia notificação se bandwidth ultrapassar 80%',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Performance do app degrada visivelmente (carregamento lento)',
            bullet: { level: 0 },
            spacing: { after: 400 },
          }),

          // Fluxo técnico para desenvolvedores - PÁGINA 5
          new Paragraph({
            text: 'Fluxo Técnico Completo (Para Desenvolvedores)',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            pageBreakBefore: true,
          }),
          new Paragraph({
            text: 'Entenda o que acontece desde uma mudança no código até o usuário ver a atualização:',
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: '1. Desenvolvedor faz alteração no código e envia (commit) para o GitHub',
            numbering: { reference: 'default-numbering', level: 0 },
          }),
          new Paragraph({
            text: '2. GitHub Actions detecta o commit e roda testes automáticos',
            numbering: { reference: 'default-numbering', level: 0 },
          }),
          new Paragraph({
            text: '3. Se os testes passarem, GitHub notifica a Vercel via webhook',
            numbering: { reference: 'default-numbering', level: 0 },
          }),
          new Paragraph({
            text: '4. Vercel puxa o código atualizado do GitHub',
            numbering: { reference: 'default-numbering', level: 0 },
          }),
          new Paragraph({
            text: '5. Vercel executa o build (npm run build) gerando arquivos otimizados',
            numbering: { reference: 'default-numbering', level: 0 },
          }),
          new Paragraph({
            text: '6. Vercel publica os arquivos na CDN global',
            numbering: { reference: 'default-numbering', level: 0 },
          }),
          new Paragraph({
            text: '7. Cloudflare cacheia os novos arquivos em seus servidores',
            numbering: { reference: 'default-numbering', level: 0 },
          }),
          new Paragraph({
            text: '8. Usuário acessa app.eliteblindagens.com.br',
            numbering: { reference: 'default-numbering', level: 0 },
          }),
          new Paragraph({
            text: '9. Cloudflare serve o conteúdo do cache ou busca na Vercel',
            numbering: { reference: 'default-numbering', level: 0 },
          }),
          new Paragraph({
            text: '10. Frontend (React) carrega no navegador e se conecta ao Supabase',
            numbering: { reference: 'default-numbering', level: 0 },
          }),
          new Paragraph({
            text: '11. Supabase retorna dados via API REST ou WebSocket (tempo real)',
            numbering: { reference: 'default-numbering', level: 0 },
          }),
          new Paragraph({
            text: '12. Usuário vê a interface atualizada com seus dados',
            numbering: { reference: 'default-numbering', level: 0 },
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Tempo total deste processo: ~2-3 minutos desde o commit até o deploy.',
            spacing: { after: 400 },
          }),

          // Stack Tecnológico
          new Paragraph({
            text: 'Stack Tecnológico',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: 'Frontend:',
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: '• React 18 com TypeScript - framework principal',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Vite - build tool ultrarrápido',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• TailwindCSS - estilização utility-first',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Framer Motion - animações suaves',
            bullet: { level: 0 },
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Backend:',
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: '• PostgreSQL 15 - banco de dados relacional',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Supabase Auth - autenticação JWT',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Supabase Storage - armazenamento de imagens',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: '• Supabase Realtime - WebSocket para sincronização',
            bullet: { level: 0 },
            spacing: { after: 400 },
          }),

          // Contato e informações finais
          new Paragraph({
            text: 'Informações de Contato',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            pageBreakBefore: true,
          }),
          new Paragraph({
            text: `Empresa: ${COMPANY_INFO.name}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Website: ${COMPANY_INFO.website}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Telefone: ${COMPANY_INFO.phoneFormatted}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Endereço: ${COMPANY_INFO.address.full}`,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: 'Projeto Supabase:',
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: 'Project ID: rlaxbloitiknjikrpbim',
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: 'Região: South America (São Paulo)',
            spacing: { after: 400 },
          }),

          // Rodapé
          new Paragraph({
            text: '_______________________________________________',
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Documento gerado automaticamente pelo Elite Track Admin', italics: true })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: '© 2025 Elite Blindagens - Todos os direitos reservados', italics: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  })

  // Gerar e baixar o arquivo
  const blob = await Packer.toBlob(doc)
  const fileName = `Manual-Arquitetura-EliteTrack-${new Date().toISOString().split('T')[0]}.docx`
  saveAs(blob, fileName)
}
