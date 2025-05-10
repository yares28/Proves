"use server"

import { supabase } from "@/lib/supabase"
import type { ExamFilters } from "@/types/exam"

// Cache for database results to prevent excessive queries
const cache = {
  schools: null as string[] | null,
  degrees: new Map<string, string[]>(), // Map school key to degrees
  semesters: new Map<string, string[]>(),
  years: new Map<string, number[]>(),
  subjects: new Map<string, string[]>(),
  // Reset cache after 5 minutes
  lastUpdated: Date.now(),
  TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
  
  // Generate a cache key for array of schools
  getSchoolsKey(schools: string[] | undefined): string {
    if (!schools || schools.length === 0) return 'all';
    return [...schools].sort().join(',');
  },
  
  // Check if cache needs reset due to TTL
  checkExpiry() {
    const now = Date.now();
    if (now - this.lastUpdated > this.TTL) {
      this.resetCache();
    }
  },
  
  // Reset the cache
  resetCache() {
    this.schools = null;
    this.degrees.clear();
    this.semesters.clear();
    this.years.clear();
    this.subjects.clear();
    this.lastUpdated = Date.now();
    console.log('Cache reset due to TTL expiry');
  }
};

export async function getExams(filters: ExamFilters = {}) {
  try {
    console.log('Fetching exams with filters:', filters)
    
    let query = supabase
      .from('ETSINF')
      .select('*')
      .order('date', { ascending: true })

    // Apply filters if they exist
    if (filters.school) {
      // Handle both string and array formats for backward compatibility
      const schools = Array.isArray(filters.school) ? filters.school : [filters.school];
      
      if (schools.length === 1) {
        query = query.eq('school', schools[0]);
      } else if (schools.length > 1) {
        query = query.in('school', schools);
      }
    }
    
    if (filters.degree) {
      // Handle both string and array formats for backward compatibility
      const degrees = Array.isArray(filters.degree) ? filters.degree : [filters.degree];
      
      if (degrees.length === 1) {
        query = query.eq('degree', degrees[0]);
      } else if (degrees.length > 1) {
        query = query.in('degree', degrees);
      }
    }
    
    if (filters.year) {
      query = query.eq('year', filters.year)
    }
    
    if (filters.semester) {
      query = query.eq('semester', filters.semester)
    }
    
    if (filters.subject) {
      // For subject, we need to check both subject and acronym fields
      // since the subject may be in "Subject (ACRONYM)" format
      if (filters.subject.includes('(') && filters.subject.includes(')')) {
        // Extract acronym from "Subject (ACRONYM)" format
        const acronymMatch = filters.subject.match(/\(([^)]+)\)/)
        if (acronymMatch && acronymMatch[1]) {
          const acronym = acronymMatch[1]
          query = query.eq('acronym', acronym)
        }
      } else {
        // Simple subject name search
        query = query.ilike('subject', `%${filters.subject}%`)
      }
    }
    
    if (filters.searchQuery) {
      // Search across multiple fields with OR condition
      query = query.or(
        `subject.ilike.%${filters.searchQuery}%,` +
        `code.ilike.%${filters.searchQuery}%,` +
        `acronym.ilike.%${filters.searchQuery}%,` +
        `location.ilike.%${filters.searchQuery}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error fetching exams:', error)
      throw error
    }
    
    console.log(`Found ${data.length} exams matching filters`)
    return data
  } catch (error) {
    console.error('Error fetching exams:', error)
    return []
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
    
    let query = supabase
      .from('ETSINF')
      .select('degree')
      .order('degree', { ascending: true })

    // If schools are specified, filter degrees for those schools
    if (schools && schoolArray.length > 0) {
      if (schoolArray.length === 1) {
        query = query.eq('school', schoolArray[0]);
      } else if (schoolArray.length > 1) {
        query = query.in('school', schoolArray);
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error fetching degrees:', error)
      throw error
    }

    const degrees = [...new Set(data.map(row => row.degree))];
    
    // Cache the results
    cache.degrees.set(cacheKey, degrees);
    
    return degrees
  } catch (error) {
    console.error('Error fetching degrees:', error)
    return []
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
    console.log('Fetching schools from Supabase...')
    const { data, error } = await supabase
      .from('ETSINF')
      .select('school')
      .order('school', { ascending: true })
      .limit(1000) // Add a reasonable limit

    if (error) {
      console.error('Supabase error fetching schools:', error)
      throw error
    }

    const schools = [...new Set(data.map(row => row.school))]
      .filter(school => school && school.trim() !== '') // Filter out empty values
    
    // Cache the results
    cache.schools = schools;
    
    return schools
  } catch (error) {
    console.error('Error fetching schools:', error)
    return []
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
  
  // Normalize schools parameter
  const schoolArray = schools ? (Array.isArray(schools) ? schools : [schools]) : [];
  const degreeArray = degrees ? (Array.isArray(degrees) ? degrees : [degrees]) : [];
  
  // Generate a composite cache key
  const schoolsKey = cache.getSchoolsKey(schoolArray);
  const degreesKey = degreeArray.length > 0 ? degreeArray.sort().join(',') : 'all';
  const cacheKey = `${schoolsKey}-${degreesKey}`;
  
  // Check if we have cached results
  if (cache.semesters.has(cacheKey)) {
    console.log('Using cached semesters for:', cacheKey);
    return cache.semesters.get(cacheKey) || [];
  }
  
  try {
    console.log('Fetching semesters with filters:', { schools: schoolArray, degrees: degreeArray });
    let query = supabase
      .from('ETSINF')
      .select('semester')
      .order('semester', { ascending: true });

    // Apply filters if they exist
    // First filter by schools
    if (schools && schoolArray.length > 0) {
      if (schoolArray.length === 1) {
        query = query.eq('school', schoolArray[0]);
      } else if (schoolArray.length > 1) {
        query = query.in('school', schoolArray);
      }
    }
    
    // Then filter by degrees
    if (degrees && degreeArray.length > 0) {
      if (degreeArray.length === 1) {
        query = query.eq('degree', degreeArray[0]);
      } else if (degreeArray.length > 1) {
        query = query.in('degree', degreeArray);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching semesters:', error);
      throw error;
    }

    const semesters = [...new Set(data.map(row => row.semester))];
    
    // Cache the results
    cache.semesters.set(cacheKey, semesters);
    
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
  
  // Generate a composite cache key
  const schoolsKey = cache.getSchoolsKey(schoolArray);
  const degreesKey = degreeArray.length > 0 ? degreeArray.sort().join(',') : 'all';
  const semestersKey = semesterArray.length > 0 ? semesterArray.sort().join(',') : 'all';
  const cacheKey = `${schoolsKey}-${degreesKey}-${semestersKey}`;
  
  // Check if we have cached results
  if (cache.years.has(cacheKey)) {
    console.log('Using cached years for:', cacheKey);
    return cache.years.get(cacheKey) || [];
  }
  
  try {
    console.log('Fetching years with filters:', { 
      schools: schoolArray, 
      degrees: degreeArray,
      semesters: semesterArray 
    });
    
    let query = supabase
      .from('ETSINF')
      .select('year')
      .order('year', { ascending: true });

    // Apply filters if they exist
    // First filter by schools
    if (schools && schoolArray.length > 0) {
      if (schoolArray.length === 1) {
        query = query.eq('school', schoolArray[0]);
      } else if (schoolArray.length > 1) {
        query = query.in('school', schoolArray);
      }
    }
    
    // Then filter by degrees
    if (degrees && degreeArray.length > 0) {
      if (degreeArray.length === 1) {
        query = query.eq('degree', degreeArray[0]);
      } else if (degreeArray.length > 1) {
        query = query.in('degree', degreeArray);
      }
    }
    
    // Then filter by semesters
    if (semesters && semesterArray.length > 0) {
      if (semesterArray.length === 1) {
        query = query.eq('semester', semesterArray[0]);
      } else if (semesterArray.length > 1) {
        query = query.in('semester', semesterArray);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching years:', error);
      throw error;
    }

    const years = [...new Set(data.map(row => row.year))];
    
    // Cache the results
    cache.years.set(cacheKey, years);
    
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
  
  // ADDED: Debug logging for input parameters
  console.log('DEBUG getSubjects - Raw input:', { schools, degrees, semesters, years });
  console.log('DEBUG getSubjects - Normalized arrays:', { 
    schoolArray, 
    degreeArray,
    semesterArray,
    yearArray
  });
  
  // Generate a composite cache key
  const schoolsKey = cache.getSchoolsKey(schoolArray);
  const degreesKey = degreeArray.length > 0 ? degreeArray.sort().join(',') : 'all';
  const semestersKey = semesterArray.length > 0 ? semesterArray.sort().join(',') : 'all';
  const yearsKey = yearArray.length > 0 ? yearArray.sort().join(',') : 'all';
  const cacheKey = `${schoolsKey}-${degreesKey}-${semestersKey}-${yearsKey}`;
  
  // Check if we have cached results
  if (cache.subjects.has(cacheKey)) {
    console.log('Using cached subjects for:', cacheKey);
    return cache.subjects.get(cacheKey) || [];
  }
  
  try {
    console.log('Fetching subjects with filters:', { 
      schools: schoolArray, 
      degrees: degreeArray,
      semesters: semesterArray,
      years: yearArray
    });
    
    let query = supabase
      .from('ETSINF')
      .select('subject, acronym')
      .order('subject', { ascending: true });

    // Apply filters if they exist
    // First filter by schools
    if (schools && schoolArray.length > 0) {
      if (schoolArray.length === 1) {
        query = query.eq('school', schoolArray[0]);
      } else if (schoolArray.length > 1) {
        query = query.in('school', schoolArray);
      }
    }
    
    // Then filter by degrees
    if (degrees && degreeArray.length > 0) {
      if (degreeArray.length === 1) {
        query = query.eq('degree', degreeArray[0]);
      } else if (degreeArray.length > 1) {
        query = query.in('degree', degreeArray);
      }
    }
    
    // Then filter by semesters
    if (semesters && semesterArray.length > 0) {
      if (semesterArray.length === 1) {
        query = query.eq('semester', semesterArray[0]);
      } else if (semesterArray.length > 1) {
        query = query.in('semester', semesterArray);
      }
    }
    
    // Then filter by years
    if (years && yearArray.length > 0) {
      if (yearArray.length === 1) {
        // ADDED: Type conversion check for year values
        const yearValue = isNaN(Number(yearArray[0])) ? yearArray[0] : Number(yearArray[0]);
        console.log('DEBUG - Using year value:', yearValue, 'Original:', yearArray[0]);
        query = query.eq('year', yearValue);
      } else if (yearArray.length > 1) {
        // ADDED: Convert string years to numbers if they are numeric strings
        const convertedYears = yearArray.map(y => isNaN(Number(y)) ? y : Number(y));
        console.log('DEBUG - Using year values:', convertedYears, 'Original:', yearArray);
        query = query.in('year', convertedYears);
      }
    }

    // ADDED: Log query information without using toSQL
    console.log('DEBUG - Query filters:', { 
      schools: schoolArray,
      degrees: degreeArray,
      semesters: semesterArray,
      years: yearArray.map(y => isNaN(Number(y)) ? y : Number(y))
    });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching subjects:', error);
      throw error;
    }
    
    // ADDED: Log the raw data returned from the database
    console.log(`DEBUG - Raw data from DB (${data?.length || 0} records):`, data?.slice(0, 3));
    
    // Create formatted subject strings with acronyms in parentheses
    const subjectEntries = data.map(row => ({
      value: `${row.subject} (${row.acronym})`,
      subject: row.subject,
      acronym: row.acronym
    }));
    
    // Remove duplicates by checking both subject and acronym
    const uniqueSubjects = Array.from(
      new Map(subjectEntries.map(item => [`${item.subject}-${item.acronym}`, item])).values()
    ).map(item => item.value);
    
    // ADDED: Log the final result
    console.log(`DEBUG - Final uniqueSubjects (${uniqueSubjects.length}):`, uniqueSubjects.slice(0, 3));
    
    // Cache the results
    cache.subjects.set(cacheKey, uniqueSubjects);
    
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
