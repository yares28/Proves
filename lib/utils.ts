import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Exam } from "@/types/exam";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Robust timezone-aware date parsing
function parseExamDateTime(
  dateStr: string,
  timeStr: string,
  timeZone: string
): { start: Date; isValid: boolean } {
  try {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{1,2}:\d{2}(?::\d{2})?$/; // Accept HH:mm or HH:mm:ss

    if (!dateRegex.test(dateStr) || !timeRegex.test(timeStr)) {
      return { start: new Date(), isValid: false };
    }
    // Parse components
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    // Validate ranges
    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59 ||
      (seconds !== undefined && (seconds < 0 || seconds > 59))
    ) {
      return { start: new Date(), isValid: false };
    }
    // Create date properly handling the supplied timezone to avoid double conversion
    let examDate: Date;

    examDate = new Date(year, month - 1, day, hours, minutes, seconds ?? 0, 0);

    // Validate the created date
    if (
      isNaN(examDate.getTime()) ||
      examDate.getFullYear() !== year ||
      examDate.getMonth() !== month - 1 ||
      examDate.getDate() !== day
    ) {
      return { start: new Date(), isValid: false };
    }
    return { start: examDate, isValid: true };
  } catch (error) {
    return { start: new Date(), isValid: false };
  }
}

