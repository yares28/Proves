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
): FilterData {
  const [data, setData] = useState<{
    schools: string[],
    degrees: string[],
    semesters: string[],
    years: number[],
    subjects: string[]
  }>({
    schools: [],
    degrees: [],
    semesters: [],
    years: [],
    subjects: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3
  
  // Use refs to store previous filter values to prevent unnecessary refetches
  const prevSelectedSchoolsRef = useRef<string[]>([]);
  const prevSelectedDegreesRef = useRef<string[]>([]);
  const prevSelectedSemestersRef = useRef<string[]>([]);
  const prevSelectedYearsRef = useRef<string[]>([]);
  
  // Stable stringified versions for comparison
  const selectedSchoolsStr = JSON.stringify(selectedSchools.sort());
  const selectedDegreesStr = JSON.stringify(selectedDegrees.sort());
  const selectedSemestersStr = JSON.stringify(selectedSemesters.sort());
  const selectedYearsStr = JSON.stringify(selectedYears.sort());
  
  const prevSelectedSchoolsStr = JSON.stringify(prevSelectedSchoolsRef.current.sort());
  const prevSelectedDegreesStr = JSON.stringify(prevSelectedDegreesRef.current.sort());
  const prevSelectedSemestersStr = JSON.stringify(prevSelectedSemestersRef.current.sort());
  const prevSelectedYearsStr = JSON.stringify(prevSelectedYearsRef.current.sort());
  
  // Track if schools have been fetched already
  const schoolsLoadedRef = useRef(false);
  
  // Fetch schools only once
  useEffect(() => {
    // Skip if schools are already loaded
    if (schoolsLoadedRef.current && data.schools.length > 0) {
      return;
    }
    
    const fetchSchools = async () => {
      try {
        console.log('Fetching schools...');
        const schools = await getSchools()
        setData(prev => ({ ...prev, schools }))
        schoolsLoadedRef.current = true;
      } catch (err) {
        console.error('Error fetching schools:', err)
      }
    }
    
    fetchSchools()
  }, [data.schools.length])
  
  // Fetch degree data when selectedSchools changes
  useEffect(() => {
    // Skip if selectedSchools haven't changed
    if (selectedSchoolsStr === prevSelectedSchoolsStr && prevSelectedSchoolsStr !== "[]") {
      console.log('Skipping degrees fetch - selectedSchools unchanged');
      return;
    }
    
    // Update ref with current selectedSchools
    prevSelectedSchoolsRef.current = [...selectedSchools];
    
    const fetchDegreeData = async () => {
      try {
        console.log('Fetching degrees for schools:', selectedSchools);
        setIsLoading(true)
        
        // Only fetch degrees if at least one school is selected
        const degrees = selectedSchools.length > 0 
          ? await getDegrees(selectedSchools) 
          : [];
        
        setData(prev => ({
          ...prev,
          degrees,
          // When schools change, clear dependent filters
          semesters: [],
          years: [],
          subjects: []
        }))
        
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching degree data:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch degree data'))
        setIsLoading(false)
      }
    }
    
    fetchDegreeData()
  }, [selectedSchoolsStr])
  
  // Fetch semester data when selectedDegrees changes
  useEffect(() => {
    // Skip if relevant filters haven't changed or prerequisites aren't met
    if ((selectedDegreesStr === prevSelectedDegreesStr && prevSelectedDegreesStr !== "[]") || 
        selectedSchools.length === 0 || selectedDegrees.length === 0) {
      return;
    }
    
    // Update ref with current selectedDegrees
    prevSelectedDegreesRef.current = [...selectedDegrees];
    
    const fetchSemesterData = async () => {
      try {
        console.log('Fetching semesters for degrees:', selectedDegrees);
        setIsLoading(true)
        
        // Fetch semesters filtered by both schools and degrees
        const semesters = await getSemesters(selectedSchools, selectedDegrees);
        
        setData(prev => ({
          ...prev,
          semesters,
          // When degrees change, clear dependent filters
          years: [],
          subjects: []
        }))
        
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching semester data:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch semester data'))
        setIsLoading(false)
      }
    }
    
    fetchSemesterData()
  }, [selectedSchoolsStr, selectedDegreesStr, selectedSchools.length, selectedDegrees.length])
  
  // Fetch year data when selectedSemesters changes
  useEffect(() => {
    // Skip if relevant filters haven't changed or prerequisites aren't met
    if ((selectedSemestersStr === prevSelectedSemestersStr && prevSelectedSemestersStr !== "[]") || 
        selectedSchools.length === 0 || selectedDegrees.length === 0 || selectedSemesters.length === 0) {
      return;
    }
    
    // Update ref with current selectedSemesters
    prevSelectedSemestersRef.current = [...selectedSemesters];
    
    const fetchYearData = async () => {
      try {
        console.log('Fetching years for semesters:', selectedSemesters);
        setIsLoading(true)
        
        // Fetch years filtered by schools, degrees, and semesters
        const years = await getYears(selectedSchools, selectedDegrees, selectedSemesters);
        
        setData(prev => ({
          ...prev,
          years,
          // When semesters change, clear subjects
          subjects: []
        }))
        
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching year data:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch year data'))
        setIsLoading(false)
      }
    }
    
    fetchYearData()
  }, [
    selectedSchoolsStr, 
    selectedDegreesStr, 
    selectedSemestersStr, 
    selectedSchools.length, 
    selectedDegrees.length, 
    selectedSemesters.length
  ])
  
  // Fetch subject data when any relevant filter changes
  useEffect(() => {
    // More flexible subject fetching - fetch when we have at least school OR degree selected
    const hasMinimumForSubjects = selectedSchools.length > 0 || selectedDegrees.length > 0;
    
    // Skip if no meaningful filters are selected or if nothing has changed
    if (!hasMinimumForSubjects) {
      // Clear subjects if no meaningful filters
      setData(prev => ({ ...prev, subjects: [] }));
      return;
    }
    
    // Check if any relevant filter has changed
    const filtersChanged = 
      selectedSchoolsStr !== prevSelectedSchoolsStr ||
      selectedDegreesStr !== prevSelectedDegreesStr ||
      selectedSemestersStr !== prevSelectedSemestersStr ||
      selectedYearsStr !== prevSelectedYearsStr;
    
    if (!filtersChanged) {
      console.log('Skipping subjects fetch - no relevant filters changed');
      return;
    }
    
    // Update refs with current values
    prevSelectedSchoolsRef.current = [...selectedSchools];
    prevSelectedDegreesRef.current = [...selectedDegrees];
    prevSelectedSemestersRef.current = [...selectedSemesters];
    prevSelectedYearsRef.current = [...selectedYears];
    
    const fetchSubjectData = async () => {
      try {
        console.log('DEBUG - useFilterData - Fetching subjects with parameters:', {
          selectedSchools,
          selectedDegrees, 
          selectedSemesters,
          selectedYears,
          hasMinimumForSubjects
        });
        
        setIsLoading(true)
        
        // Fetch subjects filtered by available filters (allow partial selections)
        const subjects = await getSubjects(
          selectedSchools, 
          selectedDegrees, 
          selectedSemesters,
          selectedYears
        );
        
        console.log('DEBUG - useFilterData - Subject fetch result:', {
          receivedSubjectsCount: subjects.length,
          sampleSubjects: subjects.slice(0, 3)
        });
        
        setData(prev => ({
          ...prev,
          subjects
        }))
        
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching subject data:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch subject data'))
        setIsLoading(false)
      }
    }
    
    fetchSubjectData()
  }, [
    selectedSchoolsStr, 
    selectedDegreesStr, 
    selectedSemestersStr,
    selectedYearsStr,
    selectedSchools.length, 
    selectedDegrees.length, 
    selectedSemesters.length,
    selectedYears.length
  ])

  return {
    schools: data.schools,
    degrees: data.degrees,
    semesters: data.semesters,
    years: data.years,
    subjects: data.subjects,
    isLoading,
    error
  }
} 