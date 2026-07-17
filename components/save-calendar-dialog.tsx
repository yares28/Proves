"use client"

import * as React from "react"
import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast" 
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre del calendario es requerido" })
    .max(50, { message: "El nombre del calendario no puede exceder 50 caracteres" })
})

type SaveCalendarFormValues = z.infer<typeof formSchema>

interface SaveCalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: Record<string, string[]>
  onSave: (name: string) => void
  existingNames?: string[]
}

export function SaveCalendarDialog({
  open,
  onOpenChange,
  filters,
  onSave,
  existingNames = [],
}: SaveCalendarDialogProps) {
  const { user, syncToken } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if we have any active filters
  const hasActiveFilters = Object.values(filters).some(values => values.length > 0)

  const form = useForm<SaveCalendarFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  async function onSubmit(values: SaveCalendarFormValues) {
    console.log('🔄 Starting calendar save process...');
    
    // Check for duplicate names
    if (existingNames.includes(values.name)) {
      console.log('⚠️ Duplicate calendar name detected:', values.name);
      form.setError("name", { 
        type: "manual", 
        message: "Ya tienes un calendario con este nombre" 
      })
      return
    }

    // Validation to ensure user is logged in
    if (!user) {
      console.log('❌ Save calendar failed: User not logged in');
      toast({
        title: "Autenticación requerida",
        description: "Por favor inicia sesión para guardar calendarios",
        variant: "destructive",
      })
      onOpenChange(false)
      return
    }
    
    console.log('✅ User authenticated', { userId: user.id });

    setIsSubmitting(true)
    
    try {
      console.log('🔄 Synchronizing authentication tokens before save...');
      // Synchronize auth tokens before performing action
      const tokenSynced = await syncToken();
      
      if (!tokenSynced) {
        console.error('❌ Failed to synchronize authentication tokens');
        throw new Error("Error al sincronizar el estado de autenticación. Por favor cierra sesión e inicia sesión de nuevo.");
      }
      
      console.log('✅ Token synchronization successful');

      // Delegate the actual persistence to the parent, which supplies the
      // server-validated session tokens to the save action.
      onSave(values.name)
      
      // Show success toast
      toast({
        title: "Calendario guardado",
        description: `Tu calendario "${values.name}" ha sido guardado exitosamente.`,
      })
      
      console.log('✅ Calendar save completed successfully');
      onOpenChange(false)
    } catch (error) {
      console.error("❌ Error saving calendar:", error)
      
      // Get specific error message if available
      const errorMessage = error instanceof Error ? error.message : 
        "Ocurrió un error al guardar tu calendario. Por favor intenta de nuevo.";
      
      // Provide precise error guidance
      if (errorMessage.includes("authentication") || 
          errorMessage.includes("log in") ||
          errorMessage.includes("session")) {
        console.log('⚠️ Authentication-related error detected:', errorMessage);
        toast({
          title: "Sesión expirada",
          description: "Tu sesión ha expirado. Por favor cierra sesión e inicia sesión de nuevo para actualizar tu autenticación.",
          variant: "destructive",
        })
      } else {
        console.log('⚠️ General error saving calendar:', errorMessage);
        toast({
          title: "Error al guardar calendario",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Guardar Vista de Calendario</DialogTitle>
          <DialogDescription>
            Dale un nombre a tu vista de calendario para guardarla para uso futuro.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Calendario</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Mi Calendario de Exámenes" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !hasActiveFilters}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 