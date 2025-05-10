"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, MapPin, School, BookOpen, ChevronDown, ChevronUp, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getExams } from "@/actions/exam-actions"

type Exam = {
  id: number | string;
  date: string;
  subject: string;
  code: string;
  time: string;
  location: string;
  year: string;
  semester: string;
  school: string;
  degree: string;
};

type SortField = "date" | "subject" | "time" | "location" | "year" | "semester"
type SortDirection = "asc" | "desc"

export function ExamListView({ activeFilters = {} }: { activeFilters?: Record<string, string[]> }) {
  const [exams, setExams] = useState<Exam[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [expandedExam, setExpandedExam] = useState<number | string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if ETSINF is in the schools filter
  const hasETSINFFilter = activeFilters?.school?.includes("ETSINF")

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true)
        console.log("ExamListView - Fetching with filters:", activeFilters)
        const data = await getExams(activeFilters)
        console.log(`ExamListView - Fetched ${data.length} exams:`, data.slice(0, 2)) // Log the first 2 exams
        setExams(data || [])
      } catch (error) {
        console.error("Error fetching exams:", error)
        setExams([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchExams()
  }, [activeFilters])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredExams = exams.filter((exam) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      exam.subject.toLowerCase().includes(query) ||
      (exam.code && exam.code.toLowerCase().includes(query)) ||
      exam.location.toLowerCase().includes(query) ||
      exam.school.toLowerCase().includes(query) ||
      exam.degree.toLowerCase().includes(query)
    )
  })

  const sortedExams = [...filteredExams].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case "subject":
        comparison = a.subject.localeCompare(b.subject)
        break
      case "time":
        comparison = a.time.localeCompare(b.time)
        break
      case "location":
        comparison = a.location.localeCompare(b.location)
        break
      case "year":
        comparison = String(a.year).localeCompare(String(b.year))
        break
      case "semester":
        comparison = String(a.semester).localeCompare(String(b.semester))
        break
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  const toggleExamDetails = (examId: number | string) => {
    setExpandedExam(expandedExam === examId ? null : examId)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search exams..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 px-0 font-medium"
                    onClick={() => handleSort("date")}
                  >
                    Date
                    {sortField === "date" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 px-0 font-medium"
                    onClick={() => handleSort("subject")}
                  >
                    Subject
                    {sortField === "subject" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 px-0 font-medium"
                    onClick={() => handleSort("time")}
                  >
                    Time
                    {sortField === "time" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 px-0 font-medium"
                    onClick={() => handleSort("location")}
                  >
                    Location
                    {sortField === "location" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead className="hidden xl:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 px-0 font-medium"
                    onClick={() => handleSort("year")}
                  >
                    Year
                    {sortField === "year" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead className="hidden xl:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 px-0 font-medium"
                    onClick={() => handleSort("semester")}
                  >
                    Semester
                    {sortField === "semester" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading exams...
                  </TableCell>
                </TableRow>
              ) : sortedExams.length > 0 ? (
                sortedExams.map((exam) => (
                  <TableRow key={exam.id} className="group">
                    <TableCell className="font-medium">
                      {new Date(exam.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{exam.subject}</span>
                        <span className="text-xs text-muted-foreground">{exam.code || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{exam.time}</TableCell>
                    <TableCell className="hidden lg:table-cell">{exam.location}</TableCell>
                    <TableCell className="hidden xl:table-cell">{exam.year}</TableCell>
                    <TableCell className="hidden xl:table-cell">{exam.semester}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 md:hidden"
                          onClick={() => toggleExamDetails(exam.id)}
                        >
                          {expandedExam === exam.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="sr-only">Toggle details</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden md:flex">
                              <ChevronDown className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Add to Calendar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {Object.keys(activeFilters).length > 0 ? 
                      "No exams found for the selected filters." :
                      "No exams found. Try selecting some filters."
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  )
}
