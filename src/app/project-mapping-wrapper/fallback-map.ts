/**
 * Fallback implementation to initialize a Leaflet map directly without React components.
 * This is a last resort if the React-Leaflet components fail to render.
 */

// Import the ProjectMarker type from types file
import { ProjectMarker, MapConfig } from './fallback-map-types';

// Extend the ProjectMarker interface to include fillOpacity
declare module './fallback-map-types' {
  interface ProjectMarker {
    fillOpacity?: number;
  }
}

// Define custom Leaflet feature types
type LeafletMarkerWithData = L.Marker & { projectData?: ProjectMarker };
type LeafletPolylineWithData = L.Polyline & { projectData?: ProjectMarker };
type LeafletPolygonWithData = L.Polygon & { projectData?: ProjectMarker };
type LeafletFeature = LeafletMarkerWithData | LeafletPolylineWithData | LeafletPolygonWithData;

// Type guards to check feature types
function isMarker(feature: any): feature is L.Marker {
  return feature && typeof feature.getLatLng === 'function';
}

function isPolyline(feature: any): feature is L.Polyline {
  return feature && feature.getLatLngs && !(feature as any)._bounds.isValid;
}

function isPolygon(feature: any): feature is L.Polygon {
  return feature && feature.getLatLngs && (feature as any)._bounds.isValid;
}

// Sample project data - will be replaced with dynamic data
let SAMPLE_PROJECTS: ProjectMarker[] = [
  {
    id: '1',
    name: 'Highway 101 Expansion',
    description: 'Expansion of Highway 101 to reduce congestion',
    latitude: 39.2715,
    longitude: -121.0249,
    status: 'Construction',
    category: 'Highway',
    budget: 24000000,
    geometryType: 'point',
    color: '#d97706'
  },
  {
    id: '2',
    name: 'Downtown Light Rail',
    description: 'New light rail system connecting downtown area',
    status: 'Planning',
    category: 'Transit',
    budget: 12000000,
    geometryType: 'line',
    path: [
      [39.2515, -121.0049],
      [39.2535, -121.0079],
      [39.2565, -121.0099],
      [39.2595, -121.0129],
      [39.2615, -121.0159]
    ],
    color: '#3b82f6',
    weight: 5,
    opacity: 0.8
  },
  {
    id: '3',
    name: 'Waterfront Pedestrian Bridge',
    description: 'Pedestrian bridge connecting the harbor to downtown',
    latitude: 39.2615,
    longitude: -121.0349,
    status: 'Complete', 
    category: 'Bicycle',
    budget: 5000000,
    geometryType: 'point',
    color: '#10b981'
  },
  {
    id: '4',
    name: 'Bike Lane Expansion',
    description: 'Adding protected bike lanes throughout the city',
    status: 'Construction',
    category: 'Bridge',
    budget: 35000000,
    geometryType: 'polygon',
    polygon: [
      [39.2535, -121.0149],
      [39.2515, -121.0129],
      [39.2495, -121.0149],
      [39.2515, -121.0169],
      [39.2535, -121.0149]
    ],
    color: '#d97706',
    fillColor: '#d97706',
    weight: 2,
    opacity: 0.6
  },
  {
    id: '5',
    name: 'Highway 192 Repair',
    description: 'Repairing damage from recent storms',
    latitude: 39.2715,
    longitude: -121.0449,
    status: 'Planning',
    category: 'Planning Study',
    budget: 1200000,
    geometryType: 'point',
    color: '#6366f1'
  }
];

// Function to update the projects data from external source
export function updateProjectsData(projects: ProjectMarker[]): void {
  if (Array.isArray(projects) && projects.length > 0) {
    SAMPLE_PROJECTS = projects;
    logger.log(`Updated projects data with ${projects.length} projects`);
    
    // Refresh the map if it's already initialized
    if (typeof window !== 'undefined' && window.leafletMapInstance) {
      refreshMapFeatures();
      
      // Dispatch event to notify that projects have been updated
      const event = new CustomEvent('fallback-projects-updated');
      window.dispatchEvent(event);
    }
  }
}

// Function to get the current projects data
export function getProjectsData(): ProjectMarker[] {
  return [...SAMPLE_PROJECTS];
}

// Function to synchronize with the main map's project data
export function syncWithMainMap(mainMapProjects: any[]): void {
  // Convert main map projects to the fallback map format
  const convertedProjects = mainMapProjects.map(project => {
    // Base properties that should exist in both systems
    const baseProject: Partial<ProjectMarker> = {
      id: project.id,
      name: project.name,
      description: project.description || "",
      status: project.status,
      category: project.category,
      budget: typeof project.allocatedBudget === 'number' ? project.allocatedBudget : 
             typeof project.budget === 'number' ? project.budget : undefined
    };
    
    // Determine geometry type and add appropriate properties
    if (project.geometry) {
      // Main map uses GeoJSON format
      switch (project.geometry.type) {
        case 'Point':
          return {
            ...baseProject,
            geometryType: 'point',
            latitude: project.geometry.coordinates[1],  // GeoJSON uses [lng, lat]
            longitude: project.geometry.coordinates[0],
            color: getColorForStatus(project.status)
          } as ProjectMarker;
          
        case 'LineString':
          return {
            ...baseProject,
            geometryType: 'line',
            // Convert GeoJSON [lng, lat] to our format [lat, lng]
            path: project.geometry.coordinates.map((coord: number[]) => 
              [coord[1], coord[0]] as [number, number]
            ),
            color: getColorForStatus(project.status),
            weight: 5,
            opacity: 0.8
          } as ProjectMarker;
          
        case 'Polygon':
          if (project.geometry.coordinates[0]) {
            return {
              ...baseProject,
              geometryType: 'polygon',
              // Convert GeoJSON [lng, lat] to our format [lat, lng]
              polygon: project.geometry.coordinates[0].map((coord: number[]) => 
                [coord[1], coord[0]] as [number, number]
              ),
              color: getColorForStatus(project.status),
              fillColor: getColorForStatus(project.status),
              weight: 2,
              opacity: 0.6
            } as ProjectMarker;
          }
          break;
      }
    } 
    
    // Fallback if no geometry or unrecognized format - use project.coordinates or default location
    return {
      ...baseProject,
      geometryType: 'point',
      latitude: project.coordinates?.latitude ?? 39.2615,
      longitude: project.coordinates?.longitude ?? -121.0149,
      color: getColorForStatus(project.status)
    } as ProjectMarker;
  });
  
  // Update the fallback map with the converted projects
  updateProjectsData(convertedProjects);
}

// Helper function to get color based on status
function getColorForStatus(status: string): string {
  switch (status) {
    case 'Construction':
    case 'Active':
    case 'In Progress':
      return '#d97706'; // Amber
    case 'Planning':
    case 'Proposed':
      return '#3b82f6'; // Blue
    case 'Complete':
    case 'Completed':
      return '#10b981'; // Green
    default:
      return '#6b7280'; // Gray
  }
}

// Get icon URL based on project category
function _getIconUrl(_category: string): string {
  const defaultIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
  
  // In a real implementation, you would have category-specific icons
  return defaultIcon;
}

// Create marker popup content with theme-responsive styling
function createPopupContent(project: ProjectMarker): string {
  const budget = project.budget ? 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(project.budget) : 
    'N/A';
  
  // More robust dark mode detection - explicitly check for both 'dark' class and system preference
  let isDarkMode = false;
  
  if (typeof window !== 'undefined') {
    // Check if there's a theme in localStorage (many Next.js theme implementations use this)
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      isDarkMode = storedTheme === 'dark';
    } else {
      // Check if dark class is on html element
      isDarkMode = document.documentElement.classList.contains('dark');
      
      // If no explicit class found, check system preference as fallback
      if (!isDarkMode) {
        isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    }
  }
  
  // Set colors based on theme
  const colors = isDarkMode ? {
    // Dark mode colors
    background: '#1e1e1e',
    text: '#e4e4e7',
    heading: '#ffffff',
    subtext: '#a1a1aa',
    border: '#333333',
    cardBackground: '#27272a',
    footerBackground: '#292929',
    linkColor: '#60a5fa'
  } : {
    // Light mode colors - enhanced for better contrast
    background: '#ffffff',
    text: '#374151',
    heading: '#111827',
    subtext: '#6b7280',
    border: '#e5e7eb',
    cardBackground: '#f3f4f6',
    footerBackground: '#f9fafb',
    linkColor: '#3b82f6'
  };
  
  // Enhanced popup styling with responsive design
  return `
    <div style="
      min-width: 260px; 
      max-width: 320px; 
      background-color: ${colors.background}; 
      color: ${colors.text}; 
      border-radius: 8px; 
      box-shadow: 0 4px 16px rgba(0, 0, 0, ${isDarkMode ? '0.4' : '0.1'}); 
      overflow: hidden;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    ">
      <div style="padding: 16px;">
        <h3 style="
          font-weight: 600; 
          font-size: 17px; 
          margin: 0 0 8px 0; 
          color: ${colors.heading};
          line-height: 1.3;
        ">${project.name}</h3>
        
        <p style="
          margin: 0 0 16px 0; 
          color: ${colors.text}; 
          font-size: 14px; 
          line-height: 1.5;
          opacity: 0.9;
        ">${project.description}</p>
        
        <div style="
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 12px;
          margin-top: 16px;
          border-top: 1px solid ${colors.border}; 
          padding-top: 12px;
        ">
          <div>
            <div style="
              font-size: 12px; 
              color: ${colors.subtext}; 
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Category</div>
            <div style="
              font-size: 14px; 
              font-weight: 500; 
              color: ${isDarkMode ? '#ffffff' : '#374151'};
            ">${project.category}</div>
          </div>
          
          <div>
            <div style="
              font-size: 12px; 
              color: ${colors.subtext}; 
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Status</div>
            <div style="
              display: inline-block;
              font-size: 13px; 
              font-weight: 500; 
              padding: 2px 8px;
              border-radius: 9999px;
              background-color: ${getStatusColor(project.status, isDarkMode)};
              color: ${getStatusTextColor(project.status, isDarkMode)};
            ">${project.status}</div>
          </div>
          
          <div>
            <div style="
              font-size: 12px; 
              color: ${colors.subtext}; 
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Budget</div>
            <div style="
              font-size: 14px; 
              font-weight: 600; 
              color: ${colors.heading};
            ">${budget}</div>
          </div>
        </div>
      </div>
      
      <div style="
        background-color: ${colors.footerBackground}; 
        padding: 12px 16px; 
        display: flex; 
        justify-content: flex-end;
        border-top: 1px solid ${colors.border};
      ">
        <a href="#" style="
          color: ${colors.linkColor}; 
          font-size: 13px; 
          text-decoration: none;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 4px;
          background: ${isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
          transition: background 0.2s;
        ">View Details</a>
      </div>
    </div>
  `;
}

// Helper function to get status color with theme support
function getStatusColor(status: string, isDarkMode = false): string {
  if (isDarkMode) {
    switch (status) {
      case 'Construction':
        return '#b45309'; // Dark orange/amber
      case 'Planning':
        return '#1d4ed8'; // Dark blue
      case 'Complete':
        return '#15803d'; // Dark green
      default:
        return '#4b5563'; // Dark gray
    }
  } else {
    switch (status) {
      case 'Construction':
        return '#fef3c7'; // Light orange/amber
      case 'Planning':
        return '#dbeafe'; // Light blue
      case 'Complete':
        return '#dcfce7'; // Light green
      default:
        return '#f3f4f6'; // Light gray
    }
  }
}

// Helper function to get status text color
function getStatusTextColor(status: string, isDarkMode = false): string {
  if (isDarkMode) {
    switch (status) {
      case 'Construction':
        return '#fbbf24'; // Orange/amber text
      case 'Planning':
        return '#60a5fa'; // Blue text
      case 'Complete':
        return '#34d399'; // Green text
      default:
        return '#9ca3af'; // Gray text
    }
  } else {
    switch (status) {
      case 'Construction':
        return '#b45309'; // Orange/amber text
      case 'Planning':
        return '#1d4ed8'; // Blue text
      case 'Complete':
        return '#15803d'; // Green text
      default:
        return '#4b5563'; // Gray text
    }
  }
}

// Track project features
let projectFeatures: Record<string, LeafletFeature> = {};

// Setup search control with address lookup
function setupSearchControl(map: L.Map): void {
  if (typeof window === 'undefined' || !window.L) return;
  
  try {
    // Make sure CSS is loaded first
    const cssUrl = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css';
    if (!document.querySelector(`link[href="${cssUrl}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      document.head.appendChild(link);
    }
    
    // Add custom styles to ensure control visibility
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .leaflet-control-geocoder {
        clear: none !important;
        margin-left: 0 !important;
        margin-top: 0 !important;
        box-shadow: 0 1px 5px rgba(0,0,0,0.4);
        border-radius: 4px;
        background: white;
      }
      
      .leaflet-control-geocoder-form input {
        min-width: 200px;
      }
      
      /* Ensure control is visible in both dark and light modes */
      .leaflet-control-geocoder-form input {
        color: #333;
        background: white;
      }
      
      /* Improve clear button visibility */
      .leaflet-control-geocoder-form button {
        color: #666;
      }
      
      /* Fix positioning issues */
      .search-control-wrapper {
        margin-bottom: 8px !important;
      }
      
      /* Style search results */
      .leaflet-control-geocoder-alternatives {
        width: 100%;
        max-height: 300px;
        overflow-y: auto;
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      }
      
      .leaflet-control-geocoder-alternatives li {
        border-bottom: 1px solid #eee;
        padding: 10px;
      }
      
      .leaflet-control-geocoder-alternatives li:last-child {
        border-bottom: none;
      }
      
      .leaflet-control-geocoder a.leaflet-control-geocoder-icon {
        background-position: center;
      }
      
      /* Custom dismiss button for search results */
      .search-result-dismiss {
        display: flex;
        padding: 8px;
        justify-content: center;
        border-top: 1px solid #eee;
        color: #2563eb;
        font-weight: bold;
        cursor: pointer;
      }
      
      .search-result-dismiss:hover {
        background-color: #f8fafc;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Direct script loading to ensure it's loaded immediately
    const scriptUrl = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js';
    if (!window.L.Control.Geocoder) {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      
      script.onload = () => {
        logger.log('Geocoder script loaded');
        initializeSearchControl(map);
      };
      
      script.onerror = (error) => {
        logger.error('Error loading geocoder script:', error);
      };
      
      document.head.appendChild(script);
    } else {
      // Script already loaded
      initializeSearchControl(map);
    }
  } catch (error) {
    logger.error('Error setting up search control:', error);
  }
}

// Initialize the search control once the script is loaded
function initializeSearchControl(map: L.Map): void {
  try {
    if (!window.L.Control.Geocoder) {
      logger.error('Geocoder control not available');
      return;
    }
    
    // Create a wrapper div with specific margins
    const controlWrapper = window.L.DomUtil.create('div', 'search-control-wrapper');
    controlWrapper.style.marginBottom = '8px';
    
    // Create the control container
    const controlContainer = window.L.Control.geocoder({
      defaultMarkGeocode: false,
      position: 'topleft',
      placeholder: 'Search address...',
      errorMessage: 'Nothing found',
      suggestMinLength: 3,
      suggestTimeout: 250,
      queryMinLength: 1,
      geocoder: window.L.Control.Geocoder.nominatim({
        geocodingQueryParams: {
          countrycodes: 'us',
          limit: 5
        }
      })
    });
    
    // Add custom handler for results
    controlContainer.on('markgeocode', function(event) {
      const { geocode } = event;
      const latlng = geocode.center;
      const bounds = geocode.bbox;
      
      // Remove any previous result markers
      if (window.searchResultMarker) {
        map.removeLayer(window.searchResultMarker);
      }
      
      // Create a marker for the search result
      window.searchResultMarker = window.L.marker(latlng, {
        icon: window.L.divIcon({
          html: `
            <div style="
              background-color: #ef4444;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 0 2px #ef4444, 0 0 10px rgba(0,0,0,0.3);
            "></div>
          `,
          className: 'search-result-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        })
      }).addTo(map);
      
      // Create a popup with the search result and a dismiss button
      const popupContent = document.createElement('div');
      
      const addressDiv = document.createElement('div');
      addressDiv.style.marginBottom = '8px';
      addressDiv.style.maxWidth = '250px';
      addressDiv.style.wordBreak = 'break-word';
      addressDiv.innerHTML = `<strong>${geocode.name}</strong>`;
      
      const dismissButton = document.createElement('button');
      dismissButton.innerText = 'Clear Search';
      dismissButton.style.display = 'block';
      dismissButton.style.width = '100%';
      dismissButton.style.padding = '6px';
      dismissButton.style.backgroundColor = '#f1f5f9';
      dismissButton.style.border = 'none';
      dismissButton.style.borderRadius = '4px';
      dismissButton.style.color = '#2563eb';
      dismissButton.style.fontWeight = 'bold';
      dismissButton.style.cursor = 'pointer';
      dismissButton.onclick = function() {
        if (window.searchResultMarker) {
          map.removeLayer(window.searchResultMarker);
          window.searchResultMarker = null;
        }
        map.closePopup();
      };
      
      popupContent.appendChild(addressDiv);
      popupContent.appendChild(dismissButton);
      
      window.searchResultMarker.bindPopup(popupContent).openPopup();
      
      // Fit the map to the bounds with padding
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView(latlng, 16);
      }
    });
    
    // Add the control to the map
    controlContainer.addTo(map);
    logger.log('Added search control to map');
  } catch (error) {
    logger.error('Error initializing search control:', error);
  }
}

// Setup geolocation functionality
function setupGeolocation(map: L.Map): void {
  if (typeof window === 'undefined' || !window.L) return;
  
  try {
    // Create locate control with improved styling
    const locateControl = window.L.control({
      position: 'topleft'
    });
    
    locateControl.onAdd = function() {
      const container = window.L.DomUtil.create('div', 'leaflet-bar leaflet-control custom-locate-control');
      container.innerHTML = `
        <a href="#" title="Show my location" role="button" aria-label="Show my location" style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.4);
          color: #2563eb;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="8"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </a>
      `;
      
      // Handle click events
      container.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Add active state to the button
        const button = container.querySelector('a');
        if (button) {
          button.style.backgroundColor = '#e6f1ff';
          button.style.color = '#1d4ed8';
          
          // Reset button style after 2 seconds
          setTimeout(() => {
            button.style.backgroundColor = 'white';
            button.style.color = '#2563eb';
          }, 2000);
        }
        
        getUserLocation(map);
        return false;
      };
      
      return container;
    };
    
    locateControl.addTo(map);
    logger.log('Added geolocation control to map');
  } catch (error) {
    logger.error('Error setting up geolocation:', error);
  }
}

// Locate the user with improved UX
function getUserLocation(map: L.Map): void {
  if (typeof window === 'undefined' || !window.L || !navigator.geolocation) return;
  
  try {
    // Create a loading indicator directly on the map
    const loadingContainer = window.L.DomUtil.create('div', 'geolocation-loading');
    loadingContainer.style.position = 'absolute';
    loadingContainer.style.zIndex = '1000';
    loadingContainer.style.top = '50%';
    loadingContainer.style.left = '50%';
    loadingContainer.style.transform = 'translate(-50%, -50%)';
    loadingContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingContainer.style.borderRadius = '8px';
    loadingContainer.style.padding = '12px 16px';
    loadingContainer.style.color = 'white';
    loadingContainer.style.fontSize = '14px';
    loadingContainer.style.display = 'flex';
    loadingContainer.style.alignItems = 'center';
    loadingContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    
    const spinner = document.createElement('div');
    spinner.style.width = '20px';
    spinner.style.height = '20px';
    spinner.style.borderRadius = '50%';
    spinner.style.border = '3px solid #ffffff';
    spinner.style.borderTopColor = '#3b82f6';
    spinner.style.animation = 'spin 1s linear infinite';
    spinner.style.marginRight = '10px';
    
    const loadingText = document.createElement('span');
    loadingText.innerText = 'Finding your location...';
    
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    
    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(loadingText);
    document.head.appendChild(styleEl);
    
    // Add loading indicator to the map container
    map.getContainer().appendChild(loadingContainer);
    
    // Clear any existing location marker
    if (window.userLocationMarker) {
      map.removeLayer(window.userLocationMarker);
    }
    
    // Request location from browser
    navigator.geolocation.getCurrentPosition(
      // Success handler
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Create a marker for the user's location
        const locationIcon = window.L.divIcon({
          html: `
            <div style="
              background-color: #3b82f6;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 0 2px #3b82f6, 0 0 10px rgba(0,0,0,0.5);
            "></div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background-color: rgba(59, 130, 246, 0.2);
              animation: pulse 2s infinite;
            "></div>
          `,
          className: 'user-location-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
        
        window.userLocationMarker = window.L.marker([latitude, longitude], {
          icon: locationIcon,
          zIndexOffset: 1000
        }).addTo(map);
        
        // Add a pulse animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
        
        // Pan to the location
        map.setView([latitude, longitude], 15, {
          animate: true,
          duration: 1
        });
        
        // Add a popup
        window.userLocationMarker.bindPopup(`
          <div style="text-align: center;">
            <strong>Your Location</strong><br>
            <span style="font-size: 12px; color: #666;">Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}</span>
          </div>
        `).openPopup();
        
        // Remove loading indicator
        if (loadingContainer.parentNode) {
          loadingContainer.parentNode.removeChild(loadingContainer);
        }
      },
      // Error handler
      (error) => {
        logger.error('Error getting user location:', error);
        
        // Update loading indicator with error message
        if (loadingContainer.parentNode) {
          loadingContainer.innerHTML = '';
          
          const errorIcon = document.createElement('div');
          errorIcon.innerHTML = '⚠️';
          errorIcon.style.fontSize = '20px';
          errorIcon.style.marginRight = '10px';
          
          const errorText = document.createElement('div');
          errorText.style.display = 'flex';
          errorText.style.flexDirection = 'column';
          
          const errorTitle = document.createElement('span');
          errorTitle.innerText = 'Location Error';
          errorTitle.style.fontWeight = 'bold';
          errorTitle.style.marginBottom = '4px';
          
          const errorMsg = document.createElement('span');
          errorMsg.innerText = error.message || 'Could not access your location';
          errorMsg.style.fontSize = '12px';
          errorMsg.style.opacity = '0.8';
          
          const dismissBtn = document.createElement('button');
          dismissBtn.innerText = 'Dismiss';
          dismissBtn.style.marginTop = '10px';
          dismissBtn.style.backgroundColor = '#3b82f6';
          dismissBtn.style.border = 'none';
          dismissBtn.style.color = 'white';
          dismissBtn.style.padding = '4px 8px';
          dismissBtn.style.borderRadius = '4px';
          dismissBtn.style.cursor = 'pointer';
          dismissBtn.style.alignSelf = 'flex-end';
          dismissBtn.onclick = function() {
            if (loadingContainer.parentNode) {
              loadingContainer.parentNode.removeChild(loadingContainer);
            }
          };
          
          errorText.appendChild(errorTitle);
          errorText.appendChild(errorMsg);
          errorText.appendChild(dismissBtn);
          
          loadingContainer.style.display = 'flex';
          loadingContainer.style.alignItems = 'flex-start';
          loadingContainer.appendChild(errorIcon);
          loadingContainer.appendChild(errorText);
          
          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            if (loadingContainer.parentNode) {
              loadingContainer.parentNode.removeChild(loadingContainer);
            }
          }, 5000);
        }
      },
      // Options
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } catch (error) {
    logger.error('Error with geolocation:', error);
  }
}

// Add a method to focus on a specific project feature
export function focusProjectMarker(projectId: string): void {
  if (typeof window === 'undefined' || !window.leafletMapInstance) return;
  
  const feature = projectFeatures[projectId];
  if (!feature) {
    logger.warn(`No feature found for project ID: ${projectId}`);
    return;
  }
  
  // Center the map on the feature
  if (isMarker(feature)) {
    // For markers (points)
    window.leafletMapInstance.setView(feature.getLatLng(), 15, {
      animate: true,
      duration: 0.8
    });
    feature.openPopup();
  } else if (isPolyline(feature) || isPolygon(feature)) {
    // For polylines and polygons
    window.leafletMapInstance.fitBounds(feature.getBounds(), {
      padding: [50, 50],
      animate: true,
      duration: 0.8
    });
    
    // For polylines and polygons, we create a popup at the center of the bounds
    const bounds = feature.getBounds();
    const center = bounds.getCenter();
    
    const _popup = window.L.popup()
      .setLatLng(center)
      .setContent(createPopupContent(feature.projectData || SAMPLE_PROJECTS[0]))
      .openOn(window.leafletMapInstance);
  }
  
  // Highlight the feature
  highlightFeature(feature);
}

// Function to highlight a feature
function highlightFeature(feature: LeafletFeature): void {
  // Remove highlight from all features
  Object.values(projectFeatures).forEach((f) => {
    try {
      // Reset marker styling for L.Marker
      if (isMarker(f) && f._icon) {
        f._icon.style.zIndex = '';
        f._icon.style.filter = '';
        f._icon.style.transform = '';
      }
      
      // Reset styling for polylines and polygons
      if ((isPolyline(f) || isPolygon(f)) && typeof f.setStyle === 'function') {
        f.setStyle({
          weight: f.projectData?.weight || 3,
          opacity: f.projectData?.opacity || 0.7,
          color: f.projectData?.color || '#3388ff',
          fillOpacity: 0.2
        });
      }
    } catch (e) {
      logger.warn('Error resetting feature style:', e);
    }
  });
  
  try {
    // Highlight the selected feature
    if (isMarker(feature) && feature._icon) {
      feature._icon.style.zIndex = '1000'; // Bring to front
      feature._icon.style.filter = 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.8))'; // Blue glow
      feature._icon.style.transform = 'scale(1.2) translate(-42%, -42%)'; // Make slightly larger
    } else if ((isPolyline(feature) || isPolygon(feature)) && typeof feature.setStyle === 'function') {
      // Highlight line or polygon
      feature.setStyle({
        weight: (feature.projectData?.weight || 3) + 2,
        opacity: 1,
        color: '#3b82f6', // Highlight color
        fillOpacity: 0.4,
        dashArray: ''
      });
      
      if (typeof feature.bringToFront === 'function') {
        feature.bringToFront();
      }
    }
  } catch (e) {
    logger.warn('Error highlighting feature:', e);
  }
}

// Function to refresh map features when projects data changes
function refreshMapFeatures(): void {
  if (typeof window === 'undefined' || !window.leafletMapInstance) return;
  
  try {
    const map = window.leafletMapInstance;
    
    // Remove existing features
    Object.values(projectFeatures).forEach(feature => {
      map.removeLayer(feature);
    });
    
    // Reset features object
    projectFeatures = {};
    
    // Add features for each project
    const allFeatures: LeafletFeature[] = [];
    
    // Add features for each project based on geometry type
    SAMPLE_PROJECTS.forEach(project => {
      let feature: LeafletFeature | null = null;
      
      // Create the appropriate feature based on geometry type
      switch (project.geometryType) {
        case 'point':
          if (project.latitude && project.longitude) {
            // Create marker for point geometry
            feature = createMarkerForProject(project);
          }
          break;
          
        case 'line':
          if (project.path && project.path.length >= 2) {
            // Create polyline for line geometry
            feature = createMarkerForProject(project);
          }
          break;
          
        case 'polygon':
          if (project.polygon && project.polygon.length >= 3) {
            // Create polygon for polygon geometry
            feature = createMarkerForProject(project);
          }
          break;
      }
      
      if (feature) {
        // Store feature reference
        projectFeatures[project.id] = feature;
        
        // Add click handler for all feature types
        feature.on('click', () => {
          // Log the click
          logger.log(`Feature clicked for project: ${project.name}`);
          
          // Highlight the feature
          highlightFeature(feature as LeafletFeature);
          
          // Dispatch custom event that can be captured in React components
          const event = new CustomEvent('project-marker-clicked', {
            detail: { projectId: project.id }
          });
          window.dispatchEvent(event);
        });
        
        // Add to collection for bounds
        allFeatures.push(feature);
      }
    });
    
    // Fit bounds to show all features
    if (allFeatures.length > 0) {
      try {
        const group = window.L.featureGroup(allFeatures);
        map.fitBounds(group.getBounds().pad(0.2));
      } catch (e) {
        logger.warn('Error fitting bounds:', e);
      }
    }
    
    logger.log('Refreshed map features successfully');
  } catch (error) {
    logger.error('Error refreshing map features:', error);
  }
}

function createMarkerForProject(project: ProjectMarker): LeafletFeature {
  if (project.geometryType === 'point' && project.latitude !== undefined && project.longitude !== undefined) {
    // Create a marker for point geometry
    const marker = L.marker([project.latitude, project.longitude], {
      title: project.name,
      icon: getMarkerIcon(project)
    });
    
    // Add the project data to the marker for reference
    marker.projectData = project;
    
    // Add popup
    marker.bindPopup(createPopupContent(project), {
      maxWidth: 320,
      minWidth: 260,
      className: 'project-popup'
    });
    
    return marker;
  } else if (project.geometryType === 'line' && project.path) {
    // Create a polyline for line geometry
    const polyline = L.polyline(project.path, {
      color: project.color || getColorForStatus(project.status),
      weight: project.weight || 4,
      opacity: project.opacity || 0.7
    });
    
    // Add the project data to the polyline for reference
    polyline.projectData = project;
    
    // Add popup
    polyline.bindPopup(createPopupContent(project), {
      maxWidth: 320,
      minWidth: 260,
      className: 'project-popup'
    });
    
    return polyline;
  } else if (project.geometryType === 'polygon' && project.polygon) {
    // Create a polygon for polygon geometry
    const polygon = L.polygon(project.polygon, {
      color: project.color || getColorForStatus(project.status),
      fillColor: project.fillColor || project.color || getColorForStatus(project.status),
      weight: project.weight || 2,
      opacity: project.opacity || 0.8,
      fillOpacity: project.fillOpacity || 0.2
    });
    
    // Add the project data to the polygon for reference
    polygon.projectData = project;
    
    // Add popup
    polygon.bindPopup(createPopupContent(project), {
      maxWidth: 320,
      minWidth: 260,
      className: 'project-popup'
    });
    
    return polygon;
  }
  
  // Fallback for incomplete data - create a simple marker at a default position
  logger.warn('Incomplete project data for', project.name);
  const defaultMarker = L.marker([39.2615, -121.0149], {
    title: project.name + ' (Location Approximated)',
    icon: getMarkerIcon(project)
  });
  
  // Add the project data to the marker for reference
  defaultMarker.projectData = project;
  
  defaultMarker.bindPopup(createPopupContent(project));
  return defaultMarker;
}

// Helper function to get marker icon based on project category
function getMarkerIcon(project: ProjectMarker): any {
  // Create a colored marker based on project status
  const color = getColorForStatus(project.status);
  
  // Default icon - can be extended to have category-specific icons
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

// Complete the initializeDirectMap function update that was started earlier
export function initializeDirectMap(containerId: string, config?: Partial<MapConfig>): void {
  if (typeof window === 'undefined') return;
  
  logger.log(`Attempting direct map initialization for container ${containerId}`);
  
  // Make sure Leaflet is loaded
  if (!window.L) {
    logger.error('Leaflet is not loaded. Cannot initialize map.');
    return;
  }
  
  // Get the container element
  const container = document.getElementById(containerId);
  if (!container) {
    logger.error(`Container with ID ${containerId} not found.`);
    return;
  }
  
  try {
    // First, make sure the container has proper dimensions
    container.style.minHeight = '700px';
    container.style.height = '100%';
    container.style.width = '100%';
    container.style.position = 'relative';
    container.style.display = 'block';
    container.style.visibility = 'visible';
    
    // Force layout recalculation
    container.getBoundingClientRect();
    
    logger.log(`Container dimensions: ${container.clientWidth}x${container.clientHeight}`);
    
    // Check if the map is already initialized in this container
    if (container.querySelector('.leaflet-container')) {
      logger.warn('Map already exists in container. Skipping initialization.');
      return;
    }
    
    // Get map configuration or use defaults
    const mapConfig = {
      basemap: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      },
      initialView: {
        center: [39.2615, -121.0149] as [number, number], // Nevada City, CA 
        zoom: 13
      },
      controls: {
        showZoom: true,
        showGeolocation: true,
        showSearch: true
      },
      ...config
    };
    
    // Initialize the map with configuration
    const map = window.L.map(container, {
      center: mapConfig.initialView.center, 
      zoom: mapConfig.initialView.zoom,
      zoomControl: false  // Disable default zoom control so we can position it
    });
    
    // Add zoom control to the bottom right if enabled
    if (mapConfig.controls.showZoom !== false) {
      window.L.control.zoom({
        position: 'bottomright'
      }).addTo(map);
    }
    
    // Add a tile layer with configured basemap
    window.L.tileLayer(mapConfig.basemap.url, {
      attribution: mapConfig.basemap.attribution,
      maxZoom: 19
    }).addTo(map);
    
    // Add search control if enabled
    if (mapConfig.controls.showSearch !== false) {
      setupSearchControl(map);
    }
    
    // Add geolocation control if enabled
    if (mapConfig.controls.showGeolocation !== false) {
      setupGeolocation(map);
    }
    
    // Reset features object
    projectFeatures = {};
    
    // Array to collect all features for bounds calculation
    const allFeatures: LeafletFeature[] = [];
    
    // Add features for each project based on geometry type
    SAMPLE_PROJECTS.forEach(project => {
      let feature: LeafletFeature | null = null;
      
      // Create the appropriate feature based on geometry type
      switch (project.geometryType) {
        case 'point':
          if (project.latitude && project.longitude) {
            // Create marker for point geometry
            feature = createMarkerForProject(project);
          }
          break;
          
        case 'line':
          if (project.path && project.path.length >= 2) {
            // Create polyline for line geometry
            feature = createMarkerForProject(project);
          }
          break;
          
        case 'polygon':
          if (project.polygon && project.polygon.length >= 3) {
            // Create polygon for polygon geometry
            feature = createMarkerForProject(project);
          }
          break;
      }
      
      if (feature) {
        // Store feature reference
        projectFeatures[project.id] = feature;
        
        // Add click handler for all feature types
        feature.on('click', () => {
          // Log the click
          logger.log(`Feature clicked for project: ${project.name}`);
          
          // Highlight the feature
          highlightFeature(feature as LeafletFeature);
          
          // Dispatch custom event that can be captured in React components
          const event = new CustomEvent('project-marker-clicked', {
            detail: { projectId: project.id }
          });
          window.dispatchEvent(event);
        });
        
        // Add to collection for bounds
        allFeatures.push(feature);
      }
    });
    
    // Store map reference in window for debugging
    window.leafletMapInstance = map;
    
    // Fit bounds to show all features
    if (allFeatures.length > 0) {
      try {
        const group = window.L.featureGroup(allFeatures);
        map.fitBounds(group.getBounds().pad(0.2));
      } catch (e) {
        logger.warn('Error fitting bounds:', e);
      }
    }
    
    // Force a resize to ensure correct dimensions
    setTimeout(() => {
      map.invalidateSize(true);
      logger.log('Map size invalidated after creation');
    }, 500);
    
    logger.log('Map initialized successfully with direct DOM method');
    
    // Dispatch event to notify that map is ready
    const event = new CustomEvent('leaflet-map-ready');
    window.dispatchEvent(event);
    
  } catch (error) {
    logger.error('Error initializing Leaflet map:', error);
  }
}

export function cleanupDirectMap(): void {
  if (typeof window === 'undefined') return;
  
  logger.log('Cleaning up direct map implementation');
  
  if (window.leafletMapInstance) {
    try {
      window.leafletMapInstance.remove();
      window.leafletMapInstance = null;
      logger.log('Map instance removed');
    } catch (e) {
      logger.warn('Error removing map instance:', e);
    }
  }
  
  // Also clean up any Leaflet DOM elements
  try {
    const leafletElements = document.querySelectorAll('[class^="leaflet-"]');
    leafletElements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    // Clean up search result and user location
    if (window.searchResultLayer) {
      window.searchResultLayer = null;
    }
    
    if (window.userLocationMarker) {
      window.userLocationMarker = null;
    }
    
    if (window.dismissSearchButton) {
      window.dismissSearchButton = null;
    }
    
    logger.log('Removed Leaflet DOM elements');
  } catch (e) {
    logger.warn('Error cleaning up Leaflet DOM elements:', e);
  }
}

// Add type declarations for Window to make TypeScript happy
declare global {
  interface Window {
    L: any;
    leafletMapInstance: any;
    searchResultLayer: any;
    userLocationMarker: any;
    dismissSearchButton: any;
    searchResultMarker: any;
    projectMarkers: Record<string, any>;
    isDarkMode: boolean;
    themeObserver: MutationObserver;
  }
}

// Set up theme change detection
if (typeof window !== 'undefined') {
  // Listen for theme changes from system preference
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (window.leafletMapInstance) {
      // Refresh the map features to update popup styles
      refreshMapFeatures();
    }
  });
  
  // Watch for theme changes from manual toggles (class changes on document)
import logger from '../../lib/logger';

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (window.leafletMapInstance) {
          // Refresh the map features to update popup styles
          refreshMapFeatures();
        }
        break;
      }
    }
  });
  
  // Start observing theme changes once the document is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.documentElement, { attributes: true });
    });
  } else {
    observer.observe(document.documentElement, { attributes: true });
  }
  
  // Monitor localStorage changes for theme updates
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    const setItemEvent = new CustomEvent('localStorage', { 
      detail: { key, value } 
    });
    
    // Call the original function first
    originalSetItem.apply(this, [key, value]);
    
    // Dispatch the event
    document.dispatchEvent(setItemEvent);
  };
  
  // Listen for localStorage changes
  document.addEventListener('localStorage', (e: any) => {
    if (e.detail && e.detail.key === 'theme' && window.leafletMapInstance) {
      logger.log('Theme changed in localStorage:', e.detail.value);
      // Refresh the map features to update popup styles
      setTimeout(refreshMapFeatures, 0);
    }
  });
} 