# 📸 Correção do Upload de Fotos na Timeline

## Problema Identificado

O upload de fotos na timeline não estava funcionando devido a:

1. **Tabela `step_photos` incompleta** - faltavam colunas essenciais
2. **Bucket de storage inexistente** - o bucket `step-photos` não existia
3. **Políticas de storage ausentes** - não havia permissões para upload

## Correções Aplicadas

### 1. Atualização da Tabela `step_photos`

Foram adicionadas as seguintes colunas:

```sql
ALTER TABLE step_photos 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS photo_type VARCHAR(50) DEFAULT 'during',
ADD COLUMN IF NOT EXISTS stage VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_step_photos_project_id ON step_photos(project_id);
```

**Estrutura final da tabela:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| step_id | UUID | FK para timeline_steps |
| project_id | UUID | FK para projects |
| photo_url | TEXT | URL da foto no storage |
| photo_type | VARCHAR(50) | Tipo: before, during, after |
| stage | VARCHAR(255) | Nome da etapa |
| description | TEXT | Descrição da foto |
| uploaded_by | VARCHAR(100) | Quem fez upload |
| created_at | TIMESTAMPTZ | Data de criação |

### 2. Criação dos Buckets de Storage

Foram criados 3 buckets públicos no Supabase Storage:

- **step-photos** - Fotos das etapas da timeline
- **chat-files** - Anexos do chat
- **quote-files** - Anexos de orçamentos

Configuração:

- Tamanho máximo: 10MB
- MIME types permitidos: image/jpeg, image/png, image/webp, image/heic

### 3. Políticas de Storage

Criadas políticas para permitir:

- Leitura pública (SELECT)
- Upload autenticado (INSERT)
- Atualização autenticada (UPDATE)
- Deleção autenticada (DELETE)

## Fluxo de Upload Corrigido

```
1. Usuário seleciona foto no modal
2. uploadToStorage() envia para bucket 'step-photos'
3. saveStepPhoto() salva referência na tabela step_photos
4. Realtime subscription detecta INSERT
5. Interface atualiza automaticamente
```

## Arquivos Envolvidos

- `src/components/executor/ExecutorPhotos.tsx` - Componente de upload
- `src/services/photoUploadService.ts` - Serviço de upload
- `src/services/realtimeSync.ts` - Sincronização em tempo real
- `src/services/storage/SupabaseAdapter.ts` - Carrega fotos junto com projetos

## Como Testar

1. Logar como executor (ex: joao@teste.com / Teste@2025)
2. Ir para a seção "Fotos"
3. Clicar em "Adicionar" em qualquer etapa
4. Selecionar uma foto
5. Escolher categoria e descrição
6. Clicar em "Enviar Foto"
7. A foto deve aparecer na interface imediatamente

## Realtime

A tabela `step_photos` está configurada no Supabase Realtime, então:

- Fotos adicionadas por um executor aparecem para outros usuários em tempo real
- O cliente pode acompanhar o progresso das fotos instantaneamente

## Data da Correção

11 de Janeiro de 2026

## Status

✅ **Corrigido e Funcionando**
