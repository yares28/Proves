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
      // Use production domain for reliable access
      const baseUrl = window.location.origin.includes('localhost') 
        ? 'https://upv-cal.vercel.app' 
        : window.location.origin

      const params = new URLSearchParams()
      params.set("name", "Recordatorios de exámenes")

      // Map filters - simplified to prevent URL length issues
      const keys = ["school", "degree", "year", "semester"] as const
      keys.forEach((key) => {
        const value = (filters && (filters as any)[key]) as string[] | undefined
        if (Array.isArray(value) && value.length <= 2) {
          value.slice(0, 2).forEach((v) => v && params.append(key, v))
        }
      })

      // Add essential reminders only
      const reminderDurations: string[] = []
      if (settings?.examReminders?.oneDay) reminderDurations.push("-P1D")
      if (settings?.examReminders?.oneHour) reminderDurations.push("-PT1H")
      
      if (reminderDurations.length === 0) {
        reminderDurations.push("-P1D") // Just one default
      }
      
      reminderDurations.forEach((r) => params.append("reminder", r))

      const icalUrl = `${baseUrl}/api/ical?${params.toString()}`
      
      console.log("🔗 Generated iCal URL:", icalUrl)
      console.log("📏 URL length:", icalUrl.length)
      
      // Verify feed accessibility
      try {
        const testResponse = await fetch(icalUrl, { method: 'HEAD' })
        if (!testResponse.ok) {
          throw new Error(`iCal feed not accessible: ${testResponse.status}`)
        }
        console.log("✅ iCal feed is accessible")
      } catch (feedError) {
        console.warn("⚠️ Could not verify iCal feed:", feedError)
      }

      // CRITICAL: Based on 2024 Google Calendar API research
      // Google Calendar does NOT support direct webcal subscription via /r?cid= anymore
      // Instead, we need to provide manual subscription instructions
      
      console.log("📋 Google Calendar requires manual subscription - showing instructions")
      
      // Always show instructions for manual subscription since automatic subscription is deprecated
      setShowInstructions(true)
      setIsOpen(false)
      
    } catch (e) {
      console.error('❌ Google Calendar export error:', e)
      toast.error("Error al generar el enlace de calendario")
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Agregar calendario a Google Calendar
            </DialogTitle>
            <DialogDescription className="text-left space-y-4">
              <p>Sigue estos pasos para agregar el calendario de exámenes a tu Google Calendar:</p>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-900 mb-3">📋 Pasos para agregar el calendario:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Ve a <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">calendar.google.com</a></li>
                  <li>En el lado izquierdo, busca "Otros calendarios" y haz clic en el <strong>+</strong></li>
                  <li>Selecciona <strong>"Desde URL"</strong></li>
                  <li>Copia y pega la URL del calendario (botón de abajo)</li>
                  <li>Haz clic en <strong>"Agregar calendario"</strong></li>
                </ol>
              </div>

              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="font-medium text-green-900 mb-2">🔄 URL del calendario:</p>
                <div className="space-y-2">
                  {(() => {
                    const baseUrl = window.location.origin.includes('localhost') 
                      ? 'https://upv-cal.vercel.app' 
                      : window.location.origin
                      
                    const params = new URLSearchParams()
                    params.set("name", "Recordatorios de exámenes")
                    
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
                    
                    return (
                      <>
                        <div className="p-2 bg-white border rounded text-xs font-mono break-all">
                          {icalUrl}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(icalUrl)
                                toast.success("URL copiada al portapapeles")
                              } catch (error) {
                                toast.error("Error al copiar URL")
                              }
                            }}
                            className="flex-1"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar URL
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer')}
                            className="flex-1"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Abrir Google Calendar
                          </Button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">💡 ¿Por qué es manual?</p>
                    <p className="text-amber-800">
                      Google Calendar ya no permite suscripciones automáticas desde sitios externos por motivos de seguridad. 
                      Este método manual garantiza que el calendario se agregue correctamente y se mantenga sincronizado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900 mb-1">✨ Después de agregar:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• El calendario aparecerá en tu lista de calendarios</li>
                  <li>• Se actualizará automáticamente con nuevos exámenes</li>
                  <li>• Recibirás recordatorios según tu configuración</li>
                </ul>
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