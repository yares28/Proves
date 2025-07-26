"use client";

import React from "react";
import { Copy, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

interface GoogleCalendarInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  icalUrl: string;
}

export function GoogleCalendarInstructions({
  isOpen,
  onClose,
  icalUrl,
}: GoogleCalendarInstructionsProps) {
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(icalUrl);
      toast({
        title: "URL copiada",
        description: "La URL del calendario se ha copiado al portapapeles.",
      });
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar la URL. Cópiala manualmente.",
        variant: "destructive",
      });
    }
  };

  const openGoogleCalendar = () => {
    window.open('https://calendar.google.com/calendar/u/0/r', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Añadir a Google Calendar
          </DialogTitle>
          <DialogDescription>
            Sigue estos pasos para añadir el calendario a tu Google Calendar:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-medium">1</span>
                <span>Ve a Google Calendar (se abrirá en una nueva pestaña)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-medium">2</span>
                <span>En la izquierda, junto a "Otros calendarios", haz clic en <strong>"+"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-medium">3</span>
                <span>Selecciona <strong>"Desde URL"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-medium">4</span>
                <span>Pega la URL del calendario (usa el botón de abajo para copiarla)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-medium">5</span>
                <span>Haz clic en <strong>"Añadir calendario"</strong></span>
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">URL del calendario:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={icalUrl}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-800 text-sm font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyUrl}
                className="flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={openGoogleCalendar} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Abrir Google Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 