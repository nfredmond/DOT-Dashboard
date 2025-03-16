"use client";

import { useState, useEffect } from 'react';
import { useProjects } from '@/contexts/ProjectsContext';
import { useMapIntegration } from '@/hooks/useMapIntegration';
import { 
  MapPin, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Search,
  X,
  Map as MapIcon,
  Eye
} from 'lucide-react';

interface ProjectListProps {
  mapRef: React.MutableRefObject<any>;
}

// Initialize empty data structure for useProjects() fallback
const emptyProjectData = {
  projects: [],
  filteredProjects: [],
  deleteProject: () => {}
};

export default function ProjectList({ mapRef }: ProjectListProps) {
  const { focusProject, handleProjectSelect } = useMapIntegration(mapRef);
  const { projects, filteredProjects, deleteProject } = useProjects() || emptyProjectData;
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  // Use useEffect to log available projects for debugging
  useEffect(() => {
    console.log('Projects available in ProjectList:', projects.length);
    console.log('Filtered projects in ProjectList:', filteredProjects.length);
  }, [projects, filteredProjects]);

  // Filter projects based on search term
  const displayedProjects = searchTerm 
    ? filteredProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredProjects;

  // Handle focusing on a project
  const handleFocusProject = (projectId: string) => {
    setActiveProject(projectId);
    focusProject(projectId, 15); // Zoom level 15
    
    // Additionally, if we have direct access to the map instance,
    // make sure popup opens for this project
    if (typeof window !== 'undefined' && window.leafletMapInstance) {
      window.leafletMapInstance.eachLayer((layer: any) => {
        if (layer.projectData && layer.projectData.id === projectId) {
          // If it's a marker, open its popup
          if (layer.openPopup) {
            layer.openPopup();
          } else if (layer.getBounds) {
            // For lines/polygons, create popup at center
            const center = layer.getBounds().getCenter();
            const project = filteredProjects.find(p => p.id === projectId);
            
            if (project) {
              window.L.popup()
                .setLatLng(center)
                .setContent(`
                  <div class="p-3">
                    <h3 class="text-lg font-bold mb-2">${project.name}</h3>
                    <p class="mb-2">${project.description}</p>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span class="font-semibold">Status:</span> ${project.status}
                      </div>
                      <div>
                        <span class="font-semibold">Category:</span> ${project.category}
                      </div>
                      <div class="col-span-2">
                        <span class="font-semibold">Budget:</span> $${project.allocatedBudget?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </div>
                `)
                .openOn(window.leafletMapInstance);
            }
          }
        }
      });
    }
  };

  // Handle deleting a project
  const handleDeleteProject = (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the row click
    
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
      
      // If active project is deleted, clear active state
      if (activeProject === projectId) {
        setActiveProject(null);
      }
    }
  };

  // Handle editing a project
  const handleEditProject = (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the row click
    
    // Navigate to edit page or open edit modal
    console.log('Edit project:', projectId);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="absolute z-[1000] top-4 left-4 bg-white dark:bg-gray-800 rounded-md shadow-lg p-0 w-80 flex flex-col max-h-[calc(100vh-120px)] overflow-hidden">
      <div className="bg-blue-600 dark:bg-blue-800 text-white p-3 rounded-t-md">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Projects ({displayedProjects.length})
          </h3>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-blue-700 dark:hover:bg-blue-700 rounded-sm"
          >
            {expanded ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronUp className="h-4 w-4" />
            }
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Search input */}
          <div className="relative p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-10 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            {searchTerm && (
              <button 
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-5"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            )}
          </div>

          {/* Project list */}
          <div className="overflow-y-auto flex-1">
            {displayedProjects.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No matching projects found' : 'No projects available'}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {displayedProjects.map(project => (
                  <li 
                    key={project.id}
                    onClick={() => handleFocusProject(project.id)}
                    className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition duration-150 ${
                      activeProject === project.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center mb-1">
                          <span 
                            className={`h-3 w-3 rounded-full mr-2 flex-shrink-0 ${getStatusColor(project.status)}`} 
                          />
                          <h4 className="font-medium text-sm truncate">{project.name}</h4>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-2">{project.description}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="mr-2">{project.status}</span>
                          <span className="mx-1">•</span>
                          <span>{project.category}</span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1 ml-1">
                        <button 
                          onClick={(e) => handleFocusProject(project.id)}
                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-sm text-blue-600 dark:text-blue-400"
                          title="Focus on map"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => handleEditProject(project.id, e)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-sm"
                          title="Edit project"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-sm text-red-600 dark:text-red-400"
                          title="Delete project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to get status color
function getStatusColor(status: string | undefined) {
  if (!status) return 'bg-gray-500';
  
  switch (status.toLowerCase()) {
    case 'active':
    case 'in progress':
    case 'construction':
      return 'bg-amber-500';
    case 'planned':
    case 'planning':
      return 'bg-blue-500';
    case 'completed':
    case 'complete':
      return 'bg-green-500';
    case 'on hold':
      return 'bg-yellow-500';
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
} 