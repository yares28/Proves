/**
 * Spring Boot API Client for UPV Exam Calendar
 * Integrates with Supabase authentication and provides type-safe API calls
 */

import { createClient } from '@/lib/supabase/client';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080/api';

// Types
interface ExamDto {
  id?: number;
  subject: string;
  degree: string;
  year: string;
  semester: string;
  date: string; // ISO string
  room?: string;
  school?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}

// Error types
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Spring Boot API Client Class
 */
class SpringApiClient {
  private baseUrl: string;
  private supabase = createClient();

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication headers for requests
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  /**
   * Make authenticated request to Spring Boot API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          // Fallback to status text if not JSON
        }
        
        throw new ApiError(errorMessage, response.status, errorText);
      }

      const data: ApiResponse<T> = await response.json();
      return data;
      
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('API request failed:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown API error'
      );
    }
  }

  /**
   * Check API health status
   */
  async health(): Promise<ApiResponse<Record<string, any>>> {
    return this.request('/health');
  }

  /**
   * Get all exams
   */
  async getExams(): Promise<ApiResponse<ExamDto[]>> {
    return this.request('/exams');
  }

  /**
   * Get exam by ID
   */
  async getExamById(id: number): Promise<ApiResponse<ExamDto>> {
    return this.request(`/exams/${id}`);
  }

  /**
   * Get upcoming exams
   */
  async getUpcomingExams(): Promise<ApiResponse<ExamDto[]>> {
    return this.request('/exams/upcoming');
  }

  /**
   * Get distinct degrees
   */
  async getDegrees(): Promise<ApiResponse<string[]>> {
    return this.request('/exams/degrees');
  }

  /**
   * Get exams by degree
   */
  async getExamsByDegree(degree: string): Promise<ApiResponse<ExamDto[]>> {
    return this.request(`/exams/degree/${encodeURIComponent(degree)}`);
  }
}

// Export singleton instance
export const springApi = new SpringApiClient();

// Export types and error class
export { ApiError };
export type { ApiResponse, ExamDto }; 