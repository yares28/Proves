"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getUserCalendars } from "@/actions/user-calendars"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Trash2, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MyCalendarsPage() {
  const { user } = useAuth()
  const [calendars, setCalendars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchCalendars() {
      if (!user?.id) {
        setCalendars([])
        setLoading(false)
        return
      }

      try {
        const data = await getUserCalendars(user.id)
        setCalendars(data)
      } catch (error) {
        console.error("Error fetching calendars:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCalendars()
  }, [user?.id])

  function handleViewCalendar(id: string, filters: any) {
    // Navigate to calendar page with filters
    router.push(`/?calendar=${id}`)
  }

  const months = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", 
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ]

  // If not logged in, prompt to log in
  if (!user && !loading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <h1 className="text-3xl font-bold">My Calendars</h1>
          <p className="text-muted-foreground">Please log in to view your saved calendars.</p>
          <Button onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="opacity-100">
        <h1 className="text-center text-3xl font-bold tracking-tight mb-8">MY CALENDARS</h1>

        <Tabs defaultValue="calendars" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="calendars">My Calendars</TabsTrigger>
            <TabsTrigger value="months">Months</TabsTrigger>
          </TabsList>

          <TabsContent value="calendars">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : calendars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {calendars.map((calendar) => (
                  <Card key={calendar.id} className="overflow-hidden border-2 hover:shadow-md transition-all">
                    <CardContent className="p-0">
                      <div className="flex flex-col h-[200px]">
                        <div className="flex-1 flex items-center justify-center p-6">
                          <h3 className="text-lg font-medium text-center">{calendar.name}</h3>
                        </div>
                        <div className="bg-muted/30 p-3 flex justify-between items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewCalendar(calendar.id, calendar.filters)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/10">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-2" />
                <h3 className="text-lg font-medium mb-1">No saved calendars</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't saved any exam calendars yet.
                </p>
                <Button onClick={() => router.push("/")}>
                  Create a Calendar
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="months">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {months.slice(0, 6).map((month) => (
                <Card key={month} className="overflow-hidden border-2 hover:shadow-md transition-all">
                  <CardContent className="p-0">
                    <div className="flex flex-col h-[180px]">
                      <div className="flex-1 flex items-center justify-center p-6">
                        <h3 className="text-xl font-medium text-center">{month}</h3>
                      </div>
                      <div className="bg-muted/30 p-3 flex justify-center items-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/?month=${month.toLowerCase()}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Month
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 