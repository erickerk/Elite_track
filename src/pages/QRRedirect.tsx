import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, QrCode } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface QRCodeData {
  code: string
  target_type: 'project' | 'laudo' | 'vehicle' | 'card' | 'invite'
  target_id: string | null
  target_url: string | null
  active: boolean
}

export function QRRedirect() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'error' | 'not_found' | 'inactive'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function resolveQRCode() {
      if (!code) {
        console.log('[QRRedirect] ❌ Código não fornecido')
        setStatus('not_found')
        setErrorMessage('Código QR não fornecido')
        return
      }

      console.log('[QRRedirect] 📍 Resolvendo código:', code)
      console.log('[QRRedirect] 🔍 Verificando se é UUID:', {
        hasHyphen: code.includes('-'),
        length: code.length,
        isUUID: code.includes('-') && code.length > 20
      })

      // Se for um UUID ou ID de projeto, redirecionar direto para /verify
      if (code.includes('-') && code.length > 20) {
        console.log('[QRRedirect] ✅ UUID detectado - redirecionando para /verify/' + code)
        navigate(`/verify/${code}`, { replace: true })
        return
      }

      // Buscar no Supabase
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await (supabase as any)
            .from('qr_codes')
            .select('*')
            .eq('code', code)
            .single()

          if (error || !data) {
            // Fallback: tentar como ID de projeto
            navigate(`/verify/${code}`, { replace: true })
            return
          }

          const qrData = data as QRCodeData

          // Verificar se está ativo
          if (!qrData.active) {
            setStatus('inactive')
            setErrorMessage('Este QR Code não está mais ativo')
            return
          }

          // Atualizar contador de scans
          await (supabase as any)
            .from('qr_codes')
            .update({ 
              scan_count: (data.scan_count || 0) + 1,
              last_scanned_at: new Date().toISOString()
            })
            .eq('code', code)

          // Redirecionar baseado no tipo
          if (qrData.target_url) {
            window.location.href = qrData.target_url
            return
          }

          switch (qrData.target_type) {
            case 'project':
            case 'laudo':
              navigate(`/verify/${qrData.target_id}`, { replace: true })
              break
            case 'vehicle':
              navigate(`/verify/${qrData.target_id}`, { replace: true })
              break
            case 'card':
              navigate(`/elite-card`, { replace: true })
              break
            case 'invite':
              navigate(`/register/${qrData.target_id}`, { replace: true })
              break
            default:
              navigate(`/verify/${qrData.target_id || code}`, { replace: true })
          }
        } catch (err) {
          console.error('[QRRedirect] Erro ao buscar QR:', err)
          // Fallback: tentar como ID de projeto
          navigate(`/verify/${code}`, { replace: true })
        }
      } else {
        // Sem Supabase: fallback para /verify
        navigate(`/verify/${code}`, { replace: true })
      }
    }

    void resolveQRCode()
  }, [code, navigate])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (status === 'inactive' || status === 'not_found' || status === 'error') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            {status === 'inactive' ? (
              <QrCode className="w-10 h-10 text-red-400" />
            ) : (
              <AlertCircle className="w-10 h-10 text-red-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {status === 'inactive' ? 'QR Code Inativo' : 'QR Code não encontrado'}
          </h1>
          <p className="text-gray-400 mb-8">
            {errorMessage || 'O código escaneado não foi encontrado ou não está mais disponível.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-black rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Ir para Página Inicial
          </button>
        </div>
      </div>
    )
  }

  return null
}
export default QRRedirect
