"use client";

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useProjects } from '@/contexts/ProjectsContext';

/**
 * Map legend component that displays project categories and statuses with filtering capabilities
 */
export default function ProjectMapLegend() {
  const [expanded, setExpanded] = useState(true);
  const { projects, filteredProjects } = useProjects() || { projects: [], filteredProjects: [] };
  
  // Function to handle project type click
  const handleStatusClick = (status: string) => {
    // Access the window's leaflet map instance
    if (typeof window !== 'undefined' && window.leafletMapInstance) {
      const projectsWithStatus = filteredProjects.filter(p => 
        p.status.toLowerCase() === status.toLowerCase()
      );
      
      if (projectsWithStatus.length > 0) {
        // Create a layer group of all markers with this status
        const bounds = [];
        
        // Loop through layers on the map
        window.leafletMapInstance.eachLayer(layer => {
          // Check if layer is a marker, polyline, or polygon with project data
          if (layer.projectData) {
            const projectData = layer.projectData;
            if (projectData.status.toLowerCase() === status.toLowerCase()) {
              // Get position to create bounds
              if (layer.getLatLng) {
                bounds.push(layer.getLatLng());
              } else if (layer.getBounds) {
                bounds.push(layer.getBounds());
              }
              
              // Highlight the layer
              if (layer.setStyle) {
                layer.setStyle({
                  weight: 5,
                  color: '#3b82f6',
                  opacity: 1,
                  fillOpacity: 0.6
                });
              }
              
              // If it's a marker, open its popup
              if (layer.openPopup) {
                layer.openPopup();
              }
            }
          }
        });
        
        // Fit map to bounds if we found markers
        if (bounds.length > 0) {
          window.leafletMapInstance.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  };
  
  // Function to handle project category click
  const handleCategoryClick = (category: string) => {
    // Access the window's leaflet map instance
    if (typeof window !== 'undefined' && window.leafletMapInstance) {
      const projectsWithCategory = filteredProjects.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      );
      
      if (projectsWithCategory.length > 0) {
        // Create a layer group of all markers with this category
        const bounds = [];
        
        // Loop through layers on the map
        window.leafletMapInstance.eachLayer(layer => {
          // Check if layer is a marker, polyline, or polygon with project data
          if (layer.projectData) {
            const projectData = layer.projectData;
            if (projectData.category.toLowerCase() === category.toLowerCase()) {
              // Get position to create bounds
              if (layer.getLatLng) {
                bounds.push(layer.getLatLng());
              } else if (layer.getBounds) {
                bounds.push(layer.getBounds());
              }
              
              // Highlight the layer
              if (layer.setStyle) {
                layer.setStyle({
                  weight: 5,
                  color: '#3b82f6',
                  opacity: 1,
                  fillOpacity: 0.6
                });
              }
              
              // If it's a marker, open its popup
              if (layer.openPopup) {
                layer.openPopup();
              }
            }
          }
        });
        
        // Fit map to bounds if we found markers
        if (bounds.length > 0) {
          window.leafletMapInstance.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  };

  return (
    <div className="absolute z-[1000] bottom-24 right-8 bg-white dark:bg-gray-800 rounded-md shadow-lg p-3 w-64 max-h-[calc(100vh-100px)] flex flex-col overflow-visible">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Project Legend</h3>
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
        <div className="overflow-y-auto text-xs flex-1">
          <div className="mb-4">
            <h4 className="font-medium mb-2">Status</h4>
            <ul className="space-y-2">
              <li 
                className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                onClick={() => handleStatusClick('Construction')}
              >
                <span className="h-4 w-4 rounded-full mr-2 bg-amber-500"></span>
                <span>Construction</span>
              </li>
              <li 
                className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                onClick={() => handleStatusClick('Planning')}
              >
                <span className="h-4 w-4 rounded-full mr-2 bg-blue-500"></span>
                <span>Planning</span>
              </li>
              <li 
                className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                onClick={() => handleStatusClick('Complete')}
              >
                <span className="h-4 w-4 rounded-full mr-2 bg-green-500"></span>
                <span>Complete</span>
              </li>
            </ul>
          </div>
          
          <div className="mb-2">
            <h4 className="font-medium mb-2">Category</h4>
            <ul className="space-y-2">
              <li 
                className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                onClick={() => handleCategoryClick('Highway')}
              >
                <span className="h-4 w-4 mr-2 bg-red-500"></span>
                <span>Highway</span>
              </li>
              <li 
                className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                onClick={() => handleCategoryClick('Transit')}
              >
                <span className="h-4 w-4 mr-2 bg-blue-400"></span>
                <span>Transit</span>
              </li>
              <li 
                className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                onClick={() => handleCategoryClick('Bicycle')}
              >
                <span className="h-4 w-4 mr-2 bg-green-400"></span>
                <span>Bicycle</span>
              </li>
              <li 
                className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                onClick={() => handleCategoryClick('Bridge')}
              >
                <span className="h-4 w-4 mr-2 bg-yellow-500"></span>
                <span>Bridge</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 