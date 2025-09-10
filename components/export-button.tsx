"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Exam, ExamFilters } from "@/types/exam";

interface ExportButtonProps {
  exams: Exam[];
  filters: ExamFilters;
}

export function ExportButton({ exams, filters }: ExportButtonProps) {
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Funcionalidad deshabilitada",
      description: "La exportación ha sido deshabilitada temporalmente.",
      variant: "destructive",
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
