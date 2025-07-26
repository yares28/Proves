"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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
import { Calendar, Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre es requerido" })
    .max(50, { message: "El nombre no puede exceder 50 caracteres" })
    .regex(/^[a-zA-Z0-9\s\-_]+$/, {
      message: "Solo se permiten letras, números, espacios, guiones y guiones bajos"
    })
})

type ExportCalendarFormValues = z.infer<typeof formSchema>

interface ExportCalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (name: string) => Promise<void>
}

export function ExportCalendarDialog({
  open,
  onOpenChange,
  onExport,
}: ExportCalendarDialogProps) {
  const [isExporting, setIsExporting] = useState(false)

  const form = useForm<ExportCalendarFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "Mis Exámenes UPV",
    },
  })

  async function onSubmit(values: ExportCalendarFormValues) {
    setIsExporting(true)
    try {
      await onExport(values.name)
      onOpenChange(false)
      form.reset() // Reset form after successful export
    } catch (error) {
      console.error("Export failed:", error)
      // Error handling is done in the parent component
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Exportar a Google Calendar
          </DialogTitle>
          <DialogDescription>
            Introduce un nombre para tu calendario de exámenes que aparecerá en Google Calendar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del calendario</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Mis Exámenes UPV 2024"
                      {...field}
                      disabled={isExporting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isExporting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Exportar a Google
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 