# /release-checklist

## Description
Checklist pré-release completo para projetos Next.js: validação de build, linting, testes, sanidade de variáveis de ambiente, performance e notas de rollback. Garante deploy seguro e confiável.

## Steps

1. **Validação de Branch e Git**
   - Confirme que está na branch correta (main, production, release)
   - Execute `git status` para garantir working directory limpo
   - Verifique que todos os commits relevantes foram merged
   - Confirme que não há merge conflicts pendentes
   - Valide que branch está atualizada com remoto: `git pull origin <branch>`

2. **Atualização de Versão e Changelog**
   - Atualize versão em `package.json` seguindo semver (major.minor.patch)
   - Adicione entrada em `CHANGELOG.md` ou arquivo equivalente:
     - Data e versão
     - Features adicionadas
     - Bugs corrigidos
     - Breaking changes
     - Migrações necessárias
   - Commit com mensagem: `chore(release): bump version to x.y.z`

3. **Execução de Linting**
   - Execute `npm run lint` ou `next lint`
   - Corrija todos os errors (warnings podem ser aceitáveis conforme política do projeto)
   - Execute `npm run format` ou Prettier para garantir formatação consistente
   - Valide que não há console.log, debugger ou TODOs críticos no código

4. **Type Checking TypeScript**
   - Execute `npm run type-check` ou `tsc --noEmit`
   - Corrija todos os type errors
   - Valide que não há `any` críticos sem justificativa
   - Confirme que tipos estão atualizados com mudanças recentes

5. **Execução de Testes**
   - Execute suite completa de testes unitários: `npm run test`
   - Execute testes e2e Playwright: `npx playwright test`
   - Confirme que TODOS os testes passam (zero falhas)
   - Se houver falhas, use `/run-tests-and-fix` para corrigir
   - Valide cobertura de código se aplicável: `npm run test:coverage`

6. **Build de Produção**
   - Execute `npm run build` ou `next build`
   - Valide que build completa sem erros
   - Verifique warnings de build (ex: large bundles, deprecated APIs)
   - Analise bundle size: `npm run analyze` se configurado
   - Confirme que não há imports circulares ou dead code significativo

7. **Sanidade de Variáveis de Ambiente**
   - Revise `.env.example` ou `.env.template`
   - Confirme que todas as variáveis necessárias estão documentadas
   - Valide que `.env` não está commitado no Git
   - Se deploy em cloud (Vercel, Netlify):
     - Confirme que env vars estão configuradas no dashboard da plataforma
     - Valide secrets sensíveis (API keys, database URLs)
   - Teste que aplicação funciona com env vars de produção (staging primeiro se disponível)

8. **Validação de Performance**
   - Execute Lighthouse audit em build de produção:
     - Performance score ≥ 90
     - Accessibility score ≥ 90
     - Best Practices score ≥ 90
     - SEO score ≥ 90
   - Verifique Core Web Vitals:
     - LCP (Largest Contentful Paint) ≤ 2.5s
     - INP (Interaction to Next Paint) ≤ 200ms
     - CLS (Cumulative Layout Shift) ≤ 0.1
   - Se métricas estão ruins, otimize antes de release

9. **Security Scan Pré-Release**
   - Execute `/security-scan` ou checklist manual:
     - `npm audit` sem vulnerabilidades críticas
     - Headers de segurança configurados
     - Secrets não hardcoded
     - Autenticação e autorização funcionando
   - Valide proteção contra OWASP Top 10 (XSS, Injection, CSRF, etc.)

10. **Preparação de Rollback**
    - Documente como fazer rollback se deploy falhar:
      - Comando para reverter deploy (ex: `vercel rollback`)
      - Instruções para reverter branch Git se necessário
      - Backup de banco de dados (se houver migrações)
    - Identifique monitoramento pós-deploy:
      - Logs a observar (errors, warnings)
      - Métricas de negócio (conversão, latência)
      - Alertas configurados (Sentry, Datadog, etc.)
    - Defina critério para rollback (ex: error rate > 5%, latência > 3s)

11. **Deploy e Validação**
    - Execute deploy conforme pipeline do projeto:
      - Manual: `vercel --prod`, `netlify deploy --prod`
      - CI/CD: merge para branch main/production
    - Aguarde deploy completar
    - Valide que aplicação está acessível em produção
    - Teste smoke test manual: login, navegação, features críticas
    - Monitore logs por 15-30 minutos pós-deploy

12. **Documentação Pós-Release**
    - Notifique time/stakeholders sobre release
    - Atualize documentação se houve mudanças de API/features
    - Crie tag Git: `git tag v1.2.3 && git push origin v1.2.3`
    - Feche issues/tickets relacionadas ao release
    - Documente lições aprendidas se houve problemas

## Acceptance Criteria

- [ ] Working directory limpo e branch atualizada
- [ ] Versão e changelog atualizados
- [ ] Lint e formatação sem erros
- [ ] Type checking sem erros TypeScript
- [ ] Todos os testes passam (unit + e2e)
- [ ] Build de produção completa sem erros
- [ ] Variáveis de ambiente validadas e configuradas
- [ ] Performance e Core Web Vitals dentro dos targets
- [ ] Security scan aprovado
- [ ] Plano de rollback documentado
- [ ] Deploy bem-sucedido e validado
- [ ] Monitoramento ativo pós-deploy

## How to Use

Invoque este workflow no Cascade digitando:

/release-checklist

Exemplo de uso:
- "/release-checklist: preparar release v2.0.0 para produção"
- "Preciso fazer deploy, use /release-checklist"
- "/release-checklist: validar tudo antes de subir para staging"

**Nota**: Este checklist é ideal para releases planejados. Para hotfixes urgentes, pode-se pular alguns steps (ex: changelog) mas NUNCA pule testes e build validation.
