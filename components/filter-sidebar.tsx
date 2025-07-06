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
import { extractTokensFromStorage } from "@/lib/auth/token-manager"

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
  const [allFiltersSearch, setAllFiltersSearch] = useState("")
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
  
  // Define filter categories with dependencies (memoized to prevent unnecessary re-renders)
  const filterCategories: FilterCategory[] = [
    { name: "Schools", field: "school", options: schools, searchable: true },
    { name: "Degrees", field: "degree", options: degrees, searchable: true, dependsOn: ["school"] },
    { name: "Semesters", field: "semester", options: semesters, searchable: false, dependsOn: ["school", "degree"] },
    { name: "Course Years", field: "year", options: years.map(String), searchable: false, dependsOn: ["school", "degree", "semester"] },
    { name: "Subjects", field: "subject", options: subjects, searchable: true, dependsOn: ["school", "degree", "semester", "year"] },
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
    JSON.stringify(searchQueries),
    allFiltersSearch
  ]);
  
  // Check if a category has all its required dependencies selected
  const hasRequiredDependencies = (category: FilterCategory): boolean => {
    if (!category.dependsOn) return true;
    
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
      
      // Clear child filters when parent filters change
      if (category === "school") {
        // When school changes, clear degree, semester, year and subject filters
        delete newFilters.degree;
        delete newFilters.semester;
        delete newFilters.year;
        delete newFilters.subject;
      } else if (category === "degree") {
        // When degree changes, clear semester, year and subject filters
        delete newFilters.semester;
        delete newFilters.year;
        delete newFilters.subject;
      } else if (category === "semester") {
        // When semester changes, clear year and subject filters
        delete newFilters.year;
        delete newFilters.subject;
      } else if (category === "year") {
        // When year changes, clear subject filters
        delete newFilters.subject;
      }
      
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
      
      // If all filters of a category are removed, also clear dependent filters
      if (category === "school" && newFilters.school.length === 0) {
        delete newFilters.degree;
        delete newFilters.semester;
        delete newFilters.year;
        delete newFilters.subject;
      } else if (category === "degree" && newFilters.degree.length === 0) {
        delete newFilters.semester;
        delete newFilters.year;
        delete newFilters.subject;
      } else if (category === "semester" && newFilters.semester.length === 0) {
        delete newFilters.year;
        delete newFilters.subject;
      } else if (category === "year" && newFilters.year.length === 0) {
        delete newFilters.subject;
      }
      
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
    
    // Apply global search if any
    const options = allFiltersSearch 
      ? filteredOptions.filter(option => option.toLowerCase().includes(allFiltersSearch.toLowerCase())) 
      : filteredOptions;
    
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
    
    // Also filter options globally if allFiltersSearch is set
    const finalFiltered = allFiltersSearch 
      ? filtered.filter(option => option.toLowerCase().includes(allFiltersSearch.toLowerCase())) 
      : filtered;
    
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
      return `Select a ${missingNames[0]} first`;
    } else {
      const lastDep = missingNames.pop();
      return `Select ${missingNames.join(', ')} and ${lastDep} first`;
    }
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
      if (user?.id) {
        try {
          const names = await getUserCalendarNames(user.id);
          setExistingNames(names);
        } catch (error) {
          console.error("Error fetching calendar names:", error);
        }
      }
    };
    
    fetchCalendarNames();
  }, [user?.id]);

  // Open save dialog if user is logged in, otherwise show login toast
  const openSaveDialog = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save calendars",
        variant: "destructive",
      });
      return;
    }
    setSaveDialogOpen(true);
  };

  // Save calendar function
  const handleSaveCalendar = async (name: string) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to save calendars",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Saving calendar with user ID:", user.id);
      
      // First, sync auth tokens to ensure we have the latest state
      console.log("⏳ Synchronizing authentication state...");
      await syncToken();
      
      // Get both auth tokens using the token manager
      const { accessToken, refreshToken } = extractTokensFromStorage();
      
      // Verify tokens were found
      if (!accessToken || !refreshToken) {
        console.error("❌ Missing auth tokens:", {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken
        });
        throw new Error("Authentication error: Missing tokens. Please log in again.");
      }
      
      console.log("✅ Found auth tokens - preparing to save calendar");
      
      // Pass both tokens directly to the server action
      const response = await saveUserCalendar({
        name,
        filters: activeFilters,
        userId: user.id,
        accessToken,
        refreshToken
      });
      
      if (!response) {
        throw new Error("Failed to save calendar: Server returned empty response");
      }
      
      console.log("✅ Server response:", response);
      
      // Update the list of existing names
      setExistingNames(prev => [...prev, name]);
      
      toast({
        title: "Calendar saved",
        description: `Your calendar "${name}" has been saved successfully.`,
      });
    } catch (error: any) {
      console.error("Error saving calendar:", error);
      
      // Get a more descriptive error message if available
      const errorMessage = typeof error === 'string' ? error : 
                          error?.message || 
                          "An error occurred while saving your calendar. Please try again.";
      
      // If it's an authentication error, provide specific guidance
      if (errorMessage.includes("authentication") || 
          errorMessage.includes("log in") || 
          errorMessage.includes("session") ||
          errorMessage.includes("token")) {
        toast({
          title: "Authentication error",
          description: "Please log out and log in again to refresh your session.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error saving calendar",
          description: errorMessage,
          variant: "destructive",
        });
      }
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
      className="space-y-6 rounded-xl border bg-card p-6 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Filters</h2>
        {Object.keys(activeFilters).length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filters section moved to the top */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Active Filters</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([category, values]) =>
              values.map((value) => (
                <Badge
                  key={`${category}-${value}`}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {value}
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

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search all filters..."
          value={allFiltersSearch}
          onChange={(e) => setAllFiltersSearch(e.target.value)}
          className="pl-9"
        />
      </div>

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
              {/* Remove the buttons from inside the trigger */}
              {activeFilters[category.field]?.length > 0 && (
                <Badge variant="outline" className="mr-2 text-xs">
                  {activeFilters[category.field].length}
                </Badge>
              )}
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
                    Select all
                  </span>
                )}
                {activeFilters[category.field]?.length > 0 && (
                  <span
                    onClick={(e) => clearCategoryFilters(category.field, e)}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer underline"
                  >
                    Clear all
                  </span>
                )}
              </div>

              {/* Keep the amber card but use a fixed message */}
              {category.dependsOn && !hasRequiredDependencies(category) && (
                <Card className="mb-3 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                  <CardContent className="p-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                    <Info className="h-4 w-4" />
                    <span>Select one of the options above.</span>
                  </CardContent>
                </Card>
              )}
              
              {category.searchable && hasRequiredDependencies(category) && (
                <div className="mb-2">
                  <Input
                    placeholder={`Search ${category.name.toLowerCase()}...`}
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
                      : `No ${category.name.toLowerCase()} available for the selected filters`}
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
            Save Calendar
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
    </motion.aside>
  )
}
