"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Copy, ArrowLeft, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'
import { authPerformanceTracker } from '@/components/auth-performance-monitor'

const supabase = createClient()

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [authCode, setAuthCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isSupabaseAuth, setIsSupabaseAuth] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      const state = searchParams.get('state')
      
      // Handle OAuth errors immediately
      if (errorParam) {
        console.error('❌ OAuth error:', errorParam, errorDescription)
        authPerformanceTracker.complete(false)
        
        const userFriendlyError = errorParam === 'access_denied' 
          ? 'Acceso denegado. Necesitas otorgar permisos para continuar.'
          : `Error de autorización: ${errorDescription || errorParam}`
        
        setError(userFriendlyError)
        setIsProcessing(false)
        return
      }
      
      // Handle Google Calendar OAuth callback (has specific state parameter)
      if (state && state.includes('google-calendar') && code) {
        console.log('🔄 Processing Google Calendar OAuth callback...')
        authPerformanceTracker.stage('Procesando Google Calendar OAuth')
        setAuthCode(code)
        setIsProcessing(false)
        return
      }
      
      // Handle Supabase auth callback (OAuth flow)
      if (code && !state?.includes('google-calendar')) {
        setIsSupabaseAuth(true)
        authPerformanceTracker.stage('Intercambiando código por sesión', 1)
        
        try {
          console.log('🔄 Processing Supabase OAuth callback...')
          
          // Try to exchange code for session
          const { data, error: supabaseError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (supabaseError) {
            console.error('❌ Supabase auth error:', supabaseError.message)
            authPerformanceTracker.complete(false)
            
            // Provide user-friendly error messages
            let userMessage = 'Error en la autenticación'
            if (supabaseError.message.includes('invalid_grant')) {
              userMessage = 'Código de autorización expirado. Intenta de nuevo.'
            } else if (supabaseError.message.includes('network')) {
              userMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.'
            } else if (supabaseError.message.includes('code verifier')) {
              userMessage = 'Error de configuración de autenticación. Intenta de nuevo.'
            }
            
            setError(userMessage)
            setIsProcessing(false)
            return
          }
          
          if (data?.session) {
            console.log('✅ Supabase PKCE auth successful')
            authPerformanceTracker.complete(true)
            
            // Store provider tokens if available for future use
            if (data.session.provider_token) {
              localStorage.setItem('oauth_provider_token', data.session.provider_token)
            }
            if (data.session.provider_refresh_token) {
              localStorage.setItem('oauth_provider_refresh_token', data.session.provider_refresh_token)
            }
            
            toast({
              title: "¡Autenticación exitosa!",
              description: "Has iniciado sesión correctamente.",
            })
            
            // Get redirect destination from URL params or default
            const next = searchParams.get('next') || '/my-calendars'
            const validNext = next.startsWith('/') ? next : '/my-calendars'
            
            // Redirect immediately to intended page
            router.push(validNext)
            return
          }
        } catch (error: any) {
          console.error('❌ Unexpected auth error:', error)
          authPerformanceTracker.complete(false)
          
          let errorMessage = 'Error inesperado durante la autenticación'
          if (error.message === 'timeout') {
            errorMessage = 'La autenticación tardó demasiado tiempo. Intenta de nuevo.'
          }
          
          setError(errorMessage)
        }
      }
      // No valid callback parameters
      else if (!code) {
        console.warn('⚠️ No authorization code received')
        authPerformanceTracker.complete(false)
        setError('No se recibió código de autorización válido')
      }
      
      setIsProcessing(false)
    }

    // Start performance tracking
    authPerformanceTracker.stage('Iniciando procesamiento de callback')
    handleAuthCallback()
  }, [searchParams, router, toast])

  const copyToClipboard = async () => {
    if (authCode) {
      try {
        await navigator.clipboard.writeText(authCode)
        setCopied(true)
        toast({
          title: "¡Copiado!",
          description: "Código de autorización copiado al portapapeles",
        })
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        toast({
          title: "Error al copiar",
          description: "Por favor selecciona y copia el código manualmente",
          variant: "destructive",
        })
      }
    }
  }

  const goBack = () => {
    router.push('/')
  }

  const retryAuth = () => {
    router.push('/my-calendars')
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Procesando autenticación...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {error ? (
              <>
                <div className="h-5 w-5 rounded-full bg-red-500" />
                {isSupabaseAuth ? 'Error de Autenticación' : 'Error de Autorización'}
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                {isSupabaseAuth ? 'Autenticación Exitosa' : 'Autorización Exitosa'}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <>
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
              <div className="flex space-x-2">
                <Button onClick={goBack} variant="outline" className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Inicio
                </Button>
                {isSupabaseAuth && (
                  <Button onClick={retryAuth} className="flex-1">
                    Reintentar
                  </Button>
                )}
              </div>
            </>
          ) : isSupabaseAuth ? (
            <>
              <p className="text-sm text-muted-foreground">
                Redirigiendo a tu panel de calendarios...
              </p>
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </>
          ) : authCode ? (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Copia este código de autorización y pégalo en el diálogo de exportación:
                </p>
                <div className="relative">
                  <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {authCode}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Siguientes Pasos:</h4>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Copia el código de autorización de arriba</li>
                  <li>2. Regresa a la página del calendario</li>
                  <li>3. Pega el código en el diálogo de exportación</li>
                  <li>4. Completa el proceso de exportación</li>
                </ol>
              </div>

              <Button onClick={goBack} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Calendario
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Procesando autorización...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm text-muted-foreground text-center">
                Cargando autenticación...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
} 