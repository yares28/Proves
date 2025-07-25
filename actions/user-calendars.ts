"use server"

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'
import { cookies } from 'next/headers'

// Remove headers import since we can't rely on it in server actions
// import { headers } from 'next/headers'

type CalendarFilters = Record<string, string[]>

interface SaveCalendarParams {
  name: string
  filters: CalendarFilters
  userId: string
  accessToken?: string
  refreshToken?: string
}

/**
 * Server action to save a user calendar.
 * Includes comprehensive authentication validation and error handling.
 */
export async function saveUserCalendar({ name, filters, userId, accessToken, refreshToken }: SaveCalendarParams) {
  console.log('🔄 [SERVER] saveUserCalendar called');
  console.log('📋 Request details:', {
    name,
    userId,
    filtersCount: Object.keys(filters).length,
    accessTokenProvided: !!accessToken,
    refreshTokenProvided: !!refreshToken
  });
  
  try {
    // Input validation
    if (!name?.trim()) {
      console.log('❌ [SERVER] Calendar name validation failed');
      throw new Error('Calendar name is required');
    }
    
    if (!userId) {
      console.log('❌ [SERVER] User ID validation failed');
      throw new Error('User ID is required to save calendar');
    }
    
    console.log('✅ [SERVER] Input validation passed');
    
    // Create server client
    console.log('🔄 [SERVER] Creating Supabase client');
    const supabase = await createClient();
    
    // If auth tokens were explicitly passed, use them to set the session
    if (accessToken && refreshToken) {
      console.log('🔄 [SERVER] Setting session with provided auth tokens (token details redacted for security)');
      
      try {
        // Set the session using the provided tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) {
          console.error('❌ [SERVER] Error setting session with tokens (error details may contain sensitive data):', error.message);
          throw new Error(`Auth token error: ${error.message}`);
        }
        
        console.log('✅ [SERVER] Session set successfully:', {
          user: data?.user?.id,
          hasSession: !!data?.session
        });
      } catch (e) {
        console.error('❌ [SERVER] Error setting session with token:', e);
        throw e;
      }
    } else {
      console.log('⚠️ [SERVER] Missing auth tokens, authentication will likely fail');
    }
    
    // Obtain and validate session
    console.log('🔍 [SERVER] Verifying authentication session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ [SERVER] Session error:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error('❌ [SERVER] No valid session found');
      throw new Error('No valid session found. Please log in again.');
    }
    
    console.log('✅ [SERVER] Valid session found for user:', session.user.id);
    
    // Validate that the session user matches the requested user ID
    if (session.user.id !== userId) {
      console.error('❌ [SERVER] User ID mismatch:');
      console.error(`- Request user ID: ${userId}`);
      console.error(`- Session user ID: ${session.user.id}`);
      throw new Error('User authentication failed: Session user does not match request user');
    }
    
    console.log('✅ [SERVER] User authentication confirmed');
    console.log('🔄 [SERVER] Saving calendar to database');
    
    // Debug: Log the filters being saved
    console.log('🔍 [DEBUG] Filters being saved:', {
      filters,
      filtersType: typeof filters,
      filtersKeys: Object.keys(filters || {}),
      filtersStringified: JSON.stringify(filters)
    });
    
    // Insert the calendar with proper error handling
    const { data, error } = await supabase
      .from('user_calendars')
      .insert({
        name,
        filters,
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      .select();
    
    if (error) {
      console.error('❌ [SERVER] Database error saving calendar:', error);
      
      // Classify the error for better user feedback
      if (error.code === '42501' || 
          error.message.includes('permission denied') || 
          error.message.includes('JWTError')) {
        console.log('⚠️ [SERVER] Authentication error detected in database response');
        throw new Error('Authentication error: Permission denied. Please log in again.');
      }
      
      if (error.code === '23505') {
        console.log('⚠️ [SERVER] Duplicate calendar detected');
        throw new Error('A calendar with this name already exists');
      }
      
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('✅ [SERVER] Calendar saved successfully', {
      id: data?.[0]?.id,
      name: data?.[0]?.name
    });
    return data;
  } catch (error: any) {
    console.error('❌ [SERVER] saveUserCalendar failed:', error);
    
    // Provide clear error message for client
    if (error.message) {
      throw new Error(`Failed to save calendar: ${error.message}`);
    } else {
      throw new Error('Failed to save calendar: Unknown error');
    }
  }
}

export async function getUserCalendars(userId: string, accessToken?: string, refreshToken?: string) {
  console.log('🔄 [SERVER] getUserCalendars called with:', {
    userId,
    accessTokenProvided: !!accessToken,
    refreshTokenProvided: !!refreshToken
  });
  
  try {
    if (!userId) {
      console.log('⚠️ [SERVER] No userId provided, returning empty array');
      return []
    }
    
    console.log('🔄 [SERVER] Creating Supabase client');
    const supabase = await createClient()
    
    // If auth tokens were provided, use them to set the session
    if (accessToken && refreshToken) {
      console.log('🔄 [SERVER] Setting session with provided auth tokens (details redacted)');
      
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) {
          console.error('❌ [SERVER] Error setting session (sensitive details redacted):', error.message);
          throw new Error(`Auth token error: ${error.message}`);
        }
        
        console.log('✅ [SERVER] Session set successfully');
      } catch (e) {
        console.error('❌ [SERVER] Error setting session (sensitive details redacted)');
        throw e;
      }
    } else {
      console.log('⚠️ [SERVER] No auth tokens provided, using existing session');
    }
    
    // Verify session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ [SERVER] Session error:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }
    
    if (!session) {
      console.log('⚠️ [SERVER] No valid session found');
      // Don't throw error, just return empty array for better UX
      return []
    }
    
    console.log('✅ [SERVER] Valid session found, fetching calendars');
    
    const { data, error } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ [SERVER] Error fetching calendars:', error)
      
      // Handle JWT expired error gracefully
      if (error.code === 'PGRST301' || error.message.includes('JWT expired')) {
        console.log('⚠️ [SERVER] JWT expired, returning empty array');
        return []
      }
      
      throw new Error('Failed to fetch calendars')
    }
    
    console.log('✅ [SERVER] Calendars fetched successfully:', data?.length || 0);
    
    return data || []
  } catch (error) {
    console.error('❌ [SERVER] Error in getUserCalendars:', error)
    
    // Handle JWT expired error gracefully - return empty array instead of throwing
    if (error instanceof Error && (error.message.includes('JWT expired') || error.message.includes('Auth token error'))) {
      console.log('⚠️ [SERVER] JWT/Auth error detected, returning empty array for better UX');
      return []
    }
    
    throw new Error('Failed to fetch calendars')
  }
}

export async function getUserCalendarNames(userId: string, accessToken?: string, refreshToken?: string) {
  console.log('🔄 [SERVER] getUserCalendarNames called with:', {
    userId,
    accessTokenProvided: !!accessToken,
    refreshTokenProvided: !!refreshToken
  });
  
  try {
    if (!userId) {
      console.log('⚠️ [SERVER] No userId provided, returning empty array');
      return []
    }
    
    console.log('🔄 [SERVER] Creating Supabase client');
    const supabase = await createClient()
    
    // If auth tokens were provided, use them to set the session
    if (accessToken && refreshToken) {
      console.log('🔄 [SERVER] Setting session with provided auth tokens (details redacted)');
      
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) {
          console.error('❌ [SERVER] Error setting session (sensitive details redacted):', error.message);
          throw new Error(`Auth token error: ${error.message}`);
        }
        
        console.log('✅ [SERVER] Session set successfully');
      } catch (e) {
        console.error('❌ [SERVER] Error setting session (sensitive details redacted)');
        throw e;
      }
    } else {
      console.log('⚠️ [SERVER] No auth tokens provided, using existing session');
    }
    
    // Verify session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ [SERVER] Session error:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }
    
    if (!session) {
      console.log('⚠️ [SERVER] No valid session found');
      // Don't throw error, just return empty array for better UX
      return []
    }
    
    console.log('✅ [SERVER] Valid session found, fetching calendar names');
    
    const { data, error } = await supabase
      .from('user_calendars')
      .select('name')
      .eq('user_id', userId)
    
    if (error) {
      console.error('❌ [SERVER] Error fetching calendar names:', error)
      
      // Handle JWT expired error gracefully
      if (error.code === 'PGRST301' || error.message.includes('JWT expired')) {
        console.log('⚠️ [SERVER] JWT expired, returning empty array');
        return []
      }
      
      throw new Error('Failed to fetch calendar names')
    }
    
    console.log('✅ [SERVER] Calendar names fetched successfully:', data?.length || 0);
    
    // Extract array of names from the result
    return (data || []).map(cal => cal.name as string)
  } catch (error) {
    console.error('❌ [SERVER] Error in getUserCalendarNames:', error)
    
    // Handle JWT expired error gracefully - return empty array instead of throwing
    if (error instanceof Error && (error.message.includes('JWT expired') || error.message.includes('Auth token error'))) {
      console.log('⚠️ [SERVER] JWT/Auth error detected, returning empty array for better UX');
      return []
    }
    
    throw new Error('Failed to fetch calendar names')
  }
}

export async function deleteUserCalendar(calendarId: string, userId: string, accessToken?: string, refreshToken?: string) {
  console.log('🔄 [SERVER] deleteUserCalendar called with:', {
    calendarId,
    userId,
    accessTokenProvided: !!accessToken,
    refreshTokenProvided: !!refreshToken
  });
  
  try {
    if (!calendarId || !userId) {
      console.log('❌ [SERVER] Missing required parameters');
      throw new Error('Calendar ID and User ID are required');
    }
    
    console.log('🔄 [SERVER] Creating Supabase client');
    const supabase = await createClient()
    
    // If auth tokens were provided, use them to set the session
    if (accessToken && refreshToken) {
      console.log('🔄 [SERVER] Setting session with provided auth tokens (details redacted)');
      
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) {
          console.error('❌ [SERVER] Error setting session (sensitive details redacted):', error.message);
          throw new Error(`Auth token error: ${error.message}`);
        }
        
        console.log('✅ [SERVER] Session set successfully');
      } catch (e) {
        console.error('❌ [SERVER] Error setting session (sensitive details redacted)');
        throw e;
      }
    } else {
      console.log('⚠️ [SERVER] No auth tokens provided, using existing session');
    }
    
    // Verify session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ [SERVER] Session error:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }
    
    if (!session) {
      console.log('❌ [SERVER] No valid session found');
      throw new Error('No valid session found. Please log in again.');
    }
    
    console.log('✅ [SERVER] Valid session found, deleting calendar');
    
    const { error } = await supabase
      .from('user_calendars')
      .delete()
      .eq('id', calendarId)
      .eq('user_id', userId) // Security check to ensure users can only delete their own calendars
    
    if (error) {
      console.error('❌ [SERVER] Error deleting calendar:', error)
      
      // Handle JWT expired error gracefully
      if (error.code === 'PGRST301' || error.message.includes('JWT expired')) {
        console.log('⚠️ [SERVER] JWT expired');
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error('Failed to delete calendar')
    }
    
    console.log('✅ [SERVER] Calendar deleted successfully');
    
    return { success: true }
  } catch (error) {
    console.error('❌ [SERVER] Error in deleteUserCalendar:', error)
    
    // Handle JWT expired error gracefully
    if (error instanceof Error && (error.message.includes('JWT expired') || error.message.includes('Auth token error'))) {
      console.log('⚠️ [SERVER] JWT/Auth error detected');
      throw new Error('Session expired. Please log in again.');
    }
    
    throw new Error('Failed to delete calendar')
  }
} 