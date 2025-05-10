"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface FindExamCardProps {
  degrees: string[]
}

export function FindExamCard({ degrees }: FindExamCardProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [degree, setDegree] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()

    if (searchQuery) params.append("q", searchQuery)
    if (degree) params.append("degree", degree)

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
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">
                Search by subject or code
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="e.g. Calculus, CAL101..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="degree" className="text-sm font-medium">
                Degree
              </Label>
              <Select value={degree} onValueChange={setDegree}>
                <SelectTrigger id="degree" className="w-full">
                  <SelectValue placeholder="Select degree" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Degrees</SelectItem>
                  {degrees.map((degree) => (
                    <SelectItem key={degree} value={degree}>
                      {degree}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-primary/5 px-6 py-4">
          <Button type="submit" className="w-full shadow-md transition-all hover:shadow-lg" onClick={handleSearch}>
            Search Exams
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
