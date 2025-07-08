"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

const supabase = createClient()

export function AuthStatusIndicator() {
  // Component disabled - no authentication warnings or popups will be shown
  return null
} 