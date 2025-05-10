"use server"

import { supabase } from "@/lib/supabase"
import type { ExamFilters } from "@/types/exam"

export async function getExams(filters: ExamFilters = {}) {
  try {
    const { data, error } = await supabase
      .from('ETSINF')
      .select('*')
      .order('date', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching exams:', error)
    return []
  }
}

export async function getDegrees(school?: string) {
  try {
    console.log('Fetching degrees from Supabase...')
    
    let query = supabase
      .from('ETSINF')
      .select('degree')
      .order('degree', { ascending: true })

    // If a school is specified, filter degrees for that school
    if (school && school !== "all") {
      query = query.eq('school', school)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error fetching degrees:', error)
      throw error
    }

    console.log('Raw degrees data:', data)
    const degrees = [...new Set(data.map(row => row.degree))]
    console.log('Processed degrees:', degrees)
    return degrees
  } catch (error) {
    console.error('Error fetching degrees:', error)
    return []
  }
}

export async function getTableNames() {
  try {
    console.log('Fetching schools from Supabase...')
    const { data, error } = await supabase
      .from('ETSINF')
      .select('school')
      .order('school', { ascending: true })

    if (error) {
      console.error('Supabase error fetching schools:', error)
      throw error
    }

    console.log('Raw schools data:', data)
    const schools = [...new Set(data.map(row => row.school))]
    console.log('Processed schools:', schools)
    return schools
  } catch (error) {
    console.error('Error fetching schools:', error)
    return []
  }
}

export async function getSemesters(school?: string) {
  try {
    console.log('Fetching semesters from Supabase...')
    let query = supabase
      .from('ETSINF')
      .select('semester')
      .order('semester', { ascending: true })

    if (school && school !== "all") {
      query = query.eq('school', school)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error fetching semesters:', error)
      throw error
    }

    console.log('Raw semesters data:', data)
    const semesters = [...new Set(data.map(row => row.semester))]
    console.log('Processed semesters:', semesters)
    return semesters
  } catch (error) {
    console.error('Error fetching semesters:', error)
    return []
  }
}

export async function getYears(school?: string) {
  try {
    console.log('Fetching years from Supabase...')
    let query = supabase
      .from('ETSINF')
      .select('year')
      .order('year', { ascending: true })

    if (school && school !== "all") {
      query = query.eq('school', school)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error fetching years:', error)
      throw error
    }

    console.log('Raw years data:', data)
    const years = [...new Set(data.map(row => row.year))]
    console.log('Processed years:', years)
    return years
  } catch (error) {
    console.error('Error fetching years:', error)
    return []
  }
}

export async function getSubjects(school?: string) {
  try {
    console.log('Fetching subjects from Supabase...')
    let query = supabase
      .from('ETSINF')
      .select('subject, acronym')
      .order('subject', { ascending: true })

    if (school && school !== "all") {
      query = query.eq('school', school)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error fetching subjects:', error)
      throw error
    }

    console.log('Raw subjects data:', data)
    
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
    
    console.log('Processed subjects:', uniqueSubjects)
    return uniqueSubjects
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return []
  }
}
