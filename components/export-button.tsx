"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openInGoogleCalendar } from "@/lib/calendar-export";
import type { Exam, ExamFilters } from "@/types/exam";

interface ExportButtonProps {
  exams: Exam[];
  filters: ExamFilters;
}

export function ExportButton({ exams, filters }: ExportButtonProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (exams.length === 0) return;

    openInGoogleCalendar(filters, { name: "Exámenes UPV" });

    toast({
      title: "Abriendo Google Calendar",
      description:
        "Confirma en Google Calendar para añadir el calendario de exámenes a tu cuenta.",
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-10 px-3 py-1.5 gap-2 rounded-sm text-sm font-medium"
      disabled={exams.length === 0}
      onClick={handleExport}
    >
      <Share2 className="h-4 w-4" />
      <span>Exportar</span>
    </Button>
  );
}
