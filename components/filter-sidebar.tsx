"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Search, X, Info } from "lucide-react"
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
  const [expandedItems, setExpandedItems] = useState<string[]>(["school"]) // Default to showing school filter
  const prevSchoolsRef = useRef<string[]>([]);
  
  // Track if categories have been auto-expanded
  const expandedCategoriesRef = useRef<Record<string, boolean>>({
    school: true,
    degree: false,
    semester: false,
    year: false,
    subject: false
  });

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
    selectedYears  // Add selectedYears here to ensure they're passed to useFilterData
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
  
  // Define filter categories with dependencies
  const filterCategories: FilterCategory[] = [
    { name: "Schools", field: "school", options: schools, searchable: true },
    { name: "Degrees", field: "degree", options: degrees, searchable: true, dependsOn: ["school"] },
    { name: "Semesters", field: "semester", options: semesters, searchable: false, dependsOn: ["school", "degree"] },
    { name: "Course Years", field: "year", options: years.map(String), searchable: false, dependsOn: ["school", "degree", "semester"] },
    { name: "Subjects", field: "subject", options: subjects, searchable: true, dependsOn: ["school", "degree", "semester", "year"] },
  ]

  // When parent filter selections change, auto-expand child filters
  useEffect(() => {
    const autoExpandNext = (categoryField: string) => {
      // Find the current category's index
      const currentIndex = filterCategories.findIndex(c => c.field === categoryField);
      
      // If there's a next category and we have the necessary parent filters selected
      if (currentIndex >= 0 && currentIndex < filterCategories.length - 1) {
        const nextCategory = filterCategories[currentIndex + 1];
        
        // Check if next category should be expanded
        if (
          !expandedCategoriesRef.current[nextCategory.field] && 
          hasRequiredDependencies(nextCategory)
        ) {
          // Mark this category as already expanded
          expandedCategoriesRef.current[nextCategory.field] = true;
          
          // Add a small delay to make the UI flow more natural
          setTimeout(() => {
            setExpandedItems(prev => {
              if (!prev.includes(nextCategory.field)) {
                return [...prev, nextCategory.field];
              }
              return prev;
            });
          }, 300);
        }
      }
    };

    // If we have schools selected, auto-expand degrees
    if (hasSelectedSchools) {
      autoExpandNext('school');
    }
    
    // If we have degrees selected, auto-expand semesters
    if (hasSelectedDegrees) {
      autoExpandNext('degree');
    }
    
    // If we have semesters selected, auto-expand years
    if (hasSelectedSemesters) {
      autoExpandNext('semester');
    }
  }, [hasSelectedSchools, hasSelectedDegrees, hasSelectedSemesters, filterCategories]);
  
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
        
        // Reset auto-expand flags for child categories
        expandedCategoriesRef.current = {
          ...expandedCategoriesRef.current,
          degree: false,
          semester: false,
          year: false,
          subject: false
        };
      } else if (category === "degree") {
        // When degree changes, clear semester, year and subject filters
        delete newFilters.semester;
        delete newFilters.year;
        delete newFilters.subject;
        
        // Reset auto-expand flags for child categories
        expandedCategoriesRef.current = {
          ...expandedCategoriesRef.current,
          semester: false,
          year: false,
          subject: false
        };
      } else if (category === "semester") {
        // When semester changes, clear year and subject filters
        delete newFilters.year;
        delete newFilters.subject;
        
        // Reset auto-expand flags for child categories
        expandedCategoriesRef.current = {
          ...expandedCategoriesRef.current,
          year: false,
          subject: false
        };
      } else if (category === "year") {
        // When year changes, clear subject filters
        delete newFilters.subject;
        
        // Reset auto-expand flags for subject category
        expandedCategoriesRef.current = {
          ...expandedCategoriesRef.current,
          subject: false
        };
      }
      
      onFiltersChange(newFilters);
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
        
        // Reset auto-expand flags
        expandedCategoriesRef.current = {
          ...expandedCategoriesRef.current,
          degree: false,
          semester: false,
          year: false,
          subject: false
        };
      } else if (category === "degree" && newFilters.degree.length === 0) {
        delete newFilters.semester;
        delete newFilters.year;
        delete newFilters.subject;
        
        // Reset auto-expand flags
        expandedCategoriesRef.current = {
          ...expandedCategoriesRef.current,
          semester: false,
          year: false,
          subject: false
        };
      } else if (category === "semester" && newFilters.semester.length === 0) {
        delete newFilters.year;
        delete newFilters.subject;
        
        // Reset auto-expand flags
        expandedCategoriesRef.current = {
          ...expandedCategoriesRef.current,
          year: false,
          subject: false
        };
      } else if (category === "year" && newFilters.year.length === 0) {
        delete newFilters.subject;
        
        // Reset auto-expand flags
        expandedCategoriesRef.current = {
          ...expandedCategoriesRef.current,
          subject: false
        };
      }
      
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFiltersChange({});
    
    // Reset all auto-expand flags
    expandedCategoriesRef.current = {
      school: true,
      degree: false,
      semester: false,
      year: false,
      subject: false
    };
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
    if (allFiltersSearch) {
      return filtered.filter(option => 
        option.toLowerCase().includes(allFiltersSearch.toLowerCase())
      );
    }
    
    return filtered;
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
              {category.name}
              {activeFilters[category.field]?.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilters[category.field].length}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent>
              {category.dependsOn && !hasRequiredDependencies(category) && (
                <Card className="mb-3 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                  <CardContent className="p-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                    <Info className="h-4 w-4" />
                    <span>{getDependencyMessage(category)}</span>
                  </CardContent>
                </Card>
              )}
              
              {category.dependsOn && hasRequiredDependencies(category) && (
                <div className="mb-3 text-sm text-muted-foreground">
                  {category.field === 'degree' && `Showing degrees for ${getFilterDisplay('school', selectedSchools)}`}
                  {category.field === 'semester' && `Showing semesters for ${getFilterDisplay('degree', selectedDegrees)}`}
                  {category.field === 'year' && `Showing course years for ${getFilterDisplay('semester', selectedSemesters)}`}
                  {category.field === 'subject' && 'Showing subjects for selected filters'}
                </div>
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
                      ? getDependencyMessage(category)
                      : `No ${category.name.toLowerCase()} available for the selected filters`}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

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
    </motion.aside>
  )
}
