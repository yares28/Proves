import { NextRequest, NextResponse } from 'next/server'

// Serverless-compatible token storage using global object with TTL
// This approach works better than Map for serverless functions
declare global {
  var tokenCache: { [key: string]: { queryString: string; expires: number } } | undefined;
}

// Initialize global token cache if it doesn't exist
if (!global.tokenCache) {
  global.tokenCache = {};
}

// Clean up expired tokens periodically
function cleanupExpiredTokens() {
  if (!global.tokenCache) return;
  
  const now = Date.now();
  const expired = Object.keys(global.tokenCache).filter(
    token => global.tokenCache![token].expires < now
  );
  
  expired.forEach(token => {
    delete global.tokenCache![token];
  });
  
  if (expired.length > 0) {
    console.log(`🧹 [TOKEN-STORE] Cleaned up ${expired.length} expired tokens`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, queryString } = await request.json();
    
    if (!token || !queryString) {
      return new NextResponse('Missing token or queryString', { status: 400 });
    }
    
    // Clean up expired tokens first
    cleanupExpiredTokens();
    
    // Store the mapping with 24-hour TTL
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    global.tokenCache![token] = { queryString, expires };
    
    console.log(`🔑 [TOKEN-STORE] Stored mapping: ${token} -> ${queryString} (expires: ${new Date(expires).toISOString()})`);
    
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error storing token mapping:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Get query string from token
export function getQueryStringFromToken(token: string): string | null {
  console.log(`🔍 [TOKEN-STORE] Looking up token: ${token}`);
  
  if (!global.tokenCache) {
    console.error(`❌ [TOKEN-STORE] Global token cache not initialized`);
    return null;
  }
  
  const totalTokens = Object.keys(global.tokenCache).length;
  console.log(`📊 [TOKEN-STORE] Total tokens in cache: ${totalTokens}`);
  
  const entry = global.tokenCache[token];
  if (!entry) {
    console.error(`❌ [TOKEN-STORE] Token ${token} not found in cache`);
    console.log(`🔑 [TOKEN-STORE] Available tokens:`, Object.keys(global.tokenCache).slice(0, 5));
    return null;
  }
  
  // Check if token has expired
  if (entry.expires < Date.now()) {
    delete global.tokenCache[token];
    console.log(`⏰ [TOKEN-STORE] Token ${token} expired and removed`);
    return null;
  }
  
  console.log(`✅ [TOKEN-STORE] Token ${token} found, returning query string`);
  return entry.queryString;
}