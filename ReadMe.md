This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where comments have been removed, empty lines have been removed, line numbers have been added, content has been formatted for parsing in markdown style, content has been compressed (code blocks are separated by ⋮---- delimiter), security check has been disabled.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Empty lines have been removed from all files
- Line numbers have been added to the beginning of each line
- Content has been formatted for parsing in markdown style
- Content has been compressed - code blocks are separated by ⋮---- delimiter
- Security check has been disabled - content may contain sensitive information
- Files are sorted by Git change count (files with more changes are at the bottom)

## Additional Info

# Directory Structure
```
actions/
  auth-test.ts
  exam-actions-new.ts
  exam-actions.ts
  exam-actions.ts.orig
  table-check.ts
  user-calendars.ts
app/
  api/
    calendars/
      [id]/
        delete/
          route.ts
  auth-test/
    page.tsx
  debug/
    page.tsx
  exams/
    page.tsx
  my-calendars/
    layout.tsx
    page.tsx
    test-page.tsx
  saved-calendars/
    layout.tsx
    page.tsx
  test-auth/
    page.tsx
  globals.css
  layout.tsx
  page.tsx
  test.tsx
backend/
  src/
    main/
      java/
        com/
          upv/
            examcalendar/
              model/
                Exam.java
              repository/
                ExamRepository.java
              ExamCalendarApplication.java
      resources/
        application.properties
  pom.xml
components/
  auth/
    auth-dialog.tsx
    login-form.tsx
    register-form.tsx
    user-button.tsx
  ui/
    accordion.tsx
    alert-dialog.tsx
    alert.tsx
    aspect-ratio.tsx
    avatar.tsx
    badge.tsx
    breadcrumb.tsx
    button.tsx
    calendar.tsx
    card.tsx
    carousel.tsx
    chart.tsx
    checkbox.tsx
    collapsible.tsx
    command.tsx
    context-menu.tsx
    dialog.tsx
    drawer.tsx
    dropdown-menu.tsx
    error-state.tsx
    form.tsx
    hover-card.tsx
    input-otp.tsx
    input.tsx
    label.tsx
    loading-state.tsx
    menubar.tsx
    navigation-menu.tsx
    pagination.tsx
    popover.tsx
    progress.tsx
    radio-group.tsx
    resizable.tsx
    scroll-area.tsx
    select.tsx
    separator.tsx
    sheet.tsx
    sidebar.tsx
    skeleton.tsx
    slider.tsx
    sonner.tsx
    switch.tsx
    table.tsx
    tabs.tsx
    textarea.tsx
    toast.tsx
    toaster.tsx
    toggle-group.tsx
    toggle.tsx
    tooltip.tsx
    use-mobile.tsx
    use-toast.ts
  auth-debug.tsx
  auth-debugger.tsx
  calendar-display.tsx
  exam-list-view.tsx
  feature-showcase.tsx
  filter-connection.tsx
  filter-sidebar.tsx
  find-exam-card.tsx
  footer.tsx
  header.tsx
  hero-section.tsx
  icons.tsx
  save-calendar-dialog.tsx
  statistics-section.tsx
  testimonials.tsx
  theme-provider.tsx
  theme-toggle.tsx
  view-toggle.tsx
context/
  auth-context.tsx
docs/
  performance-optimizations.md
hooks/
  use-mobile.tsx
  use-toast.ts
lib/
  auth/
    index.ts
    token-manager.ts
  hooks/
    use-filter-data.ts
  supabase/
    client.ts
    server.ts
  supabase.ts
  utils.ts
public/
  placeholder-logo.svg
  placeholder.svg
styles/
  globals.css
  tooltip.module.css
types/
  database.types.ts
  exam.ts
utils/
  supabase/
    client.ts
    middleware.ts
    server.ts
  auth-helpers.ts
  date-utils.ts
  exam-mapper.ts
.gitignore
APIdocs.md
components.json
middleware.ts
next.config.mjs
package.json
page.tsx
postcss.config.mjs
start-services.bat
tailwind.config.ts
tsconfig.json
```

# Files

## File: actions/auth-test.ts
````typescript
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
export async function testServerAuth(authToken?: string)
````

## File: actions/exam-actions-new.ts
````typescript
import { supabase } from "@/lib/supabase"
import type { ExamFilters } from "@/types/exam"
export async function getExams(filters: ExamFilters =
export async function getDegrees(school?: string)
export async function getTableNames()
export async function getSemesters(school?: string)
export async function getYears(school?: string)
export async function getSubjects(school?: string)
````

## File: actions/exam-actions.ts
````typescript
import { supabase } from "@/lib/supabase"
import type { ExamFilters } from "@/types/exam"
import { mapExamData } from "@/utils/exam-mapper"
⋮----
getSchoolsKey(schools: string[] | undefined): string
getExamsKey(filters: ExamFilters): string
checkExpiry()
resetCache()
⋮----
export async function getExams(filters: ExamFilters =
export async function getDegrees(schools?: string | string[])
export async function getSchools()
⋮----
export async function getSemesters(
  schools?: string | string[],
  degrees?: string | string[]
): Promise<string[]>
export async function getYears(
  schools?: string | string[],
  degrees?: string | string[],
  semesters?: string | string[]
): Promise<number[]>
export async function getSubjects(
  schools?: string | string[],
  degrees?: string | string[],
  semesters?: string | string[],
  years?: string | string[]
): Promise<string[]>
export async function debugCheckDataExists(
  schools: string[],
  degrees: string[],
  semesters: string[],
  years: string[]
)
````

## File: actions/exam-actions.ts.orig
````
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
      console.log('Filtering by schools:', schools);
      
      if (schools.length === 1) {
        query = query.eq('school', schools[0]);
      } else if (schools.length > 1) {
        query = query.in('school', schools);
      }
    }
    
    if (filters.degree) {
      // Handle both string and array formats for backward compatibility
      const degrees = Array.isArray(filters.degree) ? filters.degree : [filters.degree];
      console.log('Filtering by degrees:', degrees);
      
      if (degrees.length === 1) {
        query = query.eq('degree', degrees[0]);
      } else if (degrees.length > 1) {
        query = query.in('degree', degrees);
      }
    }
    
    if (filters.year) {
      // Handle both string and array formats
      const years = Array.isArray(filters.year) ? filters.year : [filters.year];
      console.log('Filtering by years:', years);
      
      if (years.length === 1) {
        query = query.eq('year', years[0]);
      } else if (years.length > 1) {
        query = query.in('year', years);
      }
    }
    
    if (filters.semester) {
      // Handle both string and array formats
      const semesters = Array.isArray(filters.semester) ? filters.semester : [filters.semester];
      console.log('Filtering by semesters:', semesters);
      
      if (semesters.length === 1) {
        query = query.eq('semester', semesters[0]);
      } else if (semesters.length > 1) {
        query = query.in('semester', semesters);
      }
    }
    
    if (filters.subject) {
      // Handle both string and array formats
      const subjects = Array.isArray(filters.subject) ? filters.subject : [filters.subject];
      console.log('Filtering by subjects:', subjects);
      
      // For multiple subjects, we need to use OR conditions
      if (subjects.length === 1) {
        // Single subject handling
        const subject = subjects[0];
        // For subject, we need to check both subject and acronym fields
        // since the subject may be in "Subject (ACRONYM)" format
        if (subject.includes('(') && subject.includes(')')) {
          // Extract acronym and subject name from "Subject (ACRONYM)" format
          const subjectName = subject.split('(')[0].trim();
          const acronymMatch = subject.match(/\(([^)]+)\)/);
          if (acronymMatch && acronymMatch[1]) {
            const acronym = acronymMatch[1];
            // Use OR to match either the subject name or the acronym
            query = query.or(`subject.eq.${subjectName},acronym.eq.${acronym}`);
          } else {
            // If no acronym could be extracted, fall back to subject search
            query = query.ilike('subject', `%${subjectName}%`);
          }
        } else {
          // Simple subject name search
          query = query.ilike('subject', `%${subject}%`);
        }
      } else if (subjects.length > 1) {
        // Multiple subjects - create OR filter
        const orConditions = subjects.map(subject => {
          if (subject.includes('(') && subject.includes(')')) {
            // Extract acronym and subject name
            const subjectName = subject.split('(')[0].trim();
            const acronymMatch = subject.match(/\(([^)]+)\)/);
            if (acronymMatch && acronymMatch[1]) {
              const acronym = acronymMatch[1];
              // Return both conditions to match either subject or acronym
              return `subject.eq.${subjectName},acronym.eq.${acronym}`;
            }
          }
          return `subject.ilike.%${subject}%`;
        }).join(',');
        
        query = query.or(orConditions);
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

    // Add dummy data for testing if no exams exist
    const { data, error } = await query

    if (error) {
      console.error('Supabase error fetching exams:', error)
      throw error
    }
    
    console.log(`Found ${data.length} exams matching filters`)
    
    // If no data is returned, create some dummy exam data for testing
    // Always generate dummy data if no real exams found
    if (data.length === 0) {
      console.log('No exams found, creating dummy data for testing')
      
      // Get the current date and month numbers
      const today = new Date()
      
      // Create dummy exams for the next 30 days
      const dummyExams = []
      
      for (let i = 0; i < 5; i++) {
        // Calculate a date in the future for the exam (5, 10, 15, 20, 25 days from now)
        const examDate = new Date(today)
        examDate.setDate(today.getDate() + ((i + 1) * 5))
        
        // Format as YYYY-MM-DD
        const year = examDate.getFullYear()
        const month = String(examDate.getMonth() + 1).padStart(2, '0')
        const day = String(examDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        // Create a dummy exam
        dummyExams.push({
          id: `dummy-${i}`,
          subject: `Sample Subject ${i + 1}`,
          acronym: `SS${i + 1}`,
          code: `CS${100 + i}`,
          date: dateStr,
          time: '10:00',
          location: 'Main Campus, Room 101',
          school: filters.school && Array.isArray(filters.school) && filters.school.length > 0 ? 
            filters.school[0] : 'ETSINF',
          degree: filters.degree && Array.isArray(filters.degree) && filters.degree.length > 0 ? 
            filters.degree[0] : 'GIINF',
          semester: filters.semester && Array.isArray(filters.semester) && filters.semester.length > 0 ? 
            filters.semester[0] : 'A',
          year: filters.year && Array.isArray(filters.year) && filters.year.length > 0 ? 
            filters.year[0] : '1'
        })
      }
      
      console.log(`Created ${dummyExams.length} dummy exams:`, dummyExams)
      return dummyExams
    }
    
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
````

## File: actions/table-check.ts
````typescript
import { supabase } from "@/lib/supabase"
export async function checkTableStructure()
export async function runDirectQuery()
````

## File: actions/user-calendars.ts
````typescript
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'
import { cookies } from 'next/headers'
type CalendarFilters = Record<string, string[]>
interface SaveCalendarParams {
  name: string
  filters: CalendarFilters
  userId: string
  accessToken?: string
  refreshToken?: string
}
export async function saveUserCalendar(
export async function getUserCalendars(userId: string)
export async function getUserCalendarNames(userId: string)
export async function deleteUserCalendar(calendarId: string, userId: string)
````

## File: app/api/calendars/[id]/delete/route.ts
````typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteUserCalendar } from "@/actions/user-calendars";
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
)
````

## File: app/auth-test/page.tsx
````typescript
import { useState } from "react"
import { AuthDebugger } from "@/components/auth-debugger"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { saveUserCalendar } from "@/actions/user-calendars"
import { extractTokensFromStorage } from "@/lib/auth/token-manager"
⋮----
const runSaveTest = async () =>
````

## File: app/debug/page.tsx
````typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkTableStructure, runDirectQuery } from "@/actions/table-check";
⋮----
const checkTable = async () =>
const runQuery = async () =>
````

## File: app/exams/page.tsx
````typescript
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import type { ExamFilters } from "@/types/exam"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, School, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getExams } from "@/actions/exam-actions"
export default async function ExamsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
})
⋮----
<Badge variant="outline">{exam.code}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>
````

## File: app/my-calendars/layout.tsx
````typescript
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
export default function MyCalendarsLayout({
  children,
}: {
  children: React.ReactNode
})
````

## File: app/my-calendars/page.tsx
````typescript
import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getUserCalendars } from "@/actions/user-calendars"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Trash2, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
⋮----
async function fetchCalendars()
⋮----
function handleViewCalendar(id: string, filters: any)
````

## File: app/my-calendars/test-page.tsx
````typescript
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
export default function TestPage()
````

## File: app/saved-calendars/layout.tsx
````typescript
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"
export default function SavedCalendarsLayout({
  children,
}: {
  children: React.ReactNode
})
````

## File: app/saved-calendars/page.tsx
````typescript
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Eye, Trash2, Clock, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getUserCalendars, deleteUserCalendar } from "@/actions/user-calendars"
import { useAuth } from "@/context/auth-context"
import { getExams } from "@/actions/exam-actions"
import { formatDateString, getAcademicYearForMonth, getCurrentYear } from "@/utils/date-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
⋮----
interface Window {
    _didLogExamDate?: boolean;
  }
⋮----
async function fetchExamsDirectly(filters: any)
⋮----
// If no subject filters, return all the results mapped to the expected format
⋮----
// Generate array of months from September to August (academic year)
⋮----
async function fetchCalendars()
⋮----
async function handleViewCalendar(calendar: any)
⋮----
// If already selected, deselect it
⋮----
// Set as selected
⋮----
// Log the calendar object to inspect its filters
⋮----
// Don't fetch again if we already have the data
⋮----
async function handleDeleteCalendar(id: string)
function monthHasExams(monthName: string, exams: any[])
function getMonthIndex(monthName: string)
function getExamsForDay(year: number, month: number, day: number, exams: any[])
function generateCalendarDays(monthName: string, exams: any[])
````

## File: app/test-auth/page.tsx
````typescript
import { useAuth } from "@/context/auth-context"
import { useState } from "react"
import { testServerAuth } from "@/actions/auth-test"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthDebugger } from "@/components/auth-debug"
export default function TestAuthPage()
⋮----
const runAuthTest = async () =>
````

## File: app/globals.css
````css
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
⋮----
:root {
.dark {
⋮----
* {
⋮----
@apply border-border;
⋮----
body {
h1,
⋮----
@apply tracking-tight;
⋮----
.glass-card {
.dark .glass-card {
.shimmer {
.dark .shimmer {
````

## File: app/layout.tsx
````typescript
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/context/auth-context'
import { Toaster } from "@/components/ui/toaster"
⋮----
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>)
````

## File: app/page.tsx
````typescript
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CalendarDisplay } from "@/components/calendar-display"
import { FilterSidebar } from "@/components/filter-sidebar"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ThemeProvider } from "@/components/theme-provider"
import { FilterConnection } from "@/components/filter-connection"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
⋮----
xmlns="http://www.w3.org/2000/svg"
````

## File: app/test.tsx
````typescript

````

## File: backend/src/main/java/com/upv/examcalendar/model/Exam.java
````java
public class Exam {
````

## File: backend/src/main/java/com/upv/examcalendar/repository/ExamRepository.java
````java
public interface ExamRepository extends JpaRepository<Exam, Long> {
⋮----
List<String> findAllTableNames();
````

## File: backend/src/main/java/com/upv/examcalendar/ExamCalendarApplication.java
````java
public class ExamCalendarApplication {
public static void main(String[] args) {
SpringApplication.run(ExamCalendarApplication.class, args);
````

## File: backend/src/main/resources/application.properties
````
# Server Configuration
server.port=8080

# Database Configuration
spring.datasource.url=${SUPABASE_DB_URL}
spring.datasource.username=${SUPABASE_DB_USER}
spring.datasource.password=${SUPABASE_DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Logging Configuration
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
````

## File: backend/pom.xml
````xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    <groupId>com.upv</groupId>
    <artifactId>exam-calendar</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>exam-calendar</name>
    <description>UPV Exam Calendar Backend</description>
    <properties>
        <java.version>17</java.version>
        <start-class>com.upv.examcalendar.ExamCalendarApplication</start-class>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>jakarta.persistence</groupId>
            <artifactId>jakarta.persistence-api</artifactId>
            <version>3.1.0</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <mainClass>${start-class}</mainClass>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
````

## File: components/auth/auth-dialog.tsx
````typescript
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
````

## File: components/auth/login-form.tsx
````typescript
import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
⋮----
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@supabase/supabase-js"
⋮----
type FormValues = z.infer<typeof formSchema>
interface LoginFormProps {
  onSuccess: () => void
}
⋮----
const onSubmit = async (data: FormValues) =>
⋮----
// If rememberMe is selected, set a longer session in localStorage
⋮----
// Get the actual session
⋮----
// Store the actual session object
⋮----
const handleProviderSignIn = async (provider: "google" | "github" | "facebook") =>
⋮----
<form onSubmit=
````

## File: components/auth/register-form.tsx
````typescript
import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
⋮----
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
⋮----
type FormValues = z.infer<typeof formSchema>
interface RegisterFormProps {
  onSuccess: () => void
}
⋮----
const onSubmit = async (data: FormValues) =>
⋮----
<form onSubmit=
````

## File: components/auth/user-button.tsx
````typescript
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { AuthDialog } from "@/components/auth/auth-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Calendar, Loader2 } from "lucide-react"
````

## File: components/ui/accordion.tsx
````typescript
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/alert-dialog.tsx
````typescript
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
````

## File: components/ui/alert.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/aspect-ratio.tsx
````typescript

````

## File: components/ui/avatar.tsx
````typescript
import { cn } from "@/lib/utils"
````

## File: components/ui/badge.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
⋮----
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}
⋮----
<div className=
````

## File: components/ui/breadcrumb.tsx
````typescript
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/button.tsx
````typescript
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
⋮----
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
````

## File: components/ui/calendar.tsx
````typescript
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
export type CalendarProps = React.ComponentProps<typeof DayPicker>
````

## File: components/ui/card.tsx
````typescript
import { cn } from "@/lib/utils"
⋮----
className=
⋮----
<div ref=
````

## File: components/ui/carousel.tsx
````typescript
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]
type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}
type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps
⋮----
function useCarousel()
````

## File: components/ui/chart.tsx
````typescript
import { cn } from "@/lib/utils"
⋮----
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}
type ChartContextProps = {
  config: ChartConfig
}
⋮----
function useChart()
⋮----
className=
⋮----
<div className=
````

## File: components/ui/checkbox.tsx
````typescript
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/collapsible.tsx
````typescript

````

## File: components/ui/command.tsx
````typescript
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"
⋮----
className=
````

## File: components/ui/context-menu.tsx
````typescript
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/dialog.tsx
````typescript
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/drawer.tsx
````typescript
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"
const Drawer = (
⋮----
className=
````

## File: components/ui/dropdown-menu.tsx
````typescript
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/error-state.tsx
````typescript
import { Button } from "./button"
import { AlertCircle } from "lucide-react"
interface ErrorStateProps {
  error: Error
  onRetry?: () => void
}
````

## File: components/ui/form.tsx
````typescript
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
⋮----
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}
⋮----
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) =>
const useFormField = () =>
type FormItemContextValue = {
  id: string
}
⋮----
<div ref=
⋮----
className=
````

## File: components/ui/hover-card.tsx
````typescript
import { cn } from "@/lib/utils"
````

## File: components/ui/input-otp.tsx
````typescript
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
containerClassName=
className=
⋮----
<div ref=
````

## File: components/ui/input.tsx
````typescript
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/label.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
````

## File: components/ui/loading-state.tsx
````typescript
export function LoadingState()
````

## File: components/ui/menubar.tsx
````typescript
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/navigation-menu.tsx
````typescript
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/pagination.tsx
````typescript
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"
const Pagination = (
⋮----
className=
⋮----
<li ref=
⋮----
const PaginationPrevious = (
````

## File: components/ui/popover.tsx
````typescript
import { cn } from "@/lib/utils"
````

## File: components/ui/progress.tsx
````typescript
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/radio-group.tsx
````typescript
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/resizable.tsx
````typescript
import { GripVertical } from "lucide-react"
⋮----
import { cn } from "@/lib/utils"
````

## File: components/ui/scroll-area.tsx
````typescript
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/select.tsx
````typescript
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/separator.tsx
````typescript
import { cn } from "@/lib/utils"
````

## File: components/ui/sheet.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}
⋮----
className=
````

## File: components/ui/sidebar.tsx
````typescript
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
⋮----
type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}
⋮----
function useSidebar()
⋮----
const handleKeyDown = (event: KeyboardEvent) =>
⋮----
className=
⋮----
{/* This is what handles the sidebar gap on desktop */}
⋮----
onClick?.(event)
toggleSidebar()
````

## File: components/ui/skeleton.tsx
````typescript
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/slider.tsx
````typescript
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/sonner.tsx
````typescript
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
type ToasterProps = React.ComponentProps<typeof Sonner>
const Toaster = (
````

## File: components/ui/switch.tsx
````typescript
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/table.tsx
````typescript
import { cn } from "@/lib/utils"
⋮----
<table ref=
⋮----
(
⋮----
<tbody ref=
⋮----
<tfoot ref=
⋮----
className=
⋮----
<td ref=
⋮----
<caption ref=
````

## File: components/ui/tabs.tsx
````typescript
import { cn } from "@/lib/utils"
````

## File: components/ui/textarea.tsx
````typescript
import { cn } from "@/lib/utils"
⋮----
className=
````

## File: components/ui/toast.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
⋮----
className=
⋮----
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>
````

## File: components/ui/toaster.tsx
````typescript
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
````

## File: components/ui/toggle-group.tsx
````typescript
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"
⋮----
className=
````

## File: components/ui/toggle.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
````

## File: components/ui/tooltip.tsx
````typescript
import { cn } from "@/lib/utils"
````

## File: components/ui/use-mobile.tsx
````typescript
export function useIsMobile()
⋮----
const onChange = () =>
````

## File: components/ui/use-toast.ts
````typescript
import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"
⋮----
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}
⋮----
function genId()
type ActionType = typeof actionTypes
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }
interface State {
  toasts: ToasterToast[]
}
⋮----
const addToRemoveQueue = (toastId: string) =>
export const reducer = (state: State, action: Action): State =>
⋮----
function dispatch(action: Action)
type Toast = Omit<ToasterToast, "id">
function toast(
⋮----
const update = (props: ToasterToast)
const dismiss = () => dispatch(
⋮----
function useToast()
````

## File: components/auth-debug.tsx
````typescript
import React, { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { syncAuthState, isAuthenticated } from "@/lib/auth/token-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
export function AuthDebugger()
⋮----
const checkBrowserCookies = () =>
const checkLocalAuth = async () =>
const handleSyncTokens = async () =>
````

## File: components/auth-debugger.tsx
````typescript
import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
export function AuthDebugger()
⋮----
// Load localStorage data
⋮----
// Show cookies
⋮----
// Function to refresh data
const refreshData = () =>
// Format token display
const formatToken = (token: string | null | undefined) =>
````

## File: components/calendar-display.tsx
````typescript
import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, Download, Save, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { ViewToggle } from "@/components/view-toggle"
import { ExamListView } from "@/components/exam-list-view"
import { getExams } from "@/actions/exam-actions"
import { formatDateString, getCurrentYear, getAcademicYearForMonth } from "@/utils/date-utils"
import { SaveCalendarDialog } from "@/components/save-calendar-dialog"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import styles from "@/styles/tooltip.module.css"
import { saveUserCalendar, getUserCalendarNames } from "@/actions/user-calendars"
import { extractTokensFromStorage } from "@/lib/auth/token-manager"
const generateMonths = () =>
⋮----
const fetchExams = async () =>
⋮----
const fetchCalendarNames = async () =>
⋮----
const handleDayClick = (month: string, day: number) =>
const hasExam = (month: string, day: number) =>
const showPreviousMonths = () =>
const showNextMonths = () =>
const openSaveDialog = () =>
const handleSaveCalendar = async (name: string) =>
````

## File: components/exam-list-view.tsx
````typescript
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, MapPin, School, BookOpen, ChevronDown, ChevronUp, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getExams } from "@/actions/exam-actions"
type Exam = {
  id: number | string;
  date: string;
  subject: string;
  code: string;
  time: string;
  location: string;
  year: string;
  semester: string;
  school: string;
  degree: string;
};
type SortField = "date" | "subject" | "time" | "location" | "year" | "semester"
type SortDirection = "asc" | "desc"
⋮----
const fetchExams = async () =>
⋮----
const handleSort = (field: SortField) =>
⋮----
const toggleExamDetails = (examId: number | string) =>
⋮----
````

## File: components/feature-showcase.tsx
````typescript
import { Calendar, Filter, Clock, MapPin, Download, Bell } from "lucide-react"
import { motion } from "framer-motion"
````

## File: components/filter-connection.tsx
````typescript
import { useState, useCallback } from "react"
import { FilterSidebar } from "@/components/filter-sidebar"
import { CalendarDisplay } from "@/components/calendar-display"
export function FilterConnection()
````

## File: components/filter-sidebar.tsx
````typescript
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Search, X, Info, CheckCircle } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useFilterData } from "@/lib/hooks/use-filter-data"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { Card, CardContent } from "@/components/ui/card"
type FilterCategory = {
  name: string;
  field: string;
  options: string[];
  searchable: boolean;
  dependsOn?: string[];
};
type ActiveFilters = Record<string, string[]>;
⋮----
const autoExpandNext = (categoryField: string) =>
⋮----
const hasRequiredDependencies = (category: FilterCategory): boolean =>
const addFilter = (category: string, value: string) =>
const removeFilter = (category: string, value: string) =>
const clearAllFilters = () =>
const selectAllFilters = (category: FilterCategory) =>
⋮----
// Apply global search if any
⋮----
// Set all filtered options as selected
⋮----
// Call onFiltersChange after state update
⋮----
const filteredOptions = (category: FilterCategory) =>
⋮----
// If category has dependencies and not all are selected, return empty array
⋮----
// Filter by the search query if one exists
⋮----
// Also filter options globally if allFiltersSearch is set
⋮----
// Debug: Logging for School category specifically
⋮----
const handleAccordionChange = (value: string[]) =>
// Format the filter list for display
const getFilterDisplay = (field: string, values: string[]) =>
// Get dependency message for a category
const getDependencyMessage = (category: FilterCategory) =>
⋮----
// Convert field name to display name (e.g., 'school' to 'School')
⋮----
// Update the function signature to accept any MouseEvent
const clearCategoryFilters = (category: string, e?: React.MouseEvent) =>
⋮----
// Remove this category's filters
⋮----
// Clear dependent filters if needed
⋮----
e.stopPropagation();
selectAllFilters(category);
⋮----
onClick=
⋮----
checked=
⋮----
addFilter(category.field, option);
````

## File: components/find-exam-card.tsx
````typescript
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getSchools } from "@/actions/exam-actions"
⋮----
async function fetchSchools()
⋮----
const validateAcronym = (value: string) =>
const handleSearch = (e: React.FormEvent) =>
⋮----
// Validate acronym
⋮----
// Change parameter name from 'q' to 'acronym' to be more specific
````

## File: components/footer.tsx
````typescript
import Link from "next/link"
export function Footer()
⋮----
xmlns="http://www.w3.org/2000/svg"
````

## File: components/header.tsx
````typescript
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserButton } from "@/components/auth/user-button"
import { useAuth } from "@/context/auth-context"
⋮----
const handleScroll = () =>
⋮----
const navigateToMyCalendars = () =>
````

## File: components/hero-section.tsx
````typescript
import { ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { FindExamCard } from "@/components/find-exam-card"
⋮----
const scrollToFilters = () =>
````

## File: components/icons.tsx
````typescript
import { LucideProps } from "lucide-react"
````

## File: components/save-calendar-dialog.tsx
````typescript
import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { isAuthenticated } from "@/lib/auth/token-manager"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
⋮----
type SaveCalendarFormValues = z.infer<typeof formSchema>
interface SaveCalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: Record<string, string[]>
  onSave: (name: string) => void
  existingNames?: string[]
}
⋮----
async function onSubmit(values: SaveCalendarFormValues)
⋮----
// Check for duplicate names
⋮----
<form onSubmit=
````

## File: components/statistics-section.tsx
````typescript
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Calendar, School, BookOpen } from "lucide-react"
````

## File: components/testimonials.tsx
````typescript
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LucideQuote } from "lucide-react"
````

## File: components/theme-provider.tsx
````typescript
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"
export function ThemeProvider(
````

## File: components/theme-toggle.tsx
````typescript
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
export function ThemeToggle()
⋮----
<DropdownMenuItem onClick=
````

## File: components/view-toggle.tsx
````typescript
import { Calendar, List } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
interface ViewToggleProps {
  view: "calendar" | "list"
  onChange: (view: "calendar" | "list") => void
}
⋮----
<Tabs value=
````

## File: context/auth-context.tsx
````typescript
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { syncAuthState as syncTokenState } from "@/lib/auth/token-manager"
⋮----
type User = {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}
interface AuthContextProps {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signInWithProvider: (provider: "google" | "github" | "facebook") => Promise<void>
  syncToken: () => Promise<boolean>
}
⋮----
export function AuthProvider(
⋮----
async function checkSession()
async function signUp(email: string, password: string, fullName: string)
async function signIn(email: string, password: string)
⋮----
// Set cookies that server can recognize
⋮----
// Force a session refresh to ensure cookies are properly set
⋮----
async function signOut()
async function signInWithProvider(provider: "google" | "github" | "facebook")
async function syncAuthState()
async function syncToken()
⋮----
export const useAuth = () =>
````

## File: docs/performance-optimizations.md
````markdown
# Performance Optimizations for Exam Calendar

This document outlines the performance optimizations implemented to make the exam calendar data fetching faster.

## Database Indexes

The following indexes were created on the `ETSINF` table to optimize query performance:

```sql
-- Basic indexes for common filter columns
CREATE INDEX idx_etsinf_school ON "ETSINF" (school);
CREATE INDEX idx_etsinf_degree ON "ETSINF" (degree);
CREATE INDEX idx_etsinf_year ON "ETSINF" (year);
CREATE INDEX idx_etsinf_semester ON "ETSINF" (semester);
CREATE INDEX idx_etsinf_exam_date ON "ETSINF" (exam_date);

-- Composite indexes for combined filters
CREATE INDEX idx_etsinf_school_degree ON "ETSINF" (school, degree);
CREATE INDEX idx_etsinf_school_degree_year ON "ETSINF" (school, degree, year);
CREATE INDEX idx_etsinf_date_time ON "ETSINF" (exam_date, exam_time);

-- Full text search index for subject searching
CREATE INDEX idx_etsinf_subject_gin ON "ETSINF" USING gin(to_tsvector('english', subject));
```

## Code Optimizations

### 1. Query Optimizations

- **Selective Column Selection**: Only retrieving the specific columns needed instead of using `SELECT *`
- **Filter Order**: Arranged filters from most selective to least selective to maximize index usage
- **Numeric Conversions**: Properly converting string year values to integers for correct comparisons
- **ILIKE with Indexes**: Using `ilike` with pattern matching to leverage the GIN index for subject searches

### 2. Caching Improvements

- **Multi-Level Cache**: Implemented caching for all data types (schools, degrees, semesters, years, subjects, and exams)
- **Different TTLs**: Set different time-to-live values for different data types (shorter for exams, longer for metadata)
- **Cache Key Generation**: Created robust cache key generation based on filter combinations
- **Automatic Cache Expiry**: Added automatic cache cleaning for expired entries

### 3. Performance Monitoring

- **Query Timing**: Added performance timing for all database operations
- **Result Counting**: Logging the number of results and query execution time
- **Cache Hit Logging**: Tracking when cache is used vs. when database queries are made

## Results

These optimizations should result in:

1. **Faster Initial Load**: The first load of any filter combination will be faster due to better database query structure
2. **Near-Instant Repeated Queries**: Subsequent identical queries will use the cache
3. **Reduced Database Load**: Fewer and more efficient database queries
4. **Better User Experience**: More responsive UI especially when applying filters
5. **Scalability**: Better handling of larger datasets as the application grows

## Monitoring Query Performance

You can monitor the performance of your queries with:

```sql
-- Check which indexes exist on the ETSINF table
SELECT
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'ETSINF';

-- Check index usage statistics
SELECT
    relname as table_name,
    indexrelname as index_name,
    idx_scan as index_scans_count,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM
    pg_stat_user_indexes
JOIN
    pg_index USING (indexrelid)
WHERE
    relname = 'ETSINF'
ORDER BY
    idx_scan DESC;
```
````

## File: hooks/use-mobile.tsx
````typescript
export function useIsMobile()
⋮----
const onChange = () =>
````

## File: hooks/use-toast.ts
````typescript
import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"
⋮----
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}
⋮----
function genId()
type ActionType = typeof actionTypes
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }
interface State {
  toasts: ToasterToast[]
}
⋮----
const addToRemoveQueue = (toastId: string) =>
export const reducer = (state: State, action: Action): State =>
⋮----
function dispatch(action: Action)
type Toast = Omit<ToasterToast, "id">
function toast(
⋮----
const update = (props: ToasterToast)
const dismiss = () => dispatch(
⋮----
function useToast()
````

## File: lib/auth/index.ts
````typescript

````

## File: lib/auth/token-manager.ts
````typescript
import { createClient } from '@supabase/supabase-js';
import { Session } from '@supabase/supabase-js';
⋮----
export async function storeSession(session: Session | null): Promise<boolean>
⋮----
// Set all cookie variants to ensure server can access
⋮----
function setCookie(name: string, value: string): void
export async function syncAuthState(): Promise<boolean>
export async function isAuthenticated(): Promise<boolean>
export async function clearAuthState(): Promise<void>
export function extractTokensFromStorage():
export function getSessionFromStorage(): Session | null
````

## File: lib/hooks/use-filter-data.ts
````typescript
import { useState, useEffect, useRef } from 'react'
import { getSchools, getDegrees, getSemesters, getYears, getSubjects } from '@/actions/exam-actions'
interface FilterData {
  schools: string[]
  degrees: string[]
  semesters: string[]
  years: number[]
  subjects: string[]
  isLoading: boolean
  error: Error | null
}
export function useFilterData(
  selectedSchools: string[] = [],
  selectedDegrees: string[] = [],
  selectedSemesters: string[] = [],
  selectedYears: string[] = []
): FilterData
⋮----
const fetchSchools = async () =>
⋮----
const fetchDegreeData = async () =>
⋮----
const fetchSemesterData = async () =>
⋮----
const fetchYearData = async () =>
⋮----
const fetchSubjectData = async () =>
````

## File: lib/supabase/client.ts
````typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
export function createClient()
````

## File: lib/supabase/server.ts
````typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'
export async function createClient()
⋮----
// Try different cookie formats in priority order
⋮----
// Get the cookieStore
⋮----
// Simple function to safely check if cookie exists
const cookieExists = async (name: string): Promise<boolean> =>
// Simple function to safely get cookie value
const getCookieValue = async (name: string): Promise<string | undefined> =>
// Log available cookies for debugging
````

## File: lib/supabase.ts
````typescript
import { createClient } from "@supabase/supabase-js"
````

## File: lib/utils.ts
````typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[])
````

## File: public/placeholder-logo.svg
````
<svg xmlns="http://www.w3.org/2000/svg" width="215" height="48" fill="none"><path fill="#000" d="M57.588 9.6h6L73.828 38h-5.2l-2.36-6.88h-11.36L52.548 38h-5.2l10.24-28.4Zm7.16 17.16-4.16-12.16-4.16 12.16h8.32Zm23.694-2.24c-.186-1.307-.706-2.32-1.56-3.04-.853-.72-1.866-1.08-3.04-1.08-1.68 0-2.986.613-3.92 1.84-.906 1.227-1.36 2.947-1.36 5.16s.454 3.933 1.36 5.16c.934 1.227 2.24 1.84 3.92 1.84 1.254 0 2.307-.373 3.16-1.12.854-.773 1.387-1.867 1.6-3.28l5.12.24c-.186 1.68-.733 3.147-1.64 4.4-.906 1.227-2.08 2.173-3.52 2.84-1.413.667-2.986 1-4.72 1-2.08 0-3.906-.453-5.48-1.36-1.546-.907-2.76-2.2-3.64-3.88-.853-1.68-1.28-3.627-1.28-5.84 0-2.24.427-4.187 1.28-5.84.88-1.68 2.094-2.973 3.64-3.88 1.574-.907 3.4-1.36 5.48-1.36 1.68 0 3.227.32 4.64.96 1.414.64 2.56 1.56 3.44 2.76.907 1.2 1.454 2.6 1.64 4.2l-5.12.28Zm11.486-7.72.12 3.4c.534-1.227 1.307-2.173 2.32-2.84 1.04-.693 2.267-1.04 3.68-1.04 1.494 0 2.76.387 3.8 1.16 1.067.747 1.827 1.813 2.28 3.2.507-1.44 1.294-2.52 2.36-3.24 1.094-.747 2.414-1.12 3.96-1.12 1.414 0 2.64.307 3.68.92s1.84 1.52 2.4 2.72c.56 1.2.84 2.667.84 4.4V38h-4.96V25.92c0-1.813-.293-3.187-.88-4.12-.56-.96-1.413-1.44-2.56-1.44-.906 0-1.68.213-2.32.64-.64.427-1.133 1.053-1.48 1.88-.32.827-.48 1.84-.48 3.04V38h-4.56V25.92c0-1.2-.133-2.213-.4-3.04-.24-.827-.626-1.453-1.16-1.88-.506-.427-1.133-.64-1.88-.64-.906 0-1.68.227-2.32.68-.64.427-1.133 1.053-1.48 1.88-.32.827-.48 1.827-.48 3V38h-4.96V16.8h4.48Zm26.723 10.6c0-2.24.427-4.187 1.28-5.84.854-1.68 2.067-2.973 3.64-3.88 1.574-.907 3.4-1.36 5.48-1.36 1.84 0 3.494.413 4.96 1.24 1.467.827 2.64 2.08 3.52 3.76.88 1.653 1.347 3.693 1.4 6.12v1.32h-15.08c.107 1.813.614 3.227 1.52 4.24.907.987 2.134 1.48 3.68 1.48.987 0 1.88-.253 2.68-.76a4.803 4.803 0 0 0 1.84-2.2l5.08.36c-.64 2.027-1.84 3.64-3.6 4.84-1.733 1.173-3.733 1.76-6 1.76-2.08 0-3.906-.453-5.48-1.36-1.573-.907-2.786-2.2-3.64-3.88-.853-1.68-1.28-3.627-1.28-5.84Zm15.16-2.04c-.213-1.733-.76-3.013-1.64-3.84-.853-.827-1.893-1.24-3.12-1.24-1.44 0-2.6.453-3.48 1.36-.88.88-1.44 2.12-1.68 3.72h9.92ZM163.139 9.6V38h-5.04V9.6h5.04Zm8.322 7.2.24 5.88-.64-.36c.32-2.053 1.094-3.56 2.32-4.52 1.254-.987 2.787-1.48 4.6-1.48 2.32 0 4.107.733 5.36 2.2 1.254 1.44 1.88 3.387 1.88 5.84V38h-4.96V25.92c0-1.253-.12-2.28-.36-3.08-.24-.8-.64-1.413-1.2-1.84-.533-.427-1.253-.64-2.16-.64-1.44 0-2.573.48-3.4 1.44-.8.933-1.2 2.307-1.2 4.12V38h-4.96V16.8h4.48Zm30.003 7.72c-.186-1.307-.706-2.32-1.56-3.04-.853-.72-1.866-1.08-3.04-1.08-1.68 0-2.986.613-3.92 1.84-.906 1.227-1.36 2.947-1.36 5.16s.454 3.933 1.36 5.16c.934 1.227 2.24 1.84 3.92 1.84 1.254 0 2.307-.373 3.16-1.12.854-.773 1.387-1.867 1.6-3.28l5.12.24c-.186 1.68-.733 3.147-1.64 4.4-.906 1.227-2.08 2.173-3.52 2.84-1.413.667-2.986 1-4.72 1-2.08 0-3.906-.453-5.48-1.36-1.546-.907-2.76-2.2-3.64-3.88-.853-1.68-1.28-3.627-1.28-5.84 0-2.24.427-4.187 1.28-5.84.88-1.68 2.094-2.973 3.64-3.88 1.574-.907 3.4-1.36 5.48-1.36 1.68 0 3.227.32 4.64.96 1.414.64 2.56 1.56 3.44 2.76.907 1.2 1.454 2.6 1.64 4.2l-5.12.28Zm11.443 8.16V38h-5.6v-5.32h5.6Z"/><path fill="#171717" fill-rule="evenodd" d="m7.839 40.783 16.03-28.054L20 6 0 40.783h7.839Zm8.214 0H40L27.99 19.894l-4.02 7.032 3.976 6.914H20.02l-3.967 6.943Z" clip-rule="evenodd"/></svg>
````

## File: public/placeholder.svg
````
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" fill="none"><rect width="1200" height="1200" fill="#EAEAEA" rx="3"/><g opacity=".5"><g opacity=".5"><path fill="#FAFAFA" d="M600.709 736.5c-75.454 0-136.621-61.167-136.621-136.62 0-75.454 61.167-136.621 136.621-136.621 75.453 0 136.62 61.167 136.62 136.621 0 75.453-61.167 136.62-136.62 136.62Z"/><path stroke="#C9C9C9" stroke-width="2.418" d="M600.709 736.5c-75.454 0-136.621-61.167-136.621-136.62 0-75.454 61.167-136.621 136.621-136.621 75.453 0 136.62 61.167 136.62 136.621 0 75.453-61.167 136.62-136.62 136.62Z"/></g><path stroke="url(#a)" stroke-width="2.418" d="M0-1.209h553.581" transform="scale(1 -1) rotate(45 1163.11 91.165)"/><path stroke="url(#b)" stroke-width="2.418" d="M404.846 598.671h391.726"/><path stroke="url(#c)" stroke-width="2.418" d="M599.5 795.742V404.017"/><path stroke="url(#d)" stroke-width="2.418" d="m795.717 796.597-391.441-391.44"/><path fill="#fff" d="M600.709 656.704c-31.384 0-56.825-25.441-56.825-56.824 0-31.384 25.441-56.825 56.825-56.825 31.383 0 56.824 25.441 56.824 56.825 0 31.383-25.441 56.824-56.824 56.824Z"/><g clip-path="url(#e)"><path fill="#666" fill-rule="evenodd" d="M616.426 586.58h-31.434v16.176l3.553-3.554.531-.531h9.068l.074-.074 8.463-8.463h2.565l7.18 7.181V586.58Zm-15.715 14.654 3.698 3.699 1.283 1.282-2.565 2.565-1.282-1.283-5.2-5.199h-6.066l-5.514 5.514-.073.073v2.876a2.418 2.418 0 0 0 2.418 2.418h26.598a2.418 2.418 0 0 0 2.418-2.418v-8.317l-8.463-8.463-7.181 7.181-.071.072Zm-19.347 5.442v4.085a6.045 6.045 0 0 0 6.046 6.045h26.598a6.044 6.044 0 0 0 6.045-6.045v-7.108l1.356-1.355-1.282-1.283-.074-.073v-17.989h-38.689v23.43l-.146.146.146.147Z" clip-rule="evenodd"/></g><path stroke="#C9C9C9" stroke-width="2.418" d="M600.709 656.704c-31.384 0-56.825-25.441-56.825-56.824 0-31.384 25.441-56.825 56.825-56.825 31.383 0 56.824 25.441 56.824 56.825 0 31.383-25.441 56.824-56.824 56.824Z"/></g><defs><linearGradient id="a" x1="554.061" x2="-.48" y1=".083" y2=".087" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset=".208" stop-color="#C9C9C9"/><stop offset=".792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="b" x1="796.912" x2="404.507" y1="599.963" y2="599.965" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset=".208" stop-color="#C9C9C9"/><stop offset=".792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="c" x1="600.792" x2="600.794" y1="403.677" y2="796.082" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset=".208" stop-color="#C9C9C9"/><stop offset=".792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><linearGradient id="d" x1="404.85" x2="796.972" y1="403.903" y2="796.02" gradientUnits="userSpaceOnUse"><stop stop-color="#C9C9C9" stop-opacity="0"/><stop offset=".208" stop-color="#C9C9C9"/><stop offset=".792" stop-color="#C9C9C9"/><stop offset="1" stop-color="#C9C9C9" stop-opacity="0"/></linearGradient><clipPath id="e"><path fill="#fff" d="M581.364 580.535h38.689v38.689h-38.689z"/></clipPath></defs></svg>
````

## File: styles/globals.css
````css
@tailwind base;
@tailwind components;
@tailwind utilities;
body {
@layer utilities {
⋮----
.text-balance {
⋮----
@layer base {
⋮----
:root {
.dark {
⋮----
* {
⋮----
@apply border-border;
````

## File: styles/tooltip.module.css
````css
.examTooltip {
.examTooltip[data-state="open"] {
.examCard {
.examCard:hover {
.examCount {
.scrollArea {
.scrollArea::-webkit-scrollbar {
.scrollArea::-webkit-scrollbar-track {
.scrollArea::-webkit-scrollbar-thumb {
.scrollArea::-webkit-scrollbar-thumb:hover {
````

## File: types/database.types.ts
````typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
export interface Database {
  public: {
    Tables: {
      user_calendars: {
        Row: {
          id: string
          user_id: string
          name: string
          filters: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          filters: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          filters?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_calendars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
````

## File: types/exam.ts
````typescript
export interface Exam {
  id: number
  subject: string
  code: string
  date: string
  time: string
  location: string
  school: string
  degree: string
  year: string
  semester: string
  created_at?: string
}
export interface ExamFilters {
  school?: string | string[]
  degree?: string | string[]
  year?: string
  semester?: string
  subject?: string
  acronym?: string
}
````

## File: utils/supabase/client.ts
````typescript
import { createBrowserClient } from "@supabase/ssr";
export const createClient = ()
````

## File: utils/supabase/middleware.ts
````typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
export const createClient = (request: NextRequest) =>
⋮----
getAll()
setAll(cookiesToSet)
````

## File: utils/supabase/server.ts
````typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
export const createClient = (cookieStore: ReturnType<typeof cookies>) =>
⋮----
getAll()
setAll(cookiesToSet)
````

## File: utils/auth-helpers.ts
````typescript
import { createClient } from '@supabase/supabase-js'
⋮----
export async function checkAndFixAuthState()
export async function fixAuth()
export async function syncAuthState()
⋮----
// Set all possible cookie formats that the server might check
⋮----
export async function isAuthenticated()
````

## File: utils/date-utils.ts
````typescript
export function formatDateString(year: number, month: number, day: number): string
export function debugDateMatch(calendarDate: string, examDate: string, examId: string | number): boolean
export function getCurrentYear(): number
export function getAcademicYearForMonth(month: number): number
````

## File: utils/exam-mapper.ts
````typescript
export function mapExamData(exam: any)
````

## File: .gitignore
````
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules

# next.js
/.next/
/out/

# production
/build

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
````

## File: APIdocs.md
````markdown
ETSINF
No description available


Language: Javascript
Columns

Name	Format	Type	Description
exam_instance_id	
bigint

number	
exam_date	
date

string	
exam_time	
time without time zone

string	
duration_minutes	
integer

number	
code	
integer

number	
subject	
text

string	
acronym	
character varying

string	
degree	
text

string	
year	
smallint

number	
semester	
character

string	
place	
text

string	
comment	
text

string	
school	
text

string	
Read rows
Documentation
To read rows in this table, use the select method.

Read all rows

let { data: ETSINF, error } = await supabase
  .from('ETSINF')
  .select('*')
Read specific columns

let { data: ETSINF, error } = await supabase
  .from('ETSINF')
  .select('some_column,other_column')
Read referenced tables

let { data: ETSINF, error } = await supabase
  .from('ETSINF')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination

let { data: ETSINF, error } = await supabase
  .from('ETSINF')
  .select('*')
  .range(0, 9)
Filtering
Documentation
Supabase provides a wide range of filters

With filtering

let { data: ETSINF, error } = await supabase
  .from('ETSINF')
  .select("*")

  // Filters
  .eq('column', 'Equal to')
  .gt('column', 'Greater than')
  .lt('column', 'Less than')
  .gte('column', 'Greater than or equal to')
  .lte('column', 'Less than or equal to')
  .like('column', '%CaseSensitive%')
  .ilike('column', '%CaseInsensitive%')
  .is('column', null)
  .in('column', ['Array', 'Values'])
  .neq('column', 'Not equal to')

  // Arrays
  .contains('array_column', ['array', 'contains'])
  .containedBy('array_column', ['contained', 'by'])

  // Logical operators
  .not('column', 'like', 'Negate filter')
  .or('some_column.eq.Some value, other_column.eq.Other value')
Insert rows
Documentation
insert lets you insert into your tables. You can also insert in bulk and do UPSERT.

insert will also return the replaced values for UPSERT.

Insert a row

const { data, error } = await supabase
  .from('ETSINF')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows

const { data, error } = await supabase
  .from('ETSINF')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows

const { data, error } = await supabase
  .from('ETSINF')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
Documentation
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Update matching rows

const { data, error } = await supabase
  .from('ETSINF')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
Documentation
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Delete matching rows

const { error } = await supabase
  .from('ETSINF')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Documentation
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Subscribe to all events

const channels = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'ETSINF' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts

const channels = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'ETSINF' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates

const channels = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'ETSINF' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes

const channels = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'ETSINF' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows

const channels = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'ETSINF', filter: 'some_column=eq.some_value' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()


  INDEXES:

  | indexname                     | indexdef                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| etsinf_pkey                   | CREATE UNIQUE INDEX etsinf_pkey ON public."ETSINF" USING btree (exam_instance_id)                             |
| idx_etsinf_school             | CREATE INDEX idx_etsinf_school ON public."ETSINF" USING btree (school)                                        |
| idx_etsinf_degree             | CREATE INDEX idx_etsinf_degree ON public."ETSINF" USING btree (degree)                                        |
| idx_etsinf_year               | CREATE INDEX idx_etsinf_year ON public."ETSINF" USING btree (year)                                            |
| idx_etsinf_semester           | CREATE INDEX idx_etsinf_semester ON public."ETSINF" USING btree (semester)                                    |
| idx_etsinf_exam_date          | CREATE INDEX idx_etsinf_exam_date ON public."ETSINF" USING btree (exam_date)                                  |
| idx_etsinf_school_degree      | CREATE INDEX idx_etsinf_school_degree ON public."ETSINF" USING btree (school, degree)                         |
| idx_etsinf_school_degree_year | CREATE INDEX idx_etsinf_school_degree_year ON public."ETSINF" USING btree (school, degree, year)              |
| idx_etsinf_date_time          | CREATE INDEX idx_etsinf_date_time ON public."ETSINF" USING btree (exam_date, exam_time)                       |
| idx_etsinf_subject_gin        | CREATE INDEX idx_etsinf_subject_gin ON public."ETSINF" USING gin (to_tsvector('english'::regconfig, subject)) |



TABLE 2:

user_calendars
No description available


Language: Javascript
Columns

Name	Format	Type	Description
id	
uuid

string	
user_id	
uuid

string	
name	
text

string	
filters	
jsonb

json	
created_at	
timestamp with time zone

string	
Read rows
Documentation
To read rows in this table, use the select method.

Read all rows

let { data: user_calendars, error } = await supabase
  .from('user_calendars')
  .select('*')
Read specific columns

let { data: user_calendars, error } = await supabase
  .from('user_calendars')
  .select('some_column,other_column')
Read referenced tables

let { data: user_calendars, error } = await supabase
  .from('user_calendars')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination

let { data: user_calendars, error } = await supabase
  .from('user_calendars')
  .select('*')
  .range(0, 9)
Filtering
Documentation
Supabase provides a wide range of filters

With filtering

let { data: user_calendars, error } = await supabase
  .from('user_calendars')
  .select("*")

  // Filters
  .eq('column', 'Equal to')
  .gt('column', 'Greater than')
  .lt('column', 'Less than')
  .gte('column', 'Greater than or equal to')
  .lte('column', 'Less than or equal to')
  .like('column', '%CaseSensitive%')
  .ilike('column', '%CaseInsensitive%')
  .is('column', null)
  .in('column', ['Array', 'Values'])
  .neq('column', 'Not equal to')

  // Arrays
  .contains('array_column', ['array', 'contains'])
  .containedBy('array_column', ['contained', 'by'])

  // Logical operators
  .not('column', 'like', 'Negate filter')
  .or('some_column.eq.Some value, other_column.eq.Other value')
Insert rows
Documentation
insert lets you insert into your tables. You can also insert in bulk and do UPSERT.

insert will also return the replaced values for UPSERT.

Insert a row

const { data, error } = await supabase
  .from('user_calendars')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows

const { data, error } = await supabase
  .from('user_calendars')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows

const { data, error } = await supabase
  .from('user_calendars')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
Documentation
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Update matching rows

const { data, error } = await supabase
  .from('user_calendars')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
Documentation
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Delete matching rows

const { error } = await supabase
  .from('user_calendars')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Documentation
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Subscribe to all events

const channels = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'user_calendars' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts

const channels = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'user_calendars' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates

const channels = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'user_calendars' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes

const channels = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'user_calendars' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows

const channels = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'user_calendars', filter: 'some_column=eq.some_value' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()




  RLS policies:

  [
  {
    "schemaname": "public",
    "tablename": "ETSINF",
    "policyname": "Allow anonymus read access",
    "permissive": "PERMISSIVE",
    "roles": "{anon}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "user_calendars",
    "policyname": "Delete own calendars",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "user_calendars",
    "policyname": "Insert own calendars",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "user_calendars",
    "policyname": "Select own calendars",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "user_calendars",
    "policyname": "Update own calendars",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": "(auth.uid() = user_id)"
  },

]
````

## File: components.json
````json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
````

## File: middleware.ts
````typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
export async function middleware(req: NextRequest)
⋮----
get(name)
set(name, value, options)
remove(name, options)
⋮----
// Check if the route is protected (currently only /my-calendars is protected)
````

## File: next.config.mjs
````
/** @type {import('next').NextConfig} */
````

## File: package.json
````json
{
  "name": "my-v0-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@emotion/is-prop-valid": "latest",
    "@hookform/resolvers": "^3.9.1",
    "@radix-ui/react-accordion": "1.2.2",
    "@radix-ui/react-alert-dialog": "1.1.4",
    "@radix-ui/react-aspect-ratio": "1.1.1",
    "@radix-ui/react-avatar": "1.1.2",
    "@radix-ui/react-checkbox": "1.1.3",
    "@radix-ui/react-collapsible": "1.1.2",
    "@radix-ui/react-context-menu": "2.2.4",
    "@radix-ui/react-dialog": "1.1.4",
    "@radix-ui/react-dropdown-menu": "2.1.4",
    "@radix-ui/react-hover-card": "1.1.4",
    "@radix-ui/react-label": "2.1.1",
    "@radix-ui/react-menubar": "1.1.4",
    "@radix-ui/react-navigation-menu": "1.2.3",
    "@radix-ui/react-popover": "1.1.4",
    "@radix-ui/react-progress": "1.1.1",
    "@radix-ui/react-radio-group": "1.2.2",
    "@radix-ui/react-scroll-area": "1.2.2",
    "@radix-ui/react-select": "2.1.4",
    "@radix-ui/react-separator": "1.1.1",
    "@radix-ui/react-slider": "1.2.2",
    "@radix-ui/react-slot": "1.1.1",
    "@radix-ui/react-switch": "1.1.2",
    "@radix-ui/react-tabs": "latest",
    "@radix-ui/react-toast": "1.2.4",
    "@radix-ui/react-toggle": "1.1.1",
    "@radix-ui/react-toggle-group": "1.1.1",
    "@radix-ui/react-tooltip": "1.1.6",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/ssr": "^0.6.1",
    "@supabase/supabase-js": "latest",
    "autoprefixer": "^10.4.20",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "1.0.4",
    "date-fns": "4.1.0",
    "embla-carousel-react": "8.5.1",
    "framer-motion": "^12.10.5",
    "input-otp": "1.4.1",
    "lucide-react": "^0.454.0",
    "next": "15.2.4",
    "next-themes": "latest",
    "react": "^19",
    "react-day-picker": "8.10.1",
    "react-dom": "^19",
    "react-hook-form": "^7.54.1",
    "react-resizable-panels": "^2.1.7",
    "recharts": "2.15.0",
    "sonner": "^1.7.1",
    "tailwind-merge": "^2.5.5",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.6",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/lodash": "^4.17.16",
    "@types/node": "^22",
    "@types/react": "^19.1.3",
    "@types/react-dom": "^19.1.3",
    "postcss": "^8",
    "tailwindcss": "^3.4.17",
    "typescript": "^5"
  }
}
````

## File: page.tsx
````typescript
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
````

## File: postcss.config.mjs
````
/** @type {import('postcss-load-config').Config} */
````

## File: start-services.bat
````
@echo off
setlocal enabledelayedexpansion

echo Starting UPV Exam Calendar services...

REM Check if .env.local exists in root directory
if not exist .env.local (
    echo Error: .env.local file not found in root directory
    echo Please create .env.local with the following variables:
    echo SUPABASE_DB_URL=your_database_url
    echo SUPABASE_DB_USER=your_database_user
    echo SUPABASE_DB_PASSWORD=your_database_password
    exit /b 1
)

REM Load environment variables from .env.local
for /f "tokens=*" %%a in (.env.local) do (
    set %%a
)

REM Verify required variables are set
if "%SUPABASE_DB_URL%"=="" (
    echo Error: SUPABASE_DB_URL is not set in .env.local
    exit /b 1
)
if "%SUPABASE_DB_USER%"=="" (
    echo Error: SUPABASE_DB_USER is not set in .env.local
    exit /b 1
)
if "%SUPABASE_DB_PASSWORD%"=="" (
    echo Error: SUPABASE_DB_PASSWORD is not set in .env.local
    exit /b 1
)

REM Start Spring Boot backend
echo Starting Spring Boot backend...
start "Spring Boot Backend" cmd /c "cd backend && mvn spring-boot:run"

REM Wait for backend to start
timeout /t 10 /nobreak

REM Start Next.js frontend
echo Starting Next.js frontend...
start "Next.js Frontend" cmd /c "npm run dev"

echo Services started successfully!
echo Backend: http://localhost:8080
echo Frontend: http://localhost:3000
````

## File: tailwind.config.ts
````typescript
import type { Config } from "tailwindcss"
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "target": "ES6",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
````
