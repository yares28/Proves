"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, MapPin, School, BookOpen, ChevronDown, ChevronUp, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSettings } from "@/context/settings-context"
import { useTranslations } from "@/hooks/use-translations"
import { examSubject } from "@/lib/i18n"
import type { Exam } from "@/types/exam"

type SortField = "date" | "subject" | "time" | "location" | "year" | "semester"
type SortDirection = "asc" | "desc"

/**
 * The list rendering of the same exams the calendar shows. It used to re-fetch
 * them with the identical filters its parent had already resolved; now they are
 * passed in.
 */
export function ExamListView({
  exams = [],
  isLoading = false,
}: {
  exams?: Exam[]
  isLoading?: boolean
}) {
  const { settings } = useSettings()
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [expandedExam, setExpandedExam] = useState<number | string | null>(null)

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
      // Search every language, not just the one on screen: students mix them.
      exam.subject.toLowerCase().includes(query) ||
      (exam.subject_va?.toLowerCase().includes(query) ?? false) ||
      (exam.subject_en?.toLowerCase().includes(query) ?? false) ||
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
          placeholder={t("list.search")}
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
                      {t("list.colDate")}
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
                      {t("list.colSubject")}
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
                      {t("list.colTime")}
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
                      {t("list.colLocation")}
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
                      {t("list.colYear")}
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
                      {t("list.colSemester")}
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
                          <span>{examSubject(exam, settings.language)}</span>
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
                      {searchQuery
                        ? t("list.noMatch")
                        : t("list.selectCriteria")}
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
