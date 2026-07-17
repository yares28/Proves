"use server"

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { User } from '@supabase/supabase-js'

type CalendarFilters = Record<string, string[]>

interface SaveCalendarParams {
  name: string
  filters: CalendarFilters
  userId: string
  accessToken?: string
  refreshToken?: string
}

/**
 * Creates a Supabase client authenticated as the current user and returns the
 * *server-validated* user. Authentication tokens are passed from the client and
 * applied with setSession; getUser() then re-validates them against the Supabase
 * auth server (unlike getSession(), which trusts local data). The returned
 * `user.id` is the only identity we trust for row ownership — never a client-
 * supplied id.
 */
async function getAuthedClient(
  accessToken?: string,
  refreshToken?: string
): Promise<{ supabase: SupabaseClient<Database>; user: User } | null> {
  const supabase = await createClient()

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (error) {
      // Expired/invalid tokens are an expected, recoverable condition.
      if (error.message.includes('JWT expired') || error.message.includes('Invalid')) {
        return null
      }
      throw new Error(`Auth token error: ${error.message}`)
    }
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return null
  }

  return { supabase, user }
}

/**
 * Server action to save a user calendar. The calendar is always stored against
 * the server-validated user id.
 */
export async function saveUserCalendar({ name, filters, userId, accessToken, refreshToken }: SaveCalendarParams) {
  if (!name?.trim()) {
    throw new Error('Calendar name is required')
  }

  const authed = await getAuthedClient(accessToken, refreshToken)
  if (!authed) {
    throw new Error('No valid session found. Please log in again.')
  }

  const { supabase, user } = authed

  // Defense in depth: the client-supplied id must match the authenticated user.
  if (userId && userId !== user.id) {
    throw new Error('User authentication failed: session user does not match request user')
  }

  const { data, error } = await supabase
    .from('user_calendars')
    .insert({
      name,
      filters,
      user_id: user.id,
      created_at: new Date().toISOString(),
    })
    .select()

  if (error) {
    if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('JWTError')) {
      throw new Error('Authentication error: Permission denied. Please log in again.')
    }
    if (error.code === '23505') {
      throw new Error('A calendar with this name already exists')
    }
    throw new Error(`Database error: ${error.message}`)
  }

  return data
}

export async function getUserCalendars(userId: string, accessToken?: string, refreshToken?: string) {
  try {
    const authed = await getAuthedClient(accessToken, refreshToken)
    if (!authed) {
      // Return empty rather than throwing for better UX when the session lapses.
      return []
    }

    const { supabase, user } = authed

    const { data, error } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST301' || error.message.includes('JWT expired')) {
        return []
      }
      throw new Error('Failed to fetch calendars')
    }

    return data || []
  } catch (error) {
    if (error instanceof Error && (error.message.includes('JWT expired') || error.message.includes('Auth token error'))) {
      return []
    }
    throw new Error('Failed to fetch calendars')
  }
}

export async function getUserCalendarNames(userId: string, accessToken?: string, refreshToken?: string) {
  try {
    const authed = await getAuthedClient(accessToken, refreshToken)
    if (!authed) {
      return []
    }

    const { supabase, user } = authed

    const { data, error } = await supabase
      .from('user_calendars')
      .select('name')
      .eq('user_id', user.id)

    if (error) {
      if (error.code === 'PGRST301' || error.message.includes('JWT expired')) {
        return []
      }
      throw new Error('Failed to fetch calendar names')
    }

    return (data || []).map(cal => cal.name as string)
  } catch (error) {
    if (error instanceof Error && (error.message.includes('JWT expired') || error.message.includes('Auth token error'))) {
      return []
    }
    throw new Error('Failed to fetch calendar names')
  }
}

export async function deleteUserCalendar(calendarId: string, userId: string, accessToken?: string, refreshToken?: string) {
  try {
    if (!calendarId) {
      throw new Error('Calendar ID is required')
    }

    const authed = await getAuthedClient(accessToken, refreshToken)
    if (!authed) {
      throw new Error('No valid session found. Please log in again.')
    }

    const { supabase, user } = authed

    // Scope the delete to the authenticated user's own rows.
    const { error } = await supabase
      .from('user_calendars')
      .delete()
      .eq('id', calendarId)
      .eq('user_id', user.id)

    if (error) {
      if (error.code === 'PGRST301' || error.message.includes('JWT expired')) {
        throw new Error('Session expired. Please log in again.')
      }
      throw new Error('Failed to delete calendar')
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error && (error.message.includes('JWT expired') || error.message.includes('Auth token error'))) {
      throw new Error('Session expired. Please log in again.')
    }
    throw new Error('Failed to delete calendar')
  }
}
