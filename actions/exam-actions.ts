"use server"

import { supabase } from "@/lib/supabase"
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { ExamFilters } from "@/types/exam"
import { mapExamData } from "@/utils/exam-mapper"

// Cache for database results to prevent excessive queries
const cache = {
  schools: null as string[] | null,
  degrees: new Map<string, string[]>(), // Map school key to degrees
  semesters: new Map<string, string[]>(),
  years: new Map<string, number[]>(),
  subjects: new Map<string, string[]>(),
  // Add exams cache with 2-minute TTL (shorter than metadata to refresh more often)
  exams: new Map<string, { data: any[], timestamp: number }>(),
  examsTTL: 2 * 60 * 1000, // 2 minutes in milliseconds
  // Reset cache after 5 minutes
  lastUpdated: Date.now(),
  TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
  
  // Generate a cache key for array of schools
  getSchoolsKey(schools: string[] | undefined): string {
    if (!schools || schools.length === 0) return 'all';
    return [...schools].sort().join(',');
  },
  
  // Generate a cache key for exam filters
  getExamsKey(filters: ExamFilters): string {
    const parts = [];
    
    if (filters.school) {
      const schools = Array.isArray(filters.school) ? [...filters.school].sort() : [filters.school];
      parts.push(`school=${schools.join(',')}`);
    }
    
    if (filters.degree) {
      const degrees = Array.isArray(filters.degree) ? [...filters.degree].sort() : [filters.degree];
      parts.push(`degree=${degrees.join(',')}`);
    }
    
    if (filters.year) {
      const years = Array.isArray(filters.year) ? [...filters.year].sort() : [filters.year];
      parts.push(`year=${years.join(',')}`);
    }
    
    if (filters.semester) {
      const semesters = Array.isArray(filters.semester) ? [...filters.semester].sort() : [filters.semester];
      parts.push(`semester=${semesters.join(',')}`);
    }
    
    if (filters.subject) {
      const subjects = Array.isArray(filters.subject) ? [...filters.subject].sort() : [filters.subject];
      parts.push(`subject=${subjects.join(',')}`);
    }
    
    if (filters.acronym) {
      parts.push(`acronym=${filters.acronym}`);
    }
    
    return parts.length ? parts.join('&') : 'all';
  },
  
  // Check if cache needs reset due to TTL
  checkExpiry() {
    const now = Date.now();
    if (now - this.lastUpdated > this.TTL) {
      this.resetCache();
    }
    
    // Also clear any expired exam cache entries
    for (const [key, entry] of this.exams.entries()) {
      if (now - entry.timestamp > this.examsTTL) {
        this.exams.delete(key);
      }
    }
  },
  
  // Reset the cache
  resetCache() {
    this.schools = null;
    this.degrees.clear();
    this.semesters.clear();
    this.years.clear();
    this.subjects.clear();
    this.exams.clear();
    this.lastUpdated = Date.now();
    console.log('Cache reset due to TTL expiry');
  }
};

export async function getExams(
  filters: ExamFilters = {},
  client: SupabaseClient<Database> = supabase
) {
  // Check cache expiry first
  cache.checkExpiry();
  
  // Validate and normalize filters
  const normalizedFilters: ExamFilters = {};
  
  if (filters && typeof filters === 'object') {
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // Filter out empty strings and null values
          const cleanedArray = value.filter(v => v !== null && v !== undefined && v !== '');
          if (cleanedArray.length > 0) {
            normalizedFilters[key] = cleanedArray;
          }
        } else if (typeof value === 'string' && value.trim() !== '') {
          normalizedFilters[key] = [value.trim()];
        }
      }
    });
  }
  
  console.log('🔧 [EXAM-ACTIONS] Normalized filters:', {
    original: filters,
    normalized: normalizedFilters
  });
  
  // Generate cache key for this query
  const cacheKey = cache.getExamsKey(normalizedFilters);
  
  // Check if we have cached results for this exact query
  if (cache.exams.has(cacheKey)) {
    console.log('Using cached exams for:', cacheKey);
    return cache.exams.get(cacheKey)?.data || [];
  }
  
  try {
    console.log('Fetching exams with filters:', filters);
    
    // Debug: Log detailed filter information
    console.log('🔍 [EXAM-ACTIONS DEBUG] Filter details:', {
      filtersType: typeof filters,
      filtersKeys: Object.keys(filters || {}),
      filtersValues: filters,
      schoolFilter: filters.school,
      schoolFilterType: typeof filters.school,
      schoolFilterIsArray: Array.isArray(filters.school)
    });
    
    const startTime = performance.now();
    
    // Only select needed columns for better network performance
    let query = client
      .from('ETSINF')
      .select('exam_instance_id, exam_date, exam_time, duration_minutes, code, subject, acronym, degree, year, semester, place, comment, school')
      .order('exam_date', { ascending: true });

    // Apply filters using a strategy that leverages indexes
    // Order filters from most selective to least selective for best index usage
    // Use normalized filters for actual querying
    
    // School filter (usually most selective at top level)
    if (normalizedFilters.school) {
      const schools = normalizedFilters.school;
      console.log('Filtering by schools:', schools);
      
      if (schools.length === 1) {
        query = query.eq('school', schools[0]);
      } else if (schools.length > 1) {
        query = query.in('school', schools);
      }
    }
    
    // Degree filter (second level in hierarchy)
    if (normalizedFilters.degree) {
      const degrees = normalizedFilters.degree;
      console.log('Filtering by degrees:', degrees);
      
      if (degrees.length === 1) {
        query = query.eq('degree', degrees[0]);
      } else if (degrees.length > 1) {
        query = query.in('degree', degrees);
      }
    }
    
    // Year filter (third level)
    if (normalizedFilters.year) {
      const years = normalizedFilters.year;
      console.log('Filtering by years:', years);
      
      if (years.length === 1) {
        query = query.eq('year', parseInt(years[0], 10)); // Ensure numeric comparison
      } else if (years.length > 1) {
        // Convert to integers for proper comparison
        const numericYears = years.map(y => parseInt(y, 10));
        query = query.in('year', numericYears);
      }
    }
    
    // Semester filter (fourth level)
    if (normalizedFilters.semester) {
      const semesters = normalizedFilters.semester;
      console.log('Filtering by semesters:', semesters);
      
      if (semesters.length === 1) {
        query = query.eq('semester', semesters[0]);
      } else if (semesters.length > 1) {
        query = query.in('semester', semesters);
      }
    }
    
    // Subject filter (most specific - using improved matching strategy)
    if (normalizedFilters.subject) {
      const subjects = normalizedFilters.subject;
      console.log('Filtering by subjects:', subjects);
      
      if (subjects.length === 1) {
        const subject = subjects[0];
        
        // Check if subject has an acronym in parentheses
        if (subject.includes('(') && subject.includes(')')) {
          // Extract the acronym from the parentheses
          const match = subject.match(/\(([^)]+)\)/);
          if (match && match[1]) {
            const acronym = match[1];
            // Use exact acronym matching for better precision
            query = query.eq('acronym', acronym);
            console.log(`Using exact acronym match for: "${acronym}"`);
          } else {
            // Fallback to subject name if acronym extraction fails
            const subjectName = subject.split('(')[0].trim();
            query = query.ilike('subject', `%${subjectName}%`);
            console.log(`Using subject name search: "%${subjectName}%"`);
          }
        } else {
          // No acronym present, use subject name
          query = query.ilike('subject', `%${subject}%`);
          console.log(`Using subject name search: "%${subject}%"`);
        }
      } else if (subjects.length > 1) {
        // For multiple subjects, use PostgREST's array syntax for OR conditions
        const acronyms = [];
        const subjectNames = [];
        
        for (const subject of subjects) {
          if (subject.includes('(') && subject.includes(')')) {
            // Extract acronym and use exact matching
            const match = subject.match(/\(([^)]+)\)/);
            if (match && match[1]) {
              const acronym = match[1];
              acronyms.push(acronym);
            } else {
              // Fallback to subject name
              const subjectName = subject.split('(')[0].trim();
              subjectNames.push(subjectName);
            }
          } else {
            // No acronym, use subject name
            subjectNames.push(subject);
          }
        }
        
        // Handle acronym-based filtering with .in() for better performance and reliability
        if (acronyms.length > 0 && subjectNames.length === 0) {
          // Only acronyms - use simple .in() operation
          query = query.in('acronym', acronyms);
          console.log(`Using IN operation for acronyms:`, acronyms);
        } else if (acronyms.length === 0 && subjectNames.length > 0) {
          // Only subject names - build OR conditions for ilike operations
          const conditions = subjectNames.map(name => `subject.ilike.%${name}%`);
          query = query.or(conditions.join(','));
          console.log(`Using OR conditions for subject names:`, conditions);
        } else if (acronyms.length > 0 && subjectNames.length > 0) {
          // Mixed - need to combine acronym exact matches with subject name searches
          const acronymConditions = acronyms.map(acronym => `acronym.eq.${encodeURIComponent(acronym)}`);
          const nameConditions = subjectNames.map(name => `subject.ilike.%${name}%`);
          const allConditions = [...acronymConditions, ...nameConditions];
          query = query.or(allConditions.join(','));
          console.log(`Using OR conditions for mixed subjects:`, allConditions);
        }
      }
    }
    
    // Acronym filter
    if (filters.acronym) {
      console.log('Filtering by acronym:', filters.acronym);
      query = query.ilike('acronym', `%${filters.acronym}%`);
    }

    // Add pagination to limit result size if needed
    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching exams:', error);
      throw error;
    }
    
    // Transform the data to match what frontend expects
    const transformedData = data.map(mapExamData);
    
    // Cache the results
    cache.exams.set(cacheKey, { 
      data: transformedData, 
      timestamp: Date.now() 
    });
    
    const duration = performance.now() - startTime;
    console.log(`Found ${data.length} exams matching filters in ${duration.toFixed(2)}ms`);
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching exams:', error);
    return [];
  }
}

/**
 * Get degrees from the database, optionally filtered by school(s)
 * @param schools - A single school name or array of school names to filter by
 */
export async function getDegrees(schools?: string | string[]) {
  // Check cache expiry
  cache.checkExpiry();
  
  // Normalize schools parameter
  const schoolArray = schools ? (Array.isArray(schools) ? schools : [schools]) : [];
  const cacheKey = cache.getSchoolsKey(schoolArray);
  
  // Check if we have cached results
  if (cache.degrees.has(cacheKey)) {
    console.log('Using cached degrees for:', cacheKey);
    return cache.degrees.get(cacheKey) || [];
  }
  
  try {
    console.log('Fetching degrees from Supabase for schools:', schools ? schoolArray : 'all');
    const startTime = performance.now();
    
    // Only select what we need
    let query = supabase
      .from('ETSINF')
      .select('degree')
      .order('degree', { ascending: true });

    // If schools are specified, filter degrees for those schools
    // This leverages the school index or school+degree composite index
    if (schools && schoolArray.length > 0) {
      if (schoolArray.length === 1) {
        query = query.eq('school', schoolArray[0]);
      } else if (schoolArray.length > 1) {
        query = query.in('school', schoolArray);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching degrees:', error);
      throw error;
    }

    // Extract unique degrees
    const degrees = [...new Set(data.map(row => row.degree))];
    
    // Cache the results
    cache.degrees.set(cacheKey, degrees);
    
    const duration = performance.now() - startTime;
    console.log(`Fetched ${degrees.length} degrees in ${duration.toFixed(2)}ms`);
    
    return degrees;
  } catch (error) {
    console.error('Error fetching degrees:', error);
    return [];
  }
}

export async function getSchools() {
  // Check cache expiry
  cache.checkExpiry();
  
  // Return cached results if available
  if (cache.schools) {
    console.log('Using cached schools');
    return cache.schools;
  }
  
  try {
    console.log('Fetching schools from Supabase...');
    const startTime = performance.now();
    
    // Use a more efficient query that leverages indexes
    // Only select distinct school column, which should use an index
    const { data, error } = await supabase
      .from('ETSINF')
      .select('school')
      .limit(100) // Safety limit, we don't expect more than this many schools
      .order('school', { ascending: true });

    if (error) {
      console.error('Supabase error fetching schools:', error);
      throw error;
    }

    // Extract unique school names
    const schools = [...new Set(data.map(row => row.school))];
    cache.schools = schools;
    
    const duration = performance.now() - startTime;
    console.log(`Fetched ${schools.length} schools in ${duration.toFixed(2)}ms`);
    
    return schools;
  } catch (error) {
    console.error('Error fetching schools:', error);
    return [];
  }
}

export const getTableNames = getSchools;

/**
 * Get semesters from the database, filtered by schools and degrees
 * @param schools - Schools to filter by
 * @param degrees - Degrees to filter by (optional)
 */
export async function getSemesters(
  schools?: string | string[],
  degrees?: string | string[]
): Promise<string[]> {
  // Check cache expiry
  cache.checkExpiry();
  
  // Normalize parameters
  const schoolArray = schools ? (Array.isArray(schools) ? schools : [schools]) : [];
  const degreeArray = degrees ? (Array.isArray(degrees) ? degrees : [degrees]) : [];
  
  // Generate a cache key
  const key = `${cache.getSchoolsKey(schoolArray)}_${degreeArray.sort().join(',')}`;
  
  // Check for cached results
  if (cache.semesters.has(key)) {
    console.log('Using cached semesters for:', key);
    return cache.semesters.get(key) || [];
  }
  
  try {
    console.log('Fetching semesters from Supabase with filters:', { schools: schoolArray, degrees: degreeArray });
    const startTime = performance.now();
    
    // Only select what we need
    let query = supabase
      .from('ETSINF')
      .select('semester');
    
    // Apply filters to leverage indexes - ordered from most selective to least
    // School filter (top level)
    if (schoolArray.length > 0) {
      if (schoolArray.length === 1) {
        query = query.eq('school', schoolArray[0]);
      } else {
        query = query.in('school', schoolArray);
      }
    }
    
    // Degree filter (second level)
    if (degreeArray.length > 0) {
      if (degreeArray.length === 1) {
        query = query.eq('degree', degreeArray[0]);
      } else {
        query = query.in('degree', degreeArray);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching semesters:', error);
      throw error;
    }
    
    // Extract unique semesters and sort them
    const semesters = [...new Set(data.map(row => row.semester))].sort();
    
    // Cache the results
    cache.semesters.set(key, semesters);
    
    const duration = performance.now() - startTime;
    console.log(`Fetched ${semesters.length} semesters in ${duration.toFixed(2)}ms`);
    
    return semesters;
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return [];
  }
}

/**
 * Get years from the database, filtered by schools, degrees, and semesters
 * @param schools - Schools to filter by
 * @param degrees - Degrees to filter by (optional)
 * @param semesters - Semesters to filter by (optional)
 */
export async function getYears(
  schools?: string | string[],
  degrees?: string | string[],
  semesters?: string | string[]
): Promise<number[]> {
  // Check cache expiry
  cache.checkExpiry();
  
  // Normalize parameters
  const schoolArray = schools ? (Array.isArray(schools) ? schools : [schools]) : [];
  const degreeArray = degrees ? (Array.isArray(degrees) ? degrees : [degrees]) : [];
  const semesterArray = semesters ? (Array.isArray(semesters) ? semesters : [semesters]) : [];
  
  // Generate a cache key
  const key = `${cache.getSchoolsKey(schoolArray)}_${degreeArray.sort().join(',')}_${semesterArray.sort().join(',')}`;
  
  // Check for cached results
  if (cache.years.has(key)) {
    console.log('Using cached years for:', key);
    return cache.years.get(key) || [];
  }
  
  try {
    console.log('Fetching years from Supabase with filters:', { 
      schools: schoolArray, 
      degrees: degreeArray,
      semesters: semesterArray 
    });
    const startTime = performance.now();
    
    // Only select what we need
    let query = supabase
      .from('ETSINF')
      .select('year');
    
    // Apply filters to leverage indexes - ordered from most selective to least
    // School filter (top level)
    if (schoolArray.length > 0) {
      if (schoolArray.length === 1) {
        query = query.eq('school', schoolArray[0]);
      } else {
        query = query.in('school', schoolArray);
      }
    }
    
    // Degree filter (second level)
    if (degreeArray.length > 0) {
      if (degreeArray.length === 1) {
        query = query.eq('degree', degreeArray[0]);
      } else {
        query = query.in('degree', degreeArray);
      }
    }
    
    // Semester filter (third level)
    if (semesterArray.length > 0) {
      if (semesterArray.length === 1) {
        query = query.eq('semester', semesterArray[0]);
      } else {
        query = query.in('semester', semesterArray);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching years:', error);
      throw error;
    }
    
    // Extract unique years, sort them numerically
    const years = [...new Set(data.map(row => row.year))].sort((a, b) => a - b);
    
    // Cache the results
    cache.years.set(key, years);
    
    const duration = performance.now() - startTime;
    console.log(`Fetched ${years.length} years in ${duration.toFixed(2)}ms`);
    
    return years;
  } catch (error) {
    console.error('Error fetching years:', error);
    return [];
  }
}

/**
 * Get subjects from the database, filtered by schools, degrees, semesters, and years
 * @param schools - Schools to filter by
 * @param degrees - Degrees to filter by (optional)
 * @param semesters - Semesters to filter by (optional)
 * @param years - Years to filter by (optional)
 */
export async function getSubjects(
  schools?: string | string[],
  degrees?: string | string[],
  semesters?: string | string[],
  years?: string | string[]
): Promise<string[]> {
  // Check cache expiry
  cache.checkExpiry();
  
  // Normalize parameters
  const schoolArray = schools ? (Array.isArray(schools) ? schools : [schools]) : [];
  const degreeArray = degrees ? (Array.isArray(degrees) ? degrees : [degrees]) : [];
  const semesterArray = semesters ? (Array.isArray(semesters) ? semesters : [semesters]) : [];
  const yearArray = years ? (Array.isArray(years) ? years : [years]) : [];
  
  // Generate a cache key
  const key = `${cache.getSchoolsKey(schoolArray)}_${degreeArray.sort().join(',')}_${semesterArray.sort().join(',')}_${yearArray.sort().join(',')}`;
  
  // Check for cached results
  if (cache.subjects.has(key)) {
    console.log('Using cached subjects for:', key);
    return cache.subjects.get(key) || [];
  }
  
  try {
    console.log('Fetching subjects from Supabase with filters:', { 
      schools: schoolArray, 
      degrees: degreeArray,
      semesters: semesterArray,
      years: yearArray
    });
    const startTime = performance.now();
    
    // Select only the columns we need
    let query = supabase
      .from('ETSINF')
      .select('subject, acronym')
      .order('subject', { ascending: true });
    
    // Apply filters to leverage indexes - ordered from most selective to least
    // School filter (top level)
    if (schoolArray.length > 0) {
      if (schoolArray.length === 1) {
        query = query.eq('school', schoolArray[0]);
      } else {
        query = query.in('school', schoolArray);
      }
    }
    
    // Degree filter (second level)
    if (degreeArray.length > 0) {
      if (degreeArray.length === 1) {
        query = query.eq('degree', degreeArray[0]);
      } else {
        query = query.in('degree', degreeArray);
      }
    }
    
    // Year filter (third level)
    if (yearArray.length > 0) {
      if (yearArray.length === 1) {
        query = query.eq('year', parseInt(yearArray[0], 10)); // Ensure numeric comparison
      } else {
        // Convert to integers for proper comparison
        const numericYears = yearArray.map(y => parseInt(y, 10));
        query = query.in('year', numericYears);
      }
    }
    
    // Semester filter (fourth level)
    if (semesterArray.length > 0) {
      if (semesterArray.length === 1) {
        query = query.eq('semester', semesterArray[0]);
      } else {
        query = query.in('semester', semesterArray);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
    
    // Format subjects with acronym if available
    const subjects = data.map(row => {
      if (row.acronym) {
        return `${row.subject} (${row.acronym})`;
      }
      return row.subject;
    });
    
    // Remove duplicates and sort
    const uniqueSubjects = [...new Set(subjects)].sort();
    
    // Cache the results
    cache.subjects.set(key, uniqueSubjects);
    
    const duration = performance.now() - startTime;
    console.log(`Fetched ${uniqueSubjects.length} subjects in ${duration.toFixed(2)}ms`);
    
    return uniqueSubjects;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}

/**
 * Direct debug function to check what data exists in the database for the selected filters
 * This is a temporary function for debugging purposes
 */
export async function debugCheckDataExists(
  schools: string[], 
  degrees: string[], 
  semesters: string[], 
  years: string[]
) {
  try {
    console.log('DEBUG - Direct database check for:', {
      schools, 
      degrees, 
      semesters, 
      years
    });
    
    // Convert years to numbers if they are numeric strings
    const yearValues = years.map(y => isNaN(Number(y)) ? y : Number(y));
    
    let query = supabase
      .from('ETSINF')
      .select('subject, acronym, school, degree, semester, year')
      .limit(5);
    
    // Apply filters
    if (schools.length > 0) {
      if (schools.length === 1) {
        query = query.eq('school', schools[0]);
      } else {
        query = query.in('school', schools);
      }
    }
    
    if (degrees.length > 0) {
      if (degrees.length === 1) {
        query = query.eq('degree', degrees[0]);
      } else {
        query = query.in('degree', degrees);
      }
    }
    
    if (semesters.length > 0) {
      if (semesters.length === 1) {
        query = query.eq('semester', semesters[0]);
      } else {
        query = query.in('semester', semesters);
      }
    }
    
    if (years.length > 0) {
      if (years.length === 1) {
        query = query.eq('year', yearValues[0]);
      } else {
        query = query.in('year', yearValues);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error in debug check:', error);
      return { error: error.message, data: null };
    }
    
    console.log('DEBUG - Direct database check results:', {
      count: data?.length || 0,
      sample: data
    });
    
    return { 
      error: null, 
      data: {
        count: data?.length || 0,
        sample: data
      }
    };
  } catch (error) {
    console.error('Error in debug check:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error', 
      data: null 
    };
  }
} 