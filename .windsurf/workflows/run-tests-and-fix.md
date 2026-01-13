# /run-tests-and-fix

## Description
Executa suite de testes (unit + e2e Playwright), identifica falhas, corrige os problemas e re-executa até todos os testes passarem. Processo iterativo e seguro para garantir zero regressões.

## Steps

1. **Preparação do Ambiente**
   - Verifique se dependências estão instaladas (`npm install`)
   - Confirme que variáveis de ambiente de teste estão configuradas (.env.test)
   - Identifique tipos de testes disponíveis: unit (Jest/Vitest), e2e (Playwright), integration
   - Pergunte ao usuário qual suite executar (all, unit, e2e) ou execute todas por padrão

2. **Execução de Testes Unitários**
   - Execute `npm run test` ou `npm run test:unit`
   - Capture output completo com stack traces
   - Identifique testes que falharam e testes que passaram
   - Liste razões de falha: assertions, erros de runtime, timeouts

3. **Execução de Testes E2E Playwright**
   - Execute `npx playwright test` ou `npm run test:e2e`
   - Configure headed mode se necessário para debugging: `npx playwright test --headed`
   - Capture screenshots de falhas (Playwright gera automaticamente)
   - Identifique seletores quebrados, timeouts, assertions falhadas

4. **Análise de Falhas**
   - Para cada teste falhado, identifique:
     - **Tipo de erro**: assertion, timeout, selector not found, network error
     - **Causa raiz**: código de produção bugado, teste flaky, dados de teste inválidos
     - **Severidade**: blocker (quebra CI), intermittent (flaky), low (edge case)
   - Priorize correções: blockers primeiro, depois flaky tests, depois low priority

5. **Correção de Testes Quebrados**
   - **Se erro no código de produção**:
     - Corrija o bug no código fonte (siga /bugfix-e2e se apropriado)
     - Não modifique o teste para passar incorretamente
   - **Se teste está desatualizado**:
     - Atualize seletores, assertions, mocks conforme código atual
     - Sincronize dados de teste com schema atual
   - **Se teste é flaky**:
     - Adicione waits adequados (waitForSelector, waitForLoadState)
     - Use retry logic ou aumentar timeout apenas se justificado
     - Estabilize condições de teste (limpar estado, seed data)

6. **Correção de Testes Unitários**
   - Verifique mocks e stubs estão corretos
   - Atualize snapshots se mudanças visuais foram intencionais: `npm run test -- -u`
   - Corrija assertions que não refletem comportamento esperado
   - Adicione testes faltantes para cobertura adequada

7. **Re-execução Iterativa**
   - Após cada correção, re-execute os testes afetados
   - Se teste passar, marque como resolvido
   - Se ainda falhar, retorne ao Step 4 (análise de falhas)
   - Continue até todos os testes passarem

8. **Execução Completa Final**
   - Execute suite completa: `npm run test && npx playwright test`
   - Confirme que TODOS os testes passam (zero falhas)
   - Verifique que não há testes skipados sem justificativa
   - Valide cobertura de código se aplicável: `npm run test:coverage`

9. **Relatório de Correções**
   - Liste testes que falharam inicialmente
   - Documente correções aplicadas (código ou teste)
   - Identifique testes flaky que precisam atenção futura
   - Sugira melhorias (ex: adicionar testes para edge cases descobertos)

10. **Verificação de CI/CD**
    - Se projeto tem CI (GitHub Actions, etc.), confirme que testes passam localmente
    - Valide que configuração de CI está atualizada
    - Sugira executar pipeline de CI antes de merge
    - Documente comandos exatos que CI executa

## Acceptance Criteria

- [ ] Todos os testes unitários passam (0 failures)
- [ ] Todos os testes e2e Playwright passam (0 failures)
- [ ] Nenhum teste skipado sem justificativa documentada
- [ ] Correções aplicadas no código de produção OU nos testes (conforme apropriado)
- [ ] Testes não foram enfraquecidos para passar incorretamente
- [ ] Suite completa executada pelo menos uma vez com 100% sucesso
- [ ] Relatório de correções documentado
- [ ] CI/CD local verificado se aplicável

## How to Use

Invoque este workflow no Cascade digitando:

/run-tests-and-fix

Exemplo de uso:
- "/run-tests-and-fix: executar todos os testes e corrigir falhas"
- "Testes estão falhando no CI, use /run-tests-and-fix"
- "/run-tests-and-fix: apenas testes e2e de autenticação"

**Nota**: Este workflow pode demorar dependendo do número de testes. Seja paciente durante execução de suites grandes.
