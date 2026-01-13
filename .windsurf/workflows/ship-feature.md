# /ship-feature

## Description
Implementa uma feature completa end-to-end, desde o planejamento até a entrega com testes e documentação. Ideal para adicionar novas funcionalidades ao projeto Next.js com garantia de qualidade.

## Steps

1. **Análise e Planejamento**
   - Pergunte ao usuário sobre a feature: objetivo, escopo, páginas/componentes afetados
   - Identifique dependências existentes (componentes shadcn/ui, hooks, APIs)
   - Liste arquivos que serão criados ou modificados
   - Documente decisões arquiteturais (Client Component vs Server Component, data fetching, state management)

2. **Validação do Plano**
   - Apresente o plano estruturado ao usuário com estimativa de complexidade
   - Aguarde confirmação explícita antes de prosseguir
   - Ajuste conforme feedback recebido

3. **Implementação Backend/API (se aplicável)**
   - Crie ou modifique route handlers em `/app/api/`
   - Implemente validação de entrada com Zod ou similar
   - Adicione tratamento de erros adequado
   - Garanta tipos TypeScript corretos para respostas

4. **Implementação de Componentes UI**
   - Use componentes shadcn/ui existentes como base
   - Siga tokens de design (cores, espaçamento, tipografia) do projeto
   - Implemente acessibilidade básica (ARIA labels, keyboard navigation)
   - Adicione estados de loading, erro e vazio quando apropriado

5. **Integração de Dados**
   - Conecte componentes às APIs/route handlers
   - Implemente Server Components para data fetching quando possível
   - Use React Server Actions para mutations se apropriado
   - Configure revalidação/cache conforme necessário

6. **Testes End-to-End com Playwright**
   - Crie arquivo de teste em `/tests/e2e/` ou `/e2e/`
   - Teste o happy path completo da feature
   - Adicione casos de erro principais (validação, network failure)
   - Verifique responsividade básica (desktop + mobile viewport)

7. **Verificação Manual**
   - Execute `npm run dev` (ou equivalente) se necessário
   - Instrua o usuário sobre como testar a feature manualmente
   - Liste URLs/rotas a serem verificadas
   - Confirme que não há erros no console

8. **Documentação e Limpeza**
   - Atualize README.md se a feature adicionar novos scripts ou configurações
   - Remova código comentado ou imports não utilizados
   - Verifique formatação com Prettier
   - Execute linting com `npm run lint`

9. **Resumo de Entrega**
   - Liste todos os arquivos criados/modificados
   - Resuma funcionalidades implementadas
   - Forneça comandos para rodar testes
   - Sugira próximos passos (ex: deploy, monitoramento)

## Acceptance Criteria

- [ ] Feature implementada conforme requisitos
- [ ] Tipos TypeScript sem erros (`npm run type-check` ou `tsc --noEmit`)
- [ ] Lint sem warnings críticos (`npm run lint`)
- [ ] Pelo menos 1 teste Playwright end-to-end passando
- [ ] Componentes responsivos (mobile + desktop)
- [ ] Sem erros no console do navegador
- [ ] Código segue padrões do projeto (naming, estrutura de pastas)
- [ ] Acessibilidade básica implementada (WCAG 2.1 AA mínimo)

## How to Use

Invoque este workflow no Cascade digitando:
```
/ship-feature
```

Exemplo de uso:
- "Use /ship-feature para adicionar autenticação com GitHub"
- "Preciso de um dashboard de analytics, use /ship-feature"
- "/ship-feature: sistema de comentários para posts do blog"
