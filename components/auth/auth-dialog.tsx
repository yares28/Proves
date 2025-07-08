"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { Search, Calendar } from "lucide-react"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const router = useRouter()

  const handleMyCalendars = () => {
    onOpenChange(false)
    router.push("/my-calendars")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            {activeTab === "login" ? "Bienvenido de nuevo" : "Crear una cuenta"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {activeTab === "login"
              ? "Inicia sesión en tu cuenta para acceder a tu calendario de exámenes"
              : "Regístrate para personalizar tu calendario de exámenes"}
          </DialogDescription>
        </DialogHeader>
        
        {/* My Calendars Button */}
        <div className="flex justify-center pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMyCalendars}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Mis Calendarios
          </Button>
        </div>

        <Tabs
          defaultValue="login"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "login" | "register")}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm onSuccess={() => setActiveTab("login")} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 