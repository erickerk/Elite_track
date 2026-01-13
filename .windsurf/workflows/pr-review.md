# /pr-review

## Description
Revisa mudanças locais (staged ou unstaged) como se fosse um Pull Request, identificando riscos, edge cases, testes faltantes, problemas de segurança e sugerindo descrição de PR profissional.

## Steps

1. **Coleta de Mudanças**
   - Execute `git status` para identificar arquivos modificados
   - Execute `git diff` ou `git diff --staged` para ver alterações exatas
   - Liste todos os arquivos afetados com tipo de mudança (added, modified, deleted)
   - Identifique escopo: feature, bugfix, refactor, docs, config

2. **Análise de Qualidade de Código**
   - Verifique se mudanças seguem padrões do projeto (naming, estrutura)
   - Identifique code smells: funções longas (>50 linhas), duplicação, high complexity
   - Valide que imports estão organizados e sem ciclos
   - Confirme que não há console.log, debugger ou TODOs críticos

3. **Revisão de Type-Safety**
   - Execute `npm run type-check` ou `tsc --noEmit`
   - Identifique uso de `any`, type assertions desnecessárias
   - Verifique que tipos de props, retornos e parâmetros estão corretos
   - Confirme que não há type errors ou warnings do TypeScript

4. **Identificação de Riscos**
   - **Breaking changes**: alterações em interfaces públicas, APIs, props
   - **Performance**: loops O(n²), re-renders desnecessários, bundle size
   - **Race conditions**: async/await patterns, estado compartilhado
   - **Backward compatibility**: migrações de schema, config changes
   - Liste riscos por severidade (high, medium, low)

5. **Análise de Edge Cases e Testes**
   - Identifique edge cases não cobertos: inputs vazios, null/undefined, limites
   - Verifique se há testes novos para código novo
   - Valide que testes existentes ainda passam (`npm run test`)
   - Liste cenários de teste faltantes (ex: erro de rede, permissões negadas)

6. **Security Review Checklist**
   - **Input validation**: dados do usuário são validados/sanitizados?
   - **Authentication/Authorization**: rotas protegidas corretamente?
   - **Secrets**: API keys, tokens estão em variáveis de ambiente (não hardcoded)?
   - **XSS/Injection**: uso de dangerouslySetInnerHTML, SQL queries dinâmicas?
   - **Dependencies**: novos pacotes vêm de fontes confiáveis?
   - **CORS/CSP**: configurações de segurança não foram enfraquecidas?

7. **Revisão de Acessibilidade**
   - Elementos interativos têm labels ou ARIA attributes?
   - Contraste de cores adequado (WCAG AA)?
   - Keyboard navigation funciona?
   - Formulários têm validação e mensagens de erro acessíveis?

8. **Verificação de Documentação**
   - README ou docs foram atualizados se necessário?
   - Comentários JSDoc/TSDoc adicionados em APIs públicas?
   - Changelog foi atualizado?
   - Migrações ou breaking changes documentados?

9. **Linting e Formatação**
   - Execute `npm run lint` e reporte warnings/errors
   - Execute `npm run format` ou Prettier para verificar formatação
   - Confirme que commits seguem Conventional Commits (se aplicável)
   - Verifique que não há trailing spaces, mixed line endings

10. **Geração de PR Description**
    - **Título**: formato `type(scope): description` (ex: `feat(auth): add OAuth login`)
    - **What**: resumo das mudanças principais
    - **Why**: motivação, problema sendo resolvido
    - **How**: abordagem técnica, decisões importantes
    - **Testing**: como foi testado, comandos para verificar
    - **Screenshots** (se UI): mencionar se há mudanças visuais
    - **Breaking Changes**: listar explicitamente
    - **Checklist**: tipo de mudança, testes, documentação

## Acceptance Criteria

- [ ] Todas as mudanças revisadas linha por linha
- [ ] Riscos identificados e documentados
- [ ] Edge cases e cenários de teste faltantes listados
- [ ] Security checklist completo
- [ ] Type-safety verificada (zero erros TypeScript)
- [ ] Lint e formatação sem problemas
- [ ] PR description profissional gerada
- [ ] Recomendações acionáveis fornecidas

## How to Use

Invoque este workflow no Cascade digitando:

/pr-review

Exemplo de uso:
- "Fiz mudanças no auth, use /pr-review antes de commitar"
- "/pr-review: revisar alterações no dashboard"
- "Preciso de feedback no meu código, aplique /pr-review"

**Nota**: Certifique-se de ter mudanças locais (staged ou unstaged) antes de invocar este workflow.
