"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function TestCalendarExportPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const { toast } = useToast();

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAPIRoute = async () => {
    addResult("🧪 Testing API route accessibility...");
    
    // Test with a sample calendar ID (this will fail but show us the error)
    const testId = "test-calendar-id";
    const baseUrl = "https://upv-cal.vercel.app";
    const apiUrl = `${baseUrl}/api/calendars/${testId}/ical`;
    
    try {
      const response = await fetch(apiUrl);
      addResult(`📊 API Response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const content = await response.text();
        addResult(`✅ API returned iCal content (${content.length} chars)`);
        addResult(`📄 Content preview: ${content.substring(0, 100)}...`);
      } else {
        const errorText = await response.text();
        addResult(`❌ API Error: ${errorText}`);
      }
    } catch (error) {
      addResult(`❌ API Test Failed: ${error}`);
    }
  };

  const testGoogleCalendarURLs = () => {
    addResult("🔗 Testing Google Calendar URL patterns...");
    
    const baseUrl = "https://upv-cal.vercel.app";
    const testIcalUrl = `${baseUrl}/api/ical?name=Test&school=ETSINF`;
    const testWebcalUrl = testIcalUrl.replace(/^https?:/, "webcal:");
    
    const googleCalendarUrls = [
      `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(testWebcalUrl)}`,
      `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(testWebcalUrl)}`,
      `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(testIcalUrl)}`,
      `https://calendar.google.com/calendar/r/settings/addbyurl?cid=${encodeURIComponent(testIcalUrl)}`,
    ];

    googleCalendarUrls.forEach((url, index) => {
      addResult(`🔗 Pattern ${index + 1}: ${url}`);
      
      // Test if the URL opens (just for demonstration)
      const testLink = () => {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addResult(`✅ Attempted to open pattern ${index + 1}`);
      };
      
      // Don't actually open all of them automatically
      if (index === 0) {
        addResult(`ℹ️ You can test this URL manually`);
      }
    });
  };

  const testICalGeneration = async () => {
    addResult("📅 Testing iCal generation...");
    
    // Test with existing ical route on production
    try {
      const testFilters = {
        school: ["ETSINF"],
        degree: ["GIINF"],
        year: ["1"]
      };
      
      const params = new URLSearchParams();
      params.set("name", "Test Calendar");
      Object.entries(testFilters).forEach(([key, values]) => {
        values.forEach(value => params.append(key, value));
      });
      
      const baseUrl = "https://upv-cal.vercel.app";
      const icalUrl = `${baseUrl}/api/ical?${params.toString()}`;
      addResult(`🔗 Testing iCal URL: ${icalUrl}`);
      
      const response = await fetch(icalUrl);
      addResult(`📊 iCal Response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const content = await response.text();
        addResult(`✅ iCal generated successfully (${content.length} chars)`);
        addResult(`📄 iCal preview: ${content.substring(0, 200)}...`);
        
        // Test if it's valid iCal format
        if (content.includes("BEGIN:VCALENDAR") && content.includes("END:VCALENDAR")) {
          addResult(`✅ iCal format appears valid`);
        } else {
          addResult(`❌ iCal format may be invalid`);
        }
      } else {
        const errorText = await response.text();
        addResult(`❌ iCal generation failed: ${errorText}`);
      }
    } catch (error) {
      addResult(`❌ iCal test failed: ${error}`);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addResult("🚀 Starting comprehensive Google Calendar export tests...");
    
    await testICalGeneration();
    await testAPIRoute();
    testGoogleCalendarURLs();
    
    addResult("✅ All tests completed!");
    
    toast({
      title: "Tests Completed",
      description: "Check the results below for debugging information.",
    });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Google Calendar Export Debug Tool</CardTitle>
          <p className="text-muted-foreground">
            This tool helps diagnose issues with the Google Calendar export functionality.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={runAllTests}>
              🚀 Run All Tests
            </Button>
            <Button onClick={testICalGeneration} variant="outline">
              📅 Test iCal Generation
            </Button>
            <Button onClick={testAPIRoute} variant="outline">
              🔗 Test API Route
            </Button>
            <Button onClick={testGoogleCalendarURLs} variant="outline">
              🌐 Test Google URLs
            </Button>
            <Button onClick={clearResults} variant="secondary">
              🧹 Clear Results
            </Button>
          </div>
          
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 font-mono text-sm p-4 rounded max-h-96 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div key={index} className="mb-1">
                      {result}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manual Testing Steps</CardTitle>
            </CardHeader>
             <CardContent className="space-y-2 text-sm">
               <div>
                 <strong>1. Test iCal URL directly:</strong>
                 <br />
                 <a 
                   href="https://upv-cal.vercel.app/api/ical?name=Test&school=ETSINF"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="bg-muted px-2 py-1 rounded text-blue-600 hover:underline inline-block"
                 >
                   https://upv-cal.vercel.app/api/ical?name=Test&school=ETSINF
                 </a>
               </div>
               <div>
                 <strong>2. Test calendar-specific API route:</strong>
                 <br />
                 <code className="bg-muted px-2 py-1 rounded">
                   https://upv-cal.vercel.app/api/calendars/[calendar-id]/ical
                 </code>
               </div>
               <div>
                 <strong>3. Test Google Calendar URL:</strong>
                 <br />
                 <a 
                   href="https://calendar.google.com/calendar/u/0/r?cid=webcal%3A%2F%2Fupv-cal.vercel.app%2Fapi%2Fical%3Fname%3DTest%26school%3DETSINF"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="bg-muted px-2 py-1 rounded text-blue-600 hover:underline inline-block text-xs break-all"
                 >
                   Test Google Calendar Subscription
                 </a>
               </div>
               <div>
                 <strong>4. Alternative Google Calendar URL:</strong>
                 <br />
                 <a 
                   href="https://calendar.google.com/calendar/render?cid=webcal%3A%2F%2Fupv-cal.vercel.app%2Fapi%2Fical%3Fname%3DTest%26school%3DETSINF"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="bg-muted px-2 py-1 rounded text-blue-600 hover:underline inline-block text-xs break-all"
                 >
                   Test Google Calendar (Alternative)
                 </a>
               </div>
             </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
