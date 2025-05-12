import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteUserCalendar } from "@/actions/user-calendars";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const calendarId = params.id;
    
    // Get the current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(new URL("/my-calendars", request.url));
    }
    
    // Delete the calendar
    await deleteUserCalendar(calendarId, user.id);
    
    // Redirect back to My Calendars page
    return NextResponse.redirect(new URL("/my-calendars", request.url));
  } catch (error) {
    console.error("Error deleting calendar:", error);
    return NextResponse.redirect(new URL("/my-calendars", request.url));
  }
} 