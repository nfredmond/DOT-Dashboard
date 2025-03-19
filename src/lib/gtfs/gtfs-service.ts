import { supabase } from '@/lib/supabase';
import axios from 'axios';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

// GTFS types
export interface GTFSAgency {
  agency_id: string;
  agency_name: string;
  agency_url: string;
  agency_timezone: string;
  agency_lang?: string;
  agency_phone?: string;
  agency_fare_url?: string;
  agency_email?: string;
}

export interface GTFSRoute {
  route_id: string;
  agency_id?: string;
  route_short_name?: string;
  route_long_name?: string;
  route_desc?: string;
  route_type: number;
  route_url?: string;
  route_color?: string;
  route_text_color?: string;
}

export interface GTFSStop {
  stop_id: string;
  stop_code?: string;
  stop_name: string;
  stop_desc?: string;
  stop_lat: number;
  stop_lon: number;
  zone_id?: string;
  stop_url?: string;
  location_type?: number;
  parent_station?: string;
  stop_timezone?: string;
  wheelchair_boarding?: number;
}

export interface GTFSTrip {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign?: string;
  trip_short_name?: string;
  direction_id?: number;
  block_id?: string;
  shape_id?: string;
  wheelchair_accessible?: number;
  bikes_allowed?: number;
}

export interface GTFSStopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
  stop_headsign?: string;
  pickup_type?: number;
  drop_off_type?: number;
  shape_dist_traveled?: number;
  timepoint?: number;
}

export interface GTFSCalendar {
  service_id: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  start_date: string;
  end_date: string;
}

export interface GTFSCalendarDate {
  service_id: string;
  date: string;
  exception_type: number;
}

export interface GTFSShape {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
  shape_dist_traveled?: number;
}

export interface GTFSFeedInfo {
  feed_publisher_name?: string;
  feed_publisher_url?: string;
  feed_lang?: string;
  feed_start_date?: string;
  feed_end_date?: string;
  feed_version?: string;
}

export interface GTFSFrequency {
  trip_id: string;
  start_time: string;
  end_time: string;
  headway_secs: number;
  exact_times?: number;
}

export interface GTFSTransfer {
  from_stop_id: string;
  to_stop_id: string;
  transfer_type: number;
  min_transfer_time?: number;
}

export interface GTFSFeedMetadata {
  id: string;
  name: string;
  url: string;
  agency_id: string;
  imported_at: Date;
  valid_from?: Date;
  valid_until?: Date;
  version?: string;
  status: 'active' | 'archived' | 'processing' | 'error';
  error_message?: string;
  feed_info?: GTFSFeedInfo;
}

export interface GTFSImportOptions {
  url: string;
  name: string;
  agency_id: string;
  organization_id: string;
}

export interface GTFSFeed {
  metadata: GTFSFeedMetadata;
  agencies: GTFSAgency[];
  routes: GTFSRoute[];
  stops: GTFSStop[];
  trips: GTFSTrip[];
  stop_times: GTFSStopTime[];
  calendar: GTFSCalendar[];
  calendar_dates?: GTFSCalendarDate[];
  shapes?: GTFSShape[];
  frequencies?: GTFSFrequency[];
  transfers?: GTFSTransfer[];
}

/**
 * Service for working with GTFS (General Transit Feed Specification) data
 */
class GTFSService {
  /**
   * Import a GTFS feed from a URL
   */
  async importFeed(options: GTFSImportOptions): Promise<string> {
    try {
      // Create feed metadata entry
      const feedId = uuidv4();
      const metadata: GTFSFeedMetadata = {
        id: feedId,
        name: options.name,
        url: options.url,
        agency_id: options.agency_id,
        imported_at: new Date(),
        status: 'processing'
      };
      
      // Save metadata to DB
      await supabase
        .from('gtfs_feeds')
        .insert({
          id: feedId,
          name: options.name,
          url: options.url,
          agency_id: options.agency_id,
          organization_id: options.organization_id,
          imported_at: metadata.imported_at.toISOString(),
          status: metadata.status
        });
      
      // Start async import process
      this.processGTFSFeed(options.url, feedId, options.organization_id)
        .catch(error => {
          logger.error('Error processing GTFS feed:', error);
          // Update feed status to error
          supabase
            .from('gtfs_feeds')
            .update({
              status: 'error',
              error_message: error.message
            })
            .eq('id', feedId);
        });
      
      return feedId;
    } catch (error) {
      logger.error('Error importing GTFS feed:', error);
      throw new Error(`Failed to import GTFS feed: ${error.message}`);
    }
  }

  /**
   * Process and import a GTFS feed
   */
  private async processGTFSFeed(url: string, feedId: string, organizationId: string): Promise<void> {
    try {
      // Download the GTFS zip file
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const zip = await JSZip.loadAsync(response.data);
      
      // Parse required GTFS files
      const feed: Partial<GTFSFeed> = {
        metadata: { id: feedId } as GTFSFeedMetadata
      };
      
      // Process agency.txt
      const agencyData = await this.parseGTFSFile(zip, 'agency.txt');
      feed.agencies = agencyData as GTFSAgency[];
      
      // Process routes.txt
      const routesData = await this.parseGTFSFile(zip, 'routes.txt');
      feed.routes = routesData as GTFSRoute[];
      
      // Process stops.txt
      const stopsData = await this.parseGTFSFile(zip, 'stops.txt');
      feed.stops = stopsData as GTFSStop[];
      
      // Process trips.txt
      const tripsData = await this.parseGTFSFile(zip, 'trips.txt');
      feed.trips = tripsData as GTFSTrip[];
      
      // Process stop_times.txt
      const stopTimesData = await this.parseGTFSFile(zip, 'stop_times.txt');
      feed.stop_times = stopTimesData as GTFSStopTime[];
      
      // Process calendar.txt
      const calendarData = await this.parseGTFSFile(zip, 'calendar.txt');
      feed.calendar = calendarData as GTFSCalendar[];
      
      // Process optional files
      try {
        const calendarDatesData = await this.parseGTFSFile(zip, 'calendar_dates.txt');
        feed.calendar_dates = calendarDatesData as GTFSCalendarDate[];
      } catch (e) {
        // Optional file may not exist
      }
      
      try {
        const shapesData = await this.parseGTFSFile(zip, 'shapes.txt');
        feed.shapes = shapesData as GTFSShape[];
      } catch (e) {
        // Optional file may not exist
      }
      
      try {
        const frequenciesData = await this.parseGTFSFile(zip, 'frequencies.txt');
        feed.frequencies = frequenciesData as GTFSFrequency[];
      } catch (e) {
        // Optional file may not exist
      }
      
      try {
        const transfersData = await this.parseGTFSFile(zip, 'transfers.txt');
        feed.transfers = transfersData as GTFSTransfer[];
      } catch (e) {
        // Optional file may not exist
      }
      
      try {
        const feedInfoData = await this.parseGTFSFile(zip, 'feed_info.txt');
        if (feedInfoData && feedInfoData.length > 0) {
          feed.metadata.feed_info = feedInfoData[0] as GTFSFeedInfo;
          
          // Update feed metadata with feed info
          if (feed.metadata.feed_info.feed_start_date) {
            feed.metadata.valid_from = this.parseGTFSDate(feed.metadata.feed_info.feed_start_date);
          }
          if (feed.metadata.feed_info.feed_end_date) {
            feed.metadata.valid_until = this.parseGTFSDate(feed.metadata.feed_info.feed_end_date);
          }
          feed.metadata.version = feed.metadata.feed_info.feed_version;
        }
      } catch (e) {
        // Optional file may not exist
      }
      
      // Save data to database
      await this.saveGTFSFeedToDB(feed as GTFSFeed, organizationId);
      
      // Update feed status to active
      await supabase
        .from('gtfs_feeds')
        .update({
          status: 'active',
          valid_from: feed.metadata.valid_from?.toISOString(),
          valid_until: feed.metadata.valid_until?.toISOString(),
          version: feed.metadata.version
        })
        .eq('id', feedId);
        
    } catch (error) {
      logger.error('Error processing GTFS feed:', error);
      // Update feed status to error
      await supabase
        .from('gtfs_feeds')
        .update({
          status: 'error',
          error_message: error.message
        })
        .eq('id', feedId);
      
      throw error;
    }
  }

  /**
   * Parse a GTFS file from a zip archive
   */
  private async parseGTFSFile(zip: JSZip, filename: string): Promise<any[]> {
    const file = zip.file(filename);
    if (!file) {
      throw new Error(`Required file ${filename} not found in GTFS feed`);
    }
    
    const content = await file.async('string');
    const results = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    if (results.errors && results.errors.length > 0) {
      const errorMsg = results.errors.map(e => e.message).join(', ');
      logger.warn(`Parsing warnings for ${filename}: ${errorMsg}`);
    }
    
    return results.data;
  }

  /**
   * Parse a GTFS date string (YYYYMMDD) to a Date object
   */
  private parseGTFSDate(dateStr: string): Date {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-indexed
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }

  /**
   * Save GTFS feed data to database
   */
  private async saveGTFSFeedToDB(feed: GTFSFeed, organizationId: string): Promise<void> {
    const feedId = feed.metadata.id;
    
    // Process and insert agency data
    if (feed.agencies && feed.agencies.length > 0) {
      const agencyRows = feed.agencies.map(agency => ({
        feed_id: feedId,
        organization_id: organizationId,
        agency_id: agency.agency_id || 'default',
        agency_name: agency.agency_name,
        agency_url: agency.agency_url,
        agency_timezone: agency.agency_timezone,
        agency_lang: agency.agency_lang,
        agency_phone: agency.agency_phone,
        agency_fare_url: agency.agency_fare_url,
        agency_email: agency.agency_email
      }));
      
      const { error: agencyError } = await supabase
        .from('gtfs_agencies')
        .insert(agencyRows);
        
      if (agencyError) throw new Error(`Error saving agencies: ${agencyError.message}`);
    }
    
    // Process and insert route data
    if (feed.routes && feed.routes.length > 0) {
      const routeRows = feed.routes.map(route => ({
        feed_id: feedId,
        organization_id: organizationId,
        route_id: route.route_id,
        agency_id: route.agency_id,
        route_short_name: route.route_short_name,
        route_long_name: route.route_long_name,
        route_desc: route.route_desc,
        route_type: route.route_type,
        route_url: route.route_url,
        route_color: route.route_color,
        route_text_color: route.route_text_color
      }));
      
      // Insert in batches to avoid hitting size limits
      const batchSize = 1000;
      for (let i = 0; i < routeRows.length; i += batchSize) {
        const batch = routeRows.slice(i, i + batchSize);
        const { error: routeError } = await supabase
          .from('gtfs_routes')
          .insert(batch);
          
        if (routeError) throw new Error(`Error saving routes: ${routeError.message}`);
      }
    }
    
    // Process and insert stop data
    if (feed.stops && feed.stops.length > 0) {
      const stopRows = feed.stops.map(stop => ({
        feed_id: feedId,
        organization_id: organizationId,
        stop_id: stop.stop_id,
        stop_code: stop.stop_code,
        stop_name: stop.stop_name,
        stop_desc: stop.stop_desc,
        stop_lat: stop.stop_lat,
        stop_lon: stop.stop_lon,
        zone_id: stop.zone_id,
        stop_url: stop.stop_url,
        location_type: stop.location_type,
        parent_station: stop.parent_station,
        stop_timezone: stop.stop_timezone,
        wheelchair_boarding: stop.wheelchair_boarding,
        geom: stop.stop_lat && stop.stop_lon 
          ? `POINT(${stop.stop_lon} ${stop.stop_lat})` 
          : null
      }));
      
      // Insert in batches
      const batchSize = 1000;
      for (let i = 0; i < stopRows.length; i += batchSize) {
        const batch = stopRows.slice(i, i + batchSize);
        const { error: stopError } = await supabase
          .from('gtfs_stops')
          .insert(batch);
          
        if (stopError) throw new Error(`Error saving stops: ${stopError.message}`);
      }
    }
    
    // Similarly process and insert other GTFS data tables
    // For brevity, this implementation focuses on core tables
    // Additional tables would follow the same pattern
    
    // Process and save shapes (important for mapping)
    if (feed.shapes && feed.shapes.length > 0) {
      // Group shapes by shape_id
      const shapesByID = feed.shapes.reduce((acc, shape) => {
        if (!acc[shape.shape_id]) {
          acc[shape.shape_id] = [];
        }
        acc[shape.shape_id].push(shape);
        return acc;
      }, {});
      
      // For each shape, create a LineString
      const shapeRows = Object.entries(shapesByID).map(([shapeId, points]) => {
        // Sort by sequence
        const sortedPoints = [...points].sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
        
        // Create LineString coordinates
        const coordinates = sortedPoints.map(p => [p.shape_pt_lon, p.shape_pt_lat]);
        
        return {
          feed_id: feedId,
          organization_id: organizationId,
          shape_id: shapeId,
          geom: `LINESTRING(${coordinates.map(c => c.join(' ')).join(', ')})`
        };
      });
      
      // Insert in batches
      const batchSize = 500;
      for (let i = 0; i < shapeRows.length; i += batchSize) {
        const batch = shapeRows.slice(i, i + batchSize);
        const { error: shapeError } = await supabase
          .from('gtfs_shapes')
          .insert(batch);
          
        if (shapeError) throw new Error(`Error saving shapes: ${shapeError.message}`);
      }
    }
  }

  /**
   * Get all GTFS feeds for an organization
   */
  async getFeeds(organizationId: string): Promise<GTFSFeedMetadata[]> {
    const { data, error } = await supabase
      .from('gtfs_feeds')
      .select('*')
      .eq('organization_id', organizationId)
      .order('imported_at', { ascending: false });
      
    if (error) throw new Error(`Error fetching GTFS feeds: ${error.message}`);
    
    return data.map(feed => ({
      id: feed.id,
      name: feed.name,
      url: feed.url,
      agency_id: feed.agency_id,
      imported_at: new Date(feed.imported_at),
      valid_from: feed.valid_from ? new Date(feed.valid_from) : undefined,
      valid_until: feed.valid_until ? new Date(feed.valid_until) : undefined,
      version: feed.version,
      status: feed.status,
      error_message: feed.error_message
    }));
  }

  /**
   * Get a specific GTFS feed
   */
  async getFeed(feedId: string): Promise<GTFSFeedMetadata> {
    const { data, error } = await supabase
      .from('gtfs_feeds')
      .select('*')
      .eq('id', feedId)
      .single();
      
    if (error) throw new Error(`Error fetching GTFS feed: ${error.message}`);
    
    return {
      id: data.id,
      name: data.name,
      url: data.url,
      agency_id: data.agency_id,
      imported_at: new Date(data.imported_at),
      valid_from: data.valid_from ? new Date(data.valid_from) : undefined,
      valid_until: data.valid_until ? new Date(data.valid_until) : undefined,
      version: data.version,
      status: data.status,
      error_message: data.error_message
    };
  }

  /**
   * Get routes for a GTFS feed
   */
  async getRoutes(feedId: string): Promise<GTFSRoute[]> {
    const { data, error } = await supabase
      .from('gtfs_routes')
      .select('*')
      .eq('feed_id', feedId);
      
    if (error) throw new Error(`Error fetching GTFS routes: ${error.message}`);
    
    return data.map(route => ({
      route_id: route.route_id,
      agency_id: route.agency_id,
      route_short_name: route.route_short_name,
      route_long_name: route.route_long_name,
      route_desc: route.route_desc,
      route_type: route.route_type,
      route_url: route.route_url,
      route_color: route.route_color,
      route_text_color: route.route_text_color
    }));
  }

  /**
   * Get stops for a GTFS feed
   */
  async getStops(feedId: string): Promise<GTFSStop[]> {
    const { data, error } = await supabase
      .from('gtfs_stops')
      .select('*')
      .eq('feed_id', feedId);
      
    if (error) throw new Error(`Error fetching GTFS stops: ${error.message}`);
    
    return data.map(stop => ({
      stop_id: stop.stop_id,
      stop_code: stop.stop_code,
      stop_name: stop.stop_name,
      stop_desc: stop.stop_desc,
      stop_lat: stop.stop_lat,
      stop_lon: stop.stop_lon,
      zone_id: stop.zone_id,
      stop_url: stop.stop_url,
      location_type: stop.location_type,
      parent_station: stop.parent_station,
      stop_timezone: stop.stop_timezone,
      wheelchair_boarding: stop.wheelchair_boarding
    }));
  }

  /**
   * Get stops in a geographic area
   */
  async getStopsInArea(organizationId: string, lat: number, lon: number, radiusMeters: number): Promise<GTFSStop[]> {
    // Use PostGIS to find stops within a radius
    const { data, error } = await supabase.rpc('get_stops_in_radius', {
      p_organization_id: organizationId,
      p_lat: lat,
      p_lon: lon,
      p_radius_meters: radiusMeters
    });
    
    if (error) throw new Error(`Error fetching stops in area: ${error.message}`);
    
    return data.map(stop => ({
      stop_id: stop.stop_id,
      stop_code: stop.stop_code,
      stop_name: stop.stop_name,
      stop_desc: stop.stop_desc,
      stop_lat: stop.stop_lat,
      stop_lon: stop.stop_lon,
      zone_id: stop.zone_id,
      stop_url: stop.stop_url,
      location_type: stop.location_type,
      parent_station: stop.parent_station,
      stop_timezone: stop.stop_timezone,
      wheelchair_boarding: stop.wheelchair_boarding,
      distance_meters: stop.distance
    }));
  }

  /**
   * Get route shapes as GeoJSON
   */
  async getRouteShapesAsGeoJSON(feedId: string, routeId?: string): Promise<GeoJSON.FeatureCollection> {
    let query = supabase.rpc('get_route_shapes_as_geojson', {
      p_feed_id: feedId
    });
    
    if (routeId) {
      query = supabase.rpc('get_route_shape_as_geojson', {
        p_feed_id: feedId,
        p_route_id: routeId
      });
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Error fetching route shapes: ${error.message}`);
    
    return data;
  }

  /**
   * Calculate public transit accessibility for a location
   */
  async calculateTransitAccessibility(organizationId: string, lat: number, lon: number): Promise<{
    accessibilityScore: number;
    stopsWithin400m: number;
    stopsWithin800m: number;
    routesAvailable: number;
    averageHeadway: number | null;
  }> {
    const { data, error } = await supabase.rpc('calculate_transit_accessibility', {
      p_organization_id: organizationId,
      p_lat: lat,
      p_lon: lon
    });
    
    if (error) throw new Error(`Error calculating transit accessibility: ${error.message}`);
    
    if (!data || data.length === 0) {
      return {
        accessibilityScore: 0,
        stopsWithin400m: 0,
        stopsWithin800m: 0,
        routesAvailable: 0,
        averageHeadway: null
      };
    }
    
    return data[0];
  }

  /**
   * Delete a GTFS feed and all associated data
   */
  async deleteFeed(feedId: string): Promise<void> {
    // Begin transaction
    const { error } = await supabase.rpc('delete_gtfs_feed', {
      p_feed_id: feedId
    });
    
    if (error) throw new Error(`Error deleting GTFS feed: ${error.message}`);
  }
}

// Create a singleton instance
export const gtfsService = new GTFSService(); 