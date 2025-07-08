"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')

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
    router.push('/auth-test')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Error de Autenticación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(error)}
            </p>
            {error && (
              <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                Código de error: {error}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={goBack} variant="outline" className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Inicio
            </Button>
            <Button onClick={retryAuth} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            Si el problema persiste, contacta al soporte técnico.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">Cargando...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
} 