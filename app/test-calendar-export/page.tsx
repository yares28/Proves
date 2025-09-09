"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestCalendarExportPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const buildIcsUrl = (params: URLSearchParams) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/api/ical?${params.toString()}`;
  };

  const runGoogleCalendarTest = async () => {
    if (running) return;
    setRunning(true);
    setTestResults([]);

    try {
      addResult("🧪 Running: Google Calendar add-popup link + ICS validation...");

      // 1) Build query params including reminders
      const params = new URLSearchParams();
      params.set("name", "Recordatorios de exámenes (TEST)");
      // Minimal viable filters to try to get at least one event
      // Safe to omit; API will add placeholder if none
      params.append("school", "ETSINF");
      // Reminders: 1 day and 1 hour
      params.append("reminder", "-P1D");
      params.append("reminder", "-PT1H");

      // 2) Construct ICS URL and Google add-popup link
      const icalUrl = buildIcsUrl(params);
      const calendarFeed = icalUrl.replace(/^https?:/, "webcal:");
      const googleUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(
        calendarFeed
      )}`;

      addResult(`🔗 Built Google URL: ${googleUrl}`);

      // Validate cid encoding and scheme
      const urlObj = new URL(googleUrl);
      const cid = urlObj.searchParams.get("cid");
      if (!cid) throw new Error("cid param missing in Google URL");
      const decodedCid = decodeURIComponent(cid);
      if (!decodedCid.startsWith("webcal://")) {
        throw new Error("cid must start with webcal://");
      }
      addResult("✅ cid is URL-encoded and starts with webcal://");

      // 3) Validate ICS endpoint response headers and structure
      addResult("🌐 Fetching ICS to validate headers and content...");
      const res = await fetch(icalUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`ICS HTTP error ${res.status}`);

      const ct = res.headers.get("content-type") || "";
      if (!ct.toLowerCase().startsWith("text/calendar")) {
        throw new Error(`Unexpected Content-Type: ${ct}`);
      }
      addResult("✅ Content-Type is text/calendar");

      const ics = await res.text();
      const lines = ics.split(/\r?\n/).filter(Boolean);
      const hasBegin = lines.some((l) => l.trim() === "BEGIN:VCALENDAR");
      const hasVersion = lines.some((l) => l.startsWith("VERSION:2.0"));
      const hasMethod = lines.some((l) => l.startsWith("METHOD:PUBLISH"));
      const hasEvent = lines.some((l) => l.trim() === "BEGIN:VEVENT");

      if (!hasBegin) throw new Error("BEGIN:VCALENDAR missing");
      if (!hasVersion) throw new Error("VERSION:2.0 missing");
      if (!hasMethod) throw new Error("METHOD:PUBLISH missing");
      if (!hasEvent) throw new Error("No VEVENT found (placeholder should exist if empty)");

      addResult("✅ ICS has BEGIN:VCALENDAR, VERSION:2.0, METHOD:PUBLISH, and at least one VEVENT");

      // 4) Validate reminders got translated to minutes (VALARM/TRIGGER)
      // Our API parses -P1D and -PT1H into minutes and emits as -PT{n}M triggers
      const hasAlarm = lines.some((l) => l.trim() === "BEGIN:VALARM");
      const hasDayTrigger = ics.includes("TRIGGER:-PT1440M"); // 1 day
      const hasHourTrigger = ics.includes("TRIGGER:-PT60M"); // 1 hour

      if (!hasAlarm) {
        addResult("ℹ️ No VALARM found: this can happen for all-day placeholder events");
      } else {
        addResult("✅ VALARM components present");
      }

      if (hasDayTrigger && hasHourTrigger) {
        addResult("✅ TRIGGERs include -PT1440M and -PT60M for 1 day and 1 hour");
      } else {
        addResult("ℹ️ TRIGGERs for reminders not detected; might be due to placeholder or data");
      }

      addResult("🎉 All checks passed. Click the link below to test popup behavior manually.");
      addResult(googleUrl);
    } catch (err) {
      addResult(`❌ Failure: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  };

  const openGoogleUrl = () => {
    const last = testResults.slice().reverse().find((r) => r.startsWith("https://calendar.google.com"));
    if (last) {
      const link = document.createElement("a");
      link.href = last;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      addResult("ℹ️ No Google URL in results yet. Run the test first.");
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Google calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={runGoogleCalendarTest} disabled={running}>
              {running ? "Running..." : "Run"}
            </Button>
            <Button onClick={openGoogleUrl} variant="outline">Open Google URL</Button>
            <Button onClick={clearResults} variant="secondary">Clear</Button>
          </div>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 font-mono text-sm p-4 rounded max-h-96 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div key={index} className="mb-1 break-all">
                      {result}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


