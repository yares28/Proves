"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Copy, ArrowLeft, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'

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
      
      // Check if this is a Supabase auth callback
      if (searchParams.get('state') || searchParams.get('access_token') || searchParams.get('refresh_token')) {
        setIsSupabaseAuth(true)
        
        try {
          console.log('🔄 Processing Supabase auth callback...')
          
          // Handle Supabase OAuth callback
          const { data, error: supabaseError } = await supabase.auth.exchangeCodeForSession(code || '')
          
          if (supabaseError) {
            console.error('❌ Supabase auth error:', supabaseError.message)
            setError(`Autenticación fallida: ${supabaseError.message}`)
            setIsProcessing(false)
            return
          }
          
          if (data?.session) {
            console.log('✅ Supabase auth successful')
            toast({
              title: "¡Autenticación exitosa!",
              description: "Has iniciado sesión correctamente.",
            })
            
            // Redirect immediately to intended page
            router.push('/my-calendars')
            return
          }
        } catch (error) {
          console.error('❌ Unexpected auth error:', error)
          setError('Error inesperado durante la autenticación')
        }
      }
      // Handle Google Calendar OAuth callback
      else if (code && !errorParam) {
        console.log('🔄 Processing Google Calendar OAuth callback...')
        setAuthCode(code)
      }
      // Handle OAuth errors
      else if (errorParam) {
        console.error('❌ OAuth error:', errorParam, errorDescription)
        setError(errorParam === 'access_denied' 
          ? 'Acceso denegado. Necesitas otorgar permisos de calendario para exportar exámenes.'
          : `Error de autorización: ${errorDescription || errorParam}`
        )
      }
      // No valid callback parameters
      else {
        console.warn('⚠️ No valid callback parameters found')
        setError('No se recibió código de autorización válido')
      }
      
      setIsProcessing(false)
    }

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