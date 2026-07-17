"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/hooks/use-toast"

const supabase = createClient()

interface EnhancedGoogleAuthProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  redirectTo?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showLoadingText?: boolean
}

export function EnhancedGoogleAuth({ 
  onSuccess,
  onError,
  redirectTo,
  className = "w-full",
  variant = "outline",
  size = "default",
  showLoadingText = true
}: EnhancedGoogleAuthProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Enhanced Google OAuth sign-in with improved security and error handling
  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Initiating Google OAuth authentication...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        console.error('❌ Google authentication error:', error)
        
        // Provide user-friendly error messages based on error type
        let userMessage = 'Error en la autenticación con Google'
        
        switch (error.message) {
          case 'oauth_provider_not_supported':
            userMessage = 'Google OAuth no está habilitado en este momento'
            break
          case 'access_denied':
            userMessage = 'Acceso denegado. Es necesario otorgar permisos para continuar.'
            break
          case 'invalid_request':
            userMessage = 'Solicitud inválida. Por favor intenta de nuevo.'
            break
          case 'server_error':
            userMessage = 'Error del servidor. Por favor intenta más tarde.'
            break
          default:
            if (error.message.includes('popup')) {
              userMessage = 'Por favor permite las ventanas emergentes para este sitio'
            } else if (error.message.includes('redirect')) {
              userMessage = 'Error de redirección. Verifica la configuración.'
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

      console.log('✅ Google authentication initiated successfully')
      
      toast({
        title: "Redirigiendo...",
        description: "Te estamos redirigiendo a Google para autenticarte.",
      })
      
      // Call success callback if provided
      onSuccess?.()
      
    } catch (err) {
      console.error('❌ Unexpected error during Google sign in:', err)
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

  // Monitor auth state changes for better UX
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ Google authentication completed successfully')

        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión exitosamente con Google.",
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [toast])

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
    </div>
  )
}

// Enhanced Google One-Tap component for seamless authentication
export function GoogleOneTap() {
  const [isInitialized, setIsInitialized] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const initializeGoogleOneTap = async () => {
      if (isInitialized) return
      
      try {
        // Check if user is already authenticated
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('👤 User already authenticated, skipping One Tap')
          return
        }

        // Generate nonce for security
        const generateNonce = async (): Promise<[string, string]> => {
          const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
          const encoder = new TextEncoder()
          const encodedNonce = encoder.encode(nonce)
          const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
          return [nonce, hashedNonce]
        }

        const [nonce, hashedNonce] = await generateNonce()

        // Initialize Google One Tap
        if (typeof window !== 'undefined' && window.google) {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            callback: async (response: any) => {
              try {
                console.log('🔄 Processing Google One Tap response...')
                
                const { data, error } = await supabase.auth.signInWithIdToken({
                  provider: 'google',
                  token: response.credential,
                  nonce,
                })

                if (error) {
                  console.error('❌ Google One Tap error:', error)
                  toast({
                    title: "Error de autenticación",
                    description: "No se pudo completar la autenticación con Google.",
                    variant: "destructive",
                  })
                  return
                }

                console.log('✅ Google One Tap authentication successful')
                toast({
                  title: "¡Bienvenido!",
                  description: "Has iniciado sesión exitosamente.",
                })

                // Redirect to protected page
                window.location.href = '/my-calendars'
              } catch (error) {
                console.error('❌ Unexpected One Tap error:', error)
                toast({
                  title: "Error inesperado",
                  description: "Ocurrió un error durante la autenticación.",
                  variant: "destructive",
                })
              }
            },
            nonce: hashedNonce,
            use_fedcm_for_prompt: true,
          })

          window.google.accounts.id.prompt()
          setIsInitialized(true)
          console.log('✅ Google One Tap initialized')
        }
      } catch (error) {
        console.error('❌ Failed to initialize Google One Tap:', error)
      }
    }

    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => initializeGoogleOneTap()
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [isInitialized, toast])

  return <div id="oneTap" className="fixed top-4 right-4 z-50" />
} 