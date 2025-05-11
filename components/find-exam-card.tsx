"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getSchools } from "@/actions/exam-actions"

export function FindExamCard() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [school, setSchool] = useState("")
  const [schools, setSchools] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSchools() {
      try {
        setLoading(true)
        const schoolsData = await getSchools()
        console.log("Fetched schools:", schoolsData)
        setSchools(schoolsData)
        setFetchError(null)
      } catch (error) {
        console.error("Error fetching schools:", error)
        setFetchError("Failed to load schools. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchSchools()
  }, [])

  const validateAcronym = (value: string) => {
    return value.trim().length > 0 && value.trim().length <= 10;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedQuery = searchQuery.trim().toUpperCase();
    
    // Validate acronym
    if (!validateAcronym(trimmedQuery)) {
      setError("Please enter a valid acronym (1-10 characters)");
      return;
    }
    
    setError("");
    const params = new URLSearchParams()

    // Change parameter name from 'q' to 'acronym' to be more specific
    params.append("acronym", trimmedQuery)
    if (school && school !== "all") params.append("school", school)

    router.push(`/exams?${params.toString()}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="overflow-hidden border-none bg-white/90 shadow-xl backdrop-blur-sm dark:bg-emerald-950/80">
        <CardHeader className="bg-primary/5 pb-4 pt-6">
          <CardTitle className="flex items-center justify-center gap-2 text-xl font-medium">
            <Search className="h-5 w-5 text-primary" />
            Find Your Exam
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSearch}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">
                  Search by acronym
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="e.g. MAD, IIP, ..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setError("")
                    }}
                  />
                </div>
                {error && (
                  <p className="text-sm font-medium text-destructive">{error}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="school" className="text-sm font-medium">
                  School
                </Label>
                <Select value={school} onValueChange={setSchool} disabled={loading}>
                  <SelectTrigger id="school" className="w-full">
                    <SelectValue placeholder={loading ? "Loading schools..." : "Select school"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Schools</SelectItem>
                    {loading ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                        <span>Loading schools...</span>
                      </div>
                    ) : fetchError ? (
                      <div className="p-2 text-sm text-destructive">{fetchError}</div>
                    ) : schools.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No schools found</div>
                    ) : (
                      schools.map((schoolName) => (
                        <SelectItem key={schoolName} value={schoolName}>
                          {schoolName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!loading && (
                  <p className="text-xs text-muted-foreground">
                    {schools.length} schools available
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-primary/5 px-6 py-4">
            <Button 
              type="submit" 
              className="w-full shadow-md transition-all hover:shadow-lg" 
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Search Exams"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}
