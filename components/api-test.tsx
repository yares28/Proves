'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { springApi, type ExamDto, type ApiResponse, ApiError } from '@/lib/api/spring-api';
import { toast } from 'sonner';

/**
 * Demo component to test Spring Boot API integration
 * Shows health status, exam data, and API functionality
 */
export function ApiTestComponent() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [exams, setExams] = useState<ExamDto[]>([]);
  const [degrees, setDegrees] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Test API health endpoint
   */
  const testHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await springApi.health();
      setHealthStatus(response.data);
      toast.success('API health check successful!');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Health check failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load exams from Spring API
   */
  const loadExams = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await springApi.getExams();
      if (response.success && Array.isArray(response.data)) {
        setExams(response.data);
        toast.success(`Loaded ${response.data.length} exams from Spring API`);
      } else {
        setError('Invalid response format');
        toast.error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load exams';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load degrees from Spring API
   */
  const loadDegrees = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await springApi.getDegrees();
      if (response.success && Array.isArray(response.data)) {
        setDegrees(response.data);
        toast.success(`Loaded ${response.data.length} degrees from Spring API`);
      } else {
        setError('Invalid response format');
        toast.error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load degrees';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load upcoming exams
   */
  const loadUpcomingExams = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await springApi.getUpcomingExams();
      if (response.success && Array.isArray(response.data)) {
        setExams(response.data);
        toast.success(`Loaded ${response.data.length} upcoming exams`);
      } else {
        setError('Invalid response format');
        toast.error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load upcoming exams';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Spring Boot API Test</CardTitle>
          <CardDescription>
            Test the integration between Next.js frontend and Spring Boot backend with Supabase authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Controls */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={testHealth} disabled={loading}>
              Test Health
            </Button>
            <Button onClick={loadExams} disabled={loading}>
              Load All Exams
            </Button>
            <Button onClick={loadUpcomingExams} disabled={loading}>
              Load Upcoming Exams
            </Button>
            <Button onClick={loadDegrees} disabled={loading}>
              Load Degrees
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center text-muted-foreground">
              Loading...
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              Error: {error}
            </div>
          )}

          {/* Health Status */}
          {healthStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Health Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={healthStatus.status === 'UP' ? 'default' : 'destructive'}>
                      {healthStatus.status}
                    </Badge>
                    <span className="text-sm">{healthStatus.service}</span>
                  </div>
                  {healthStatus.version && (
                    <div className="text-sm text-muted-foreground">
                      Version: {healthStatus.version}
                    </div>
                  )}
                  {healthStatus.timestamp && (
                    <div className="text-sm text-muted-foreground">
                      Timestamp: {new Date(healthStatus.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Degrees List */}
          {degrees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Degrees ({degrees.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {degrees.map((degree, index) => (
                    <Badge key={index} variant="secondary">
                      {degree}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exams List */}
          {exams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exams ({exams.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {exams.slice(0, 10).map((exam) => (
                    <div key={exam.id} className="p-3 border border-gray-200 rounded">
                      <div className="font-medium">{exam.subject}</div>
                      <div className="text-sm text-muted-foreground">
                        {exam.degree} • {exam.year} • {exam.semester}
                      </div>
                      <div className="text-sm">
                        {new Date(exam.date).toLocaleDateString()} 
                        {exam.room && ` • Room: ${exam.room}`}
                      </div>
                    </div>
                  ))}
                  {exams.length > 10 && (
                    <div className="text-sm text-muted-foreground text-center">
                      ... and {exams.length - 10} more exams
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Documentation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div><code>GET /api/health</code> - Health check</div>
                <div><code>GET /api/exams</code> - Get all exams</div>
                <div><code>GET /api/exams/upcoming</code> - Get upcoming exams</div>
                <div><code>GET /api/exams/degrees</code> - Get available degrees</div>
                <div><code>GET /api/exams/degree/{"{"}{"{"}degree{"}"}</code> - Get exams by degree</div>
                <div><code>POST /api/exams</code> - Create exam (auth required)</div>
                <div><code>PUT /api/exams/{"{"}{"{"}id{"}"}</code> - Update exam (auth required)</div>
                <div><code>DELETE /api/exams/{"{"}{"{"}id{"}"}</code> - Delete exam (admin required)</div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
} 