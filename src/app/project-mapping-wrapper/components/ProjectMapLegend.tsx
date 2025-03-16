"use client";

import { useProjects } from "@/contexts/ProjectsContext";
import { useState, useEffect } from "react";
import { X, Filter, MapPin, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Map legend component that displays project categories and statuses with filtering capabilities
 */
export default function ProjectMapLegend() {
  const { projects, filteredProjects, setFilteredProjects } = useProjects();
  const [filters, setFilters] = useState({
    status: {} as Record<string, boolean>,
    category: {} as Record<string, boolean>
  });
  const [expanded, setExpanded] = useState(true);
  const [showStatusFilters, setShowStatusFilters] = useState(true);
  const [showCategoryFilters, setShowCategoryFilters] = useState(true);

  // Initialize filters based on available projects
  useEffect(() => {
    if (projects.length === 0) return;

    const statusFilters = projects.reduce((acc, project) => {
      if (project.status) {
        acc[project.status] = true;
      }
      return acc;
    }, {} as Record<string, boolean>);

    const categoryFilters = projects.reduce((acc, project) => {
      if (project.category) {
        acc[project.category] = true;
      }
      return acc;
    }, {} as Record<string, boolean>);

    setFilters({
      status: statusFilters,
      category: categoryFilters
    });
  }, [projects]);

  // Update filtered projects when filters change
  useEffect(() => {
    if (projects.length === 0) return;

    const activeStatusFilters = Object.entries(filters.status)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    const activeCategoryFilters = Object.entries(filters.category)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    // If all filters are active or none are active, don't filter
    const allStatusActive = activeStatusFilters.length === Object.keys(filters.status).length;
    const allCategoryActive = activeCategoryFilters.length === Object.keys(filters.category).length;

    if (allStatusActive && allCategoryActive) {
      setFilteredProjects(projects);
      return;
    }

    // Apply filters
    const filtered = projects.filter(project => {
      const statusMatch = activeStatusFilters.length === 0 || 
        (project.status && activeStatusFilters.includes(project.status));
      const categoryMatch = activeCategoryFilters.length === 0 || 
        (project.category && activeCategoryFilters.includes(project.category));
      
      return statusMatch && categoryMatch;
    });

    setFilteredProjects(filtered);
  }, [filters, projects, setFilteredProjects]);

  // Get status colors based on project status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in progress':
        return 'bg-green-500';
      case 'planned':
      case 'proposed':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-purple-500';
      case 'on hold':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get category icon based on project category
  const getCategoryIcon = (category: string) => {
    // Simple implementation - you can replace with more specific icons
    return <MapPin className="h-4 w-4" />;
  };

  // Toggle filter status
  const toggleFilter = (type: 'status' | 'category', key: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: !prev[type][key]
      }
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: Object.keys(filters.status).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>),
      category: Object.keys(filters.category).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>)
    });
  };

  // If no projects, don't render legend
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="absolute z-[1000] bottom-4 right-4 bg-white dark:bg-gray-800 rounded-md shadow-lg p-2 max-w-xs w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium flex items-center">
          <Filter className="h-4 w-4 mr-1" />
          Project Legend
        </h3>
        <div className="flex items-center space-x-1">
          <button 
            onClick={resetFilters}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
            title="Reset filters"
          >
            <X className="h-3 w-3" />
          </button>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
          >
            {expanded ? 
              <ChevronDown className="h-3 w-3" /> : 
              <ChevronUp className="h-3 w-3" />
            }
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3">
          {/* Status filters */}
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer mb-1"
              onClick={() => setShowStatusFilters(!showStatusFilters)}
            >
              <h4 className="text-xs font-medium">Status</h4>
              {showStatusFilters ? 
                <ChevronDown className="h-3 w-3" /> : 
                <ChevronUp className="h-3 w-3" />
              }
            </div>
            
            {showStatusFilters && (
              <div className="space-y-1">
                {Object.keys(filters.status).map(status => (
                  <div key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`status-${status}`}
                      checked={filters.status[status]}
                      onChange={() => toggleFilter('status', status)}
                      className="mr-2 h-3 w-3"
                    />
                    <div className="flex items-center">
                      <span 
                        className={`${getStatusColor(status)} h-3 w-3 rounded-full mr-2`} 
                      />
                      <label 
                        htmlFor={`status-${status}`}
                        className="text-xs cursor-pointer"
                      >
                        {status}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category filters */}
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer mb-1"
              onClick={() => setShowCategoryFilters(!showCategoryFilters)}
            >
              <h4 className="text-xs font-medium">Category</h4>
              {showCategoryFilters ? 
                <ChevronDown className="h-3 w-3" /> : 
                <ChevronUp className="h-3 w-3" />
              }
            </div>
            
            {showCategoryFilters && (
              <div className="space-y-1">
                {Object.keys(filters.category).map(category => (
                  <div key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${category}`}
                      checked={filters.category[category]}
                      onChange={() => toggleFilter('category', category)}
                      className="mr-2 h-3 w-3"
                    />
                    <div className="flex items-center">
                      <span className="mr-2">
                        {getCategoryIcon(category)}
                      </span>
                      <label 
                        htmlFor={`category-${category}`}
                        className="text-xs cursor-pointer"
                      >
                        {category}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter summary */}
          <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-1">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>
      )}
    </div>
  );
} 