"use server"

import { supabase } from "@/lib/supabase"

// This file provides utility functions to check the table structure in Supabase

export async function checkTableStructure() {
  try {
    console.log('Checking ETSINF table structure...')
    
    // First check if the table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tableError) {
      console.error('Error checking tables:', tableError)
      return { error: tableError.message, data: null }
    }
    
    console.log('Available tables:', tables.map(t => t.table_name))
    
    // Check ETSINF table columns
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'ETSINF')
      .eq('table_schema', 'public')
    
    if (columnError) {
      console.error('Error checking columns:', columnError)
      return { error: columnError.message, data: null }
    }
    
    console.log('ETSINF table columns:', columns)
    
    // Get a small sample of data from the table
    const { data: sample, error: sampleError } = await supabase
      .from('ETSINF')
      .select('*')
      .limit(3)
    
    if (sampleError) {
      console.error('Error getting sample data:', sampleError)
      return { error: sampleError.message, data: null }
    }
    
    console.log('ETSINF sample data:', sample)
    
    return {
      error: null,
      data: {
        tables,
        columns,
        sample
      }
    }
  } catch (error) {
    console.error('Error in table check:', error)
    return { 
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}

export async function runDirectQuery() {
  try {
    // Try a direct query using SQL
    const { data, error } = await supabase.rpc('run_sql_query', {
      query_text: `
        SELECT * FROM "ETSINF" 
        WHERE school = 'ETSINF' 
        AND degree = 'GIINF' 
        AND semester = 'A' 
        AND year = 1 
        LIMIT 5
      `
    })
    
    if (error) {
      console.error('Error running SQL query:', error)
      return { error: error.message, data: null }
    }
    
    console.log('Direct SQL query results:', data)
    
    return {
      error: null,
      data
    }
  } catch (error) {
    console.error('Error running direct query:', error)
    return { 
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
} 