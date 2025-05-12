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
        title: "Authentication Required",
        description: "Please click the user icon in the top-right corner to log in.",
        variant: "destructive",
      })
    }
  }, [searchParams, toast, user])
  
  // This component doesn't render anything visible
  return null
} 