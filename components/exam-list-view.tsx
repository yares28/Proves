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

  // Check if filters are meaningful (beyond just school/degree)
  const hasMeaningfulFilters = () => {
    if (!activeFilters || Object.keys(activeFilters).length === 0) {
      return false;
    }
    
    // Check if there are any filters other than school and degree
    const meaningfulFilterKeys = Object.keys(activeFilters).filter(key => 
      key !== 'school' && key !== 'degree' && 
      activeFilters[key] && activeFilters[key].length > 0
    );
    
    return meaningfulFilterKeys.length > 0;
  };

  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true)
      
      // Only fetch exams if we have meaningful filters
      if (!hasMeaningfulFilters()) {
        console.log("ExamListView - No meaningful filters selected, clearing exams")
        setExams([])
        setIsLoading(false)
        return
      }

      try {
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
          placeholder="Buscar exámenes..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table with sticky header */}
      <div className="rounded-lg border shadow-sm">
        {/* Table container with fixed height and overflow */}
        <div className="overflow-hidden">
          <div className={sortedExams.length > 100 ? "max-h-[600px] overflow-y-auto" : ""}>
            <table className="w-full border-collapse">
              {/* Sticky header */}
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b m-0">
                  <th className="p-4 text-left font-medium w-[120px]">
                    <button 
                      className="flex items-center text-sm font-medium hover:text-primary"
                      onClick={() => handleSort("date")}
                    >
                      Fecha
                      {sortField === "date" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-left font-medium">
                    <button 
                      className="flex items-center text-sm font-medium hover:text-primary"
                      onClick={() => handleSort("subject")}
                    >
                      Asignatura
                      {sortField === "subject" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-left font-medium hidden md:table-cell">
                    <button 
                      className="flex items-center text-sm font-medium hover:text-primary"
                      onClick={() => handleSort("time")}
                    >
                      Hora
                      {sortField === "time" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-left font-medium hidden lg:table-cell">
                    <button 
                      className="flex items-center text-sm font-medium hover:text-primary"
                      onClick={() => handleSort("location")}
                    >
                      Ubicación
                      {sortField === "location" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-left font-medium hidden xl:table-cell">
                    <button 
                      className="flex items-center text-sm font-medium hover:text-primary"
                      onClick={() => handleSort("year")}
                    >
                      Año
                      {sortField === "year" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-left font-medium hidden xl:table-cell">
                    <button 
                      className="flex items-center text-sm font-medium hover:text-primary"
                      onClick={() => handleSort("semester")}
                    >
                      Semestre
                      {sortField === "semester" && (
                        sortDirection === "asc" ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="h-24 text-center border-b p-4">
                      Cargando exámenes...
                    </td>
                  </tr>
                ) : sortedExams.length > 0 ? (
                  sortedExams.map((exam) => (
                    <tr key={exam.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">
                        {new Date(exam.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span>{exam.subject}</span>
                          <span className="text-xs text-muted-foreground">{exam.code || "-"}</span>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">{exam.time}</td>
                      <td className="p-4 hidden lg:table-cell">{exam.location}</td>
                      <td className="p-4 hidden xl:table-cell">{exam.year}</td>
                      <td className="p-4 hidden xl:table-cell">{exam.semester}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="h-24 text-center border-b p-4">
                      {!hasMeaningfulFilters() ? 
                        "Selecciona tu año, semestre o asignaturas específicas para ver los exámenes." :
                        "No se encontraron exámenes para los filtros seleccionados."
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
