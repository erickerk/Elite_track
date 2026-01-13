# /security-scan

## Description
Checklist de segurança leve mas abrangente para projetos Next.js: validação de inputs, autenticação/autorização, proteção de PII, gestão de secrets, análise de dependências e configurações de segurança.

## Steps

1. **Input Validation e Sanitização**
   - Identifique todos os pontos de entrada de dados do usuário:
     - Formulários (Client Components)
     - Route handlers (`/app/api/`)
     - Server Actions
     - Query parameters e path params
   - Verifique validação com schemas (Zod, Yup, etc.)
   - Confirme sanitização contra XSS (escape de HTML, uso de `dangerouslySetInnerHTML`)
   - Valide proteção contra injection (SQL, NoSQL, command injection)

2. **Autenticação e Autorização**
   - **Autenticação**:
     - Verifique implementação de login (JWT, session, OAuth)
     - Confirme que senhas NÃO são armazenadas em plain text (hash + salt)
     - Valide tokens com expiração e refresh adequados
     - Verifique proteção contra brute force (rate limiting)
   - **Autorização**:
     - Confirme que rotas protegidas verificam autenticação (middleware)
     - Valide RBAC/ABAC: usuários só acessam recursos permitidos
     - Verifique RLS (Row Level Security) em Supabase/DB se aplicável
     - Teste que usuários não podem acessar recursos de outros usuários

3. **Gestão de Secrets e Variáveis de Ambiente**
   - Verifique que API keys, tokens, senhas estão em `.env` e `.env.local`
   - Confirme que `.env` está em `.gitignore` (nunca commitado)
   - Valide que secrets NÃO estão hardcoded no código fonte
   - Verifique uso de `process.env.NEXT_PUBLIC_*` apenas para dados públicos
   - Recomende uso de secret managers (Vault, AWS Secrets Manager) se aplicável

4. **Proteção de PII (Personally Identifiable Information)**
   - Identifique dados sensíveis: emails, telefones, CPF, endereços, cartões
   - Verifique que PII é criptografada em banco de dados
   - Confirme que logs NÃO expõem PII
   - Valide que API responses não vazam dados sensíveis desnecessariamente
   - Verifique compliance com LGPD/GDPR (consent, right to deletion)

5. **Análise de Dependências**
   - Execute `npm audit` para vulnerabilidades conhecidas
   - Identifique dependências desatualizadas: `npm outdated`
   - Verifique CVEs (Common Vulnerabilities and Exposures) críticas
   - Recomende atualização de pacotes com vulnerabilidades HIGH/CRITICAL
   - Valide que dependências vêm de fontes confiáveis (npm registry oficial)
   - Considere usar Snyk, Dependabot ou ferramentas SCA

6. **Headers de Segurança**
   - Verifique configuração em `next.config.js`:
     - **Content-Security-Policy** (CSP): restringe sources de scripts, styles
     - **X-Frame-Options**: proteção contra clickjacking
     - **X-Content-Type-Options**: `nosniff`
     - **Referrer-Policy**: controla informações de referrer
     - **Permissions-Policy**: restringe APIs do navegador
   - Valide HTTPS enforced (HSTS header se em produção)
   - Teste headers com securityheaders.com ou ferramentas similares

7. **CORS e CSRF**
   - Verifique configuração CORS em route handlers:
     - Whitelist de origins permitidas (não usar `*` em produção)
     - Métodos HTTP permitidos restritivos
   - Valide proteção CSRF em Server Actions e formulários
   - Confirme que cookies usam flags: `HttpOnly`, `Secure`, `SameSite`

8. **File Upload Security**
   - Se há upload de arquivos, verifique:
     - Validação de tipo MIME (não confiar apenas em extensão)
     - Limite de tamanho de arquivo
     - Scan de malware (ClamAV, VirusTotal API)
     - Storage seguro (S3, Cloudinary com permissões corretas)
     - Arquivos não são executáveis no servidor

9. **API Security**
   - **Rate Limiting**: proteção contra abuse e DDoS
   - **Idempotency**: operações críticas (pagamentos) são idempotent
   - **Logging**: operações sensíveis são auditadas (login, mudança de senha)
   - **Error Handling**: mensagens de erro não vazam stack traces em produção
   - Valide que APIs externas são chamadas com timeouts adequados (proteção SSRF)

10. **Relatório de Security Scan**
    - Gere `security-report.md` com:
      - **Vulnerabilidades encontradas** (HIGH, MEDIUM, LOW)
      - **Recomendações acionáveis** priorizadas
      - **Riscos aceitos** (se houver justificativa)
      - **Próximos passos** (ex: implementar WAF, adicionar monitoring)
    - Liste checklist de itens aprovados ✅ e reprovados ❌
    - Forneça timeline sugerido para correções

## Acceptance Criteria

- [ ] Todos os inputs validados e sanitizados
- [ ] Autenticação e autorização implementadas corretamente
- [ ] Secrets não estão hardcoded ou commitados
- [ ] PII protegida e em compliance com LGPD/GDPR
- [ ] `npm audit` sem vulnerabilidades HIGH/CRITICAL
- [ ] Headers de segurança configurados (CSP, X-Frame-Options, etc.)
- [ ] CORS configurado restritivamente
- [ ] File uploads validados e seguros (se aplicável)
- [ ] Rate limiting e proteções de API implementadas
- [ ] Relatório de segurança gerado e revisado

## How to Use

Invoque este workflow no Cascade digitando:

/security-scan

Exemplo de uso:
- "/security-scan: fazer auditoria de segurança completa"
- "Preciso validar segurança antes do deploy, use /security-scan"
- "/security-scan: verificar se há vulnerabilidades críticas"

**Nota**: Este é um scan leve focado em low-hanging fruits. Para compliance rigoroso ou auditorias profissionais, considere contratar pentesters ou usar ferramentas enterprise (Burp Suite, OWASP ZAP).
