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
import { getSchools, getDegrees } from "@/actions/exam-actions"

export function FindExamCard() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [school, setSchool] = useState("")
  const [degree, setDegree] = useState("")
  const [schools, setSchools] = useState<string[]>([])
  const [degrees, setDegrees] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDegrees, setLoadingDegrees] = useState(false)
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
        setFetchError("Error al cargar las escuelas. Por favor intenta de nuevo.")
      } finally {
        setLoading(false)
      }
    }

    fetchSchools()
  }, [])

  // Fetch degrees when school changes
  useEffect(() => {
    async function fetchDegrees() {
      if (!school || school === "all") {
        setDegrees([])
        setDegree("")
        return
      }

      try {
        setLoadingDegrees(true)
        const degreesData = await getDegrees(school)
        console.log("Fetched degrees for school:", school, degreesData)
        setDegrees(degreesData)
      } catch (error) {
        console.error("Error fetching degrees:", error)
        setDegrees([])
      } finally {
        setLoadingDegrees(false)
      }
    }

    fetchDegrees()
  }, [school])

  const validateAcronym = (value: string) => {
    return value.trim().length > 0 && value.trim().length <= 10;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedQuery = searchQuery.trim().toUpperCase();
    
    // Validate acronym
    if (!validateAcronym(trimmedQuery)) {
      setError("Por favor ingresa un acrónimo válido (1-10 caracteres)");
      return;
    }
    
    setError("");
    const params = new URLSearchParams()

    // Change parameter name from 'q' to 'acronym' to be more specific
    params.append("acronym", trimmedQuery)
    if (school && school !== "all") params.append("school", school)
    if (degree && degree !== "all") params.append("degree", degree)

    router.push(`/exams?${params.toString()}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="overflow-hidden border-none bg-white/90 shadow-xl backdrop-blur-sm dark:bg-emerald-950/80">
        <CardHeader className="bg-primary/5 pb-3 pt-4">
          <CardTitle className="flex items-center justify-center gap-2 text-lg font-medium">
            <Search className="h-4 w-4 text-primary" />
            Encuentra tu Examen
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSearch}>
        <CardContent className="p-4">
            <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="search" className="text-sm font-medium">
                  Buscar por acrónimo
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                    placeholder="ej. MAD, IIP, ..."
                  className="pl-9 h-9"
                  value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setError("")
                    }}
                />
              </div>
                {error && (
                  <p className="text-xs font-medium text-destructive">{error}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="school" className="text-sm font-medium">
                  Escuela
              </Label>
                <Select value={school} onValueChange={setSchool} disabled={loading}>
                  <SelectTrigger id="school" className="w-full h-9">
                    <SelectValue placeholder={loading ? "Cargando escuelas..." : "Seleccionar escuela"} />
                </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">Todas las Escuelas</SelectItem>
                    {loading ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                        <span className="text-sm">Cargando...</span>
                      </div>
                    ) : fetchError ? (
                      <div className="p-2 text-xs text-destructive">{fetchError}</div>
                    ) : schools.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground">No se encontraron escuelas</div>
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
                    {schools.length} escuelas disponibles
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="degree" className="text-sm font-medium">
                  Carrera
                </Label>
                <Select 
                  value={degree} 
                  onValueChange={setDegree} 
                  disabled={loadingDegrees || !school || school === "all"}
                >
                  <SelectTrigger id="degree" className="w-full h-9">
                    <SelectValue placeholder={
                      !school || school === "all" 
                        ? "Selecciona una escuela primero" 
                        : loadingDegrees 
                          ? "Cargando carreras..." 
                          : "Seleccionar carrera"
                    } />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">Todas las Carreras</SelectItem>
                    {loadingDegrees ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                        <span className="text-sm">Cargando...</span>
                      </div>
                    ) : degrees.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground">
                        No se encontraron carreras para esta escuela
                      </div>
                    ) : (
                      degrees.map((degreeName) => (
                        <SelectItem key={degreeName} value={degreeName}>
                          {degreeName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!loadingDegrees && school && school !== "all" && (
                  <p className="text-xs text-muted-foreground">
                    {degrees.length} carreras disponibles
                  </p>
                )}
              </div>
            </div>
        </CardContent>
        <CardFooter className="bg-primary/5 px-4 py-3">
            <Button 
              type="submit" 
              className="w-full h-9 shadow-md transition-all hover:shadow-lg" 
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Buscar Exámenes"
              )}
          </Button>
        </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}
