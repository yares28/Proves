"use server"

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * Server action to test if authentication is working
 * This can help diagnose issues with client-server auth synchronization
 */
export async function testServerAuth(authToken?: string) {
  console.log('🔍 [SERVER] Running server authentication test');
  console.log('Token provided directly:', authToken ? 'yes (details redacted)' : 'no');
  
  try {
    // Create server client
    const supabase = await createClient();
    
    // If token was provided, set it explicitly
    if (authToken) {
      await supabase.auth.setSession({
        access_token: authToken,
        refresh_token: ''
      });
      console.log('✅ [SERVER] Manually set provided auth token');
    }
    
    // Try to get a session using the server client
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('✅ [SERVER] Valid session found for user:', session.user.id);
      return {
        success: true,
        userId: session.user.id,
        message: 'Authentication is working correctly'
      };
    } else {
      console.log('❌ [SERVER] No valid session found');
      
      // Check some cookie information without relying on has/get methods
      const cookieList = cookies();
      
      try {
        // Note: this try-catch is because cookies() API can be tricky in Next.js
        const cookieHeader = cookieList.toString();
        console.log('🍪 [SERVER] Raw cookie header:', cookieHeader || 'none');
      } catch (e) {
        console.error('Error accessing cookies:', e);
      }
      
      return {
        success: false,
        message: 'No valid session found'
      };
    }
  } catch (error) {
    console.error('❌ [SERVER] Error testing authentication:', error);
    return {
      success: false,
      message: 'Error testing authentication: ' + (error as Error).message
    };
  }
} 