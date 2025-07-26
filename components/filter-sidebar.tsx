"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Search, X, Info, CheckCircle, Save } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useFilterData } from "@/lib/hooks/use-filter-data"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { Card, CardContent } from "@/components/ui/card"
import { SaveCalendarDialog } from "@/components/save-calendar-dialog"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { saveUserCalendar, getUserCalendarNames } from "@/actions/user-calendars"
import { getFreshAuthTokens } from "@/utils/auth-helpers"
import Image from "next/image"

type FilterCategory = {
  name: string;
  field: string;
  options: string[];
  searchable: boolean;
  dependsOn?: string[]; // New field to define dependencies
};

type ActiveFilters = Record<string, string[]>;

export function FilterSidebar({ onFiltersChange = () => {} }: { onFiltersChange?: (filters: ActiveFilters) => void }) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({})
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({})
  const [expandedItems, setExpandedItems] = useState<string[]>([]) // Start with nothing expanded
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [existingNames, setExistingNames] = useState<string[]>([])
  const prevSchoolsRef = useRef<string[]>([]);

  const { user, syncToken } = useAuth()
  const { toast } = useToast()

  // Get the selected filters
  const selectedSchools = activeFilters.school || []
  const selectedDegrees = activeFilters.degree || []
  const selectedSemesters = activeFilters.semester || []
  const selectedYears = activeFilters.year || []
  
  // Check if required filters have values
  const hasSelectedSchools = selectedSchools.length > 0
  const hasSelectedDegrees = selectedDegrees.length > 0
  const hasSelectedSemesters = selectedSemesters.length > 0
  const hasSelectedYears = selectedYears.length > 0

  // Use a memoized or stable reference to pass to useFilterData
  // This prevents passing a new array reference on every render
  const selectedSchoolsForData = JSON.stringify(selectedSchools) === JSON.stringify(prevSchoolsRef.current) 
    ? prevSchoolsRef.current 
    : selectedSchools;
  
  // Update ref when schools change
  useEffect(() => {
    prevSchoolsRef.current = selectedSchools;
  }, [selectedSchools]);

  const { schools, degrees, semesters, years, subjects, isLoading, error } = useFilterData(
    selectedSchoolsForData,
    selectedDegrees,
    selectedSemesters,
    selectedYears
  )
  
  // Add debugging console logs
  useEffect(() => {
    console.log('DEBUG - FilterSidebar filters:', {
      selectedSchools,
      selectedDegrees,
      selectedSemesters,
      selectedYears,
      subjects: subjects.length,
    });
  }, [selectedSchools, selectedDegrees, selectedSemesters, selectedYears, subjects]);
  
  // Define filter categories with more flexible dependencies
  const filterCategories: FilterCategory[] = [
    { name: "Escuelas", field: "school", options: schools, searchable: true },
    { name: "Carreras", field: "degree", options: degrees, searchable: true, dependsOn: ["school"] },
    { name: "Semestres", field: "semester", options: semesters, searchable: false, dependsOn: ["school", "degree"] },
    { name: "Años del Curso", field: "year", options: years.map(String), searchable: false, dependsOn: ["school", "degree", "semester"] },
    // More flexible: subjects only need school OR degree (not both AND all others)
    { name: "Asignaturas", field: "subject", options: subjects, searchable: true, dependsOn: ["school"] },
  ]

  // Auto-expansion logic: open categories with options, close empty ones
  useEffect(() => {
    const newExpandedItems: string[] = [];
    
    console.log('🔍 Auto-expansion check based on available options');

    filterCategories.forEach(category => {
      const hasOptions = filteredOptions(category).length > 0;
      const hasDependencies = hasRequiredDependencies(category);
      
      // Expand if category has options available
      if (hasOptions && hasDependencies) {
        console.log(`✅ Auto-expanding ${category.field} - has ${filteredOptions(category).length} options`);
        newExpandedItems.push(category.field);
      } else {
        console.log(`❌ Closing ${category.field} - ${!hasDependencies ? 'missing dependencies' : 'no options available'}`);
      }
    });

    // Update expanded items if there are changes
    setExpandedItems(prev => {
      const prevSet = new Set(prev);
      const newSet = new Set(newExpandedItems);
      
      // Check if sets are different
      if (prevSet.size !== newSet.size || [...prevSet].some(item => !newSet.has(item))) {
        console.log('📋 Updating expanded items:', newExpandedItems);
        return newExpandedItems;
      }
      
      return prev;
    });
  }, [
    // Watch for changes in available options for each category
    schools.length,
    degrees.length, 
    semesters.length,
    years.length,
    subjects.length,
    // Watch for changes in filter selections that affect dependencies
    hasSelectedSchools,
    hasSelectedDegrees,
    hasSelectedSemesters,
    hasSelectedYears,
    // Watch for search queries that might filter options
    JSON.stringify(searchQueries)
  ]);
  
  // Check if a category has all its required dependencies selected
  const hasRequiredDependencies = (category: FilterCategory): boolean => {
    if (!category.dependsOn) return true;
    
    // Special case for subjects: allow if we have school OR degree (more flexible)
    if (category.field === 'subject') {
      return (activeFilters.school && activeFilters.school.length > 0) ||
             (activeFilters.degree && activeFilters.degree.length > 0);
    }
    
    return category.dependsOn.every(dependency => {
      return activeFilters[dependency] && activeFilters[dependency].length > 0;
    });
  };

  const addFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      // Create a new object for updated filters
      let newFilters = {...prev};
      
      // Add the new filter value
      newFilters[category] = [...(prev[category] || []), value];
      
      // More selective clearing of child filters when parent filters change
      if (category === "school") {
        // When school changes, only clear degree (keep other filters that might still be valid)
        delete newFilters.degree;
      } else if (category === "degree") {
        // When degree changes, clear semester and year (but keep subjects as they may still be valid)
        delete newFilters.semester;
        delete newFilters.year;
      } else if (category === "semester") {
        // When semester changes, clear year only
        delete newFilters.year;
      }
      // Note: We don't automatically clear subjects anymore - let the backend handle invalid combinations
      
      // Call onFiltersChange after state update
      setTimeout(() => onFiltersChange(newFilters), 0);
      return newFilters;
    });
  };

  const removeFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const newFilters = {
        ...prev,
        [category]: prev[category].filter(f => f !== value)
      };
      
      // More selective clearing when all filters of a category are removed
      if (category === "school" && newFilters.school.length === 0) {
        // Only clear degree when all schools are removed
        delete newFilters.degree;
      } else if (category === "degree" && newFilters.degree.length === 0) {
        // Clear semester and year when all degrees are removed
        delete newFilters.semester;
        delete newFilters.year;
      } else if (category === "semester" && newFilters.semester.length === 0) {
        // Clear year when all semesters are removed
        delete newFilters.year;
      }
      // Note: Keep subjects even when parent filters are removed - they might still be valid
      
      // Call onFiltersChange after state update
      setTimeout(() => onFiltersChange(newFilters), 0);
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    // Call onFiltersChange after state update is complete
    setTimeout(() => onFiltersChange({}), 0);
  };

  // Add "Select All" function for a category
  const selectAllFilters = (category: FilterCategory) => {
    if (!hasRequiredDependencies(category)) return;
    
    console.log(`🔄 Select all for ${category.field}`);
    
    const searchQuery = searchQueries[category.field]?.toLowerCase() || "";
    const filteredOptions = category.options.filter(option => 
      option.toLowerCase().includes(searchQuery)
    );
    
    const options = filteredOptions;
    
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      
      // Set all filtered options as selected
      newFilters[category.field] = options;
      
      console.log(`📋 Updated filters for ${category.field}:`, options);
      
      // Call onFiltersChange after state update to avoid render conflicts
      setTimeout(() => onFiltersChange(newFilters), 0);
      return newFilters;
    });
  };

  const filteredOptions = (category: FilterCategory) => {
    // If category has dependencies and not all are selected, return empty array
    if (!hasRequiredDependencies(category)) {
      return [];
    }
    
    const searchQuery = searchQueries[category.field]?.toLowerCase() || "";
    
    // Filter by the search query if one exists
    const filtered = category.options.filter(option => 
      option.toLowerCase().includes(searchQuery)
    );
    
    const finalFiltered = filtered;
    
    // Debug: Logging for School category specifically
    if (category.field === 'school') {
      console.log(`School options available: ${finalFiltered.length}`, finalFiltered);
    }
    
    return finalFiltered;
  };

  const handleAccordionChange = (value: string[]) => {
    setExpandedItems(value);
  };

  // Format the filter list for display
  const getFilterDisplay = (field: string, values: string[]) => {
    if (values.length === 0) {
      return "";
    } else if (values.length === 1) {
      return values[0];
    } else {
      return `${values.length} ${field}s`;
    }
  };
  
  // Get dependency message for a category
  const getDependencyMessage = (category: FilterCategory) => {
    if (!category.dependsOn || category.dependsOn.length === 0) return null;
    
    const missingDependencies = category.dependsOn.filter(dep => 
      !activeFilters[dep] || activeFilters[dep].length === 0
    );
    
    if (missingDependencies.length === 0) return null;
    
    const missingNames = missingDependencies.map(dep => {
      // Convert field name to display name (e.g., 'school' to 'School')
      const depCategory = filterCategories.find(c => c.field === dep);
      return depCategory ? depCategory.name.toLowerCase() : dep;
    });
    
    if (missingNames.length === 1) {
      return `Selecciona ${missingNames[0]} primero`;
    } else {
      const lastDep = missingNames.pop();
      return `Selecciona ${missingNames.join(', ')} y ${lastDep} primero`;
    }
  };

  // Helper function to extract acronym from subject name
  const getSubjectAcronym = (subjectName: string): string => {
    // Extract acronym from subject name (e.g., "Programación I (PROG)" -> "PROG")
    const acronymMatch = subjectName.match(/\(([A-Z]+)\)/);
    if (acronymMatch) {
      return acronymMatch[1];
    }
    
    // If no acronym in parentheses, try to extract from the beginning
    const words = subjectName.split(' ');
    if (words.length >= 2) {
      // Take first few letters of each word
      const acronym = words.slice(0, 3).map(word => word.charAt(0).toUpperCase()).join('');
      return acronym;
    }
    
    // Fallback: return first 4 characters
    return subjectName.substring(0, 4).toUpperCase();
  };

  // Update the function signature to accept any MouseEvent
  const clearCategoryFilters = (category: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      
      // Remove this category's filters
      delete newFilters[category];
      
      // Clear dependent filters if needed
      if (category === "school") {
        delete newFilters.degree;
        delete newFilters.semester;
        delete newFilters.year;
        delete newFilters.subject;
      } else if (category === "degree") {
        delete newFilters.semester;
        delete newFilters.year;
        delete newFilters.subject;
      } else if (category === "semester") {
        delete newFilters.year;
        delete newFilters.subject;
      } else if (category === "year") {
        delete newFilters.subject;
      }
      
      // Call onFiltersChange after state update
      setTimeout(() => onFiltersChange(newFilters), 0);
      return newFilters;
    });
  };

  // Fetch existing calendar names when the component mounts or user changes
  useEffect(() => {
    const fetchCalendarNames = async () => {
      if (!user?.id) {
        setExistingNames([])
        return
      }
      
      try {
        // Get fresh auth tokens with automatic refresh
        const tokens = await getFreshAuthTokens()
        
        if (!tokens) {
          console.warn('No valid tokens available for fetching calendar names')
          setExistingNames([])
          return
        }
        
        const names = await getUserCalendarNames(
          user.id,
          tokens.accessToken,
          tokens.refreshToken
        )
        setExistingNames(names)
      } catch (error) {
        console.error('Error fetching calendar names:', error)
        setExistingNames([])
        
        // Show error toast for auth issues
        if (error instanceof Error && error.message.includes('auth')) {
          toast({
            title: "Error de Autenticación",
            description: "Por favor inicia sesión para gestionar calendarios.",
            variant: "destructive"
          })
        }
      }
    }

    fetchCalendarNames()
  }, [user?.id, toast])

  // Open save dialog if user is logged in, otherwise show login toast
  const openSaveDialog = () => {
    if (!user) {
      toast({
        title: "Autenticación requerida",
        description: "Por favor inicia sesión para guardar calendarios",
        variant: "destructive",
      });
      return;
    }
    setSaveDialogOpen(true);
  };

  // Save calendar function
  const handleSaveCalendar = async (name: string) => {
    if (!user?.id) return false;
    
    try {
      console.log("🔄 Starting save calendar process:", { name, userId: user.id });
      
      // First, sync auth tokens to ensure we have the latest state
      console.log("⏳ Synchronizing authentication state...");
      await syncToken();
      
      // Get fresh auth tokens with automatic refresh
      const tokens = await getFreshAuthTokens()
      
      if (!tokens) {
        toast({
          title: "Error de Autenticación",
          description: "Por favor inicia sesión nuevamente.",
          variant: "destructive"
        })
        return false
      }
      
      console.log("✅ Found auth tokens - preparing to save calendar");
      
      // Pass both tokens directly to the server action
      const response = await saveUserCalendar({
        name,
        filters: activeFilters,
        userId: user.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
      
      if (!response) {
        throw new Error("Error al guardar calendario: El servidor devolvió una respuesta vacía");
      }
      
      console.log("✅ Server response:", response);
      
      toast({
        title: "¡Éxito!",
        description: `Calendario "${name}" guardado correctamente.`
      })

      // Refresh calendar names
      const names = await getUserCalendarNames(
        user.id,
        tokens.accessToken,
        tokens.refreshToken
      )
      setExistingNames(names)
      
      return true
    } catch (error) {
      console.error('Error saving calendar:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar el calendario.",
        variant: "destructive"
      })
      return false
    }
  };

  if (isLoading) {
    return (
      <motion.aside
        id="filters-section"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="space-y-6 rounded-xl border bg-card p-6 shadow-lg"
      >
        <LoadingState />
      </motion.aside>
    )
  }

  if (error) {
    return (
      <motion.aside
        id="filters-section"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="space-y-6 rounded-xl border bg-card p-6 shadow-lg"
      >
        <ErrorState error={error} />
      </motion.aside>
    )
  }

  return (
    <motion.aside
      id="filters-section"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="space-y-6 rounded-xl border bg-card p-6 shadow-lg relative"
    >
      {/* Logo Icon at the top center */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute -top-6 left-1/2 transform -translate-x-1/2 -ml-6 z-10"
      >
        <div className="relative">
          <div className="bg-white dark:bg-card rounded-full p-3 shadow-lg border border-border/50">
            <Image 
              src="/logo-icon.png" 
              alt="UPV Logo" 
              width={32} 
              height={32}
              className="h-8 w-8"
            />
          </div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-md -z-10 scale-110"></div>
        </div>
      </motion.div>

      {/* Add top padding to account for the logo */}
      <div className="pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Filtros</h2>
          {Object.keys(activeFilters).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar todo
            </Button>
          )}
        </div>

        {/* Active Filters section moved to the top */}
        {Object.keys(activeFilters).length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Filtros Activos</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeFilters).map(([category, values]) =>
                values.map((value) => (
                  <Badge
                    key={`${category}-${value}`}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {category === 'subject' ? getSubjectAcronym(value) : value}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeFilter(category, value)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))
              )}
            </div>
          </div>
        )}



        <Accordion 
          type="multiple" 
          className="w-full"
          value={expandedItems}
          onValueChange={handleAccordionChange}
        >
          {filterCategories.map((category) => (
            <AccordionItem key={category.field} value={category.field}>
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex-1">{category.name}</span>
              </AccordionTrigger>
              <AccordionContent>
                {/* Add the buttons at the top of content instead */}
                <div className="flex items-center gap-2 mb-3">
                  {filteredOptions(category).length > 0 && (
                                        <span
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllFilters(category);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground cursor-pointer underline"
                      >
                        Seleccionar todo
                      </span>
                  )}
                  {activeFilters[category.field]?.length > 0 && (
                                        <span
                        onClick={(e) => clearCategoryFilters(category.field, e)}
                        className="text-xs text-muted-foreground hover:text-foreground cursor-pointer underline"
                      >
                        Limpiar todo
                      </span>
                  )}
                </div>

                {/* Keep the amber card but use a fixed message */}
                {category.dependsOn && !hasRequiredDependencies(category) && (
                  <Card className="mb-3 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                    <CardContent className="p-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                      <Info className="h-4 w-4" />
                      <span>Selecciona una de las opciones anteriores.</span>
                    </CardContent>
                  </Card>
                )}
                
                {category.searchable && hasRequiredDependencies(category) && category.field === 'subject' && (
                  <div className="mb-2">
                    <Input
                      placeholder={`Buscar ${category.name.toLowerCase()}...`}
                      value={searchQueries[category.field] || ""}
                      onChange={(e) => setSearchQueries(prev => ({
                        ...prev,
                        [category.field]: e.target.value
                      }))}
                      className="w-full"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  {filteredOptions(category).length > 0 ? (
                    filteredOptions(category).map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${category.field}-${option}`}
                          checked={activeFilters[category.field]?.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addFilter(category.field, option);
                            } else {
                              removeFilter(category.field, option);
                            }
                          }}
                        />
                        <Label htmlFor={`${category.field}-${option}`} className="text-sm">
                          {option}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground py-2">
                      {!hasRequiredDependencies(category)
                        ? "" // Remove the dependency message text
                        : `No hay ${category.name.toLowerCase()} disponibles para los filtros seleccionados`}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Save Calendar Button */}
        {Object.keys(activeFilters).length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <Button
              onClick={openSaveDialog}
              className="w-full gap-2"
              variant="default"
            >
              <Save className="h-4 w-4" />
              Guardar Calendario
            </Button>
          </div>
        )}

        <SaveCalendarDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          filters={activeFilters}
          onSave={handleSaveCalendar}
          existingNames={existingNames}
        />
      </div>
    </motion.aside>
  )
}
