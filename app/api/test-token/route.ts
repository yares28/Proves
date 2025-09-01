import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const calendarId = '1ec27832-501f-44d7-ba76-bbb35ce87566'
    const userId = 'b261622c-d270-4185-9573-55840df7fe46'
    
    // Generate token manually to test
    const timestamp = Date.now().toString()
    const tokenData = `${calendarId}:${userId}:${timestamp}`
    
    console.log('🧪 [Test Token] Raw token data:', tokenData)
    
    const token = Buffer.from(tokenData).toString('base64')
    
    console.log('🧪 [Test Token] Generated token:', token)
    
    // Test decoding immediately
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')
    
    console.log('🧪 [Test Token] Decoded back:', decoded)
    console.log('🧪 [Test Token] Parts:', parts)
    
    const testUrl = `https://upv-cal.vercel.app/api/calendars/${calendarId}/ical-simple?token=${encodeURIComponent(token)}`
    
    return NextResponse.json({
      success: true,
      originalData: tokenData,
      generatedToken: token,
      decodedBack: decoded,
      parts: parts,
      testUrl: testUrl
    })
    
  } catch (error) {
    console.error('🧪 [Test Token] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
