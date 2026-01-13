# /bugfix-e2e

## Description
Workflow completo para investigar, reproduzir, corrigir bugs e adicionar testes de regressão end-to-end com Playwright. Garante que o bug seja resolvido na raiz e não retorne no futuro.

## Steps

1. **Coleta de Informações**
   - Pergunte ao usuário: descrição do bug, passos para reproduzir, comportamento esperado vs atual
   - Identifique ambiente afetado (dev, staging, prod)
   - Colete stack traces, logs de erro, screenshots se disponíveis
   - Determine prioridade e impacto (blocker, critical, moderate, low)

2. **Reprodução Local**
   - Configure ambiente de desenvolvimento se necessário
   - Execute os passos exatos para reproduzir o bug
   - Confirme que o bug é reproduzível consistentemente
   - Documente condições específicas que causam o erro

3. **Investigação e Isolamento**
   - Use ferramentas de debug (console.log, debugger, DevTools)
   - Identifique o arquivo/função/componente exato onde o bug ocorre
   - Analise o código ao redor para entender o contexto
   - Liste possíveis causas raiz (não apenas sintomas)

4. **Análise de Causa Raiz**
   - Determine a causa fundamental (race condition, validação faltando, estado inconsistente, etc.)
   - Verifique se há bugs relacionados no mesmo módulo
   - Considere edge cases que podem ter causado o problema
   - Documente a causa raiz em comentário ou debug-report.md

5. **Implementação da Correção**
   - Corrija o bug na origem (upstream), não apenas sintomas (downstream)
   - Use mudanças mínimas necessárias - evite refatorações grandes
   - Mantenha backward compatibility quando possível
   - Adicione validações/guards para prevenir recorrência

6. **Validação da Correção**
   - Execute os passos de reprodução novamente
   - Confirme que o bug foi eliminado
   - Teste edge cases relacionados
   - Verifique que a correção não quebrou outras funcionalidades

7. **Criação de Teste Playwright de Regressão**
   - Crie arquivo de teste em `/tests/e2e/` ou `/e2e/`
   - Nome do arquivo deve refletir o bug (ex: `fix-login-redirect.spec.ts`)
   - Implemente teste que falha SEM a correção e passa COM a correção
   - Adicione assertions claras que capturam o comportamento correto

8. **Execução dos Testes**
   - Execute o novo teste: `npx playwright test <nome-do-teste>`
   - Execute suite completa para garantir zero regressões
   - Verifique que todos os testes passam
   - Se falhar, volte ao Step 5

9. **Documentação e Resumo**
   - Atualize changelog ou BUGFIXES.md se existir
   - Documente workaround temporário se aplicável
   - Resuma: causa raiz, correção aplicada, arquivo de teste criado
   - Sugira melhorias preventivas (ex: adicionar linting rule)

## Acceptance Criteria

- [ ] Bug reproduzido e confirmado antes da correção
- [ ] Causa raiz identificada e documentada
- [ ] Correção implementada com mudanças mínimas
- [ ] Bug não ocorre mais após a correção
- [ ] Teste Playwright de regressão criado e passando
- [ ] Suite completa de testes sem falhas
- [ ] Tipos TypeScript sem erros
- [ ] Nenhuma nova funcionalidade quebrada pela correção

## How to Use

Invoque este workflow no Cascade digitando:

/bugfix-e2e

Exemplo de uso:
- "O login não redireciona para /dashboard, use /bugfix-e2e"
- "/bugfix-e2e: botão de submit fica desabilitado após erro de validação"
- "Tenho um bug no formulário de checkout, aplicar /bugfix-e2e"
