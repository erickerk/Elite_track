# /refactor-safe

## Description
Refatora código existente melhorando legibilidade, performance ou manutenibilidade SEM alterar comportamento externo. Inclui type-safety, diffs mínimos e testes de regressão.

## Steps

1. **Identificação do Escopo**
   - Pergunte ao usuário: arquivo/módulo/função a refatorar
   - Identifique motivação: performance, legibilidade, redução de duplicação, type-safety
   - Determine se é refactor local (função) ou estrutural (múltiplos arquivos)
   - Liste dependências e módulos afetados

2. **Análise do Código Atual**
   - Leia e entenda o código existente completamente
   - Identifique code smells: duplicação, funções longas, complexidade ciclomática alta
   - Mapeie dependências e side effects
   - Documente comportamento atual (input/output, edge cases)

3. **Captura de Testes Existentes**
   - Verifique se há testes unitários ou e2e cobrindo o código
   - Execute testes atuais e garanta que todos passam
   - Se não houver testes, crie testes de caracterização (characterization tests)
   - Documente comportamento esperado antes da refatoração

4. **Planejamento da Refatoração**
   - Escolha estratégia: Extract Method, Rename, Simplify Conditionals, etc.
   - Defina etapas incrementais (refatorar em pequenos passos)
   - Identifique riscos (breaking changes, performance regressions)
   - Peça confirmação ao usuário antes de prosseguir

5. **Refatoração Incremental**
   - Aplique mudanças em pequenos commits lógicos
   - Mantenha diffs mínimos - não misture refactor com features
   - Preserve comportamento externo (mesmos inputs = mesmos outputs)
   - Use TypeScript strict mode para garantir type-safety
   - Após cada mudança, execute testes

6. **Melhorias de Type-Safety**
   - Substitua `any` por tipos específicos
   - Adicione generics onde apropriado
   - Use union types e type guards para validação
   - Implemente tipos utilitários (Partial, Required, Pick, Omit)
   - Remova type assertions desnecessárias (`as`)

7. **Remoção de Código Morto**
   - Identifique funções/variáveis não utilizadas
   - Remova imports não referenciados
   - Limpe comentários obsoletos (mantenha apenas documentação útil)
   - Delete arquivos/módulos deprecados se seguro

8. **Verificação de Comportamento**
   - Execute suite completa de testes
   - Compare output antes vs depois da refatoração
   - Verifique que não há mudanças de comportamento
   - Teste edge cases manualmente se necessário

9. **Performance e Qualidade**
   - Execute `npm run lint` e corrija warnings
   - Verifique complexidade ciclomática (ideal ≤ 10)
   - Se refactor afetou performance, execute benchmarks
   - Confirme que bundle size não aumentou significativamente

10. **Documentação da Refatoração**
    - Adicione entrada em `refactor-report.md` ou changelog
    - Documente: o que mudou, por que mudou, riscos mitigados
    - Atualize comentários JSDoc se aplicável
    - Liste breaking changes (se houver)

## Acceptance Criteria

- [ ] Comportamento externo preservado (mesmos inputs/outputs)
- [ ] Todos os testes passam (zero regressões)
- [ ] Type-safety melhorada (menos `any`, mais tipos específicos)
- [ ] Diffs mínimos (sem mudanças desnecessárias)
- [ ] Lint sem warnings (`npm run lint`)
- [ ] Complexidade ciclomática reduzida ou mantida
- [ ] Código mais legível e manutenível
- [ ] Documentação atualizada onde necessário

## How to Use

Invoque este workflow no Cascade digitando:

/refactor-safe

Exemplo de uso:
- "/refactor-safe: simplificar função handleSubmit em ContactForm.tsx"
- "Preciso refatorar utils/api.ts para remover duplicação, use /refactor-safe"
- "/refactor-safe: melhorar types no módulo de autenticação"
