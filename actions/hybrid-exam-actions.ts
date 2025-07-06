'use server';

import { createClient } from '@/lib/supabase/server';
import { springApi, type ExamDto, ApiError } from '@/lib/api/spring-api';

/**
 * Hybrid exam actions that can use both Supabase direct access and Spring Boot API
 * Demonstrates the flexibility of the hybrid architecture
 */

export interface ExamData {
  id?: number;
  subject: string;
  degree: string;
  year: string;
  semester: string;
  date: string;
  room?: string;
  school?: string;
}

/**
 * Get exams using Supabase direct access (original method)
 */
export async function getExamsFromSupabase() {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('ETSINF')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Error fetching exams from Supabase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      data: null 
    };
  }
}

/**
 * Get exams using Spring Boot API (new method)
 */
export async function getExamsFromSpringAPI() {
  try {
    const response = await springApi.getExams();
    
    if (response.success && response.data) {
      return { success: true, error: null, data: response.data };
    } else {
      return { success: false, error: response.message || 'API request failed', data: null };
    }
  } catch (error) {
    console.error('Error fetching exams from Spring API:', error);
    
    if (error instanceof ApiError) {
      return { success: false, error: error.message, data: null };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown API error', 
      data: null 
    };
  }
}

/**
 * Get degrees using Supabase direct access
 */
export async function getDegreesFromSupabase() {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('ETSINF')
      .select('degree')
      .order('degree', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message, data: null };
    }

    // Extract unique degrees
    const uniqueDegrees = [...new Set(data?.map(item => item.degree).filter(Boolean))];
    
    return { success: true, error: null, data: uniqueDegrees };
  } catch (error) {
    console.error('Error fetching degrees from Supabase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      data: null 
    };
  }
}

/**
 * Get degrees using Spring Boot API
 */
export async function getDegreesFromSpringAPI() {
  try {
    const response = await springApi.getDegrees();
    
    if (response.success && response.data) {
      return { success: true, error: null, data: response.data };
    } else {
      return { success: false, error: response.message || 'API request failed', data: null };
    }
  } catch (error) {
    console.error('Error fetching degrees from Spring API:', error);
    
    if (error instanceof ApiError) {
      return { success: false, error: error.message, data: null };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown API error', 
      data: null 
    };
  }
}

/**
 * Get upcoming exams using Spring Boot API
 */
export async function getUpcomingExamsFromSpringAPI() {
  try {
    const response = await springApi.getUpcomingExams();
    
    if (response.success && response.data) {
      return { success: true, error: null, data: response.data };
    } else {
      return { success: false, error: response.message || 'API request failed', data: null };
    }
  } catch (error) {
    console.error('Error fetching upcoming exams from Spring API:', error);
    
    if (error instanceof ApiError) {
      return { success: false, error: error.message, data: null };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown API error', 
      data: null 
    };
  }
}

/**
 * Get exams by degree using Supabase direct access
 */
export async function getExamsByDegreeFromSupabase(degree: string) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('ETSINF')
      .select('*')
      .eq('degree', degree)
      .order('date', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Error fetching exams by degree from Supabase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      data: null 
    };
  }
}

/**
 * Get exams by degree using Spring Boot API
 */
export async function getExamsByDegreeFromSpringAPI(degree: string) {
  try {
    const response = await springApi.getExamsByDegree(degree);
    
    if (response.success && response.data) {
      return { success: true, error: null, data: response.data };
    } else {
      return { success: false, error: response.message || 'API request failed', data: null };
    }
  } catch (error) {
    console.error('Error fetching exams by degree from Spring API:', error);
    
    if (error instanceof ApiError) {
      return { success: false, error: error.message, data: null };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown API error', 
      data: null 
    };
  }
}

/**
 * Hybrid function that tries Spring API first, falls back to Supabase
 */
export async function getExamsHybrid() {
  // Try Spring API first
  const springResult = await getExamsFromSpringAPI();
  
  if (springResult.success) {
    return { 
      ...springResult, 
      source: 'spring-api',
      message: 'Data retrieved from Spring Boot API'
    };
  }

  console.warn('Spring API failed, falling back to Supabase:', springResult.error);

  // Fallback to Supabase direct access
  const supabaseResult = await getExamsFromSupabase();
  
  return {
    ...supabaseResult,
    source: 'supabase-direct',
    message: supabaseResult.success 
      ? 'Data retrieved from Supabase (fallback)' 
      : 'Both Spring API and Supabase failed'
  };
}

/**
 * Test Spring Boot API health
 */
export async function testSpringAPIHealth() {
  try {
    const response = await springApi.health();
    
    if (response.success && response.data) {
      return { 
        success: true, 
        error: null, 
        data: response.data,
        message: 'Spring Boot API is healthy'
      };
    } else {
      return { 
        success: false, 
        error: response.message || 'Health check failed', 
        data: null 
      };
    }
  } catch (error) {
    console.error('Error testing Spring API health:', error);
    
    if (error instanceof ApiError) {
      return { success: false, error: error.message, data: null };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown API error', 
      data: null 
    };
  }
}

/**
 * Compare data between Supabase and Spring API
 */
export async function compareDataSources() {
  try {
    const [supabaseResult, springResult] = await Promise.allSettled([
      getExamsFromSupabase(),
      getExamsFromSpringAPI()
    ]);

    return {
      supabase: supabaseResult.status === 'fulfilled' ? supabaseResult.value : null,
      springAPI: springResult.status === 'fulfilled' ? springResult.value : null,
      comparison: {
        supabaseWorking: supabaseResult.status === 'fulfilled' && supabaseResult.value.success,
        springAPIWorking: springResult.status === 'fulfilled' && springResult.value.success,
        dataConsistent: 
          supabaseResult.status === 'fulfilled' && 
          springResult.status === 'fulfilled' &&
          supabaseResult.value.success && 
          springResult.value.success &&
          supabaseResult.value.data?.length === springResult.value.data?.length
      }
    };
  } catch (error) {
    console.error('Error comparing data sources:', error);
    return {
      supabase: null,
      springAPI: null,
      comparison: {
        supabaseWorking: false,
        springAPIWorking: false,
        dataConsistent: false
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 