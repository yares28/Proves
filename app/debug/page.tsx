"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkTableStructure, runDirectQuery } from "@/actions/table-check";

export default function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkTable = async () => {
    setLoading(true);
    try {
      const data = await checkTableStructure();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const runQuery = async () => {
    setLoading(true);
    try {
      const data = await runDirectQuery();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">Database Debug Page</h1>
      
      <div className="flex gap-4">
        <Button 
          onClick={checkTable} 
          disabled={loading}
        >
          Check Table Structure
        </Button>
        
        <Button 
          onClick={runQuery} 
          disabled={loading}
          variant="outline"
        >
          Run Direct Query
        </Button>
      </div>
      
      {loading && <p>Loading...</p>}
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded overflow-auto max-h-[600px]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 