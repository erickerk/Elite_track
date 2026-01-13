# Workflows Reutilizáveis - Next.js App Router

Coleção de workflows profissionais para desenvolvimento Next.js com TypeScript, Tailwind CSS, shadcn/ui e testes Playwright.

## 📋 Workflows Disponíveis

### 1. `/ship-feature`
**Implementa feature completa end-to-end**
- Planejamento → Código → Verificação → Testes → Entrega
- Inclui validação TypeScript, testes Playwright e documentação
- Ideal para adicionar novas funcionalidades com garantia de qualidade

**Uso:**
```
/ship-feature
```

### 2. `/bugfix-e2e`
**Corrige bugs com processo estruturado**
- Reprodução → Isolamento → Correção → Teste de regressão → Verificação
- Garante que o bug é resolvido na raiz, não apenas sintomas
- Adiciona teste Playwright para prevenir recorrência

**Uso:**
```
/bugfix-e2e
```

### 3. `/ui-cinematic`
**Cria componentes UI cinemáticos dark mode**
- Design tokens → Estrutura → Animações → Acessibilidade → Performance
- Usa shadcn/ui, Tailwind, glassmorphism, scroll effects
- WCAG 2.2 AA + Core Web Vitals otimizados

**Uso:**
```
/ui-cinematic
```

### 4. `/refactor-safe`
**Refatora código mantendo comportamento**
- Type-safety → Diffs mínimos → Testes de regressão
- Remove duplicação, melhora legibilidade sem quebrar funcionalidades
- Validação completa antes e depois

**Uso:**
```
/refactor-safe
```

### 5. `/pr-review`
**Revisa mudanças como Pull Request**
- Análise de riscos → Edge cases → Testes faltantes → Security → PR description
- Identifica breaking changes, performance issues, vulnerabilidades
- Gera descrição profissional de PR automaticamente

**Uso:**
```
/pr-review
```

### 6. `/run-tests-and-fix`
**Executa testes e corrige falhas iterativamente**
- Unit tests → E2E Playwright → Análise de falhas → Correção → Re-execução
- Loop até todos os testes passarem
- Diferencia bugs de código vs testes desatualizados

**Uso:**
```
/run-tests-and-fix
```

### 7. `/security-scan`
**Auditoria de segurança lightweight**
- Input validation → Auth/Authz → PII → Secrets → Dependências → Headers
- Checklist OWASP Top 10, LGPD/GDPR compliance
- Gera relatório com vulnerabilidades priorizadas

**Uso:**
```
/security-scan
```

### 8. `/release-checklist`
**Validação pré-release completa**
- Build → Lint → Tests → Env sanity → Performance → Rollback plan
- Lighthouse audit, Core Web Vitals, security scan
- Deploy seguro com monitoramento pós-release

**Uso:**
```
/release-checklist
```

## 🚀 Como Invocar Workflows

### No Cascade (Windsurf IDE)

Digite o nome do workflow com `/` no chat do Cascade:

```
/ship-feature
```

Ou combine com contexto:

```
/ship-feature: adicionar sistema de notificações em tempo real
```

```
/bugfix-e2e: botão de submit fica desabilitado após erro
```

```
/ui-cinematic: criar hero section para landing page SaaS
```

### Composição de Workflows

Workflows podem chamar outros workflows quando apropriado:

- `/ship-feature` pode chamar `/run-tests-and-fix` automaticamente
- `/pr-review` pode recomendar `/security-scan` se detectar riscos
- `/release-checklist` executa `/run-tests-and-fix` e `/security-scan` internamente

## 📁 Estrutura de Arquivos

```
.windsurf/
└── workflows/
    ├── README.md (este arquivo)
    ├── ship-feature.md
    ├── bugfix-e2e.md
    ├── ui-cinematic.md
    ├── refactor-safe.md
    ├── pr-review.md
    ├── run-tests-and-fix.md
    ├── security-scan.md
    └── release-checklist.md
```

## ✅ Acceptance Criteria

Cada workflow define critérios de aceitação claros, incluindo:

- Type-safety (zero erros TypeScript)
- Testes passando (unit + e2e)
- Lint sem warnings críticos
- Segurança validada
- Documentação atualizada
- Performance dentro dos targets

## 🎯 Boas Práticas

1. **Leia o workflow completo** antes de executar para entender os steps
2. **Forneça contexto claro** ao invocar (ex: nome da feature, descrição do bug)
3. **Confirme decisões importantes** quando o workflow solicitar
4. **Não pule steps críticos** (testes, security scan) para economizar tempo
5. **Documente desvios** se precisar adaptar o workflow para caso específico

## 🔧 Customização

Sinta-se livre para editar os workflows conforme necessidades do projeto:

- Adicionar steps específicos do projeto
- Ajustar ferramentas (ex: trocar Jest por Vitest)
- Modificar critérios de aceitação
- Adicionar integrações (Sentry, analytics, etc.)

## 📚 Referências

- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com
- **Playwright**: https://playwright.dev
- **Next.js App Router**: https://nextjs.org/docs/app
- **WCAG 2.2**: https://www.w3.org/WAI/WCAG22/quickref/

## 🆘 Troubleshooting

**Workflow não está funcionando como esperado?**
- Verifique que Cascade tem acesso ao diretório `.windsurf/workflows/`
- Confirme que nome do workflow está correto (ex: `/ship-feature`, não `ship-feature`)
- Leia o arquivo Markdown do workflow para entender os steps esperados

**Precisa de um novo workflow?**
- Use workflows existentes como template
- Siga estrutura: Title → Description → Steps → Acceptance Criteria → How to Use
- Mantenha steps determinísticos e seguros (sem ações destrutivas sem confirmação)

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-12  
**Compatível com:** Next.js 14+, TypeScript 5+, Playwright 1.40+
