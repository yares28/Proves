"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Timer, Zap, Shield, AlertCircle, CheckCircle2 } from "lucide-react"

interface AuthPerformanceMetrics {
  startTime: number
  endTime?: number
  duration?: number
  flow: 'implicit' | 'pkce'
  status: 'pending' | 'success' | 'error'
  redirectCount: number
  stage: string
}

export function AuthPerformanceMonitor() {
  const [metrics, setMetrics] = useState<AuthPerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Listen for auth performance events
    const handleAuthStart = (event: CustomEvent) => {
      setMetrics({
        startTime: Date.now(),
        flow: event.detail.flow || 'pkce',
        status: 'pending',
        redirectCount: 0,
        stage: 'Iniciando autenticación...'
      })
      setIsVisible(true)
    }

    const handleAuthStage = (event: CustomEvent) => {
      setMetrics(prev => prev ? {
        ...prev,
        stage: event.detail.stage,
        redirectCount: event.detail.redirectCount || prev.redirectCount
      } : null)
    }

    const handleAuthComplete = (event: CustomEvent) => {
      const endTime = Date.now()
      setMetrics(prev => prev ? {
        ...prev,
        endTime,
        duration: endTime - prev.startTime,
        status: event.detail.success ? 'success' : 'error',
        stage: event.detail.success ? 'Autenticación completada' : 'Error en autenticación'
      } : null)

      // Hide after 5 seconds
      setTimeout(() => setIsVisible(false), 5000)
    }

    // Add event listeners
    window.addEventListener('auth:start', handleAuthStart as EventListener)
    window.addEventListener('auth:stage', handleAuthStage as EventListener)
    window.addEventListener('auth:complete', handleAuthComplete as EventListener)

    return () => {
      window.removeEventListener('auth:start', handleAuthStart as EventListener)
      window.removeEventListener('auth:stage', handleAuthStage as EventListener)
      window.removeEventListener('auth:complete', handleAuthComplete as EventListener)
    }
  }, [])

  if (!isVisible || !metrics) return null

  const getPerformanceColor = (duration?: number) => {
    if (!duration) return 'yellow'
    if (duration < 2000) return 'green'
    if (duration < 4000) return 'yellow'
    return 'red'
  }

  const getPerformanceLabel = (duration?: number) => {
    if (!duration) return 'En progreso...'
    if (duration < 2000) return 'Excelente'
    if (duration < 4000) return 'Bueno'
    return 'Lento'
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Timer className="h-4 w-4" />
          Performance de Autenticación
          {metrics.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {metrics.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Flow type */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tipo de flujo:</span>
          <Badge variant={metrics.flow === 'implicit' ? 'default' : 'secondary'}>
            {metrics.flow === 'implicit' ? (
              <>
                <Zap className="h-3 w-3 mr-1" />
                Implícito
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 mr-1" />
                PKCE
              </>
            )}
          </Badge>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Duración:</span>
          <Badge variant={getPerformanceColor(metrics.duration) === 'green' ? 'default' : 'destructive'}>
            {metrics.duration ? `${metrics.duration}ms` : 'Calculando...'}
          </Badge>
        </div>

        {/* Performance rating */}
        {metrics.duration && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Rendimiento:</span>
            <Badge variant={getPerformanceColor(metrics.duration) === 'green' ? 'default' : 'secondary'}>
              {getPerformanceLabel(metrics.duration)}
            </Badge>
          </div>
        )}

        {/* Progress bar */}
        {metrics.status === 'pending' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Progreso</span>
              <span>{Math.min(((Date.now() - metrics.startTime) / 5000) * 100, 95).toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(((Date.now() - metrics.startTime) / 5000) * 100, 95)} />
          </div>
        )}

        {/* Current stage */}
        <div className="text-xs text-muted-foreground">
          {metrics.stage}
        </div>

        {/* Redirect count */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Redirects:</span>
          <span>{metrics.redirectCount}</span>
        </div>

        {/* Performance tips */}
        {metrics.status === 'success' && metrics.duration && metrics.duration > 3000 && (
          <div className="text-xs p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border">
            💡 Para mejor rendimiento, considera usar el modo "fast" (flujo implícito)
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper functions to emit performance events
export const authPerformanceTracker = {
  start: (flow: 'implicit' | 'pkce') => {
    window.dispatchEvent(new CustomEvent('auth:start', { 
      detail: { flow } 
    }))
  },
  
  stage: (stage: string, redirectCount?: number) => {
    window.dispatchEvent(new CustomEvent('auth:stage', { 
      detail: { stage, redirectCount } 
    }))
  },
  
  complete: (success: boolean) => {
    window.dispatchEvent(new CustomEvent('auth:complete', { 
      detail: { success } 
    }))
  }
} 