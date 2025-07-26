import { NextRequest, NextResponse } from "next/server";
import { getExams } from "@/actions/exam-actions";
import { generateICalContent } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/server";
import { getQueryStringFromToken } from "../store-token/route";

// Enhanced headers for better calendar app compatibility
function getOptimalHeaders(contentLength?: number) {
  return {
    "Content-Type": "text/calendar; charset=utf-8",
    "Cache-Control": "public, max-age=3600", // 1 hour cache
    ...(contentLength ? { "Content-Length": String(contentLength) } : {}),
  };
}

// Note: getQueryStringFromToken function is now imported from the store-token route

async function handleRequest(
  request: NextRequest,
  method: "GET" | "HEAD",
  params: { token: string }
) {
  try {
    const token = params.token;

    if (!token) {
      return new NextResponse("Invalid token", { status: 400 });
    }

    // Get original query string from token
    const originalQuery = getQueryStringFromToken(token);
    if (!originalQuery) {
      return new NextResponse("Token not found", { status: 404 });
    }

    // Parse the original query string
    const searchParams = new URLSearchParams(originalQuery);
    const filtersParam = searchParams.get("filters");
    const calendarName = searchParams.get("name") || "UPV Exams";

    // Sanitize calendar name
    const sanitizedCalendarName =
      calendarName.replace(/[^\w\s-]/g, "").trim() || "UPV_Exams";

    // For HEAD requests, return early with just headers
    if (method === "HEAD") {
      const minimalContent = [
        "BEGIN:VCALENDAR",
        "PRODID:-//UPV-Cal//Exam API 1.0//ES",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:${sanitizedCalendarName}`,
        "X-APPLE-CALENDAR-COLOR:#0252D4",
        "BEGIN:VEVENT",
        `UID:head-request@upv-cal`,
        "DTSTART:20250101T000000Z",
        "DTEND:20250101T010000Z",
        "SUMMARY:No Exams Found",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");

      return new NextResponse(null, {
        status: 200,
        headers: getOptimalHeaders(Buffer.byteLength(minimalContent, "utf8")),
      });
    }

    // Parse filters
    let filters: Record<string, string[]> = {};

    if (filtersParam) {
      try {
        const decodedFilters = decodeURIComponent(filtersParam);
        const parsedFilters = JSON.parse(decodedFilters);

        if (typeof parsedFilters === "object" && parsedFilters !== null) {
          filters = parsedFilters;
        } else {
          console.warn("Invalid filters format, using empty filters");
          filters = {};
        }
      } catch (e) {
        console.error("Error parsing filters:", e);
        filters = {};
      }
    } else {
      // Parse individual filter parameters
      const schools = searchParams.getAll("school");
      const degrees = searchParams.getAll("degree");
      const years = searchParams.getAll("year");
      const semesters = searchParams.getAll("semester");
      const subjects = searchParams.getAll("subject");

      if (schools.length > 0) filters.school = schools;
      if (degrees.length > 0) filters.degree = degrees;
      if (years.length > 0) filters.year = years;
      if (semesters.length > 0) filters.semester = semesters;
      if (subjects.length > 0) filters.subject = subjects;
    }

    // Use service role client for anonymous access
    const supabase = await createAdminClient();

    // Fetch exams
    console.log("🔍 [TOKEN-API] Calling getExams with filters:", filters);
    const exams = await getExams(filters, supabase);
    console.log(
      "📊 [TOKEN-API] getExams returned:",
      exams?.length || 0,
      "exams"
    );

    // Generate iCal content using UPV format
    let icalContent: string;
    try {
      icalContent = generateICalContent(exams, {
        calendarName: sanitizedCalendarName,
        useUPVFormat: true, // Use UPV-compatible format
      });
    } catch (contentError) {
      console.error("Error generating iCal content:", contentError);

      // Generate minimal fallback content in UPV format
      icalContent = [
        "BEGIN:VCALENDAR",
        "PRODID:-//UPV-Cal//Exam API 1.0//ES",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:${sanitizedCalendarName} (Error)`,
        "X-APPLE-CALENDAR-COLOR:#0252D4",
        "BEGIN:VEVENT",
        "DTSTART:20250101T120000Z",
        "DTEND:20250101T130000Z",
        "DTSTAMP:" +
          new Date()
            .toISOString()
            .replace(/[-:]/g, "")
            .replace(/\.\d{3}Z$/, "Z"),
        "UID:error@upv-cal",
        "CREATED:" +
          new Date()
            .toISOString()
            .replace(/[-:]/g, "")
            .replace(/\.\d{3}Z$/, "Z"),
        "DESCRIPTION:Calendar Generation Error",
        "LAST-MODIFIED:" +
          new Date()
            .toISOString()
            .replace(/[-:]/g, "")
            .replace(/\.\d{3}Z$/, "Z"),
        "LOCATION:",
        "SEQUENCE:0",
        "STATUS:CONFIRMED",
        "SUMMARY:Calendar Generation Error",
        "TRANSP:OPAQUE",
        "UPV_BGCOLOR:#0252D4",
        "UPV_FGCOLOR:#ffffff",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");
    }

    // Log content info for debugging
    console.log(
      "📄 [TOKEN-API] Generated iCal content length:",
      icalContent.length
    );
    console.log(
      "📄 [TOKEN-API] Content preview:",
      icalContent.substring(0, 200)
    );

    // Return iCal content with optimal headers
    return new NextResponse(icalContent, {
      status: 200,
      headers: getOptimalHeaders(Buffer.byteLength(icalContent, "utf8")),
    });
  } catch (error) {
    console.error("Error in token iCal route:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Calendar generation failed: ${errorMessage}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  return handleRequest(request, "GET", params);
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  return handleRequest(request, "HEAD", params);
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
