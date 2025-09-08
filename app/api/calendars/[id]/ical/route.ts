import { NextRequest, NextResponse } from "next/server";
import { getExams } from "@/actions/exam-actions";
import { generateICalContent } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const calendarId = params.id;
    
    if (!calendarId) {
      return NextResponse.json(
        { error: "Calendar ID is required" },
        { status: 400 }
      );
    }

    // Create Supabase server client
    const supabase = await createClient();

    // Fetch the calendar and its filters from the database
    // Note: This is a public endpoint, so we don't enforce user authentication
    // The calendar ID itself serves as the authorization token
    const { data: calendar, error: calendarError } = await supabase
      .from('user_calendars')
      .select('id, name, filters')
      .eq('id', calendarId)
      .single();

    if (calendarError) {
      console.error('❌ Error fetching calendar:', calendarError);
      return NextResponse.json(
        { error: "Calendar not found" },
        { status: 404 }
      );
    }

    if (!calendar) {
      return NextResponse.json(
        { error: "Calendar not found" },
        { status: 404 }
      );
    }

    console.log('📅 Found calendar:', {
      id: calendar.id,
      name: calendar.name,
      filtersCount: Object.keys(calendar.filters || {}).length
    });

    // Parse query parameters for additional options like reminders
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const reminderMinutes = parseReminderDurations(searchParams);

    // Use the calendar's stored filters
    const filters = calendar.filters || {};
    
    console.log('🔍 Using calendar filters:', {
      filters,
      filtersType: typeof filters,
      filtersKeys: Object.keys(filters)
    });

    // Fetch exams matching the calendar's filters
    const exams = await getExams(filters as any);
    
    console.log(`✅ Fetched ${exams.length} exams for calendar: ${calendar.name}`);

    // Generate ICS content with reminders and timezone
    const ics = generateICalContent(exams as any, {
      calendarName: calendar.name,
      timeZone: "Europe/Madrid",
      reminderMinutes: reminderMinutes ?? [24 * 60, 60], // Default: 1 day and 1 hour before
      useUPVFormat: false,
    });

    // Return the iCal content with proper headers
    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="${calendar.name.replace(/[^\w\s-]/g, '').trim()}.ics"`,
        "Cache-Control": "no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    });

  } catch (error) {
    console.error('❌ Error in calendar iCal API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate calendar iCal" },
      { status: 500 }
    );
  }
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
