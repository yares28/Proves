"use client"

import { useState } from "react"
import { AuthDebugger } from "@/components/auth-debugger"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { saveUserCalendar } from "@/actions/user-calendars"
import { getCurrentSession } from "@/utils/auth-helpers"

export default function AuthTestPage() {
  const { user, syncToken, refreshSession } = useAuth()
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const runSaveTest = async () => {
    setIsLoading(true)
    setTestResult(null)
    
    try {
      // First, sync auth tokens to ensure fresh state
      console.log("⏳ Sincronizando tokens de autenticación...");
      const syncSuccess = await syncToken();
      
      if (!syncSuccess) {
        setTestResult({
          success: false,
          message: "Error al sincronizar tokens. Por favor inicia sesión nuevamente."
        });
        setIsLoading(false);
        return;
      }
      
      // Get current session
      const session = await getCurrentSession();
      
      if (!session?.access_token) {
        setTestResult({
          success: false,
          message: "No se encontró token de acceso válido. Por favor inicia sesión."
        });
        setIsLoading(false);
        return;
      }
      
      if (!user?.id) {
        setTestResult({
          success: false,
          message: "No se encontró ID de usuario. Por favor inicia sesión."
        });
        setIsLoading(false);
        return;
      }
      
      // Attempt to save a test calendar
      const response = await saveUserCalendar({
        name: `Test Calendar ${new Date().toISOString()}`,
        filters: { test: ["true"] },
        userId: user.id,
        accessToken: session.access_token,
        refreshToken: session.refresh_token
      });
      
      setTestResult({
        success: true,
        message: `¡Calendario guardado exitosamente! Respuesta: ${JSON.stringify(response)}`
      });
    } catch (error) {
      console.error("Error en prueba de guardado:", error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    setIsRefreshing(true)
    try {
      const success = await refreshSession()
      if (success) {
        setTestResult({
          success: true,
          message: "Sesión actualizada exitosamente"
        })
      } else {
        setTestResult({
          success: false,
          message: "Error al actualizar la sesión"
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Error inesperado al actualizar la sesión"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-3xl font-bold">Página de Prueba de Autenticación</h1>
      <p className="text-muted-foreground">
        Esta página ayuda a diagnosticar problemas de autenticación con acciones del servidor.
      </p>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <AuthDebugger />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prueba de Guardado de Calendario</CardTitle>
              <CardDescription>
                Prueba el flujo de autenticación basado en tokens para guardar calendarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button 
                  onClick={runSaveTest} 
                  disabled={isLoading || !user}
                  className="w-full"
                >
                  {isLoading ? "Probando..." : "Ejecutar Prueba de Guardado"}
                </Button>
                
                <Button 
                  onClick={handleRefreshSession} 
                  disabled={isRefreshing || !user}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? "Actualizando..." : "Actualizar Sesión"}
                </Button>
                
                {!user && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Por favor inicia sesión para ejecutar estas pruebas
                  </p>
                )}
              </div>
              
              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {testResult.success ? "Prueba Exitosa" : "Prueba Fallida"}
                  </AlertTitle>
                  <AlertDescription>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Consejos de Resolución de Problemas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Asegúrate de estar conectado con una cuenta de usuario válida</li>
                <li>Verifica que tanto los tokens de acceso como de actualización estén disponibles</li>
                <li>Confirma que el tiempo de expiración del token no haya pasado</li>
                <li>Intenta cerrar sesión y volver a conectarte para actualizar los tokens</li>
                <li>Limpia el caché/cookies del navegador si los problemas persisten</li>
                <li>Revisa los logs del servidor para información detallada de errores</li>
                <li>Usa el botón "Actualizar Sesión" para forzar una actualización de tokens</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 