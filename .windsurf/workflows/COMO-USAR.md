# Como Usar os Workflows em Qualquer Projeto

## 🎯 Fluxo Simples para Novo Projeto

### Opção 1: Instalação Automática (Recomendado)

1. **Abra seu novo projeto no Windsurf**
2. **No Cascade, digite:**
   ```
   Copie os workflows de C:\Users\admin\CascadeProjects\.windsurf\workflows\ para o meu projeto atual
   ```
3. **Pronto!** Digite `/` no Cascade para ver os workflows

### Opção 2: Instalação Manual

1. **Abra seu novo projeto no Windsurf**
2. **Abra o terminal integrado** (Ctrl + `)
3. **Execute os comandos:**
   ```bash
   mkdir -p .windsurf/workflows
   cp C:/Users/admin/CascadeProjects/.windsurf/workflows/*.md .windsurf/workflows/
   ```
4. **Reinicie o Windsurf** (Ctrl + Shift + P → "Reload Window")
5. **Pronto!** Digite `/` no Cascade para ver os workflows

### Opção 3: Copiar Manualmente

1. **Abra o Explorador de Arquivos**
2. **Navegue até:** `C:\Users\admin\CascadeProjects\.windsurf\workflows\`
3. **Copie a pasta `workflows`** (Ctrl + C)
4. **Vá até a raiz do seu novo projeto**
5. **Cole dentro da pasta `.windsurf`** (crie se não existir)
6. **Reinicie o Windsurf**

## 📋 Workflows Disponíveis

Execute digitando `/` no Cascade:

- `/qa-sincronia-master` - Auditoria completa (execute este primeiro)
- `/auditar-sem-mocks` - Detecta dados mock
- `/auditar-contrato-de-dados` - Valida contratos de dados
- `/auditar-integridade-realtime` - Verifica realtime
- `/otimizar-queries` - Otimiza queries do banco
- `/qa-tela-a-tela` - QA de todas as telas
- `/verificar-exports` - Verifica exports (PDF/Excel/CSV)
- `/auditar-graficos-e-calculos` - Valida gráficos e cálculos
- `/corrigir-e-regredir` - Corrige issues e testa regressão

## 🚀 Exemplo de Uso

### Cenário: Novo projeto Next.js com Supabase

1. **Abra o projeto no Windsurf**
2. **Execute a auditoria completa:**
   ```
   /qa-sincronia-master
   ```
3. **Aguarde o relatório** em `.windsurf/audit-reports/[timestamp]/`
4. **Revise os issues encontrados**
5. **Execute correções:**
   ```
   /corrigir-e-regredir
   ```

### Cenário: Verificar apenas uma área específica

**Exemplo 1: Verificar se há dados mock**
```
/auditar-sem-mocks
```

**Exemplo 2: Otimizar queries lentas**
```
/otimizar-queries
```

**Exemplo 3: QA de todas as telas**
```
/qa-tela-a-tela
```

## ❓ Perguntas Frequentes

### Os workflows funcionam em qualquer linguagem/framework?
✅ Sim! São stack-agnostic e se adaptam automaticamente ao seu projeto.

### Preciso configurar algo antes de usar?
❌ Não! Os workflows detectam automaticamente:
- Framework (Next.js, React, Django, etc.)
- Banco de dados (Supabase, PostgreSQL, etc.)
- Ferramentas de teste (Playwright, Jest, etc.)

### Os workflows modificam meu código?
⚠️ Apenas o workflow `/corrigir-e-regredir` faz modificações.
Todos os outros apenas **analisam** e **geram relatórios**.

### Onde ficam os relatórios?
📁 Em `.windsurf/audit-reports/[timestamp]/` no seu projeto.

### Posso customizar os workflows?
✅ Sim! Edite os arquivos `.md` em `.windsurf/workflows/`.

## 🔧 Solução de Problemas

### Workflows não aparecem no `/`
1. Verifique se a pasta `.windsurf/workflows/` existe na raiz do projeto
2. Reinicie o Windsurf (Ctrl + Shift + P → "Reload Window")
3. Certifique-se de que os arquivos têm extensão `.md`

### Workflow dá erro ao executar
1. Verifique se seu projeto tem as dependências necessárias
2. Leia o erro e siga as instruções do Cascade
3. Os workflows são adaptáveis - eles sugerem alternativas se algo não estiver disponível

## 📦 Compartilhar com a Equipe

Para compartilhar com sua equipe:

1. **Commite a pasta `.windsurf/workflows/`** no Git
2. **Todos da equipe terão acesso** aos workflows ao clonar o repo
3. **Opcional:** Adicione ao README do projeto:
   ```markdown
   ## Workflows de QA
   
   Execute `/qa-sincronia-master` no Cascade para auditoria completa.
   ```

## 🎓 Próximos Passos

1. ✅ Instale os workflows no seu projeto
2. ✅ Execute `/qa-sincronia-master` para primeira auditoria
3. ✅ Revise o relatório gerado
4. ✅ Execute `/corrigir-e-regredir` para corrigir issues
5. ✅ Compartilhe com a equipe via Git
