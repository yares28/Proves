"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, RefreshCw, Shield } from 'lucide-react'
import { Suspense, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useSettings } from '@/context/settings-context'
import Image from 'next/image'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { theme } = useTheme()
  const { settings } = useSettings()
  const [mounted, setMounted] = useState(false)
  const error = searchParams.get('error')

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

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'access_denied':
        return 'Acceso denegado. Es necesario otorgar permisos para continuar.'
      case 'missing_code':
        return 'No se recibió código de autorización. Por favor, intenta de nuevo.'
      case 'server_error':
        return 'Error del servidor. Por favor, intenta más tarde.'
      case 'invalid_request':
        return 'Solicitud inválida. Verifica la configuración de la aplicación.'
      case 'unauthorized_client':
        return 'Cliente no autorizado. Contacta al administrador.'
      case 'unsupported_response_type':
        return 'Tipo de respuesta no soportado.'
      case 'invalid_scope':
        return 'Permisos solicitados inválidos.'
      case 'temporarily_unavailable':
        return 'Servicio temporalmente no disponible. Intenta más tarde.'
      case 'timeout':
        return 'La autenticación tardó demasiado tiempo. Por favor, intenta de nuevo.'
      default:
        return error || 'Error desconocido durante la autenticación.'
    }
  }

  const goBack = () => {
    router.push('/')
  }

  const retryAuth = () => {
    router.push('/')
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
                  <AlertCircle className="h-4 w-4 animate-pulse" />
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, delay: 0.3 }}
                  className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center"
                >
                  <AlertCircle className="h-4 w-4 text-white" />
                </motion.div>
                <span className="text-red-600 dark:text-red-400">
                  Error de Autenticación
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-4"
              >
                <div className="text-center space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {getErrorMessage(error)}
                    </p>
                    {error && (
                      <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-3 rounded-lg border border-border/50 backdrop-blur-sm">
                        Código de error: {error}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button onClick={goBack} variant="outline" className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Inicio
                  </Button>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default function AuthCodeError() {
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
                  <AlertCircle className="h-4 w-4 animate-pulse" />
                  <p className="text-sm text-muted-foreground text-center">
                    Cargando...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
} 