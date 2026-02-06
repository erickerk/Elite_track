/**
 * Configuração do Sentry para monitoramento de erros em produção.
 * 
 * SETUP:
 * 1. Criar conta em https://sentry.io
 * 2. Criar projeto React
 * 3. Adicionar VITE_SENTRY_DSN no .env
 * 4. Instalar: npm install @sentry/react
 */

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SentryModule: any = null

export async function initSentry() {
  if (!SENTRY_DSN || import.meta.env.DEV) {
    console.log('[Sentry] Desabilitado (sem DSN ou ambiente de desenvolvimento)')
    return
  }

  try {
    // Dynamic import — só carrega @sentry/react quando instalado e DSN configurado
    const sentryPkg = '@sentry/react'
    SentryModule = await import(/* @vite-ignore */ sentryPkg)

    SentryModule.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: `elitetrack@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

      integrations: [
        SentryModule.browserTracingIntegration(),
        SentryModule.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],

      // Performance: amostragem de 20% das transações
      tracesSampleRate: 0.2,

      // Session Replay: 10% normal, 100% em erro
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })

    console.log('[Sentry] Inicializado com sucesso')
  } catch (err) {
    console.warn('[Sentry] Falha ao inicializar (pacote @sentry/react não instalado?):', err)
  }
}

/**
 * Captura erro manualmente.
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (SentryModule) {
    SentryModule.captureException(error, { extra: context })
  }
  console.error('[Error]', error.message, context)
}

/**
 * Define contexto do usuário para rastreamento.
 */
export function setUserContext(user: { id: string; email?: string; role?: string }) {
  if (SentryModule) {
    SentryModule.setUser({ id: user.id, email: user.email, segment: user.role })
  }
}

/**
 * Limpa contexto do usuário (logout).
 */
export function clearUserContext() {
  if (SentryModule) {
    SentryModule.setUser(null)
  }
}
