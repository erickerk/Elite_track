# PRD - EliteTrack™
## Product Requirements Document

**Versão:** 1.0  
**Data:** 25 de Dezembro de 2025  
**Produto:** EliteTrack - Sistema de Gestão e Acompanhamento de Blindagem Automotiva

---

## 📋 Sumário Executivo

O **EliteTrack** é uma plataforma SaaS completa para gestão de projetos de blindagem automotiva, oferecendo transparência total ao cliente através de acompanhamento em tempo real, verificação pública de autenticidade e gestão operacional eficiente para blindadoras.

### Visão do Produto
Revolucionar a experiência do cliente no processo de blindagem automotiva através de tecnologia, transparência e rastreabilidade completa.

### Objetivos de Negócio
- Aumentar confiança do cliente através de transparência total
- Reduzir solicitações de status em até 70%
- Melhorar eficiência operacional da blindadora
- Criar diferencial competitivo no mercado
- Gerar valor agregado através do Elite Card

---

## 👥 Personas e Usuários

### 1. Cliente (Proprietário do Veículo)
**Perfil:** Pessoa física que contrata serviços de blindagem
**Necessidades:**
- Acompanhar progresso do veículo em tempo real
- Ter acesso a fotos e vídeos da blindagem
- Verificar autenticidade da blindagem
- Acessar laudo técnico certificado
- Solicitar serviços adicionais
- Gerenciar revisões periódicas

**Acesso:** App mobile-first + Web dashboard

### 2. Executor/Técnico
**Perfil:** Profissional responsável pela execução da blindagem
**Necessidades:**
- Gerenciar múltiplos projetos simultaneamente
- Atualizar timeline com fotos e status
- Emitir laudos técnicos
- Gerenciar documentação do cliente
- Comunicar-se com clientes
- Gerar Elite Cards

**Acesso:** Dashboard web completo

### 3. Administrador
**Perfil:** Gestor da blindadora
**Necessidades:**
- Visão geral de todos projetos
- Gestão de equipe e executores
- Análise de KPIs e métricas
- Gestão de orçamentos
- Controle de qualidade
- Gestão de convites e acessos

**Acesso:** Dashboard administrativo completo

---

## 🎯 Funcionalidades Core

### 1. Sistema de Autenticação e Autorização

#### 1.1 Login e Registro
- **Login via e-mail/senha** com validação
- **Registro via convite** (token único)
- **Recuperação de senha** via e-mail
- **Níveis de acesso:** Cliente, Executor, Admin
- **Sessão persistente** com auto-login

#### 1.2 Gestão de Convites (Admin)
- Criar convites com e-mail e função
- Gerar token único de acesso
- Enviar convite via e-mail/WhatsApp
- Rastrear status dos convites
- Expiração automática de tokens

---

### 2. Dashboard do Cliente

#### 2.1 Visão Geral
- **Card do Projeto Ativo** com progresso visual
- **Timeline interativa** com etapas
- **Notificações em tempo real**
- **Acesso rápido** a documentos

#### 2.2 Timeline Detalhada
- Visualização de todas etapas do processo
- Status de cada etapa (Pendente, Em andamento, Concluído)
- Fotos e vídeos de cada etapa
- Notas técnicas do executor
- Datas de início e previsão
- Técnico responsável

#### 2.3 Galeria de Fotos
- Fotos organizadas por etapa
- Visualização em tela cheia
- Download de fotos
- Filtros por tipo (antes, durante, depois)

#### 2.4 Chat com Equipe
- Mensagens em tempo real
- Envio de arquivos/fotos
- Notificações de novas mensagens
- Histórico completo

#### 2.5 Laudo Técnico (EliteShield)
- Certificação ABNT NBR 15000
- Especificações técnicas completas
- Materiais utilizados
- Nível de proteção
- Garantia e validade
- Responsável técnico
- **Exportação em PDF** profissional

#### 2.6 Elite Card
- Cartão digital de benefícios
- QR Code único
- Informações do veículo
- Número de série da blindagem
- Benefícios ativos
- Contatos de emergência
- **Compartilhamento** via WhatsApp/E-mail

#### 2.7 Revisões
- Histórico de revisões
- Agendamento de próximas revisões
- Lembretes automáticos
- Status de garantia

#### 2.8 Documentos
- CNH
- CRLV
- Comprovante de residência
- Contrato de serviço
- Upload de documentos
- Visualização e download

#### 2.9 Orçamentos
- Solicitar novos orçamentos
- Ver orçamentos pendentes
- Aprovar/Recusar orçamentos
- Histórico de solicitações

#### 2.10 Conquistas (Gamificação)
- Sistema de badges
- Progresso de conquistas
- Recompensas exclusivas

---

### 3. Dashboard do Executor

#### 3.1 Visão Geral de Projetos
- **Lista de todos os projetos** com filtros
- **Busca avançada** (cliente, placa, modelo, código)
- **Filtros por status** (Todos, Pendentes, Em Andamento, Concluídos)
- **Contador de projetos** por status
- **Cards de projeto** com foto, cliente em destaque, progresso
- **Resultado da busca** com quantidade encontrada

#### 3.2 Criar Novo Projeto
- Formulário completo de cadastro
- **Upload obrigatório de foto do veículo**
- Dados do cliente (nome, e-mail, telefone)
- Dados do veículo (marca, modelo, ano, placa, cor)
- Geração automática de código e QR Code
- **Compartilhamento automático** via WhatsApp/E-mail

#### 3.3 Gerenciar Projeto (ProjectManager)
- **Tabs de navegação:** Timeline, Fotos, Laudo, Elite Card
- Atualização de etapas da timeline
- Upload de fotos por etapa
- Preenchimento de laudo técnico
- Geração de Elite Card
- Envio de notificações ao cliente

#### 3.4 Timeline de Projeto
- Visualizar todas etapas
- Atualizar status de etapas
- Adicionar notas técnicas
- Upload de fotos/vídeos
- Definir datas estimadas
- Marcar etapas como concluídas

#### 3.5 Gestão de Fotos
- Upload múltiplo de fotos
- Categorização por tipo
- Adicionar descrições
- Organizar por etapa
- Galeria visual

#### 3.6 Emissão de Laudo
- Formulário técnico completo
- Nível de blindagem
- Certificação ABNT
- Número do certificado
- Validade
- Tipo de vidro e espessura
- Proteção de carroceria
- Recursos adicionais
- Peso adicional
- Garantia
- Responsável técnico
- Data de instalação

#### 3.7 Geração de Elite Card
- Número do cartão automático
- Datas de emissão e validade
- Benefícios incluídos
- Telefones de suporte
- **Envio ao cliente**

#### 3.8 Documentação do Cliente
- **Status dinâmico** (Pendente/Enviado baseado no status do projeto)
- CNH e CRLV com visualização
- Solicitar documentos pendentes
- Download de documentos
- **Apenas documentos essenciais** (CNH, CRLV)

#### 3.9 Gestão de Orçamentos
- Ver solicitações pendentes
- Responder com valor e prazo
- Adicionar observações
- Enviar orçamento ao cliente
- Acompanhar aprovações/rejeições

#### 3.10 Agenda e Revisões
- Calendário de agendamentos
- Revisões programadas
- Lembretes de revisão anual
- Contato com clientes
- Status de confirmação

#### 3.11 Tickets de Suporte
- Visualizar tickets abertos
- Responder tickets
- Alterar prioridade
- Mudar status
- Adicionar anexos
- Fechar tickets

---

### 4. Dashboard do Administrador

#### 4.1 Visão Geral Executiva
- KPIs principais
- Gráficos de performance
- Projetos ativos
- Receita mensal
- Taxa de conclusão

#### 4.2 Gestão de Usuários
- Listar todos usuários
- Criar/Editar usuários
- Alterar funções
- Desativar usuários
- Histórico de atividades

#### 4.3 Gestão de Convites
- Criar novos convites
- Listar convites pendentes
- Reenviar convites
- Cancelar convites
- Estatísticas de conversão

#### 4.4 Análises e Relatórios
- Relatórios de projetos
- Tempo médio de conclusão
- Taxa de satisfação
- Análise de custos
- Exportação de dados

---

### 5. Consulta Pública (Verificação de Autenticidade)

#### 5.1 Página de Verificação (`/verify/:projectId`)
- **Acesso sem login** via link ou QR Code
- **Dados do veículo:** Marca, modelo, ano, placa
- **Status do projeto** e progresso
- **Timeline pública** com etapas concluídas
- **Certificação:** Nível, número, validade
- **Materiais utilizados** com especificações
- **Histórico de proprietários:**
  - Nome e CPF
  - Período de posse
  - Proprietário atual destacado
- **Histórico de manutenção e serviços:**
  - Tipo de serviço (Manutenção, Reparo, Inspeção, Troca de Peças)
  - Data e técnico responsável
  - Descrição detalhada
  - Peças substituídas (nome, quantidade, motivo)
  - Custo (se aplicável)
  - Indicação de garantia
  - Notas técnicas
  - Fotos do serviço
- **Exportação em PDF** do laudo completo
- **Verificação de autenticidade** da blindagem

#### 5.2 Laudo PDF Profissional
- **Cabeçalho oficial** com logo EliteTrack
- **Selo de autenticidade certificada**
- Informações completas do veículo
- Certificação ABNT com número e validade
- Lista detalhada de materiais
- Histórico completo de proprietários
- Histórico completo de manutenção
- **Rodapé em todas páginas** com numeração
- **Contatos** da Elite Blindagens
- Layout profissional pronto para impressão

---

### 6. Landing Page Pública

#### 6.1 Funcionalidades
- Hero section com valor do produto
- Demonstração de funcionalidades
- Depoimentos de clientes
- Planos e preços
- **Modal de consulta pública** estilizado
- **QR Scanner** com câmera
- Input para código ou placa
- FAQ
- Formulário de contato
- Footer com links

---

### 7. Sistema de Orçamentos

#### 7.1 Fluxo do Cliente
- **Solicitar orçamento** via formulário
- Selecionar tipo de serviço:
  - Nova blindagem (níveis I, II, III, III-A, IV)
  - Troca de vidro
  - Troca de porta
  - Manutenção
  - Revisão
  - Outros
- Informar dados do veículo
- Adicionar descrição detalhada
- Receber orçamento via sistema
- **Aprovar ou recusar** orçamento
- Adicionar resposta/observações

#### 7.2 Fluxo do Executor
- Ver solicitações pendentes
- Analisar requisitos
- Definir valor estimado
- Definir prazo (dias úteis)
- Adicionar observações técnicas
- Enviar orçamento ao cliente
- Acompanhar resposta

---

### 8. Sistema de Notificações

#### 8.1 Notificações In-App
- Centro de notificações
- Contador de não lidas
- Tipos:
  - Atualização de projeto
  - Nova mensagem
  - Orçamento respondido
  - Documento solicitado
  - Revisão próxima
- Marcação de lida
- Filtros por tipo

#### 8.2 Notificações Push (Futuro)
- Permissão do usuário
- Notificações web push
- Integração com PWA

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **React Router** - Navegação
- **TailwindCSS** - Estilização
- **Lucide React** - Ícones
- **html2canvas + jsPDF** - Geração de PDF
- **qrcode.react** - Geração de QR Codes

### Contextos (State Management)
- **AuthContext** - Autenticação
- **ProjectContext** - Projetos
- **NotificationContext** - Notificações
- **ChatContext** - Mensagens
- **QuoteContext** - Orçamentos
- **LeadsContext** - Leads
- **InviteContext** - Convites
- **PushNotificationContext** - Push notifications

### Segurança
- **Rate limiting** (10 req/min por sessão)
- **Sanitização de inputs** (DOMPurify)
- **Validação de códigos** de projeto
- **Logs de acesso** seguro
- **Session ID** gerado com crypto
- **Proteção de .env** via .gitignore

---

## 📱 Fluxos de Uso Principais

### Fluxo 1: Cliente Acompanha Blindagem
1. Cliente recebe link via WhatsApp/E-mail
2. Acessa `/verify/:projectId` sem login
3. Visualiza progresso e timeline pública
4. Opcionalmente faz login para acesso completo
5. No dashboard, vê timeline detalhada com fotos
6. Recebe notificações de atualizações
7. Interage via chat com equipe
8. Baixa laudo técnico em PDF
9. Acessa Elite Card ao final

### Fluxo 2: Executor Cria Novo Projeto
1. Login como executor
2. Clica em "Novo Projeto"
3. Preenche dados do cliente
4. Preenche dados do veículo
5. **Faz upload obrigatório de foto**
6. Sistema gera código e QR Code
7. **Compartilha via WhatsApp ou E-mail** com link correto
8. Projeto aparece na lista imediatamente
9. Cliente recebe acesso automaticamente

### Fluxo 3: Executor Atualiza Timeline
1. Seleciona projeto na lista
2. Clica em "Gerenciar"
3. Vai para tab "Timeline"
4. Seleciona etapa para atualizar
5. Marca status (Em andamento/Concluído)
6. Adiciona fotos da etapa
7. Adiciona notas técnicas
8. Define data estimada
9. Sistema notifica cliente automaticamente

### Fluxo 4: Cliente Solicita Orçamento
1. Acessa "Orçamentos"
2. Clica em "Novo Orçamento"
3. Seleciona tipo de serviço
4. Escolhe nível (se blindagem nova)
5. Informa dados do veículo
6. Adiciona descrição
7. Envia solicitação
8. Recebe notificação quando respondido
9. Visualiza orçamento detalhado
10. Aprova ou recusa com comentários

### Fluxo 5: Consulta Pública de Veículo Usado
1. Comprador acessa link de verificação
2. Vê dados completos do veículo
3. Confere certificação ABNT
4. Verifica histórico de proprietários
5. Analisa manutenções realizadas
6. Vê peças trocadas e custos
7. Baixa laudo em PDF
8. Valida autenticidade da blindagem

---

## 🎨 Design System

### Cores
- **Primary:** `#D4AF37` (Dourado)
- **Background:** `#000000` (Preto)
- **Carbon:** `#1a1a1a` (Cinza escuro)
- **Success:** `#10b981` (Verde)
- **Warning:** `#f59e0b` (Amarelo)
- **Error:** `#ef4444` (Vermelho)
- **Info:** `#3b82f6` (Azul)

### Tipografia
- **Primary:** Inter
- **Accent:** Pacifico (logo)

### Componentes
- **Glass Effect:** Fundo translúcido com blur
- **Cards:** Bordas arredondadas, sombras suaves
- **Buttons:** Estados hover, transições suaves
- **Modais:** Overlay escuro, conteúdo centralizado
- **Badges:** Cores contextuais por status

---

## 🔐 Segurança e Privacidade

### Autenticação
- Senhas hasheadas (bcrypt em produção)
- Tokens de sessão seguros
- Expiração automática de sessões
- Proteção contra força bruta

### Autorização
- Controle de acesso baseado em função
- Validação de permissões em cada ação
- Projetos visíveis apenas para usuários autorizados

### Dados Sensíveis
- CPF parcialmente oculto em exibições públicas
- Documentos acessíveis apenas por executor/admin
- Logs de acesso para auditoria
- Proteção de variáveis de ambiente

### LGPD/GDPR
- Consentimento de uso de dados
- Direito ao esquecimento (futuro)
- Exportação de dados (futuro)
- Política de privacidade

---

## 📊 Métricas e KPIs

### Métricas de Negócio
- **Número de projetos ativos**
- **Taxa de conclusão** no prazo
- **Tempo médio** de conclusão
- **Satisfação do cliente** (NPS)
- **Taxa de conversão** de orçamentos

### Métricas de Produto
- **Tempo médio** no app
- **Frequência de acesso** do cliente
- **Uso de funcionalidades** (timeline, chat, laudo)
- **Taxa de compartilhamento** de Elite Card
- **Downloads de PDF**

### Métricas Operacionais
- **Tempo de resposta** a solicitações
- **Número de atualizações** por projeto
- **Taxa de upload** de fotos
- **Tickets abertos/resolvidos**

---

## 🚀 Roadmap e Melhorias Futuras

### Fase 2 (Q1 2026)
- [ ] App mobile nativo (iOS/Android)
- [ ] Integração com pagamentos
- [ ] Assinatura de contratos digitais
- [ ] Vídeos na timeline
- [ ] Integração com calendário

### Fase 3 (Q2 2026)
- [ ] IA para análise de fotos
- [ ] Chatbot de atendimento
- [ ] Marketplace de serviços
- [ ] Programa de fidelidade expandido
- [ ] Integração com sistemas externos

### Fase 4 (Q3 2026)
- [ ] API pública para integrações
- [ ] White-label para outras blindadoras
- [ ] Analytics avançado
- [ ] Relatórios personalizados
- [ ] Automação de workflows

---

## 📝 Notas Técnicas

### Performance
- Otimização de imagens
- Lazy loading de componentes
- Cache de dados
- Paginação de listas grandes

### Acessibilidade
- ARIA labels em todos componentes
- Navegação por teclado
- Contraste adequado
- Textos alternativos em imagens

### Responsividade
- Design mobile-first
- Breakpoints: 640px, 768px, 1024px, 1280px
- Layout fluido
- Touch-friendly

### Browser Support
- Chrome/Edge (últimas 2 versões)
- Firefox (últimas 2 versões)
- Safari (últimas 2 versões)
- Mobile browsers

---

## 📞 Suporte e Manutenção

### Canais de Suporte
- Sistema de tickets integrado
- E-mail: suporte@elitetrack.com.br
- WhatsApp: (11) 3456-7890
- Chat in-app

### SLA
- **Crítico:** 2h
- **Alto:** 4h
- **Médio:** 24h
- **Baixo:** 72h

### Backups
- Backup diário automático
- Retenção de 30 dias
- Backup incremental a cada 6h

---

**Documento mantido por:** Equipe de Produto EliteTrack  
**Última atualização:** 25/12/2025  
**Próxima revisão:** 25/01/2026
