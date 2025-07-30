"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { Calendar, Clock, MapPin, BookOpen } from "lucide-react"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-lg border bg-popover/95 backdrop-blur-sm px-4 py-3 text-sm text-popover-foreground shadow-lg ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Custom Exam Tooltip Component
interface ExamTooltipProps {
  date: Date
  exams: Array<{
    id: string
    subject: string
    time: string
    location: string
    code?: string
    school?: string
    degree?: string
  }>
  children: React.ReactNode
}

const ExamTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & { date: Date; exams: ExamTooltipProps['exams'] }
>(({ className, sideOffset = 4, date, exams, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-xl border bg-popover/95 backdrop-blur-sm p-4 text-sm text-popover-foreground shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-w-xs w-80",
      className
    )}
    {...props}
  >
    <div className="space-y-3">
             {/* Date Header */}
       <div className="flex items-center gap-2 pb-2 border-b border-border/50">
         <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
         <div className="font-semibold text-base break-words">
           {date.toLocaleDateString("es-ES", {
             weekday: "long",
             day: "numeric",
             month: "long",
             year: "numeric"
           })}
         </div>
       </div>
      
             {/* Exams List */}
       <div className="space-y-2">
         {exams.map((exam, index) => (
           <div key={`${exam.id}-${index}`} className="space-y-1.5 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
             <div className="flex items-start justify-between gap-2">
               <div className="flex-1 min-w-0 w-full">
                 <div className="font-medium text-sm leading-tight mb-1 break-words">
                   {exam.subject}
                 </div>
                 <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                   <div className="flex items-center gap-1">
                     <Clock className="h-3 w-3 flex-shrink-0" />
                     <span className="break-words">{exam.time}</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <MapPin className="h-3 w-3 flex-shrink-0" />
                     <span className="break-words">{exam.location}</span>
                   </div>
                 </div>
                 {exam.code && (
                   <div className="flex items-center gap-1 mt-1">
                     <BookOpen className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                     <span className="text-xs text-muted-foreground font-mono break-words">({exam.code})</span>
                   </div>
                 )}
               </div>
             </div>
             {(exam.school || exam.degree) && (
               <div className="text-xs text-muted-foreground pt-1 border-t border-border/30">
                 {exam.school && <div className="break-words">{exam.school}</div>}
                 {exam.degree && <div className="break-words">{exam.degree}</div>}
               </div>
             )}
           </div>
         ))}
       </div>
      
      {/* Footer */}
      <div className="pt-2 border-t border-border/50">
        <div className="text-xs text-muted-foreground text-center">
          {exams.length} {exams.length === 1 ? 'examen' : 'exámenes'} en este día
        </div>
      </div>
    </div>
  </TooltipPrimitive.Content>
))
ExamTooltipContent.displayName = "ExamTooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, ExamTooltipContent }
