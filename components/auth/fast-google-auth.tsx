"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { authPerformanceTracker } from "../auth-performance-monitor"

const supabase = createClient()

interface FastGoogleAuthProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  redirectTo?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showLoadingText?: boolean
  mode?: "fast" | "secure" // fast = implicit flow, secure = PKCE flow
}

export function FastGoogleAuth({ 
  onSuccess,
  onError,
  redirectTo,
  className = "w-full",
  variant = "outline",
  size = "default",
  showLoadingText = true,
  mode = "fast"
}: FastGoogleAuthProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log(`🔄 Initiating Google OAuth authentication (${mode} mode)...`)
      
      // Start performance tracking
      authPerformanceTracker.start(mode === "fast" ? "implicit" : "pkce")
      authPerformanceTracker.stage(`Iniciando ${mode === "fast" ? "flujo implícito" : "flujo PKCE"}`)
      
      const authOptions = mode === "fast" 
        ? {
            // Implicit flow - faster, direct to Supabase
            provider: 'google' as const,
            options: {
              scopes: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              }
            }
          }
        : {
            // PKCE flow - more secure, through app callback
            provider: 'google' as const,
            options: {
              redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
              scopes: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              }
            }
          }

      const { data, error } = await supabase.auth.signInWithOAuth(authOptions)

      if (error) {
        console.error('❌ Google authentication error:', error)
        authPerformanceTracker.complete(false)
        
        // Provide user-friendly error messages
        let userMessage = 'Error en la autenticación con Google'
        
        switch (error.message) {
          case 'oauth_provider_not_supported':
            userMessage = 'Google OAuth no está habilitado'
            break
          case 'access_denied':
            userMessage = 'Acceso denegado. Es necesario otorgar permisos.'
            break
          case 'invalid_request':
            userMessage = 'Solicitud inválida. Intenta de nuevo.'
            break
          case 'server_error':
            userMessage = 'Error del servidor. Intenta más tarde.'
            break
          default:
            if (error.message.includes('popup')) {
              userMessage = 'Permite las ventanas emergentes para este sitio'
            }
        }
        
        setError(userMessage)
        onError?.(userMessage)
        
        toast({
          title: "Error de autenticación",
          description: userMessage,
          variant: "destructive",
        })
        
        return
      }

      console.log(`✅ Google authentication initiated (${mode} mode)`)
      
      if (mode === "fast") {
        // For implicit flow, auth happens automatically on redirect
        authPerformanceTracker.stage("Redirigiendo a Google (flujo implícito)", 1)
        toast({
          title: "Redirigiendo...",
          description: "Autenticando con Google...",
        })
      } else {
        // For PKCE flow, we get a URL to redirect to
        if (data?.url) {
          authPerformanceTracker.stage("Redirigiendo a Google (flujo PKCE)", 1)
          toast({
            title: "Redirigiendo...",
            description: "Te estamos redirigiendo a Google...",
          })
          window.location.href = data.url
        }
      }
      
      onSuccess?.()
      
    } catch (err: any) {
      console.error('❌ Unexpected error during Google sign in:', err)
      authPerformanceTracker.complete(false)
      const errorMessage = 'Error inesperado durante la autenticación'
      setError(errorMessage)
      onError?.(errorMessage)
      
      toast({
        title: "Error inesperado",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Button
          variant={variant}
          size={size}
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className={className}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {showLoadingText && "Conectando con Google..."}
            </>
          ) : (
            <>
              <Icons.google className="mr-2 h-4 w-4" />
              Continuar con Google
            </>
          )}
        </Button>
        
        {mode === "fast" && (
          <p className="text-xs text-muted-foreground text-center">
            🚀 Modo rápido activado
          </p>
        )}
      </div>
    </div>
  )
}

// Performance comparison component
export function GoogleAuthModeSelector() {
  const [selectedMode, setSelectedMode] = useState<"fast" | "secure">("fast")
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setSelectedMode("fast")}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            selectedMode === "fast" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🚀 Rápido
        </button>
        <button
          onClick={() => setSelectedMode("secure")}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            selectedMode === "secure" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🔒 Seguro
        </button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {selectedMode === "fast" ? (
          <p>⚡ Flujo implícito - Más rápido, menos redirects</p>
        ) : (
          <p>🔐 Flujo PKCE - Más seguro, mejor para producción</p>
        )}
      </div>
      
      <FastGoogleAuth mode={selectedMode} />
    </div>
  )
} 