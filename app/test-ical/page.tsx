"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink, Download } from "lucide-react";

export default function TestICalPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testICalEndpoint = async () => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const icalUrl = `${baseUrl}/api/ical?name=UPV Exams`;

      console.log("🧪 Testing iCal endpoint:", icalUrl);

      const response = await fetch(icalUrl);
      const content = await response.text();

      const results = {
        url: icalUrl,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
        contentLength: content.length,
        hasEvents: content.includes("BEGIN:VEVENT"),
        eventCount: (content.match(/BEGIN:VEVENT/g) || []).length,
        preview: content.substring(0, 500),
        headers: Object.fromEntries(response.headers.entries()),
      };

      setTestResults(results);
      console.log("🧪 Test results:", results);
    } catch (error) {
      console.error("🧪 Test failed:", error);
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const googleCalendarUrls = [
    {
      name: "Method 1: render?cid (recommended)",
      url: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(
        "https://upv-cal.vercel.app/api/ical?name=UPV Exams"
      )}`,
    },
    {
      name: "Method 2: addbyurl (legacy)",
      url: `https://calendar.google.com/calendar/r/addbyurl?url=${encodeURIComponent(
        "https://upv-cal.vercel.app/api/ical?name=UPV Exams"
      )}`,
    },
    {
      name: "Method 3: Direct settings",
      url: `https://calendar.google.com/calendar/u/0/r/settings/addcalendar`,
    },
  ];

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">iCal Integration Test</h1>

      <div className="space-y-6">
        {/* Test iCal Endpoint */}
        <Card>
          <CardHeader>
            <CardTitle>Test iCal Endpoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testICalEndpoint} disabled={loading}>
              {loading ? "Testing..." : "Test iCal Endpoint"}
            </Button>

            {testResults && (
              <div className="space-y-4">
                {testResults.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <h4 className="font-medium text-red-800">Error</h4>
                    <p className="text-red-600">{testResults.error}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Status:</strong> {testResults.status}{" "}
                        {testResults.statusText}
                      </div>
                      <div>
                        <strong>Content-Type:</strong> {testResults.contentType}
                      </div>
                      <div>
                        <strong>Content Length:</strong>{" "}
                        {testResults.contentLength} bytes
                      </div>
                      <div>
                        <strong>Has Events:</strong>{" "}
                        {testResults.hasEvents ? "✅ Yes" : "❌ No"}
                      </div>
                      <div>
                        <strong>Event Count:</strong> {testResults.eventCount}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">iCal URL</h4>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                          {testResults.url}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(testResults.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Content Preview</h4>
                      <pre className="p-4 bg-gray-100 rounded text-xs overflow-x-auto">
                        {testResults.preview}...
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Response Headers</h4>
                      <pre className="p-4 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(testResults.headers, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Calendar Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Google Calendar Integration Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {googleCalendarUrls.map((method, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-medium">{method.name}</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-xs break-all">
                    {method.url}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(method.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(method.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Manual Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Google Calendar Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium mb-2">
                If automatic methods don't work, try manual setup:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Go to{" "}
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    Google Calendar
                  </a>
                </li>
                <li>
                  Click the "+" next to "Other calendars" on the left sidebar
                </li>
                <li>Select "From URL"</li>
                <li>
                  Paste this URL:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    https://upv-cal.vercel.app/api/ical?name=UPV Exams
                  </code>
                </li>
                <li>Click "Add calendar"</li>
              </ol>
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                https://upv-cal.vercel.app/api/ical?name=UPV Exams
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  copyToClipboard(
                    "https://upv-cal.vercel.app/api/ical?name=UPV Exams"
                  )
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Direct Download */}
        <Card>
          <CardHeader>
            <CardTitle>Direct Download</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                const link = document.createElement("a");
                link.href =
                  "https://upv-cal.vercel.app/api/ical?name=UPV Exams";
                link.download = "upv-exams.ics";
                link.click();
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download .ics file
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
