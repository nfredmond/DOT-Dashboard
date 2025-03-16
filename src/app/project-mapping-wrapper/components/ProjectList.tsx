"use client";

import { useState } from 'react';
import { useProjects } from '@/contexts/ProjectsContext';
import { useMapIntegration } from '@/hooks/useMapIntegration';
import { 
  MapPin, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Search,
  X
} from 'lucide-react';

interface ProjectListProps {
  mapRef: React.MutableRefObject<any>;
}

export default function ProjectList({ mapRef }: ProjectListProps) {
  const { focusProject, handleProjectSelect } = useMapIntegration(mapRef);
  const { projects, filteredProjects, deleteProject } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(true);

  // Filter projects based on search term
  const displayedProjects = searchTerm 
    ? filteredProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredProjects;

  // Handle focusing on a project
  const handleFocusProject = (projectId: string) => {
    focusProject(projectId, 15); // Zoom level 15
  };

  // Handle deleting a project
  const handleDeleteProject = (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the row click
    
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
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
    <div className="absolute z-[1000] top-4 left-4 bg-white dark:bg-gray-800 rounded-md shadow-lg p-2 max-w-xs w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          Projects ({displayedProjects.length})
        </h3>
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

      {expanded && (
        <>
          {/* Search input */}
          <div className="relative mb-2">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <Search className="h-3 w-3 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-7 pr-7 py-1 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchTerm && (
              <button 
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-2"
              >
                <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Project list */}
          <div className="max-h-60 overflow-y-auto">
            {displayedProjects.length === 0 ? (
              <div className="text-center py-2 text-xs text-gray-500">
                {searchTerm ? 'No matching projects found' : 'No projects available'}
              </div>
            ) : (
              <ul className="space-y-1">
                {displayedProjects.map(project => (
                  <li 
                    key={project.id}
                    onClick={() => handleFocusProject(project.id)}
                    className="p-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 truncate">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-gray-500 truncate">{project.description}</div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button 
                          onClick={(e) => handleEditProject(project.id, e)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-sm"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-sm"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center mt-1">
                      <span 
                        className={`h-2 w-2 rounded-full mr-1 ${getStatusColor(project.status)}`} 
                      />
                      <span className="text-gray-500">{project.status}</span>
                      <span className="mx-1">•</span>
                      <span className="text-gray-500">{project.category}</span>
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
      return 'bg-green-500';
    case 'planned':
    case 'planning':
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
} 