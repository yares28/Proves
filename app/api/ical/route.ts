import { NextRequest, NextResponse } from "next/server";
import { getExams } from "@/actions/exam-actions";
import { generateICalContent } from "@/lib/utils";

// Build filters object from query params
function buildFilters(searchParams: URLSearchParams): Record<string, string[]> {
  // 1) Packed filters take precedence if provided
  const packed = searchParams.get("p");
  if (packed) {
    try {
      const json = decodePackedFilters(packed);
      if (json && typeof json === "object") {
        // Normalize keys to singular expected by DB
        return normalizeFilterKeys(json as Record<string, string[]>);
      }
    } catch {
      // Fall through to regular params if decoding fails
    }
  }

  const multiParams = ["school", "degree", "year", "semester", "subject", "acronym"] as const;
  const filters: Record<string, string[]> = {};
  for (const key of multiParams) {
    const values = searchParams.getAll(key);
    if (values && values.length > 0) filters[key] = values.filter(Boolean);
  }
  return filters;
}

// Parse reminder durations like -P7D, -P1D, -PT2H, -PT30M
function parseReminderDurations(searchParams: URLSearchParams): number[] | undefined {
  const reminders = searchParams.getAll("reminder");
  if (!reminders || reminders.length === 0) return undefined;

  const minutes: number[] = [];
  for (const iso of reminders) {
    // Expect negative ISO-8601 durations; ignore positives
    if (!iso || !iso.startsWith("-P")) continue;
    // Strip leading '-'
    const dur = iso.slice(1);
    // Very small ISO-8601 parser for days/hours/minutes
    // Supports PnD, PTnH, PTnM, PTnHnM combinations
    const dMatch = dur.match(/P(\d+)D/i);
    const tMatch = dur.match(/T([0-9HMS]+)/i);
    let totalMinutes = 0;
    if (dMatch) totalMinutes += parseInt(dMatch[1], 10) * 24 * 60;
    if (tMatch) {
      const t = tMatch[1];
      const h = t.match(/(\d+)H/i);
      const m = t.match(/(\d+)M/i);
      if (h) totalMinutes += parseInt(h[1], 10) * 60;
      if (m) totalMinutes += parseInt(m[1], 10);
    }
    if (totalMinutes > 0) minutes.push(totalMinutes);
  }
  // Deduplicate and sort descending so larger lead times appear first
  return Array.from(new Set(minutes)).sort((a, b) => b - a);
}

// Base64url decode helper for packed filter JSON
function decodePackedFilters(packed: string): unknown | null {
  try {
    // Convert base64url -> base64
    const b64 = packed.replace(/-/g, "+").replace(/_/g, "/");
    // Pad if needed
    const padLen = (4 - (b64.length % 4)) % 4;
    const padded = b64 + "=".repeat(padLen);
    const jsonStr = Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// Normalize plural keys to singular (and pass-through unknowns)
function normalizeFilterKeys(saved: Record<string, string[]>): Record<string, string[]> {
  const keyMap: Record<string, string> = {
    schools: "school",
    degrees: "degree",
    years: "year",
    subjects: "subject",
    semesters: "semester",
    acronyms: "acronym",
  };
  const normalized: Record<string, string[]> = {};
  Object.entries(saved || {}).forEach(([key, values]) => {
    const targetKey = keyMap[key] || key;
    if (Array.isArray(values) && values.length > 0) {
      normalized[targetKey] = values.filter(Boolean);
    }
  });
  return normalized;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const calendarName = params.get("name") || "Recordatorios de exámenes";
    const filters = buildFilters(params);
    const reminderMinutes = parseReminderDurations(params);

    // Fetch exams matching filters
    const exams = await getExams(filters as any);

    // Generate ICS with VALARMs and Madrid timezone
    const ics = generateICalContent(exams as any, {
      calendarName,
      timeZone: "Europe/Madrid",
      // Fall back to defaults if none provided
      reminderMinutes: reminderMinutes ?? undefined,
      useUPVFormat: false,
    });

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename=upv-exams.ics`,
        "Cache-Control": "no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate ICS" },
      { status: 500 }
    );
  }
}


