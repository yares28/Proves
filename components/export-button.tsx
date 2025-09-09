"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  Share2, 
  Copy, 
  Download, 
  ExternalLink, 
  Check,
  Calendar,
  AlertCircle
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useSettings } from "@/context/settings-context"

interface ExportButtonProps {
  exams: any[]
  filters: any
}

export function ExportButton({ exams, filters }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const { settings } = useSettings()

  const copyUrl = async () => {
    try {
      const currentUrl = window.location.href
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      toast.success("URL copiada al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Error al copiar URL")
    }
  }

  const exportToGoogleCalendar = async () => {
    if (exams.length === 0) {
      toast.error("No hay exámenes para exportar")
      return
    }

    try {
      const baseUrl = window.location.origin
      
      // Build filters object for token generation
      const filterObj: Record<string, string[]> = {}
      const keys = ["school", "degree", "year", "semester", "subject"] as const
      keys.forEach((key) => {
        const value = (filters && (filters as any)[key]) as string[] | undefined
        if (Array.isArray(value) && value.length > 0) {
          filterObj[key] = value.filter(Boolean)
        }
      })

      // Map reminder settings to ISO-8601 negative durations
      const reminderDurations: string[] = []
      if (settings?.examReminders?.oneWeek) reminderDurations.push("-P7D")
      if (settings?.examReminders?.oneDay) reminderDurations.push("-P1D")
      if (settings?.examReminders?.oneHour) reminderDurations.push("-PT1H")
      
      // If no reminders are enabled, use defaults (1 day and 1 hour)
      if (reminderDurations.length === 0) {
        reminderDurations.push("-P1D", "-PT1H")
      }

      // Try to use short token approach first
      let icalUrl: string
      try {
        const { generateUPVTokenUrl } = await import("@/lib/utils")
        const tokenPath = await generateUPVTokenUrl(filterObj, "Recordatorios de exámenes")
        icalUrl = `${baseUrl}${tokenPath}`
        
        // Add reminder parameters to token URL
        if (reminderDurations.length > 0) {
          const url = new URL(icalUrl)
          reminderDurations.forEach((r) => url.searchParams.append("reminder", r))
          icalUrl = url.toString()
        }
      } catch (error) {
        console.warn("Token approach failed, falling back to direct URL:", error)
        // Fallback to direct URL approach
        const { generateDirectUrl } = await import("@/lib/utils")
        const directPath = generateDirectUrl(filterObj, "Recordatorios de exámenes")
        icalUrl = `${baseUrl}${directPath}`
        
        // Add reminder parameters
        const url = new URL(icalUrl)
        reminderDurations.forEach((r) => url.searchParams.append("reminder", r))
        icalUrl = url.toString()
      }

      // Convert to webcal protocol
      const calendarFeed = icalUrl.replace(/^https?:/, "webcal:")
      
      // Use the correct Google Calendar URL format for subscription popup
      const googleCalendarUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarFeed)}`
      
      // Log the exact URL for debugging
      console.log("🔍 [Google Calendar Export] Debug Info:")
      console.log("📊 Base URL:", baseUrl)
      console.log("🔗 iCal URL:", icalUrl)
      console.log("📱 Calendar Feed:", calendarFeed)
      console.log("🌐 Google Calendar URL:", googleCalendarUrl)
      console.log("🔍 cid parameter:", encodeURIComponent(calendarFeed))
      console.log("🔍 cid length:", encodeURIComponent(calendarFeed).length)
      console.log("🔍 Double encoding check:", calendarFeed.includes("%253A") ? "❌ DOUBLE ENCODED" : "✅ OK")
      
      // Validate URL length (Google Calendar has limits)
      const cidLength = encodeURIComponent(calendarFeed).length
      if (cidLength > 2000) {
        console.warn("⚠️ cid parameter is very long:", cidLength, "characters")
        toast.error("Los filtros seleccionados generan una URL muy larga. Intenta con menos filtros.")
        return
      }
      
      // Open Google Calendar
      const openCalendar = () => {
        const link = document.createElement('a')
        link.href = googleCalendarUrl
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        link.setAttribute('aria-label', 'Abrir Google Calendar para suscribirse al calendario')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      openCalendar()
      
      // Show instructions dialog after a short delay
      setTimeout(() => {
        setShowInstructions(true)
      }, 500)
      
      // Close the export popover
      setIsOpen(false)
      
    } catch (e) {
      console.error('Google Calendar export error:', e)
      toast.error("No se pudo abrir Google Calendar")
    }
  }

  const exportToAppleCalendar = () => {
    if (exams.length === 0) {
      toast.error("No hay exámenes para exportar")
      return
    }

    // Generate .ics content
    const icsContent = generateICSContent(exams)
    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'exams.ics'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success("Archivo .ics descargado para Apple Calendar")
  }

  const downloadICS = () => {
    if (exams.length === 0) {
      toast.error("No hay exámenes para exportar")
      return
    }

    const icsContent = generateICSContent(exams)
    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'exams.ics'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success("Archivo .ics descargado")
  }

  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Resultados de Exámenes UPV',
        text: `Encontré ${exams.length} exámenes con los filtros aplicados`,
        url: window.location.href
      }).then(() => {
        toast.success("Resultados compartidos")
      }).catch(() => {
        toast.error("Error al compartir")
      })
    } else {
      copyUrl()
    }
  }

  const generateICSContent = (exams: any[]) => {
    const now = new Date()
    const icsHeader = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UPV Exam Calendar//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ]

    const events = exams.map(exam => {
      const examDate = new Date(exam.date)
      const startTime = exam.time.split('-')[0].trim()
      const endTime = exam.time.split('-')[1]?.trim() || '23:59'
      
      const [startHour, startMinute] = startTime.split(':').map(Number)
      const [endHour, endMinute] = endTime.split(':').map(Number)
      
      const startDateTime = new Date(examDate)
      startDateTime.setHours(startHour, startMinute, 0, 0)
      
      const endDateTime = new Date(examDate)
      endDateTime.setHours(endHour, endMinute, 0, 0)
      
      const uid = `exam-${exam.id}-${Date.now()}@upv.es`
      
      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `SUMMARY:${exam.subject} (${exam.code})`,
        `DESCRIPTION:${exam.time} - ${exam.location}\\n${exam.school} - ${exam.degree}\\n${exam.year} - ${exam.semester}`,
        `LOCATION:${exam.location}`,
        'END:VEVENT'
      ].join('\r\n')
    })

    return [...icsHeader, ...events, 'END:VCALENDAR'].join('\r\n')
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Exportar
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={copyUrl}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  URL Copiada
                </>
              ) : (
                "Copiar URL"
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={exportToGoogleCalendar}
            >
              <Image 
                src="/google-cal.png" 
                alt="Google Calendar" 
                width={20} 
                height={20} 
                className="mr-2 -ml-1"
              />
              Google Calendar
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={exportToAppleCalendar}
            >
              <Image 
                src="/apple-cal.png" 
                alt="Apple Calendar" 
                width={16} 
                height={16} 
                className="mr-2"
              />
              Apple Calendar
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={downloadICS}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar .ics
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Suscripción a Google Calendar
            </DialogTitle>
            <DialogDescription className="text-left space-y-3">
              <p>Se ha abierto Google Calendar en una nueva ventana.</p>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-900 mb-2">Pasos a seguir:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Busca la ventana de Google Calendar que se acaba de abrir</li>
                  <li>Verás un diálogo para suscribirte al calendario</li>
                  <li>Haz clic en "Añadir" o "Suscribirse" para confirmar</li>
                  <li>El calendario se actualizará automáticamente con nuevos exámenes</li>
                </ol>
              </div>

              <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900">¿No se abrió la ventana?</p>
                  <p className="text-amber-800 mb-2">Verifica que tu navegador no esté bloqueando ventanas emergentes para este sitio.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const baseUrl = window.location.origin
                        
                        // Build filters object
                        const filterObj: Record<string, string[]> = {}
                        const keys = ["school", "degree", "year", "semester", "subject"] as const
                        keys.forEach((key) => {
                          const value = (filters && (filters as any)[key]) as string[] | undefined
                          if (Array.isArray(value) && value.length > 0) {
                            filterObj[key] = value.filter(Boolean)
                          }
                        })

                        // Map reminder settings
                        const reminderDurations: string[] = []
                        if (settings?.examReminders?.oneWeek) reminderDurations.push("-P7D")
                        if (settings?.examReminders?.oneDay) reminderDurations.push("-P1D")
                        if (settings?.examReminders?.oneHour) reminderDurations.push("-PT1H")
                        if (reminderDurations.length === 0) {
                          reminderDurations.push("-P1D", "-PT1H")
                        }

                        // Generate URL using same approach as main function
                        let icalUrl: string
                        try {
                          const { generateUPVTokenUrl } = await import("@/lib/utils")
                          const tokenPath = await generateUPVTokenUrl(filterObj, "Recordatorios de exámenes")
                          icalUrl = `${baseUrl}${tokenPath}`
                          
                          if (reminderDurations.length > 0) {
                            const url = new URL(icalUrl)
                            reminderDurations.forEach((r) => url.searchParams.append("reminder", r))
                            icalUrl = url.toString()
                          }
                        } catch (error) {
                          const { generateDirectUrl } = await import("@/lib/utils")
                          const directPath = generateDirectUrl(filterObj, "Recordatorios de exámenes")
                          icalUrl = `${baseUrl}${directPath}`
                          
                          const url = new URL(icalUrl)
                          reminderDurations.forEach((r) => url.searchParams.append("reminder", r))
                          icalUrl = url.toString()
                        }

                        const calendarFeed = icalUrl.replace(/^https?:/, "webcal:")
                        const googleCalendarUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarFeed)}`
                        
                        console.log("🔍 [Manual Fallback] Google Calendar URL:", googleCalendarUrl)
                        window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer')
                      } catch (error) {
                        console.error("Manual fallback error:", error)
                        toast.error("Error al abrir Google Calendar manualmente")
                      }
                    }}
                    className="mt-1"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Abrir manualmente
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowInstructions(false)}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 