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
      
      // Test both old and new formats
      const oldFormatUrl = `${baseUrl}/api/ical?name=UPV Exams`;
      
      // Generate token URL for new format
      const { generateUPVTokenUrl } = await import("@/lib/utils");
      const tokenPath = await generateUPVTokenUrl({}, "UPV Exams");
      const newFormatUrl = `${baseUrl}${tokenPath}`;

      console.log("🧪 Testing old format:", oldFormatUrl);
      console.log("🧪 Testing new format:", newFormatUrl);

      // Test old format
      const oldResponse = await fetch(oldFormatUrl);
      const oldContent = await oldResponse.text();

      // Test new format
      const newResponse = await fetch(newFormatUrl);
      const newContent = await newResponse.text();

      const results = {
        oldFormat: {
          url: oldFormatUrl,
          status: oldResponse.status,
          statusText: oldResponse.statusText,
          contentType: oldResponse.headers.get("content-type"),
          contentLength: oldContent.length,
          hasEvents: oldContent.includes("BEGIN:VEVENT"),
          eventCount: (oldContent.match(/BEGIN:VEVENT/g) || []).length,
          preview: oldContent.substring(0, 500),
          isUPVFormat: oldContent.includes("PRODID:-//UPV-Cal//Exam API 1.0//ES"),
          hasUPVColors: oldContent.includes("UPV_BGCOLOR"),
        },
        newFormat: {
          url: newFormatUrl,
          status: newResponse.status,
          statusText: newResponse.statusText,
          contentType: newResponse.headers.get("content-type"),
          contentLength: newContent.length,
          hasEvents: newContent.includes("BEGIN:VEVENT"),
          eventCount: (newContent.match(/BEGIN:VEVENT/g) || []).length,
          preview: newContent.substring(0, 500),
          isUPVFormat: newContent.includes("PRODID:-//UPV-Cal//Exam API 1.0//ES"),
          hasUPVColors: newContent.includes("UPV_BGCOLOR"),
        }
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
              <div className="space-y-6">
                {testResults.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <h4 className="font-medium text-red-800">Error</h4>
                    <p className="text-red-600">{testResults.error}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Old Format Results */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-blue-600">Legacy Format (/api/ical)</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <strong>Status:</strong> {testResults.oldFormat.status}{" "}
                          {testResults.oldFormat.statusText}
                        </div>
                        <div>
                          <strong>Content-Type:</strong> {testResults.oldFormat.contentType}
                        </div>
                        <div>
                          <strong>Content Length:</strong>{" "}
                          {testResults.oldFormat.contentLength} bytes
                        </div>
                        <div>
                          <strong>Has Events:</strong>{" "}
                          {testResults.oldFormat.hasEvents ? "✅ Yes" : "❌ No"}
                        </div>
                        <div>
                          <strong>Event Count:</strong> {testResults.oldFormat.eventCount}
                        </div>
                        <div>
                          <strong>UPV Format:</strong>{" "}
                          {testResults.oldFormat.isUPVFormat ? "✅ Yes" : "❌ No"}
                        </div>
                        <div>
                          <strong>UPV Colors:</strong>{" "}
                          {testResults.oldFormat.hasUPVColors ? "✅ Yes" : "❌ No"}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h5 className="font-medium mb-2">URL</h5>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                            {testResults.oldFormat.url}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(testResults.oldFormat.url)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Content Preview</h5>
                        <pre className="p-4 bg-gray-100 rounded text-xs overflow-x-auto">
                          {testResults.oldFormat.preview}...
                        </pre>
                      </div>
                    </div>

                    {/* New Format Results */}
                    <div className="border rounded-lg p-4 border-green-200 bg-green-50">
                      <h4 className="font-medium mb-3 text-green-600">UPV Token Format (/ical/[token].ics)</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <strong>Status:</strong> {testResults.newFormat.status}{" "}
                          {testResults.newFormat.statusText}
                        </div>
                        <div>
                          <strong>Content-Type:</strong> {testResults.newFormat.contentType}
                        </div>
                        <div>
                          <strong>Content Length:</strong>{" "}
                          {testResults.newFormat.contentLength} bytes
                        </div>
                        <div>
                          <strong>Has Events:</strong>{" "}
                          {testResults.newFormat.hasEvents ? "✅ Yes" : "❌ No"}
                        </div>
                        <div>
                          <strong>Event Count:</strong> {testResults.newFormat.eventCount}
                        </div>
                        <div>
                          <strong>UPV Format:</strong>{" "}
                          {testResults.newFormat.isUPVFormat ? "✅ Yes" : "❌ No"}
                        </div>
                        <div>
                          <strong>UPV Colors:</strong>{" "}
                          {testResults.newFormat.hasUPVColors ? "✅ Yes" : "❌ No"}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h5 className="font-medium mb-2">Token URL</h5>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-white rounded text-sm">
                            {testResults.newFormat.url}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(testResults.newFormat.url)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Content Preview</h5>
                        <pre className="p-4 bg-white rounded text-xs overflow-x-auto">
                          {testResults.newFormat.preview}...
                        </pre>
                      </div>
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
