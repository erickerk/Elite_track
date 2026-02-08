# Migration 016 - Elite Concierge Veicular

## Objetivo
Criar tabela `concierge_requests` para gerenciar solicitações de serviços Elite Concierge Veicular.

## O que faz
- ✅ Cria tabela `concierge_requests` com estrutura completa
- ✅ Define tipos de serviço (revisão, manutenção, retira/leva, etc.)
- ✅ Implementa RLS (Row Level Security) para segurança
- ✅ Cria índices para performance
- ✅ Adiciona triggers para auditoria automática
- ✅ Habilita realtime para notificações instantâneas

## Tipos de Serviço Suportados
1. **revisao_programada** - Revisão periódica agendada
2. **manutencao_corretiva** - Reparo ou correção de problema
3. **retira_leva** - Serviço de buscar/entregar veículo
4. **verificacao_tecnica** - Inspeção técnica do veículo
5. **lavagem_detailing** - Limpeza e detalhamento
6. **outro** - Outros serviços personalizados

## Status do Pedido
- `pending` - Aguardando análise
- `approved` - Aprovado pela equipe
- `scheduled` - Agendado
- `in_progress` - Em execução
- `completed` - Concluído
- `cancelled` - Cancelado

## Como Executar

### 1. Via Dashboard Supabase (Recomendado)
```bash
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto Elite Track
3. Vá em: SQL Editor
4. Cole o conteúdo de: 016_concierge_requests.sql
5. Clique em: RUN
6. Verifique se não há erros
```

### 2. Via CLI Supabase (Alternativo)
```bash
supabase db push
```

## Validação Pós-Execução

### 1. Verificar se tabela foi criada
```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'concierge_requests';
```

### 2. Testar inserção manual
```sql
INSERT INTO concierge_requests (
  user_id,
  service_type,
  description,
  location,
  status
) VALUES (
  'SEU_USER_ID_AQUI',
  'revisao_programada',
  'Teste de solicitação',
  'São Paulo - Zona Sul',
  'pending'
);
```

### 3. Testar consulta
```sql
SELECT * FROM concierge_requests LIMIT 5;
```

### 4. Verificar RLS (Security)
```sql
-- Como cliente, deve ver apenas suas solicitações
-- Como admin/executor, deve ver todas
SELECT * FROM concierge_requests;
```

## Uso no Código

### Cliente - Criar Solicitação
```typescript
const { data, error } = await supabase
  .from('concierge_requests')
  .insert({
    user_id: user.id,
    project_id: project?.id,
    service_type: 'revisao_programada',
    description: 'Revisão periódica de 10.000 km',
    location: 'São Paulo - Zona Sul',
    contact_phone: '(11) 99999-9999',
    priority: 'medium'
  })
```

### Operador - Listar Solicitações Pendentes
```typescript
const { data, error } = await supabase
  .from('concierge_requests')
  .select(`
    *,
    users!user_id(name, email, phone),
    projects(vehicle:vehicles(*))
  `)
  .eq('status', 'pending')
  .order('created_at', { ascending: false })
```

### Operador - Atualizar Status
```typescript
const { error } = await supabase
  .from('concierge_requests')
  .update({
    status: 'scheduled',
    scheduled_date: '2026-02-15T10:00:00Z',
    assigned_to: operatorId,
    notes: 'Agendado com o cliente'
  })
  .eq('id', requestId)
```

### Realtime - Ouvir Novas Solicitações
```typescript
const subscription = supabase
  .channel('concierge_requests_changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'concierge_requests'
    },
    (payload) => {
      console.log('Nova solicitação:', payload.new)
      // Notificar operador
    }
  )
  .subscribe()
```

## Próximos Passos no Código

### 1. Criar Interface TypeScript
```typescript
// src/types/index.ts
export interface ConciergeRequest {
  id: string
  user_id: string
  project_id?: string
  service_type: 'revisao_programada' | 'manutencao_corretiva' | 'retira_leva' | 'verificacao_tecnica' | 'lavagem_detailing' | 'outro'
  description?: string
  location?: string
  preferred_date?: string
  status: 'pending' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_date?: string
  completed_date?: string
  assigned_to?: string
  notes?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  contact_phone?: string
  contact_email?: string
  created_at: string
  updated_at: string
}
```

### 2. Criar Hook React
```typescript
// src/hooks/useConciergeRequests.ts
export function useConciergeRequests() {
  const [requests, setRequests] = useState<ConciergeRequest[]>([])
  const [loading, setLoading] = useState(true)
  
  // Carregar solicitações
  // Criar nova solicitação
  // Atualizar status
  // Subscribe realtime
  
  return { requests, loading, createRequest, updateStatus }
}
```

### 3. Criar Componente Cliente
```typescript
// src/components/concierge/ConciergeRequestForm.tsx
// Formulário para cliente solicitar serviço
```

### 4. Criar Tela Operador/Admin
```typescript
// src/pages/ConciergeManagement.tsx
// Lista de solicitações com filtros e ações
```

## Rollback (Se Necessário)

```sql
-- Para reverter esta migration
DROP TABLE IF EXISTS concierge_requests CASCADE;
DROP FUNCTION IF EXISTS update_concierge_updated_at() CASCADE;
```

## Dependências
- ✅ Tabela `users` já existe
- ✅ Tabela `projects` já existe
- ✅ Extension `uuid-ossp` habilitada
- ✅ RLS habilitado no projeto

## Status
- [x] Migration criada
- [ ] Migration executada no Supabase
- [ ] Testada manualmente
- [ ] Interface TypeScript criada
- [ ] Componentes React criados
- [ ] Testes E2E adicionados
