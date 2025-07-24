import { NextRequest, NextResponse } from 'next/server'

// In-memory token storage (in production, use Redis or database)
const tokenStore = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { token, queryString } = await request.json();
    
    if (!token || !queryString) {
      return new NextResponse('Missing token or queryString', { status: 400 });
    }
    
    // Store the mapping
    tokenStore.set(token, queryString);
    
    console.log(`🔑 [TOKEN-STORE] Stored mapping: ${token} -> ${queryString}`);
    
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error storing token mapping:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Export the token store for use in other routes
export { tokenStore };