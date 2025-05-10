"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterSidebar } from "@/components/filter-sidebar";
import { debugCheckDataExists } from "@/actions/exam-actions";

export default function DebugPage() {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [debugResult, setDebugResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckData = async () => {
    setIsLoading(true);
    setDebugResult(null);
    
    try {
      // Extract the selected filter values
      const schools = activeFilters.school || [];
      const degrees = activeFilters.degree || [];
      const semesters = activeFilters.semester || [];
      const years = activeFilters.year || [];
      
      // Call the debug function
      const result = await debugCheckDataExists(schools, degrees, semesters, years);
      setDebugResult(result);
    } catch (error) {
      console.error("Error checking data:", error);
      setDebugResult({ error: "Failed to check data", data: null });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Debug Filters</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <FilterSidebar onFiltersChange={setActiveFilters} />
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Filter Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Active Filters</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(activeFilters, null, 2)}
                </pre>
              </div>
              
              <Button onClick={handleCheckData} disabled={isLoading}>
                {isLoading ? "Checking..." : "Check Database Records"}
              </Button>
              
              {debugResult && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Database Check Results</h3>
                  {debugResult.error ? (
                    <div className="text-red-500">Error: {debugResult.error}</div>
                  ) : (
                    <>
                      <div className="mb-2">
                        Found <span className="font-bold">{debugResult.data?.count || 0}</span> records
                      </div>
                      {debugResult.data?.count > 0 && (
                        <pre className="bg-muted p-4 rounded-md overflow-auto">
                          {JSON.stringify(debugResult.data?.sample, null, 2)}
                        </pre>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 