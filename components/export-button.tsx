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
      // Use production domain for reliable subscription
      const baseUrl = window.location.origin.includes('localhost') 
        ? 'https://upv-cal.vercel.app' 
        : window.location.origin

      const params = new URLSearchParams()
      params.set("name", "Recordatorios de exámenes")

      // Map filters - keep URLs manageable by using most important filters only
      const keys = ["school", "degree", "year", "semester"] as const
      keys.forEach((key) => {
        const value = (filters && (filters as any)[key]) as string[] | undefined
        if (Array.isArray(value) && value.length <= 3) { // Limit to prevent URL length issues
          value.forEach((v) => v && params.append(key, v))
        }
      })

      // Add reminders
      const reminderDurations: string[] = []
      if (settings?.examReminders?.oneWeek) reminderDurations.push("-P7D")
      if (settings?.examReminders?.oneDay) reminderDurations.push("-P1D")
      if (settings?.examReminders?.oneHour) reminderDurations.push("-PT1H")
      
      if (reminderDurations.length === 0) {
        reminderDurations.push("-P1D", "-PT1H")
      }
      
      reminderDurations.forEach((r) => params.append("reminder", r))

      // Generate the iCal URL (always HTTPS, never webcal for Google Calendar subscription)
      const icalUrl = `${baseUrl}/api/ical?${params.toString()}`
      
      console.log("🔗 Generated iCal URL:", icalUrl)
      console.log("📏 URL length:", icalUrl.length)
      
      // Test if the feed is accessible before attempting subscription
      try {
        const testResponse = await fetch(icalUrl, { method: 'HEAD' })
        if (!testResponse.ok) {
          throw new Error(`iCal feed not accessible: ${testResponse.status}`)
        }
        console.log("✅ iCal feed is accessible")
      } catch (feedError) {
        console.warn("⚠️ Could not verify iCal feed accessibility:", feedError)
        // Continue anyway as HEAD requests might be blocked
      }

      // Use the MOST RELIABLE Google Calendar subscription pattern
      // Based on 2024 research: Direct HTTPS URLs work better than webcal for web subscription
      const googleCalendarUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(icalUrl)}`
      
      console.log("🔗 Final Google Calendar URL:", googleCalendarUrl)
      console.log("📏 Final URL length:", googleCalendarUrl.length)
      
      // Verify URL isn't too long (Google has ~2048 char limit)
      if (googleCalendarUrl.length > 2000) {
        console.warn("⚠️ URL might be too long for reliable subscription")
        toast.error("Demasiados filtros aplicados. Reduce los filtros e intenta de nuevo.")
        return
      }

      // Try to open with user gesture (most reliable for popup blockers)
      const newWindow = window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer')
      
      if (newWindow) {
        console.log("✅ Google Calendar window opened successfully")
        // Check if the window was immediately closed (sign of popup blocker)
        setTimeout(() => {
          if (newWindow.closed) {
            console.log("⚠️ Window was closed immediately - likely popup blocked")
            setShowInstructions(true)
          } else {
            console.log("✅ Window is still open - likely successful")
            setTimeout(() => setShowInstructions(true), 1000) // Show instructions after delay
          }
        }, 100)
      } else {
        console.log("⚠️ Popup blocked, showing fallback instructions")
        setShowInstructions(true)
      }
      
      setIsOpen(false)
      
    } catch (e) {
      console.error('❌ Google Calendar export error:', e)
      toast.error("Error al generar el enlace de suscripción")
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
              <p>Se ha abierto Google Calendar en una nueva ventana para suscribirte al calendario.</p>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-900 mb-2">✅ ¿Qué deberías ver ahora?</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Una ventana de Google Calendar con un diálogo de suscripción</li>
                  <li>El título: "Add calendar" o "¿Agregar este calendario?"</li>
                  <li>Nombre: "Recordatorios de exámenes"</li>
                  <li>Un botón azul <strong>"Add"</strong> o <strong>"Agregar"</strong></li>
                  <li>Después de hacer clic, el calendario aparecerá en tu lista lateral</li>
                </ol>
              </div>

              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="font-medium text-green-900 mb-1">💡 Verificación rápida:</p>
                <p className="text-sm text-green-800">
                  Si ves el diálogo, ¡perfecto! Haz clic en "Add" y estarás listo. 
                  El calendario se actualizará automáticamente con nuevos exámenes.
                </p>
              </div>

              <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900">❌ ¿No apareció nada?</p>
                  <p className="text-amber-800 mb-2">Problemas comunes y soluciones:</p>
                  <div className="space-y-2 text-xs">
                    <div><strong>Bloqueador de popups:</strong> Permite popups para este sitio</div>
                    <div><strong>Navegador:</strong> Prueba Chrome, Firefox o Edge</div>
                    <div><strong>Manual:</strong> Usa estos enlaces alternativos:</div>
                  </div>
                  <div className="space-y-1 mt-2">
                    {/* Generate alternative URLs for manual testing */}
                    {(() => {
                      // Use same logic as main function for consistency
                      const baseUrl = window.location.origin.includes('localhost') 
                        ? 'https://upv-cal.vercel.app' 
                        : window.location.origin
                        
                      const params = new URLSearchParams()
                      params.set("name", "Recordatorios de exámenes")
                      
                      // Simplified filters to prevent URL length issues
                      const keys = ["school", "degree", "year", "semester"] as const
                      keys.forEach((key) => {
                        const value = (filters && (filters as any)[key]) as string[] | undefined
                        if (Array.isArray(value) && value.length <= 2) {
                          value.slice(0, 2).forEach((v) => v && params.append(key, v))
                        }
                      })
                      
                      const reminderDurations: string[] = []
                      if (settings?.examReminders?.oneDay) reminderDurations.push("-P1D")
                      if (settings?.examReminders?.oneHour) reminderDurations.push("-PT1H")
                      if (reminderDurations.length === 0) {
                        reminderDurations.push("-P1D")
                      }
                      reminderDurations.forEach((r) => params.append("reminder", r))
                      
                      const icalUrl = `${baseUrl}/api/ical?${params.toString()}`
                      
                      // Ensure URL isn't too long
                      if (icalUrl.length > 300) {
                        return (
                          <div className="text-xs text-amber-800 p-2 bg-amber-100 rounded">
                            URL demasiado larga. Reduce los filtros aplicados e intenta de nuevo.
                          </div>
                        )
                      }
                      
                      const urls = [
                        { 
                          label: "🔗 Suscripción directa", 
                          url: `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(icalUrl)}`
                        },
                        { 
                          label: "📱 Protocolo webcal", 
                          url: `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(icalUrl.replace(/^https?:/, "webcal:"))}`
                        },
                        { 
                          label: "🌐 Método alternativo", 
                          url: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(icalUrl)}`
                        }
                      ]
                      
                      return urls.map((urlOption, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log(`🔗 Manual URL ${index + 1}:`, urlOption.url)
                            window.open(urlOption.url, '_blank', 'noopener,noreferrer')
                          }}
                          className="w-full text-xs justify-start"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {urlOption.label}
                        </Button>
                      ))
                    })()}
                  </div>
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