"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Loader2, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getSchools, getDegrees, getFilteredAcronymsAndSubjects } from "@/actions/exam-actions"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

export function FindExamCard() {
  const router = useRouter()
  // MULTI-SELECT STATE
  const [selectedItems, setSelectedItems] = useState<Array<{ value: string; type: 'acronym' | 'subject'; acronym?: string }>>([])
  const [inputValue, setInputValue] = useState("")
  const [school, setSchool] = useState("")
  const [degree, setDegree] = useState("")
  const [schools, setSchools] = useState<string[]>([])
  const [degrees, setDegrees] = useState<string[]>([])
  const [options, setOptions] = useState<Array<{ value: string; type: 'acronym' | 'subject' }>>([])
  const [loading, setLoading] = useState(true)
  const [loadingDegrees, setLoadingDegrees] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [error, setError] = useState("")
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [acronymOpen, setAcronymOpen] = useState(false)

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

  // Fetch filtered acronyms and subjects when school or degree changes
  useEffect(() => {
    async function fetchOptions() {
      if (!school || school === "all" || !degree || degree === "all") {
        setOptions([])
        setInputValue("")
        setSelectedItems([])
        return
      }
      try {
        setLoadingOptions(true)
        const data = await getFilteredAcronymsAndSubjects(school, degree)
        setOptions(data)
      } catch (error) {
        setOptions([])
      } finally {
        setLoadingOptions(false)
      }
    }
    fetchOptions()
  }, [school, degree])

  const validateAcronym = (value: string) => {
    return value.trim().length > 0 && value.trim().length <= 10;
  }

  const isAcronymSearchEnabled = school && school !== "all" && degree && degree !== "all"

  // Filter options based on inputValue and not already selected
  const filteredOptions: Array<{ value: string; type: 'acronym' | 'subject'; acronym?: string }> = options.filter(opt =>
    opt.value.toLowerCase().includes(inputValue.toLowerCase()) &&
    !selectedItems.some(sel => sel.value === opt.value && sel.type === opt.type)
  ).slice(0, 8)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItems.length === 0) {
      setError("Selecciona al menos un acrónimo o asignatura")
      return
    }
    setError("")
    const params = new URLSearchParams()
    selectedItems.forEach(item => {
      if (item.type === 'acronym') {
        params.append("acronym", item.value)
      } else {
        params.append("subject", item.value)
      }
    })
    if (school && school !== "all") params.append("school", school)
    if (degree && degree !== "all") params.append("degree", degree)
    router.push(`/exams?${params.toString()}`)
  }

  // Add item to selection
  const handleItemSelect = (item: { value: string; type: 'acronym' | 'subject'; acronym?: string }) => {
    if (!selectedItems.some(sel => sel.value === item.value && sel.type === item.type)) {
      setSelectedItems(prev => [...prev, item])
      setInputValue("")
      setAcronymOpen(false)
      setError("")
    }
  }

  // Remove item from selection
  const handleRemoveItem = (item: { value: string; type: 'acronym' | 'subject'; acronym?: string }) => {
    setSelectedItems(prev => prev.filter(sel => !(sel.value === item.value && sel.type === item.type)))
  }

  // Input change for combobox
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setError("")
    if (e.target.value.length > 0 && isAcronymSearchEnabled) {
      setAcronymOpen(true)
    } else {
      setAcronymOpen(false)
    }
  }

  const handleInputFocus = () => {
    if (isAcronymSearchEnabled) {
      setAcronymOpen(true)
    }
  }

  const handleInputClick = () => {
    if (isAcronymSearchEnabled) {
      setAcronymOpen(true)
    }
  }

  // Reset selected items if school/degree changes
  useEffect(() => {
    setSelectedItems([])
    setInputValue("")
  }, [school, degree])

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
            {/* Escuela section moved to the top */}
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

            {/* Buscar por acrónimo o asignatura section with multi-select pills */}
            <div className="space-y-1.5">
              <Label htmlFor="search" className="text-sm font-medium">
                  Buscar por acrónimo o asignatura
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedItems.map(item => (
                  <span key={item.value + item.type} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium border border-primary/30">
                    <span className={`inline-block rounded-full w-2 h-2 mr-1 ${item.type === 'acronym' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                    {item.type === 'subject'
                      ? `${item.value}${item.acronym ? ` (${item.acronym})` : ''}`
                      : item.value}
                    <button
                      type="button"
                      className="ml-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900 p-0.5"
                      onClick={() => handleRemoveItem(item)}
                      aria-label={`Eliminar ${item.value}`}
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </span>
                ))}
              </div>
              <Popover open={acronymOpen} onOpenChange={setAcronymOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={acronymOpen}
                    className={`w-full h-9 justify-between ${!isAcronymSearchEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isAcronymSearchEnabled || selectedItems.length === options.length}
                  >
                    {!isAcronymSearchEnabled
                      ? "Selecciona escuela y carrera primero"
                      : selectedItems.length === 0
                        ? "Ej. MAD, Introducción a la Programación, ..."
                        : inputValue || "Agregar más acrónimos o asignaturas..."
                    }
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Buscar acrónimo o asignatura..."
                      value={inputValue}
                      onValueChange={value => {
                        setInputValue(value)
                        setError("")
                        if (isAcronymSearchEnabled) {
                          setAcronymOpen(true)
                        }
                      }}
                      disabled={!isAcronymSearchEnabled || selectedItems.length === options.length}
                    />
                    <CommandList>
                      {!isAcronymSearchEnabled ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Selecciona una escuela y carrera para buscar acrónimos o asignaturas
                        </div>
                      ) : inputValue.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Escribe para buscar acrónimos o asignaturas
                        </div>
                      ) : loadingOptions ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                          <span className="text-sm">Cargando...</span>
                        </div>
                      ) : filteredOptions.length === 0 ? (
                        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {filteredOptions.map((item) => (
                            <CommandItem
                              key={item.value + item.type}
                              value={item.value}
                              onSelect={() => handleItemSelect(item)}
                            >
                              <span className={`inline-block rounded-full w-2 h-2 mr-2 ${item.type === 'acronym' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                              {item.type === 'subject'
                                ? `${item.value}${item.acronym ? ` (${item.acronym})` : ''}`
                                : item.value}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {error && (
                <p className="text-xs font-medium text-destructive">{error}</p>
              )}
              
            </div>
            </div>
        </CardContent>
        <CardFooter className="bg-primary/5 px-4 py-3">
            <Button
              type="submit"
              className="w-full h-9 shadow-md transition-all hover:shadow-lg"
              disabled={loading || selectedItems.length === 0 || !isAcronymSearchEnabled}
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
