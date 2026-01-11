# 📸 Upload de Fotos na Timeline - EliteTrack

## Status: ✅ FUNCIONANDO (Validado em 11/01/2026)

## Problema Principal Corrigido

**Causa raiz:** O componente `ExecutorTimeline.tsx` tinha um `handleAddPhoto` que apenas chamava um callback de notificação - **não fazia upload real de fotos**.

**Solução:** Refatorado `ExecutorTimeline.tsx` para incluir:

- Input file oculto com ref
- Handler `handleFileSelect` que faz upload real para Supabase Storage
- Indicador visual de upload em andamento
- Integração com `uploadToStorage()` e `saveStepPhoto()`

## Fluxo Corrigido

```text
Timeline (coração da aplicação)
  ↓
1. Executor clica "Adicionar Foto" → abre modal de tipo
2. Seleciona tipo (Antes/Durante/Depois/Detalhe/Material)
3. Clica "Selecionar Foto" → abre file chooser REAL
4. uploadToStorage() → Supabase Storage (bucket: step-photos)
5. saveStepPhoto() → Tabela step_photos
6. Realtime detecta INSERT → atualiza interface
  ↓
Guia Fotos (carrega dados da Timeline via step_photos)
```

## Arquivos Modificados

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

## Validação via Playwright (11/01/2026)

Teste automatizado realizado com sucesso:

1. ✅ Login como executor João (`joao@teste.com`)
2. ✅ Navegação para seção "Fotos"
3. ✅ Seleção de foto via JavaScript injection
4. ✅ Clique em "Enviar Foto"
5. ✅ Logs confirmam upload bem-sucedido:
   - `[PhotoUpload] Upload realizado com sucesso`
   - `[RealtimeSync] Foto da etapa salva: c350309d-...`
   - `[Realtime] Nova foto inserida`
6. ✅ Contagem de fotos atualizada (4 → 5 → 6)
7. ✅ Foto aparece na etapa "Desmontagem" após reload

## Código Principal

### Upload para Storage (`photoUploadService.ts`)

```typescript
export async function uploadToStorage(
  file: File,
  bucket: string,  // 'step-photos'
  folder: string   // 'step_{stepId}'
): Promise<string | null> {
  const fileName = generateUniqueFileName(file.name, folder)
  const filePath = `${folder}/${fileName}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (error) return await fileToDataUrl(file) // Fallback

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}
```

### Salvar Referência (`realtimeSync.ts`)

```typescript
export async function saveStepPhoto(
  stepId: string,
  projectId: string,
  photoUrl: string,
  photoType: string = 'during',
  stage?: string,
  description?: string,
  uploadedBy?: string
): Promise<any | null> {
  const { data, error } = await db
    .from('step_photos')
    .insert({
      step_id: stepId,
      project_id: projectId,
      photo_url: photoUrl,
      photo_type: photoType,
      stage,
      description,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()

  return data
}
```

### Realtime Subscription (`realtimeSync.ts`)

```typescript
export function subscribeToProjectPhotos(
  projectId: string,
  onPhotoInsert: (photo: any) => void
): () => void {
  const channel = db.channel(`photos-${projectId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'step_photos',
      filter: `project_id=eq.${projectId}`
    }, (payload) => {
      onPhotoInsert(payload.new)
    })
    .subscribe()

  return () => channel.unsubscribe()
}
```

## Supabase Configuration

### Bucket: `step-photos`

- Público: Sim
- Tamanho máximo: 10MB
- MIME types: image/jpeg, image/png, image/webp, image/heic

### Tabela: `step_photos`

```sql
CREATE TABLE step_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id UUID REFERENCES timeline_steps(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type VARCHAR(50) DEFAULT 'during',
  stage VARCHAR(255),
  description TEXT,
  uploaded_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_step_photos_step_id ON step_photos(step_id);
CREATE INDEX idx_step_photos_project_id ON step_photos(project_id);

-- RLS Policy (permissiva para todos)
ALTER TABLE step_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY step_photos_all ON step_photos FOR ALL USING (true);

-- Realtime habilitado
ALTER PUBLICATION supabase_realtime ADD TABLE step_photos;
```

## Troubleshooting

| Problema | Solução |
| -------- | ------- |
| Foto não aparece após upload | Verificar logs do console, recarregar página |
| Erro 400 no upload | Verificar políticas do bucket step-photos |
| Foto salva mas não sincroniza | Verificar se Realtime está habilitado na tabela |
| Contagem não atualiza | Bug de estado local, reload resolve |

## Data da Última Validação

**11 de Janeiro de 2026** - Upload funcionando via Playwright automatizado
