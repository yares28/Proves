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
      console.log('🔄 [SERVER] Setting session with provided auth tokens:', accessToken.substring(0, 10) + '...');
      
      try {
        // Set the session using the provided tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (error) {
          console.error('❌ [SERVER] Error setting session with tokens:', error);
          throw new Error(`Auth token error: ${error.message}`);
        }
        
        console.log('✅ [SERVER] Session set using provided tokens:', {
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

export async function getUserCalendars(userId: string) {
  try {
    if (!userId) {
      return []
    }
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching calendars:', error)
      throw new Error('Failed to fetch calendars')
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getUserCalendars:', error)
    throw new Error('Failed to fetch calendars')
  }
}

export async function getUserCalendarNames(userId: string) {
  try {
    if (!userId) {
      return []
    }
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('user_calendars')
      .select('name')
      .eq('user_id', userId)
    
    if (error) {
      console.error('Error fetching calendar names:', error)
      throw new Error('Failed to fetch calendar names')
    }
    
    // Extract array of names from the result
    return (data || []).map(cal => cal.name as string)
  } catch (error) {
    console.error('Error in getUserCalendarNames:', error)
    throw new Error('Failed to fetch calendar names')
  }
}

export async function deleteUserCalendar(calendarId: string, userId: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('user_calendars')
      .delete()
      .eq('id', calendarId)
      .eq('user_id', userId) // Security check to ensure users can only delete their own calendars
    
    if (error) {
      console.error('Error deleting calendar:', error)
      throw new Error('Failed to delete calendar')
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in deleteUserCalendar:', error)
    throw new Error('Failed to delete calendar')
  }
} 