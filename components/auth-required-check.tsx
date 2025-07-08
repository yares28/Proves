"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"

export function AuthRequiredCheck() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()
  
  useEffect(() => {
    // Check if auth_required is in the URL
    if (searchParams.get("auth_required") === "true" && !user) {
      // Show a toast message
      toast({
        title: "Autenticación Requerida",
        description: "Por favor haz clic en el icono de usuario en la esquina superior derecha para iniciar sesión.",
        variant: "destructive",
      })
    }
  }, [searchParams, toast, user])
  
  // This component doesn't render anything visible
  return null
} 