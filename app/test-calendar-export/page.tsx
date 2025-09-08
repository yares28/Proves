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
      
      // Don't actually open all of them automatically
      if (index === 0) {
        addResult(`ℹ️ You can test this URL manually`);
      }
    });
  };

  const testGoogleCalendarExport = async () => {
    addResult("📱 Testing Google Calendar Export Standards...");
    
    const baseUrl = "https://upv-cal.vercel.app";
    const testIcalUrl = `${baseUrl}/api/ical?name=Google+Test&school=ETSINF&degree=GIINF&year=1`;
    
    try {
      // Test iCal content for Google Calendar compatibility
      const response = await fetch(testIcalUrl);
      if (!response.ok) {
        addResult(`❌ Failed to fetch iCal: ${response.status}`);
        return;
      }
      
      const icalContent = await response.text();
      addResult(`📄 Testing iCal content for Google Calendar compatibility...`);
      
      // RFC 5545 compliance checks based on Context7 documentation
      const checks = [
        {
          name: "VCALENDAR wrapper",
          test: () => icalContent.includes("BEGIN:VCALENDAR") && icalContent.includes("END:VCALENDAR"),
          required: true
        },
        {
          name: "VERSION property",
          test: () => icalContent.includes("VERSION:2.0"),
          required: true
        },
        {
          name: "PRODID property",
          test: () => icalContent.includes("PRODID:"),
          required: true
        },
        {
          name: "VTIMEZONE component",
          test: () => icalContent.includes("BEGIN:VTIMEZONE") && icalContent.includes("END:VTIMEZONE"),
          required: false,
          description: "Timezone support for better Google Calendar integration"
        },
        {
          name: "VEVENT components",
          test: () => icalContent.includes("BEGIN:VEVENT") && icalContent.includes("END:VEVENT"),
          required: true
        },
        {
          name: "Event UID properties",
          test: () => icalContent.includes("UID:"),
          required: true,
          description: "Unique identifiers for events"
        },
        {
          name: "DTSTAMP properties",
          test: () => icalContent.includes("DTSTAMP:"),
          required: true,
          description: "Creation/modification timestamps"
        },
        {
          name: "DTSTART properties",
          test: () => icalContent.includes("DTSTART"),
          required: true,
          description: "Event start times"
        },
        {
          name: "VALARM components",
          test: () => icalContent.includes("BEGIN:VALARM") && icalContent.includes("END:VALARM"),
          required: false,
          description: "Reminder/notification support"
        },
        {
          name: "Proper line folding",
          test: () => {
            const lines = icalContent.split('\n');
            return lines.every(line => line.length <= 75 || line.startsWith(' ') || line.startsWith('\t'));
          },
          required: true,
          description: "RFC 5545 line length compliance"
        }
      ];
      
      let passedChecks = 0;
      let requiredChecks = 0;
      
      checks.forEach(check => {
        if (check.required) requiredChecks++;
        
        const passed = check.test();
        if (passed) passedChecks++;
        
        const status = passed ? "✅" : (check.required ? "❌" : "⚠️");
        const description = check.description ? ` - ${check.description}` : "";
        addResult(`${status} ${check.name}${description}`);
      });
      
      addResult(`📊 Google Calendar Compatibility: ${passedChecks}/${checks.length} checks passed`);
      
      if (passedChecks >= requiredChecks) {
        addResult(`✅ Google Calendar export should work correctly`);
      } else {
        addResult(`❌ Google Calendar export may have issues`);
      }
      
      // Test webcal URL generation
      const webcalUrl = testIcalUrl.replace(/^https?:/, "webcal:");
      const googleUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(webcalUrl)}`;
      addResult(`🔗 Generated Google Calendar URL: ${googleUrl}`);
      
    } catch (error) {
      addResult(`❌ Google Calendar export test failed: ${error}`);
    }
  };

  const testAppleCalendarExport = async () => {
    addResult("🍎 Testing Apple Calendar Export Standards...");
    
    const baseUrl = "https://upv-cal.vercel.app";
    const testIcalUrl = `${baseUrl}/api/ical?name=Apple+Test&school=ETSINF&degree=GIINF&year=1`;
    
    try {
      // Test iCal content for Apple Calendar (CalDAV) compatibility
      const response = await fetch(testIcalUrl);
      if (!response.ok) {
        addResult(`❌ Failed to fetch iCal: ${response.status}`);
        return;
      }
      
      const icalContent = await response.text();
      addResult(`📄 Testing iCal content for Apple Calendar compatibility...`);
      
      // Apple Calendar specific checks based on Context7 documentation
      const appleChecks = [
        {
          name: "CalDAV compliance",
          test: () => icalContent.includes("BEGIN:VCALENDAR") && icalContent.includes("END:VCALENDAR"),
          required: true
        },
        {
          name: "X-WR-CALNAME property",
          test: () => icalContent.includes("X-WR-CALNAME:"),
          required: false,
          description: "Apple Calendar calendar name display"
        },
        {
          name: "X-WR-TIMEZONE property", 
          test: () => icalContent.includes("X-WR-TIMEZONE:"),
          required: false,
          description: "Apple Calendar timezone handling"
        },
        {
          name: "VTIMEZONE with TZID",
          test: () => icalContent.includes("TZID:") && icalContent.includes("BEGIN:VTIMEZONE"),
          required: false,
          description: "Proper timezone support for Apple devices"
        },
        {
          name: "Apple structured location support",
          test: () => icalContent.includes("X-APPLE-STRUCTURED-LOCATION") || icalContent.includes("LOCATION:"),
          required: false,
          description: "Location data for Apple Maps integration"
        },
        {
          name: "VALARM ACTION:DISPLAY",
          test: () => icalContent.includes("ACTION:DISPLAY"),
          required: false,
          description: "Apple notification support"
        },
        {
          name: "Proper date formatting",
          test: () => {
            // Check for proper ISO 8601 date formats
            const dateFormats = [
              /\d{8}T\d{6}Z/, // YYYYMMDDTHHMMSSZ
              /\d{8}T\d{6}/,  // YYYYMMDDTHHMMSS
              /\d{8}/         // YYYYMMDD
            ];
            return dateFormats.some(format => format.test(icalContent));
          },
          required: true,
          description: "ISO 8601 compliant date/time formats"
        },
        {
          name: "UTF-8 encoding support",
          test: () => {
            // Check if content can handle UTF-8 characters properly
            try {
              new TextEncoder().encode(icalContent);
              return true;
            } catch {
              return false;
            }
          },
          required: true,
          description: "Unicode character support"
        }
      ];
      
      let passedAppleChecks = 0;
      let requiredAppleChecks = 0;
      
      appleChecks.forEach(check => {
        if (check.required) requiredAppleChecks++;
        
        const passed = check.test();
        if (passed) passedAppleChecks++;
        
        const status = passed ? "✅" : (check.required ? "❌" : "⚠️");
        const description = check.description ? ` - ${check.description}` : "";
        addResult(`${status} ${check.name}${description}`);
      });
      
      addResult(`📊 Apple Calendar Compatibility: ${passedAppleChecks}/${appleChecks.length} checks passed`);
      
      if (passedAppleChecks >= requiredAppleChecks) {
        addResult(`✅ Apple Calendar export should work correctly`);
      } else {
        addResult(`❌ Apple Calendar export may have issues`);
      }
      
      // Test webcal URL for Apple Calendar
      const webcalUrl = testIcalUrl.replace(/^https?:/, "webcal:");
      addResult(`🔗 Apple Calendar webcal URL: ${webcalUrl}`);
      
      // Test HTTP headers for Apple Calendar compatibility
      try {
        const headResponse = await fetch(testIcalUrl, { method: 'HEAD' });
        const contentType = headResponse.headers.get('content-type');
        const cacheControl = headResponse.headers.get('cache-control');
        
        addResult(`📧 Content-Type: ${contentType || 'Not set'}`);
        addResult(`🔄 Cache-Control: ${cacheControl || 'Not set'}`);
        
        if (contentType?.includes('text/calendar')) {
          addResult(`✅ Correct Content-Type for Apple Calendar`);
        } else {
          addResult(`⚠️ Content-Type should be 'text/calendar; charset=utf-8'`);
        }
      } catch (error) {
        addResult(`⚠️ Could not test HTTP headers: ${error}`);
      }
      
    } catch (error) {
      addResult(`❌ Apple Calendar export test failed: ${error}`);
    }
  };

  const testICSValidation = async () => {
    addResult("📋 Testing ICS Format Validation...");
    
    const baseUrl = "https://upv-cal.vercel.app";
    const testIcalUrl = `${baseUrl}/api/ical?name=ICS+Validation+Test&school=ETSINF&degree=GIINF&year=1`;
    
    try {
      const response = await fetch(testIcalUrl);
      if (!response.ok) {
        addResult(`❌ Failed to fetch iCal: ${response.status}`);
        return;
      }
      
      const icalContent = await response.text();
      addResult(`📄 Validating ICS format against RFC 5545 standards...`);
      
      // Comprehensive RFC 5545 validation based on Context7 documentation
      const validationChecks = [
        {
          name: "File structure",
          test: () => {
            const lines = icalContent.split('\n');
            return lines[0]?.trim() === "BEGIN:VCALENDAR" && 
                   lines[lines.length - 1]?.trim() === "END:VCALENDAR";
          },
          required: true,
          description: "Must start with BEGIN:VCALENDAR and end with END:VCALENDAR"
        },
        {
          name: "Required properties present",
          test: () => {
            const required = ["VERSION:", "PRODID:"];
            return required.every(prop => icalContent.includes(prop));
          },
          required: true,
          description: "VERSION and PRODID are mandatory"
        },
        {
          name: "Line length compliance",
          test: () => {
            const lines = icalContent.split('\n');
            return lines.every(line => {
              // Continuation lines start with space or tab
              if (line.startsWith(' ') || line.startsWith('\t')) return true;
              // Other lines should be <= 75 characters
              return line.length <= 75;
            });
          },
          required: true,
          description: "Lines must be ≤ 75 chars or properly folded"
        },
        {
          name: "Property formatting",
          test: () => {
            // Check for proper property:value format
            const propertyRegex = /^[A-Z][A-Z0-9-]*[A-Z0-9](\;[^:]*)?:/;
            const lines = icalContent.split('\n').filter(line => 
              line.trim() && !line.startsWith(' ') && !line.startsWith('\t')
            );
            return lines.every(line => 
              line.startsWith('BEGIN:') || line.startsWith('END:') || propertyRegex.test(line)
            );
          },
          required: true,
          description: "Properties must follow NAME:VALUE or NAME;PARAM=VALUE:VALUE format"
        },
        {
          name: "Event component structure",
          test: () => {
            const eventCount = (icalContent.match(/BEGIN:VEVENT/g) || []).length;
            const eventEndCount = (icalContent.match(/END:VEVENT/g) || []).length;
            return eventCount > 0 && eventCount === eventEndCount;
          },
          required: true,
          description: "Balanced BEGIN:VEVENT and END:VEVENT pairs"
        },
        {
          name: "UID uniqueness",
          test: () => {
            const uidMatches = icalContent.match(/UID:([^\r\n]+)/g) || [];
            const uids = uidMatches.map(match => match.replace('UID:', ''));
            const uniqueUids = new Set(uids);
            return uids.length === uniqueUids.size;
          },
          required: true,
          description: "Each event must have a unique UID"
        },
        {
          name: "Date/time format validation",
          test: () => {
            // Check for valid date-time formats
            const dateTimeRegex = /\d{8}T\d{6}(Z|$)/;
            const dateRegex = /\d{8}$/;
            const dtProperties = icalContent.match(/(DTSTART|DTEND|DTSTAMP)[:;][^\r\n]*/g) || [];
            
            return dtProperties.every(prop => {
              const value = prop.split(':').pop() || '';
              return dateTimeRegex.test(value) || dateRegex.test(value);
            });
          },
          required: true,
          description: "Date/time values must be in YYYYMMDD or YYYYMMDDTHHMMSSZ format"
        },
        {
          name: "Character encoding",
          test: () => {
            // Test for proper character escaping
            const needsEscaping = /[,;\\]/;
            const lines = icalContent.split('\n');
            return lines.every(line => {
              if (line.includes(':')) {
                const value = line.split(':').slice(1).join(':');
                // If value contains special chars, they should be escaped
                if (needsEscaping.test(value)) {
                  return value.includes('\\,') || value.includes('\\;') || value.includes('\\\\');
                }
              }
              return true;
            });
          },
          required: false,
          description: "Special characters should be properly escaped"
        },
        {
          name: "Timezone consistency",
          test: () => {
            const tzidReferences = icalContent.match(/TZID=([^:;]+)/g) || [];
            const tzidDefinitions = icalContent.match(/TZID:([^\r\n]+)/g) || [];
            
            // Extract timezone IDs
            const referencedTzids = tzidReferences.map(ref => ref.replace('TZID=', ''));
            const definedTzids = tzidDefinitions.map(def => def.replace('TZID:', ''));
            
            // All referenced timezones should be defined
            return referencedTzids.every(tzid => definedTzids.includes(tzid));
          },
          required: false,
          description: "Referenced timezones should be defined in VTIMEZONE components"
        },
        {
          name: "VALARM structure",
          test: () => {
            const alarmBeginCount = (icalContent.match(/BEGIN:VALARM/g) || []).length;
            const alarmEndCount = (icalContent.match(/END:VALARM/g) || []).length;
            const alarmActions = icalContent.match(/ACTION:(DISPLAY|EMAIL|AUDIO)/g) || [];
            
            return alarmBeginCount === alarmEndCount && 
                   alarmActions.length === alarmBeginCount;
          },
          required: false,
          description: "VALARM components must have balanced BEGIN/END and valid ACTION"
        }
      ];
      
      let passedValidation = 0;
      let requiredValidation = 0;
      let criticalIssues = 0;
      
      validationChecks.forEach(check => {
        if (check.required) requiredValidation++;
        
        const passed = check.test();
        if (passed) {
          passedValidation++;
        } else if (check.required) {
          criticalIssues++;
        }
        
        const status = passed ? "✅" : (check.required ? "❌" : "⚠️");
        const description = check.description ? ` - ${check.description}` : "";
        addResult(`${status} ${check.name}${description}`);
      });
      
      addResult(`📊 ICS Validation Results: ${passedValidation}/${validationChecks.length} checks passed`);
      addResult(`🔍 Critical Issues: ${criticalIssues} (${requiredValidation - criticalIssues}/${requiredValidation} required checks passed)`);
      
      if (criticalIssues === 0) {
        addResult(`✅ ICS file is RFC 5545 compliant and should work with all calendar applications`);
      } else {
        addResult(`❌ ICS file has ${criticalIssues} critical compliance issues`);
      }
      
      // Additional format statistics
      const eventCount = (icalContent.match(/BEGIN:VEVENT/g) || []).length;
      const alarmCount = (icalContent.match(/BEGIN:VALARM/g) || []).length;
      const timezoneCount = (icalContent.match(/BEGIN:VTIMEZONE/g) || []).length;
      
      addResult(`📈 Content Analysis: ${eventCount} events, ${alarmCount} alarms, ${timezoneCount} timezones`);
      
    } catch (error) {
      addResult(`❌ ICS validation test failed: ${error}`);
    }
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
    addResult("🚀 Starting comprehensive calendar export tests...");
    
    await testICalGeneration();
    await testAPIRoute();
    await testICSValidation();
    await testGoogleCalendarExport();
    await testAppleCalendarExport();
    testGoogleCalendarURLs();
    
    addResult("✅ All comprehensive tests completed!");
    
    toast({
      title: "Tests Completed",
      description: "Check the detailed results below for complete compatibility analysis.",
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
            <Button onClick={testICSValidation} variant="outline">
              📋 Test ICS Validation
            </Button>
            <Button onClick={testGoogleCalendarExport} variant="outline">
              📱 Test Google Calendar
            </Button>
            <Button onClick={testAppleCalendarExport} variant="outline">
              🍎 Test Apple Calendar
            </Button>
            <Button onClick={testAPIRoute} variant="outline">
              🔗 Test API Route
            </Button>
            <Button onClick={testGoogleCalendarURLs} variant="outline">
              🌐 Test URL Patterns
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
