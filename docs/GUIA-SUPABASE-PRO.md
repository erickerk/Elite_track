# Guia de Migração para Supabase Pro

## Por que migrar?

| Recurso | Free | Pro (US$ 25/mês) |
|---|---|---|
| **Database** | 500 MB | 8 GB (expansível) |
| **Storage** | 1 GB | 100 GB |
| **Bandwidth** | 2 GB | 250 GB |
| **Backups** | Nenhum | Diários (7 dias) |
| **Auth MAUs** | 50.000 | 100.000 |
| **Realtime** | 200 conexões | 500 conexões |
| **Edge Functions** | 500K invocações | 2M invocações |
| **Logs** | 1 dia | 7 dias |
| **Suporte** | Comunidade | E-mail |

## Quando migrar?

Migre para Pro quando **qualquer um** desses limites for atingido:

- Storage > 800 MB (fotos de blindagem)
- Mais de 150 usuários ativos
- Necessidade de backups automáticos
- Tempo de resposta do banco degradando

## Como migrar

### Passo 1: Acessar painel Supabase

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione o projeto Elite Track
3. Vá em **Settings > Billing**
4. Clique em **Upgrade to Pro**

### Passo 2: Configurar backups automáticos

Após upgrade, os backups diários são **automáticos**.
Para backup adicional via GitHub Actions:

1. No Supabase, vá em **Settings > Database > Connection String**
2. Copie a URI de conexão
3. No GitHub, vá em **Settings > Secrets > Actions**
4. Crie o secret `SUPABASE_DB_URL` com a URI copiada
5. O workflow `backup.yml` rodará semanalmente

### Passo 3: Configurar alertas de uso

1. Supabase > **Settings > Billing > Usage Alerts**
2. Configure alerta em 80% do storage
3. Configure alerta em 80% do bandwidth

### Passo 4: Habilitar Point-in-Time Recovery (opcional)

Disponível no plano Pro por US$ 100/mês adicional.
Recomendado apenas quando o app tiver > 500 usuários.

## Custos estimados

| Cenário | Custo mensal |
|---|---|
| **Até 200 usuários** | ~R$ 125 (Pro base) |
| **200-500 usuários** | ~R$ 200 (Pro + storage extra) |
| **500+ usuários** | ~R$ 400 (Pro + PITR + compute) |

## Checklist pré-migração

- [ ] Fazer backup manual do banco (usar `scripts/backup-supabase.mjs`)
- [ ] Verificar variáveis de ambiente em produção
- [ ] Configurar `SUPABASE_DB_URL` nos GitHub Secrets
- [ ] Testar conexão com banco após upgrade
- [ ] Verificar RLS policies estão ativas
- [ ] Configurar alertas de uso
