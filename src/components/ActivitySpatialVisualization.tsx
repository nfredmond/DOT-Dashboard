import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatNumber } from '@/lib/utils';
import { Loader2, Clock, Play, Pause, RotateCcw, Download, FileDown, Users, Filter } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token here
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Define local interfaces for data types
interface ActivityLocation {
  id: string;
  scenario_id: string;
  location_type: string;
  name: string;
  latitude: number;
  longitude: number;
  properties: Record<string, any>;
  created_at: string;
}

interface Activity {
  id: string;
  simulation_run_id: string;
  person_agent_id: string;
  activity_type: string;
  activity_location_id: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  properties: Record<string, any>;
  created_at: string;
}

interface TravelItinerary {
  id: string;
  simulation_run_id: string;
  person_agent_id: string;
  origin_activity_id: string;
  destination_activity_id: string;
  departure_time: string;
  arrival_time: string;
  mode: string;
  distance_meters: number;
  duration_minutes: number;
  properties: Record<string, any>;
  created_at: string;
}

// Add PersonAgent interface for demographic filtering
interface PersonAgent {
  id: string;
  scenario_id: string;
  age: number;
  gender: string;
  household_id: string;
  household_size: number;
  income_level: string;
  employment_status: string;
  has_car: boolean;
  has_bike: boolean;
  home_location_id: string | null;
  work_location_id: string | null;
  properties: Record<string, any>;
  created_at: string;
}

// Define demographic filter interface
interface DemographicFilters {
  ageRange: [number, number];
  gender: string[];
  householdSize: [number, number];
  incomeLevel: string[];
  employmentStatus: string[];
  hasCar: boolean | null;
  hasBike: boolean | null;
}

interface ActivitySpatialVisualizationProps {
  simulationId: string;
  scenarioId: string;
}

export function ActivitySpatialVisualization({ simulationId, scenarioId }: ActivitySpatialVisualizationProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityLocations, setActivityLocations] = useState<ActivityLocation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [travelItineraries, setTravelItineraries] = useState<TravelItinerary[]>([]);
  const [personAgents, setPersonAgents] = useState<PersonAgent[]>([]);
  const [visualizationType, setVisualizationType] = useState<'heatmap' | 'flow' | 'activities'>('heatmap');
  const [filteredType, setFilteredType] = useState<string>('all');
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Time filtering state
  const [timeFilter, setTimeFilter] = useState<[number, number]>([0, 24]); // 0-24 hours
  const [enableTimeFilter, setEnableTimeFilter] = useState(false);
  const [timeFilterMode, setTimeFilterMode] = useState<'active' | 'starting' | 'ending'>('active');

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1); // hours per second
  const [currentAnimationTime, setCurrentAnimationTime] = useState(0); // current hour (0-24)
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);

  // Export state
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'geojson'>('csv');
  const [exportOptions, setExportOptions] = useState({
    includeActivities: true,
    includeTrips: true,
    includeLocations: true,
    includeDemographics: true,
    respectFilters: true
  });

  // Add demographic filtering state
  const [enableDemographicFilter, setEnableDemographicFilter] = useState(false);
  const [demographicFilterOpen, setDemographicFilterOpen] = useState(false);
  const [demographicFilters, setDemographicFilters] = useState<DemographicFilters>({
    ageRange: [0, 100],
    gender: [],
    householdSize: [1, 10],
    incomeLevel: [],
    employmentStatus: [],
    hasCar: null,
    hasBike: null
  });

  // Derived demographic option values based on available data
  const [demographicOptions, setDemographicOptions] = useState<{
    ageRange: [number, number];
    genders: string[];
    householdSizeRange: [number, number];
    incomeLevels: string[];
    employmentStatuses: string[];
  }>({
    ageRange: [0, 100],
    genders: [],
    householdSizeRange: [1, 10],
    incomeLevels: [],
    employmentStatuses: []
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch activity locations
        const locationsResponse = await fetch(`/api/scenarios/${scenarioId}/activity-locations`);
        if (!locationsResponse.ok) {
          throw new Error('Failed to fetch activity locations');
        }
        const locationsResult = await locationsResponse.json();
        setActivityLocations(locationsResult.data || []);
        
        // Fetch activities for this simulation
        const activitiesResponse = await fetch(`/api/scenarios/${scenarioId}/activity-simulations/${simulationId}/activities`);
        if (!activitiesResponse.ok) {
          throw new Error('Failed to fetch activities');
        }
        const activitiesResult = await activitiesResponse.json();
        setActivities(activitiesResult.data || []);
        
        // Fetch travel itineraries
        const itinerariesResponse = await fetch(`/api/scenarios/${scenarioId}/activity-simulations/${simulationId}/itineraries`);
        if (!itinerariesResponse.ok) {
          throw new Error('Failed to fetch travel itineraries');
        }
        const itinerariesResult = await itinerariesResponse.json();
        setTravelItineraries(itinerariesResult.data || []);
        
        // Fetch person agents
        const personsResponse = await fetch(`/api/scenarios/${scenarioId}/person-agents`);
        if (!personsResponse.ok) {
          throw new Error('Failed to fetch person agents');
        }
        const personsResult = await personsResponse.json();
        setPersonAgents(personsResult.data || []);

        // Extract demographic options from person agents
        if (personsResult.data && personsResult.data.length > 0) {
          const persons = personsResult.data;
          
          // Extract age range
          const ages = persons.map((p: PersonAgent) => p.age).filter(Boolean);
          const minAge = Math.min(...ages);
          const maxAge = Math.max(...ages);
          
          // Extract genders
          const genders = Array.from(new Set(persons.map((p: PersonAgent) => p.gender))).filter(Boolean) as string[];
          
          // Extract household sizes
          const householdSizes = persons.map((p: PersonAgent) => p.household_size).filter(Boolean);
          const minHouseholdSize = Math.min(...householdSizes);
          const maxHouseholdSize = Math.max(...householdSizes);
          
          // Extract income levels
          const incomeLevels = Array.from(new Set(persons.map((p: PersonAgent) => p.income_level))).filter(Boolean) as string[];
          
          // Extract employment statuses
          const employmentStatuses = Array.from(new Set(persons.map((p: PersonAgent) => p.employment_status))).filter(Boolean) as string[];
          
          setDemographicOptions({
            ageRange: [minAge || 0, maxAge || 100],
            genders,
            householdSizeRange: [minHouseholdSize || 1, maxHouseholdSize || 10],
            incomeLevels,
            employmentStatuses
          });
          
          // Set initial demographic filter values based on available data
          setDemographicFilters({
            ageRange: [minAge || 0, maxAge || 100],
            gender: [],
            householdSize: [minHouseholdSize || 1, maxHouseholdSize || 10],
            incomeLevel: [],
            employmentStatus: [],
            hasCar: null,
            hasBike: null
          });
        }
        
      } catch (err) {
        console.error('Error fetching spatial data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load spatial data');
      } finally {
        setLoading(false);
      }
    };
    
    if (simulationId && scenarioId) {
      fetchData();
    }
  }, [simulationId, scenarioId]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInitialized || loading || !activityLocations.length) return;
    
    // Only initialize if we have a Mapbox token
    if (!mapboxgl.accessToken) {
      console.warn('Mapbox token not found. Using placeholder map.');
      setMapInitialized(true);
      return;
    }
    
    try {
      // Calculate map bounds from activity locations
      const bounds = new mapboxgl.LngLatBounds();
      
      activityLocations.forEach(location => {
        if (location.longitude && location.latitude) {
          bounds.extend([location.longitude, location.latitude]);
        }
      });
      
      // Initialize the map
      const newMap = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        bounds: bounds.isEmpty() ? undefined : bounds,
        fitBoundsOptions: { padding: 50 }
      });
      
      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Wait for map to load
      newMap.on('load', () => {
        setMap(newMap);
        setMapInitialized(true);
      });
      
      // Cleanup on unmount
      return () => {
        newMap.remove();
      };
    } catch (err) {
      console.error('Error initializing map:', err);
      setMapInitialized(true); // Set to true to prevent continuous retries
    }
  }, [loading, mapInitialized, activityLocations]);

  // Animation effect
  useEffect(() => {
    if (!isAnimating) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        lastFrameTimeRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;
      const hourIncrement = (elapsed / 1000) * animationSpeed;
      
      // Update the current animation time
      let newTime = currentAnimationTime + hourIncrement;
      
      // Reset to 0 if we've reached 24 hours
      if (newTime >= 24) {
        newTime = 0;
      }
      
      setCurrentAnimationTime(newTime);
      
      // Set the time filter to a 2-hour window centered around current time
      const windowSize = 2; // hours
      let startTime = newTime - (windowSize / 2);
      let endTime = newTime + (windowSize / 2);
      
      // Handle wrapping around midnight
      if (startTime < 0) startTime = 0;
      if (endTime > 24) endTime = 24;
      
      setTimeFilter([startTime, endTime]);
      
      lastFrameTimeRef.current = timestamp;
      animationRef.current = requestAnimationFrame(animate);
    };

    // Enable time filter when animation starts
    if (!enableTimeFilter) {
      setEnableTimeFilter(true);
    }
    
    // Set filter mode to active during animation
    if (timeFilterMode !== 'active') {
      setTimeFilterMode('active');
    }
    
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount or when animation stops
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        lastFrameTimeRef.current = null;
      }
    };
  }, [isAnimating, animationSpeed, currentAnimationTime, enableTimeFilter, timeFilterMode]);

  // Reset animation state
  const resetAnimation = () => {
    setIsAnimating(false);
    setCurrentAnimationTime(0);
    setTimeFilter([0, 24]);
  };

  // Toggle animation
  const toggleAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
    } else {
      // Start animation from current time if time filter is enabled,
      // otherwise start from beginning
      if (enableTimeFilter) {
        setCurrentAnimationTime(timeFilter[0]);
      } else {
        setCurrentAnimationTime(0);
      }
      setIsAnimating(true);
    }
  };

  // Add a function to filter activities by demographic criteria
  const filterActivitiesByDemographics = (activitiesToFilter: Activity[]) => {
    if (!enableDemographicFilter || !personAgents.length) {
      return activitiesToFilter;
    }
    
    // Get list of person agent IDs that match demographic filters
    const filteredPersonIds = personAgents
      .filter(person => {
        const matchesAge = person.age >= demographicFilters.ageRange[0] && 
                          person.age <= demographicFilters.ageRange[1];
        
        const matchesGender = demographicFilters.gender.length === 0 || 
                             demographicFilters.gender.includes(person.gender);
        
        const matchesHouseholdSize = person.household_size >= demographicFilters.householdSize[0] &&
                                    person.household_size <= demographicFilters.householdSize[1];
        
        const matchesIncomeLevel = demographicFilters.incomeLevel.length === 0 ||
                                  demographicFilters.incomeLevel.includes(person.income_level);
        
        const matchesEmploymentStatus = demographicFilters.employmentStatus.length === 0 ||
                                      demographicFilters.employmentStatus.includes(person.employment_status);
        
        const matchesHasCar = demographicFilters.hasCar === null ||
                             person.has_car === demographicFilters.hasCar;
        
        const matchesHasBike = demographicFilters.hasBike === null ||
                              person.has_bike === demographicFilters.hasBike;
        
        return matchesAge && matchesGender && matchesHouseholdSize && 
               matchesIncomeLevel && matchesEmploymentStatus && 
               matchesHasCar && matchesHasBike;
      })
      .map(person => person.id);
    
    // Return activities that belong to the filtered person agents
    return activitiesToFilter.filter(activity => 
      filteredPersonIds.includes(activity.person_agent_id)
    );
  };

  // Update the getFilteredActivities function to include demographic filters
  const getFilteredActivities = (
    allActivities: Activity[], 
    timeFilterEnabled: boolean, 
    filterTime: [number, number], 
    filterMode: 'active' | 'starting' | 'ending',
    activityType: string,
    applyDemographicFilters: boolean = true
  ) => {
    let filtered = [...allActivities];
    
    // Apply activity type filter
    if (activityType !== 'all') {
      filtered = filtered.filter(activity => 
        activity.activity_type === activityType
      );
    }
    
    // Apply time filter if enabled
    if (timeFilterEnabled) {
      const [startHour, endHour] = filterTime;
      const startMinutes = startHour * 60;
      const endMinutes = endHour * 60;
      
      filtered = filtered.filter(activity => {
        // Convert times to minutes since midnight for easier comparison
        const startTime = new Date(activity.start_time);
        const endTime = new Date(activity.end_time);
        
        const startMinutesSinceMidnight = startTime.getHours() * 60 + startTime.getMinutes();
        const endMinutesSinceMidnight = endTime.getHours() * 60 + endTime.getMinutes();
        
        // Handle different time filter modes
        switch (filterMode) {
          case 'active':
            return (startMinutesSinceMidnight <= endMinutes && endMinutesSinceMidnight >= startMinutes);
          case 'starting':
            return (startMinutesSinceMidnight >= startMinutes && startMinutesSinceMidnight <= endMinutes);
          case 'ending':
            return (endMinutesSinceMidnight >= startMinutes && endMinutesSinceMidnight <= endMinutes);
          default:
            return true;
        }
      });
    }
    
    // Apply demographic filters if enabled
    if (enableDemographicFilter && applyDemographicFilters) {
      filtered = filterActivitiesByDemographics(filtered);
    }
    
    return filtered;
  };

  // Update the getFilteredTrips function to include demographic filters
  const getFilteredTrips = (
    allTrips: TravelItinerary[], 
    timeFilterEnabled: boolean, 
    filterTime: [number, number], 
    filterMode: 'active' | 'starting' | 'ending',
    activityType: string,
    allActivities: Activity[],
    applyDemographicFilters: boolean = true
  ) => {
    let filtered = [...allTrips];
    
    // Filter by activity type if needed
    if (activityType !== 'all') {
      // Find activities of the specified type
      const activityIds = allActivities
        .filter(a => a.activity_type === activityType)
        .map(a => a.id);
      
      // Filter itineraries that have these activities as origin or destination
      filtered = filtered.filter(
        it => activityIds.includes(it.origin_activity_id) || 
              activityIds.includes(it.destination_activity_id)
      );
    }
    
    // Apply time filter if enabled
    if (timeFilterEnabled) {
      const [startHour, endHour] = filterTime;
      const startMinutes = startHour * 60;
      const endMinutes = endHour * 60;
      
      filtered = filtered.filter(trip => {
        const departureTime = new Date(trip.departure_time);
        const arrivalTime = new Date(trip.arrival_time);
        
        const departureMinutes = departureTime.getHours() * 60 + departureTime.getMinutes();
        const arrivalMinutes = arrivalTime.getHours() * 60 + arrivalTime.getMinutes();
        
        switch (filterMode) {
          case 'active':
            return (departureMinutes <= endMinutes && arrivalMinutes >= startMinutes);
          case 'starting':
            return (departureMinutes >= startMinutes && departureMinutes <= endMinutes);
          case 'ending':
            return (arrivalMinutes >= startMinutes && arrivalMinutes <= endMinutes);
          default:
            return true;
        }
      });
    }
    
    // Apply demographic filters if enabled
    if (enableDemographicFilter && applyDemographicFilters && personAgents.length > 0) {
      // Get person IDs that match demographic filters
      const filteredPersonIds = personAgents
        .filter(person => {
          const matchesAge = person.age >= demographicFilters.ageRange[0] && 
                            person.age <= demographicFilters.ageRange[1];
          
          const matchesGender = demographicFilters.gender.length === 0 || 
                              demographicFilters.gender.includes(person.gender);
          
          const matchesHouseholdSize = person.household_size >= demographicFilters.householdSize[0] &&
                                      person.household_size <= demographicFilters.householdSize[1];
          
          const matchesIncomeLevel = demographicFilters.incomeLevel.length === 0 ||
                                    demographicFilters.incomeLevel.includes(person.income_level);
          
          const matchesEmploymentStatus = demographicFilters.employmentStatus.length === 0 ||
                                        demographicFilters.employmentStatus.includes(person.employment_status);
          
          const matchesHasCar = demographicFilters.hasCar === null ||
                              person.has_car === demographicFilters.hasCar;
          
          const matchesHasBike = demographicFilters.hasBike === null ||
                                person.has_bike === demographicFilters.hasBike;
          
          return matchesAge && matchesGender && matchesHouseholdSize && 
                matchesIncomeLevel && matchesEmploymentStatus && 
                matchesHasCar && matchesHasBike;
        })
        .map(person => person.id);
      
      // Filter trips by person agent IDs
      filtered = filtered.filter(trip => 
        filteredPersonIds.includes(trip.person_agent_id)
      );
    }
    
    return filtered;
  };

  // Update visualization when data or filters change
  useEffect(() => {
    if (!map || !map.loaded() || !mapInitialized || !activityLocations.length) return;
    
    const updateVisualization = () => {
      // Clear previous layers
      const layersToRemove = map.getStyle()?.layers
        ?.filter(layer => 
          layer.id.startsWith('activities-') || 
          layer.id.startsWith('flow-') || 
          layer.id.startsWith('heatmap-')
        )
        .map(layer => layer.id) || [];
      
      layersToRemove.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });
      
      // Remove sources
      ['activities-source', 'flow-source', 'heatmap-source'].forEach(sourceId => {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });
      
      // Filter activities based on all criteria including demographics
      let filteredActivities = getFilteredActivities(
        activities, 
        enableTimeFilter, 
        timeFilter,
        timeFilterMode,
        filteredType,
        true // Apply demographic filters
      );
      
      // Similarly filter itineraries by all criteria including demographics
      let filteredItineraries = getFilteredTrips(
        travelItineraries,
        enableTimeFilter,
        timeFilter,
        timeFilterMode,
        filteredType,
        activities,
        true // Apply demographic filters
      );
      
      // Draw visualization based on selected type
      switch (visualizationType) {
        case 'heatmap':
          drawHeatmap(filteredActivities);
          break;
        case 'flow':
          drawFlowLines(filteredItineraries, filteredType);
          break;
        case 'activities':
          drawActivityPoints(filteredActivities);
          break;
      }
    };
    
    // Only update if map is loaded
    if (map.loaded()) {
      updateVisualization();
    } else {
      map.on('load', updateVisualization);
    }
  }, [
    map, 
    mapInitialized, 
    visualizationType, 
    filteredType, 
    activities, 
    travelItineraries, 
    activityLocations, 
    timeFilter, 
    enableTimeFilter, 
    timeFilterMode,
    // Add demographic filter dependencies
    enableDemographicFilter,
    demographicFilters
  ]);

  // Helper functions for drawing visualizations
  const drawHeatmap = (filteredActivities: Activity[]) => {
    if (!map || !map.loaded()) return;
    
    // Create GeoJSON data
    const features = filteredActivities
      .filter(activity => activity.activity_location_id) // Only include activities with locations
      .map(activity => {
        const location = activityLocations.find(loc => loc.id === activity.activity_location_id);
        if (!location) return null;
        
        return {
          type: 'Feature',
          properties: { 
            id: activity.id,
            type: activity.activity_type,
            duration: activity.duration_minutes
          },
          geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          }
        };
      })
      .filter(Boolean); // Remove nulls
    
    if (features.length === 0) return;
    
    // Add source
    map.addSource('heatmap-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features as any[]
      }
    });
    
    // Add heatmap layer
    map.addLayer({
      id: 'heatmap-activities',
      type: 'heatmap',
      source: 'heatmap-source',
      paint: {
        'heatmap-weight': [
          'interpolate', ['linear'], ['get', 'duration'],
          0, 0,
          60, 0.5, // 1 hour = 0.5 weight
          240, 1   // 4+ hours = 1 weight
        ],
        'heatmap-intensity': 1,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        'heatmap-radius': 15,
        'heatmap-opacity': 0.8
      }
    });
  };

  const drawFlowLines = (itineraries: TravelItinerary[], typeFilter: string) => {
    if (!map || !map.loaded()) return;
    
    // Filter itineraries if needed
    let filteredItineraries = itineraries;
    if (typeFilter !== 'all') {
      // Find activities of the specified type
      const activityIds = activities
        .filter(a => a.activity_type === typeFilter)
        .map(a => a.id);
      
      // Filter itineraries that have these activities as origin or destination
      filteredItineraries = itineraries.filter(
        it => activityIds.includes(it.origin_activity_id) || 
              activityIds.includes(it.destination_activity_id)
      );
    }
    
    // Group by mode for different colors
    const modeGroups: Record<string, TravelItinerary[]> = {};
    filteredItineraries.forEach(it => {
      if (!modeGroups[it.mode]) {
        modeGroups[it.mode] = [];
      }
      modeGroups[it.mode].push(it);
    });
    
    // Create flow lines for each mode
    Object.entries(modeGroups).forEach(([mode, trips], index) => {
      // Create GeoJSON features for this mode
      const features = trips.map(trip => {
        const originActivity = activities.find(a => a.id === trip.origin_activity_id);
        const destActivity = activities.find(a => a.id === trip.destination_activity_id);
        
        if (!originActivity || !destActivity) return null;
        
        const originLoc = activityLocations.find(loc => loc.id === originActivity.activity_location_id);
        const destLoc = activityLocations.find(loc => loc.id === destActivity.activity_location_id);
        
        if (!originLoc || !destLoc) return null;
        
        return {
          type: 'Feature',
          properties: { 
            id: trip.id,
            mode: trip.mode,
            distance: trip.distance_meters,
            duration: trip.duration_minutes
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [originLoc.longitude, originLoc.latitude],
              [destLoc.longitude, destLoc.latitude]
            ]
          }
        };
      }).filter(Boolean); // Remove nulls
      
      if (features.length === 0) return;
      
      // Add source for this mode
      const sourceId = `flow-source-${mode}`;
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features as any[]
        }
      });
      
      // Add line layer for this mode
      map.addLayer({
        id: `flow-${mode}`,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': getModeColor(mode),
          'line-width': [
            'interpolate', ['linear'], ['get', 'distance'],
            0, 1,
            5000, 2,
            20000, 3
          ],
          'line-opacity': 0.7
        }
      });
    });
  };

  const drawActivityPoints = (filteredActivities: Activity[]) => {
    if (!map || !map.loaded()) return;
    
    // Group by activity type
    const typeGroups: Record<string, Activity[]> = {};
    filteredActivities
      .filter(activity => activity.activity_location_id) // Only include activities with locations
      .forEach(activity => {
        if (!typeGroups[activity.activity_type]) {
          typeGroups[activity.activity_type] = [];
        }
        typeGroups[activity.activity_type].push(activity);
      });
    
    // Create layers for each activity type
    Object.entries(typeGroups).forEach(([type, activities], index) => {
      // Create GeoJSON features for this type
      const features = activities.map(activity => {
        const location = activityLocations.find(loc => loc.id === activity.activity_location_id);
        if (!location) return null;
        
        return {
          type: 'Feature',
          properties: { 
            id: activity.id,
            type: activity.activity_type,
            start: activity.start_time,
            end: activity.end_time,
            duration: activity.duration_minutes
          },
          geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          }
        };
      }).filter(Boolean); // Remove nulls
      
      if (features.length === 0) return;
      
      // Add source for this activity type
      const sourceId = `activities-source-${type}`;
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features as any[]
        }
      });
      
      // Add circle layer for this activity type
      map.addLayer({
        id: `activities-${type}`,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'duration'],
            0, 4,
            60, 6,   // 1 hour
            240, 10  // 4 hours
          ],
          'circle-color': getActivityTypeColor(type),
          'circle-opacity': 0.7,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      });
      
      // Add a popup on click
      map.on('click', `activities-${type}`, (e) => {
        if (!e.features || !e.features[0]) return;
        
        const props = e.features[0].properties;
        if (!props) return;
        
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <strong>${props.type.charAt(0).toUpperCase() + props.type.slice(1)}</strong><br>
            Duration: ${formatNumber(props.duration)} min<br>
            Start: ${new Date(props.start).toLocaleTimeString()}<br>
            End: ${new Date(props.end).toLocaleTimeString()}
          `)
          .addTo(map);
      });
      
      // Change cursor on hover
      map.on('mouseenter', `activities-${type}`, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      
      map.on('mouseleave', `activities-${type}`, () => {
        map.getCanvas().style.cursor = '';
      });
    });
  };

  // Get unique activity types for the filter
  const activityTypes = ['all', ...Array.from(new Set(activities.map(a => a.activity_type)))];

  // Color utilities
  const getActivityTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'home': '#2c7fb8',
      'work': '#f03b20',
      'education': '#feb24c',
      'shopping': '#756bb1',
      'leisure': '#31a354',
      'social': '#e7298a',
      'other': '#636363'
    };
    return colorMap[type] || colorMap['other'];
  };

  const getModeColor = (mode: string) => {
    const colorMap: Record<string, string> = {
      'walk': '#1b9e77',
      'bike': '#d95f02',
      'transit': '#7570b3',
      'car': '#e7298a',
      'other': '#66a61e'
    };
    return colorMap[mode] || colorMap['other'];
  };

  // Helper function to format time for display
  const formatTimeFromHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Export data function
  const exportData = () => {
    // Apply filters if option is selected
    let dataToExport: {
      activities: Activity[];
      trips: TravelItinerary[];
      locations: ActivityLocation[];
      demographics: PersonAgent[];
    } = {
      activities: [],
      trips: [],
      locations: [],
      demographics: []
    };
    
    // Determine which data to include based on options
    if (exportOptions.includeActivities) {
      dataToExport.activities = exportOptions.respectFilters ? 
        getFilteredActivities(activities, enableTimeFilter, timeFilter, timeFilterMode, filteredType, true) : 
        activities;
    }
    
    if (exportOptions.includeTrips) {
      dataToExport.trips = exportOptions.respectFilters ? 
        getFilteredTrips(travelItineraries, enableTimeFilter, timeFilter, timeFilterMode, filteredType, activities, true) : 
        travelItineraries;
    }
    
    if (exportOptions.includeLocations) {
      // Only include locations that are referenced by included activities if filtering
      if (exportOptions.respectFilters && exportOptions.includeActivities) {
        const locationIds = new Set(dataToExport.activities
          .filter(a => a.activity_location_id)
          .map(a => a.activity_location_id));
        
        dataToExport.locations = activityLocations.filter(loc => 
          locationIds.has(loc.id)
        );
      } else {
        dataToExport.locations = activityLocations;
      }
    }
    
    // Include demographic data if selected
    if (exportOptions.includeDemographics) {
      if (exportOptions.respectFilters && (exportOptions.includeActivities || exportOptions.includeTrips)) {
        // Only include person agents that are referenced by included activities or trips
        const personIds = new Set([
          ...dataToExport.activities.map(a => a.person_agent_id),
          ...dataToExport.trips.map(t => t.person_agent_id)
        ]);
        
        dataToExport.demographics = personAgents.filter(person => 
          personIds.has(person.id)
        );
      } else {
        dataToExport.demographics = personAgents;
      }
    }
    
    // Convert to the selected format and download
    const filename = `activity-simulation-${simulationId}-export-${new Date().toISOString().slice(0, 10)}`;
    
    if (exportFormat === 'csv') {
      downloadCSV(dataToExport, filename);
    } else {
      downloadGeoJSON(dataToExport, filename);
    }
    
    // Close dialog
    setExportOpen(false);
  };
  
  // Helper function to download data as CSV
  const downloadCSV = (data: any, filename: string) => {
    const csvFiles: Record<string, string> = {};
    
    if (data.activities.length > 0) {
      const headers = [
        'id', 'person_agent_id', 'activity_type', 'activity_location_id', 
        'start_time', 'end_time', 'duration_minutes', 'created_at'
      ];
      
      let csvContent = headers.join(',') + '\n';
      
      data.activities.forEach((activity: Activity) => {
        const row = [
          activity.id,
          activity.person_agent_id,
          activity.activity_type,
          activity.activity_location_id || '',
          activity.start_time,
          activity.end_time,
          activity.duration_minutes,
          activity.created_at
        ];
        
        csvContent += row.join(',') + '\n';
      });
      
      csvFiles['activities'] = csvContent;
    }
    
    if (data.trips.length > 0) {
      const headers = [
        'id', 'person_agent_id', 'origin_activity_id', 'destination_activity_id',
        'departure_time', 'arrival_time', 'mode', 'distance_meters', 'duration_minutes', 'created_at'
      ];
      
      let csvContent = headers.join(',') + '\n';
      
      data.trips.forEach((trip: TravelItinerary) => {
        const row = [
          trip.id,
          trip.person_agent_id,
          trip.origin_activity_id,
          trip.destination_activity_id,
          trip.departure_time,
          trip.arrival_time,
          trip.mode,
          trip.distance_meters,
          trip.duration_minutes,
          trip.created_at
        ];
        
        csvContent += row.join(',') + '\n';
      });
      
      csvFiles['trips'] = csvContent;
    }
    
    if (data.locations.length > 0) {
      const headers = [
        'id', 'scenario_id', 'location_type', 'name', 'latitude', 'longitude', 'created_at'
      ];
      
      let csvContent = headers.join(',') + '\n';
      
      data.locations.forEach((location: ActivityLocation) => {
        const row = [
          location.id,
          location.scenario_id,
          location.location_type,
          location.name,
          location.latitude,
          location.longitude,
          location.created_at
        ];
        
        csvContent += row.join(',') + '\n';
      });
      
      csvFiles['locations'] = csvContent;
    }
    
    // Add demographic data export
    if (data.demographics && data.demographics.length > 0) {
      const headers = [
        'id', 'scenario_id', 'age', 'gender', 'household_id', 'household_size',
        'income_level', 'employment_status', 'has_car', 'has_bike', 
        'home_location_id', 'work_location_id', 'created_at'
      ];
      
      let csvContent = headers.join(',') + '\n';
      
      data.demographics.forEach((person: PersonAgent) => {
        const row = [
          person.id,
          person.scenario_id,
          person.age,
          person.gender,
          person.household_id,
          person.household_size,
          person.income_level,
          person.employment_status,
          person.has_car,
          person.has_bike,
          person.home_location_id || '',
          person.work_location_id || '',
          person.created_at
        ];
        
        csvContent += row.join(',') + '\n';
      });
      
      csvFiles['demographics'] = csvContent;
    }
    
    // Create a zip file if multiple files, otherwise just download the single CSV
    if (Object.keys(csvFiles).length === 1) {
      const key = Object.keys(csvFiles)[0];
      const blob = new Blob([csvFiles[key]], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${key}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // In a real implementation, you'd use a library like JSZip to bundle multiple files
      // For simplicity in this example, we'll just download multiple files
      Object.entries(csvFiles).forEach(([key, content]) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}-${key}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };
  
  // Helper function to download data as GeoJSON
  const downloadGeoJSON = (data: any, filename: string) => {
    const geoJsonExports: Record<string, any> = {};
    
    // Convert locations to GeoJSON
    if (data.locations.length > 0) {
      const locationFeatures = data.locations.map((location: ActivityLocation) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        properties: {
          id: location.id,
          scenario_id: location.scenario_id,
          name: location.name,
          location_type: location.location_type,
          created_at: location.created_at,
          ...location.properties
        }
      }));
      
      geoJsonExports['locations'] = {
        type: 'FeatureCollection',
        features: locationFeatures
      };
    }
    
    // Convert activities to GeoJSON (using location coordinates)
    if (data.activities.length > 0) {
      const activityFeatures = data.activities
        .filter((activity: Activity) => activity.activity_location_id)
        .map((activity: Activity) => {
          const location = data.locations.find((loc: ActivityLocation) => 
            loc.id === activity.activity_location_id
          );
          
          if (!location) return null;
          
          // Find the person agent for this activity to add demographic properties
          const person = data.demographics?.find((p: PersonAgent) => 
            p.id === activity.person_agent_id
          );
          
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude]
            },
            properties: {
              id: activity.id,
              person_agent_id: activity.person_agent_id,
              activity_type: activity.activity_type,
              activity_location_id: activity.activity_location_id,
              start_time: activity.start_time,
              end_time: activity.end_time,
              duration_minutes: activity.duration_minutes,
              created_at: activity.created_at,
              // Add demographic properties if available and requested
              ...(person && data.demographics.length > 0 ? {
                person_age: person.age,
                person_gender: person.gender,
                person_household_size: person.household_size,
                person_income_level: person.income_level,
                person_employment_status: person.employment_status,
                person_has_car: person.has_car,
                person_has_bike: person.has_bike
              } : {}),
              ...activity.properties
            }
          };
        })
        .filter(Boolean); // Remove nulls
      
      if (activityFeatures.length > 0) {
        geoJsonExports['activities'] = {
          type: 'FeatureCollection',
          features: activityFeatures
        };
      }
    }
    
    // Convert trips to GeoJSON LineStrings
    if (data.trips.length > 0) {
      const tripFeatures = data.trips.map((trip: TravelItinerary) => {
        const originActivity = data.activities.find((a: Activity) => a.id === trip.origin_activity_id);
        const destActivity = data.activities.find((a: Activity) => a.id === trip.destination_activity_id);
        
        if (!originActivity || !destActivity) return null;
        
        const originLoc = data.locations.find((loc: ActivityLocation) => loc.id === originActivity.activity_location_id);
        const destLoc = data.locations.find((loc: ActivityLocation) => loc.id === destActivity.activity_location_id);
        
        if (!originLoc || !destLoc) return null;
        
        // Find the person agent for this trip to add demographic properties
        const person = data.demographics?.find((p: PersonAgent) => 
          p.id === trip.person_agent_id
        );
        
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [originLoc.longitude, originLoc.latitude],
              [destLoc.longitude, destLoc.latitude]
            ]
          },
          properties: { 
            id: trip.id,
            person_agent_id: trip.person_agent_id,
            mode: trip.mode,
            distance_meters: trip.distance_meters,
            duration_minutes: trip.duration_minutes,
            departure_time: trip.departure_time,
            arrival_time: trip.arrival_time,
            origin_activity_id: trip.origin_activity_id,
            destination_activity_id: trip.destination_activity_id,
            created_at: trip.created_at,
            // Add demographic properties if available and requested
            ...(person && data.demographics.length > 0 ? {
              person_age: person.age,
              person_gender: person.gender,
              person_household_size: person.household_size,
              person_income_level: person.income_level,
              person_employment_status: person.employment_status,
              person_has_car: person.has_car,
              person_has_bike: person.has_bike
            } : {}),
            ...trip.properties
          }
        };
      }).filter(Boolean); // Remove nulls
      
      if (tripFeatures.length > 0) {
        geoJsonExports['trips'] = {
          type: 'FeatureCollection',
          features: tripFeatures
        };
      }
    }
    
    // Create a demographic-only GeoJSON if requested
    if (data.demographics && data.demographics.length > 0) {
      // Use home locations for person agents where available
      const personFeatures = data.demographics
        .filter((person: PersonAgent) => person.home_location_id)
        .map((person: PersonAgent) => {
          const homeLocation = data.locations.find((loc: ActivityLocation) => 
            loc.id === person.home_location_id
          );
          
          if (!homeLocation) return null;
          
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [homeLocation.longitude, homeLocation.latitude]
            },
            properties: {
              id: person.id,
              scenario_id: person.scenario_id,
              age: person.age,
              gender: person.gender,
              household_id: person.household_id,
              household_size: person.household_size,
              income_level: person.income_level,
              employment_status: person.employment_status,
              has_car: person.has_car,
              has_bike: person.has_bike,
              home_location_id: person.home_location_id,
              work_location_id: person.work_location_id,
              created_at: person.created_at,
              ...person.properties
            }
          };
        })
        .filter(Boolean); // Remove nulls
      
      if (personFeatures.length > 0) {
        geoJsonExports['demographics'] = {
          type: 'FeatureCollection',
          features: personFeatures
        };
      }
    }
    
    // Download each GeoJSON file
    Object.entries(geoJsonExports).forEach(([key, content]) => {
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${key}.geojson`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spatial Distribution</CardTitle>
          <CardDescription>Loading spatial data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin opacity-70" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spatial Distribution</CardTitle>
          <CardDescription>Error loading spatial data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create activity type counts for display, filtering by time and demographics if enabled
  const activityTypeCounts: Record<string, number> = {};
  const filteredForCounts = getFilteredActivities(
    activities, 
    enableTimeFilter, 
    timeFilter, 
    timeFilterMode, 
    "all", // Don't filter by activity type for counts
    enableDemographicFilter // Apply demographic filters if enabled
  );
    
  filteredForCounts.forEach(activity => {
    const type = activity.activity_type;
    activityTypeCounts[type] = (activityTypeCounts[type] || 0) + 1;
  });

  // Create mode counts for display, filtering by time and demographics if enabled
  const modeCounts: Record<string, number> = {};
  const tripsFilteredForCounts = getFilteredTrips(
    travelItineraries, 
    enableTimeFilter, 
    timeFilter, 
    timeFilterMode, 
    "all", // Don't filter by activity type for counts
    activities,
    enableDemographicFilter // Apply demographic filters if enabled
  );
    
  tripsFilteredForCounts.forEach(trip => {
    const mode = trip.mode;
    modeCounts[mode] = (modeCounts[mode] || 0) + 1;
  });

  const renderMapPlaceholder = () => (
    <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 gap-4">
      <p className="text-lg font-medium">Map Visualization</p>
      <p className="text-sm text-muted-foreground max-w-md">
        {!mapboxgl.accessToken 
          ? "Mapbox token not found. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables."
          : "Map is loading or no activity locations available to display."}
      </p>
      
      {visualizationType === 'heatmap' && (
        <div className="bg-primary/10 p-4 rounded-md w-full max-w-md">
          <h4 className="font-semibold mb-2">Activity Heatmap</h4>
          <p className="text-sm">
            Showing density of {filteredType === 'all' ? 'all activities' : `${filteredType} activities`}
            ({filteredType === 'all' ? activities.length : activities.filter(a => a.activity_type === filteredType).length} activities)
          </p>
        </div>
      )}
      
      {visualizationType === 'flow' && (
        <div className="bg-primary/10 p-4 rounded-md w-full max-w-md">
          <h4 className="font-semibold mb-2">Travel Flow Lines</h4>
          <p className="text-sm">
            Showing travel patterns between locations
            ({travelItineraries.length} trips)
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {['walk', 'bike', 'transit', 'car'].map(mode => (
              <div key={mode} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getModeColor(mode) }}></div>
                <span className="capitalize">{mode}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {visualizationType === 'activities' && (
        <div className="bg-primary/10 p-4 rounded-md w-full max-w-md">
          <h4 className="font-semibold mb-2">Activity Locations</h4>
          <p className="text-sm">
            Showing individual {filteredType === 'all' ? 'activities' : `${filteredType} activities`} by location
            ({filteredType === 'all' ? activities.length : activities.filter(a => a.activity_type === filteredType).length} activities)
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {['home', 'work', 'education', 'shopping', 'leisure', 'social'].map(type => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getActivityTypeColor(type) }}></div>
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spatial Distribution</CardTitle>
        <CardDescription>Geographic patterns of activities and trips</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Tabs 
              value={visualizationType} 
              onValueChange={(value) => setVisualizationType(value as 'heatmap' | 'flow' | 'activities')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="heatmap">Activity Heatmap</TabsTrigger>
                <TabsTrigger value="flow">Travel Flows</TabsTrigger>
                <TabsTrigger value="activities">Activity Locations</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="w-64">
              <Select value={filteredType} onValueChange={setFilteredType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Time filter controls */}
          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <h4 className="text-sm font-medium">Time Filter</h4>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm flex items-center gap-1.5">
                  <input 
                    type="checkbox" 
                    checked={enableTimeFilter} 
                    onChange={(e) => setEnableTimeFilter(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={isAnimating}
                  />
                  Enable
                </label>
                
                <Select 
                  value={timeFilterMode} 
                  onValueChange={(value) => setTimeFilterMode(value as 'active' | 'starting' | 'ending')}
                  disabled={!enableTimeFilter || isAnimating}
                >
                  <SelectTrigger className="h-8 w-[120px]">
                    <SelectValue placeholder="Filter mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active During</SelectItem>
                    <SelectItem value="starting">Starting At</SelectItem>
                    <SelectItem value="ending">Ending At</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className={`transition-opacity ${enableTimeFilter ? 'opacity-100' : 'opacity-50'}`}>
              <div className="px-2 pt-1 pb-3">
                <Slider
                  disabled={!enableTimeFilter || isAnimating}
                  value={timeFilter}
                  min={0}
                  max={24}
                  step={0.5}
                  onValueChange={(value) => setTimeFilter(value as [number, number])}
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTimeFromHours(timeFilter[0])}</span>
                <span>Time Range</span>
                <span>{formatTimeFromHours(timeFilter[1])}</span>
              </div>
              
              {/* Animation controls */}
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-8 w-8" 
                    onClick={toggleAnimation}
                    title={isAnimating ? "Pause" : "Play animation"}
                  >
                    {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-8 w-8" 
                    onClick={resetAnimation}
                    title="Reset animation"
                    disabled={isAnimating}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Speed:</span>
                  <Select 
                    value={animationSpeed.toString()} 
                    onValueChange={(value) => setAnimationSpeed(parseFloat(value))}
                    disabled={isAnimating}
                  >
                    <SelectTrigger className="h-8 w-[90px]">
                      <SelectValue placeholder="Speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                      <SelectItem value="4">4x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {isAnimating && (
                  <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded text-sm">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">{formatTimeFromHours(currentAnimationTime)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Demographic filter controls */}
          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <h4 className="text-sm font-medium">Demographic Filter</h4>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm flex items-center gap-1.5">
                  <input 
                    type="checkbox" 
                    checked={enableDemographicFilter} 
                    onChange={(e) => setEnableDemographicFilter(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Enable
                </label>
                
                <Dialog open={demographicFilterOpen} onOpenChange={setDemographicFilterOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-1"
                      disabled={!enableDemographicFilter}
                    >
                      <Filter className="h-3.5 w-3.5" />
                      Configure
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Demographic Filters</DialogTitle>
                      <DialogDescription>
                        Filter activities and travel patterns by demographic characteristics. 
                        Narrow down to specific population segments for more targeted analysis.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      {/* Age Range Filter */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="age-range">Age Range</Label>
                          <span className="text-sm text-muted-foreground">
                            {demographicFilters.ageRange[0]} - {demographicFilters.ageRange[1]} years
                          </span>
                        </div>
                        <Slider
                          id="age-range"
                          value={demographicFilters.ageRange}
                          min={demographicOptions.ageRange[0]}
                          max={demographicOptions.ageRange[1]}
                          step={1}
                          onValueChange={(value) => 
                            setDemographicFilters({
                              ...demographicFilters, 
                              ageRange: value as [number, number]
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      
                      {/* Gender Filter */}
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {demographicOptions.genders.map(gender => (
                            <div key={gender} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`gender-${gender}`} 
                                checked={demographicFilters.gender.includes(gender)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setDemographicFilters({
                                      ...demographicFilters,
                                      gender: [...demographicFilters.gender, gender]
                                    });
                                  } else {
                                    setDemographicFilters({
                                      ...demographicFilters,
                                      gender: demographicFilters.gender.filter(g => g !== gender)
                                    });
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`gender-${gender}`} 
                                className="text-sm font-medium leading-none capitalize"
                              >
                                {gender}
                              </label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Leave all unchecked to include all genders
                        </p>
                      </div>
                      
                      {/* Household Size Filter */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="household-size">Household Size</Label>
                          <span className="text-sm text-muted-foreground">
                            {demographicFilters.householdSize[0]} - {demographicFilters.householdSize[1]} people
                          </span>
                        </div>
                        <Slider
                          id="household-size"
                          value={demographicFilters.householdSize}
                          min={demographicOptions.householdSizeRange[0]}
                          max={demographicOptions.householdSizeRange[1]}
                          step={1}
                          onValueChange={(value) => 
                            setDemographicFilters({
                              ...demographicFilters, 
                              householdSize: value as [number, number]
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      
                      {/* Income Level Filter */}
                      <div className="space-y-2">
                        <Label>Income Level</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {demographicOptions.incomeLevels.map(level => (
                            <div key={level} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`income-${level}`} 
                                checked={demographicFilters.incomeLevel.includes(level)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setDemographicFilters({
                                      ...demographicFilters,
                                      incomeLevel: [...demographicFilters.incomeLevel, level]
                                    });
                                  } else {
                                    setDemographicFilters({
                                      ...demographicFilters,
                                      incomeLevel: demographicFilters.incomeLevel.filter(l => l !== level)
                                    });
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`income-${level}`} 
                                className="text-sm font-medium leading-none capitalize"
                              >
                                {level}
                              </label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Leave all unchecked to include all income levels
                        </p>
                      </div>
                      
                      {/* Employment Status Filter */}
                      <div className="space-y-2">
                        <Label>Employment Status</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {demographicOptions.employmentStatuses.map(status => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`employment-${status}`} 
                                checked={demographicFilters.employmentStatus.includes(status)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setDemographicFilters({
                                      ...demographicFilters,
                                      employmentStatus: [...demographicFilters.employmentStatus, status]
                                    });
                                  } else {
                                    setDemographicFilters({
                                      ...demographicFilters,
                                      employmentStatus: demographicFilters.employmentStatus.filter(s => s !== status)
                                    });
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`employment-${status}`} 
                                className="text-sm font-medium leading-none capitalize"
                              >
                                {status}
                              </label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Leave all unchecked to include all employment statuses
                        </p>
                      </div>
                      
                      {/* Transportation Access Filters */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Car Access</Label>
                          <Select 
                            value={demographicFilters.hasCar === null ? 'any' : demographicFilters.hasCar ? 'yes' : 'no'} 
                            onValueChange={(value) => {
                              let carValue: boolean | null = null;
                              if (value === 'yes') carValue = true;
                              if (value === 'no') carValue = false;
                              
                              setDemographicFilters({
                                ...demographicFilters,
                                hasCar: carValue
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Car access" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any</SelectItem>
                              <SelectItem value="yes">Has Car</SelectItem>
                              <SelectItem value="no">No Car</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Bicycle Access</Label>
                          <Select 
                            value={demographicFilters.hasBike === null ? 'any' : demographicFilters.hasBike ? 'yes' : 'no'} 
                            onValueChange={(value) => {
                              let bikeValue: boolean | null = null;
                              if (value === 'yes') bikeValue = true;
                              if (value === 'no') bikeValue = false;
                              
                              setDemographicFilters({
                                ...demographicFilters,
                                hasBike: bikeValue
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Bicycle access" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any</SelectItem>
                              <SelectItem value="yes">Has Bicycle</SelectItem>
                              <SelectItem value="no">No Bicycle</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Reset filters to default (all inclusive)
                          setDemographicFilters({
                            ageRange: demographicOptions.ageRange,
                            gender: [],
                            householdSize: demographicOptions.householdSizeRange,
                            incomeLevel: [],
                            employmentStatus: [],
                            hasCar: null,
                            hasBike: null
                          });
                        }}
                      >
                        Reset
                      </Button>
                      <Button onClick={() => setDemographicFilterOpen(false)}>
                        Apply Filters
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Demographic filter summary */}
            <div className={`transition-opacity ${enableDemographicFilter ? 'opacity-100' : 'opacity-50'}`}>
              <div className="text-xs text-muted-foreground mt-1">
                {!enableDemographicFilter ? (
                  <p>Demographic filtering is disabled</p>
                ) : (
                  <div className="space-y-1">
                    <p>Active filters:</p>
                    <ul className="list-disc list-inside">
                      <li>Age: {demographicFilters.ageRange[0]}-{demographicFilters.ageRange[1]} years</li>
                      
                      {demographicFilters.gender.length > 0 && (
                        <li>Gender: {demographicFilters.gender.join(', ')}</li>
                      )}
                      
                      <li>Household size: {demographicFilters.householdSize[0]}-{demographicFilters.householdSize[1]} people</li>
                      
                      {demographicFilters.incomeLevel.length > 0 && (
                        <li>Income: {demographicFilters.incomeLevel.join(', ')}</li>
                      )}
                      
                      {demographicFilters.employmentStatus.length > 0 && (
                        <li>Employment: {demographicFilters.employmentStatus.join(', ')}</li>
                      )}
                      
                      {demographicFilters.hasCar !== null && (
                        <li>Car access: {demographicFilters.hasCar ? 'Yes' : 'No'}</li>
                      )}
                      
                      {demographicFilters.hasBike !== null && (
                        <li>Bicycle access: {demographicFilters.hasBike ? 'Yes' : 'No'}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative">
          {/* Map container */}
          <div 
            ref={mapRef} 
            className="h-[500px] bg-muted rounded-md overflow-hidden"
          >
            {(!mapInitialized || !map) && renderMapPlaceholder()}
            
            {/* Animation time indicator overlay */}
            {isAnimating && map && mapInitialized && (
              <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm border border-border rounded-md px-3 py-2 shadow-md z-10">
                <h4 className="text-sm font-semibold mb-1">Current Time</h4>
                <div className="text-2xl font-bold">{formatTimeFromHours(currentAnimationTime)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Showing activities between {formatTimeFromHours(timeFilter[0])} and {formatTimeFromHours(timeFilter[1])}
                </div>
              </div>
            )}
          </div>
          
          {/* Legend and stats with time filter info */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium mb-2">Activity Distribution</h4>
                {enableTimeFilter && (
                  <span className="text-xs text-muted-foreground">
                    {formatTimeFromHours(timeFilter[0])} - {formatTimeFromHours(timeFilter[1])}
                  </span>
                )}
              </div>
              <div className="text-sm">
                <ul className="space-y-1">
                  {Object.entries(activityTypeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <li key={type} className="flex justify-between">
                        <span className="capitalize">{type}</span>
                        <span>{formatNumber(count)} activities</span>
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium mb-2">Travel Mode Distribution</h4>
                {enableTimeFilter && (
                  <span className="text-xs text-muted-foreground">
                    {formatTimeFromHours(timeFilter[0])} - {formatTimeFromHours(timeFilter[1])}
                  </span>
                )}
              </div>
              <div className="text-sm">
                <ul className="space-y-1">
                  {Object.entries(modeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([mode, count]) => (
                      <li key={mode} className="flex justify-between">
                        <span className="capitalize">{mode}</span>
                        <span>{formatNumber(count)} trips</span>
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {activities.length > 0 && (
            <span>
              {(enableTimeFilter || enableDemographicFilter)
                ? `Showing ${filteredForCounts.length} of ${activities.length} activities`
                : `${activities.length} total activities`
              }
              {filteredType !== 'all' && ` (filtered to '${filteredType}')`}
              {enableDemographicFilter && ' with demographic filters applied'}
            </span>
          )}
        </div>
        
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Visualization Data</DialogTitle>
              <DialogDescription>
                Export the current data for use in other tools. You can choose which data to include and the export format.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select 
                  value={exportFormat} 
                  onValueChange={(value) => setExportFormat(value as 'csv' | 'geojson')}
                >
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Tabular)</SelectItem>
                    <SelectItem value="geojson">GeoJSON (Spatial)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {exportFormat === 'csv' 
                    ? 'CSV files can be opened in Excel or other data analysis tools.'
                    : 'GeoJSON files can be imported into GIS software like QGIS.'
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Data to Include</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeActivities" 
                      checked={exportOptions.includeActivities}
                      onCheckedChange={(checked) => 
                        setExportOptions({...exportOptions, includeActivities: !!checked})
                      }
                    />
                    <label 
                      htmlFor="includeActivities" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Activities
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeTrips" 
                      checked={exportOptions.includeTrips}
                      onCheckedChange={(checked) => 
                        setExportOptions({...exportOptions, includeTrips: !!checked})
                      }
                    />
                    <label 
                      htmlFor="includeTrips" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Travel Itineraries
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeLocations" 
                      checked={exportOptions.includeLocations}
                      onCheckedChange={(checked) => 
                        setExportOptions({...exportOptions, includeLocations: !!checked})
                      }
                    />
                    <label 
                      htmlFor="includeLocations" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Activity Locations
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeDemographics" 
                      checked={exportOptions.includeDemographics}
                      onCheckedChange={(checked) => 
                        setExportOptions({...exportOptions, includeDemographics: !!checked})
                      }
                    />
                    <label 
                      htmlFor="includeDemographics" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Demographic Data
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="respectFilters" 
                  checked={exportOptions.respectFilters}
                  onCheckedChange={(checked) => 
                    setExportOptions({...exportOptions, respectFilters: !!checked})
                  }
                />
                <label 
                  htmlFor="respectFilters" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Apply current filters to exported data
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
              <Button
                onClick={exportData}
                disabled={!exportOptions.includeActivities && !exportOptions.includeTrips && !exportOptions.includeLocations}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export {exportFormat === 'csv' ? 'CSV' : 'GeoJSON'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
} 