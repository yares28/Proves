"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Copy, ArrowLeft, Loader2, Shield, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'
import { authPerformanceTracker } from '@/components/auth-performance-monitor'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useSettings } from '@/context/settings-context'
import Image from 'next/image'

const supabase = createClient()

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const [mounted, setMounted] = useState(false)
  const [authCode, setAuthCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isSupabaseAuth, setIsSupabaseAuth] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which logo to use based on theme - with proper hydration handling
  const getLogo = () => {
    // Always return the same logo during SSR to prevent hydration mismatch
    if (!mounted) return "/logo-full2.png"
    
    const currentTheme = settings.theme === 'system' ? theme : settings.theme
    return currentTheme === "light" ? "/logo-full-light.png" : "/logo-full2.png"
  }

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

  // Don't render theme-dependent content until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
        {/* Background pattern */}
        <div className="absolute inset-0 -z-10">
          <svg
            className="absolute inset-0 h-full w-full opacity-30 dark:opacity-10"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern
                id="grid-pattern"
                patternUnits="userSpaceOnUse"
                width="100"
                height="100"
                patternTransform="scale(0.5) rotate(0)"
              >
                <rect x="0" y="0" width="100%" height="100%" fill="none" />
                <path
                  d="M100,0 L100,100 L0,100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeOpacity="0.3"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Animated background elements */}
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>

        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            <Card className="glass-card border-0 shadow-2xl backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-muted-foreground text-center">
                    Cargando...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
        {/* Background pattern */}
        <div className="absolute inset-0 -z-10">
          <svg
            className="absolute inset-0 h-full w-full opacity-30 dark:opacity-10"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern
                id="grid-pattern"
                patternUnits="userSpaceOnUse"
                width="100"
                height="100"
                patternTransform="scale(0.5) rotate(0)"
              >
                <rect x="0" y="0" width="100%" height="100%" fill="none" />
                <path
                  d="M100,0 L100,100 L0,100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeOpacity="0.3"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Animated background elements */}
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>

        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="glass-card border-0 shadow-2xl backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                    <Loader2 className="h-8 w-8 text-primary relative z-10" />
                  </motion.div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Procesando autenticación...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Estamos verificando tus credenciales
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10">
        <svg
          className="absolute inset-0 h-full w-full opacity-30 dark:opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="grid-pattern"
              patternUnits="userSpaceOnUse"
              width="100"
              height="100"
              patternTransform="scale(0.5) rotate(0)"
            >
              <rect x="0" y="0" width="100%" height="100%" fill="none" />
              <path
                d="M100,0 L100,100 L0,100"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeOpacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Animated background elements */}
      <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          <Card className="glass-card border-0 shadow-2xl backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-4"
              >
                <Image 
                  src={getLogo()}
                  alt="UPV Calendario de Exámenes" 
                  width={200} 
                  height={80}
                  className="h-auto w-auto mx-auto drop-shadow-lg"
                  priority
                />
              </motion.div>
              <CardTitle className="flex items-center justify-center gap-3 text-xl">
                {error ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, delay: 0.3 }}
                      className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center"
                    >
                      <AlertCircle className="h-4 w-4 text-white" />
                    </motion.div>
                    <span className="text-red-600 dark:text-red-400">
                      {isSupabaseAuth ? 'Error de Autenticación' : 'Error de Autorización'}
                    </span>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, delay: 0.3 }}
                      className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <CheckCircle className="h-4 w-4 text-white" />
                    </motion.div>
                    <span className="text-green-600 dark:text-green-400">
                      {isSupabaseAuth ? 'Autenticación Exitosa' : 'Autorización Exitosa'}
                    </span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="space-y-4"
                >
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {error}
                    </p>
                  </div>
                  <div className="flex space-x-3">
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
                </motion.div>
              ) : isSupabaseAuth ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-center space-y-4"
                >
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-500/50 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Redirigiendo a tu panel de calendarios...
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-6 w-6 text-primary" />
                    </motion.div>
                  </div>
                </motion.div>
              ) : authCode ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <div className="text-center space-y-2">
                      <Shield className="h-12 w-12 text-primary/50 mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Copia este código de autorización y pégalo en el diálogo de exportación:
                      </p>
                    </div>
                    <div className="relative">
                      <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm break-all border border-border/50 backdrop-blur-sm">
                        {authCode}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyToClipboard}
                        className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-center">Siguientes Pasos:</h4>
                    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                      <ol className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">1</span>
                          Copia el código de autorización de arriba
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">2</span>
                          Regresa a la página del calendario
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">3</span>
                          Pega el código en el diálogo de exportación
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">4</span>
                          Completa el proceso de exportación
                        </li>
                      </ol>
                    </div>
                  </div>

                  <Button onClick={goBack} className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Calendario
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-center space-y-4"
                >
                  <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Procesando autorización...
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
        {/* Background pattern */}
        <div className="absolute inset-0 -z-10">
          <svg
            className="absolute inset-0 h-full w-full opacity-30 dark:opacity-10"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern
                id="grid-pattern"
                patternUnits="userSpaceOnUse"
                width="100"
                height="100"
                patternTransform="scale(0.5) rotate(0)"
              >
                <rect x="0" y="0" width="100%" height="100%" fill="none" />
                <path
                  d="M100,0 L100,100 L0,100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeOpacity="0.3"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Animated background elements */}
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>

        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            <Card className="glass-card border-0 shadow-2xl backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-muted-foreground text-center">
                    Cargando autenticación...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
} 