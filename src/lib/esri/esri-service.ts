import { supabase } from '@/lib/supabase';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

/**
 * Types for ESRI integration
 */

export interface ESRIServiceCredentials {
  clientId?: string;
  clientSecret?: string;
  token?: string;
  tokenExpires?: Date;
  username?: string;
  password?: string;
}

export interface ESRIServiceDefinition {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  serviceUrl: string;
  serviceType: 'FeatureService' | 'MapService' | 'ImageService' | 'GeoprocessingService';
  layers?: ESRILayerInfo[];
  credentials?: ESRIServiceCredentials;
  isPublic: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ESRILayerInfo {
  id: number;
  name: string;
  type: string;
  geometryType?: string;
  fields?: any[];
  description?: string;
}

export interface ESRIFeature {
  attributes: Record<string, any>;
  geometry?: any;
}

export interface ESRIFeatureSet {
  features: ESRIFeature[];
  geometryType?: string;
  spatialReference?: {
    wkid: number;
    latestWkid?: number;
  };
  fields?: any[];
}

export interface ESRIQueryOptions {
  where?: string;
  outFields?: string[];
  geometry?: any;
  geometryType?: string;
  inSR?: number;
  spatialRel?: string;
  distance?: number;
  units?: string;
  returnGeometry?: boolean;
  maxAllowableOffset?: number;
  orderByFields?: string[];
  limit?: number;
  offset?: number;
}

export interface ESRIService {
  id: string;
  name: string;
  url: string;
  organizationId: string;
  serviceType: string;
}

/**
 * Service for integrating with ESRI ArcGIS services
 */
class ESRIServiceImplementation {
  private tokenCache: Map<string, { token: string, expires: Date }> = new Map();

  /**
   * Register a new ESRI service
   */
  async registerService(
    name: string,
    serviceUrl: string,
    organizationId: string,
    serviceType: 'FeatureService' | 'MapService' | 'ImageService' | 'GeoprocessingService',
    description?: string,
    credentials?: ESRIServiceCredentials,
    isPublic: boolean = false,
    tags: string[] = []
  ): Promise<string> {
    try {
      // Validate the service URL
      await this.validateServiceUrl(serviceUrl, serviceType);
      
      // Generate a unique ID for the service
      const serviceId = uuidv4();
      
      // Get the service metadata
      const metadata = await this.getServiceMetadata(serviceUrl, serviceType, credentials);
      
      // Insert the service record
      const { error } = await supabase
        .from('esri_services')
        .insert({
          id: serviceId,
          name,
          description,
          service_url: serviceUrl,
          service_type: serviceType,
          organization_id: organizationId,
          metadata: metadata || {},
          credentials: credentials || null,
          is_public: isPublic,
          tags
        });
      
      if (error) throw new Error(`Failed to register ESRI service: ${error.message}`);
      
      // Get layer information
      if (['FeatureService', 'MapService'].includes(serviceType)) {
        const layers = await this.getServiceLayers(serviceUrl, serviceType, credentials);
        
        // Store layer information
        if (layers && layers.length > 0) {
          const layerRecords = layers.map(layer => ({
            service_id: serviceId,
            layer_id: layer.id,
            name: layer.name,
            type: layer.type,
            geometry_type: layer.geometryType,
            description: layer.description,
            fields: layer.fields || [],
            organization_id: organizationId
          }));
          
          const { error: layerError } = await supabase
            .from('esri_service_layers')
            .insert(layerRecords);
          
          if (layerError) {
            logger.error(`Failed to register ESRI service layers: ${layerError.message}`);
          }
        }
      }
      
      return serviceId;
    } catch (error) {
      logger.error('Error registering ESRI service:', error);
      throw error;
    }
  }

  /**
   * Validate a service URL
   */
  private async validateServiceUrl(
    serviceUrl: string,
    serviceType: string,
    credentials?: ESRIServiceCredentials
  ): Promise<boolean> {
    try {
      // Ensure URL ends with the correct service type
      if (!serviceUrl.endsWith(`/${serviceType}`)) {
        serviceUrl = serviceUrl.endsWith('/') 
          ? `${serviceUrl}${serviceType}`
          : `${serviceUrl}/${serviceType}`;
      }
      
      // Add query parameters for JSON response
      const url = new URL(`${serviceUrl}?f=json`);
      
      // Add token if available
      if (credentials?.token) {
        url.searchParams.append('token', credentials.token);
      }
      
      const response = await axios.get(url.toString());
      
      if (response.status !== 200 || !response.data) {
        throw new Error('Invalid service URL or service is not accessible');
      }
      
      // Check if the response has expected properties based on service type
      if (serviceType === 'FeatureService' && !response.data.layers) {
        throw new Error('URL does not point to a valid Feature Service');
      }
      
      if (serviceType === 'MapService' && (!response.data.layers && !response.data.mapName)) {
        throw new Error('URL does not point to a valid Map Service');
      }
      
      if (serviceType === 'ImageService' && !response.data.pixelSizeX) {
        throw new Error('URL does not point to a valid Image Service');
      }
      
      if (serviceType === 'GeoprocessingService' && !response.data.tasks) {
        throw new Error('URL does not point to a valid Geoprocessing Service');
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating ESRI service URL:', error);
      throw new Error(`Invalid service URL: ${error.message}`);
    }
  }

  /**
   * Get service metadata
   */
  private async getServiceMetadata(
    serviceUrl: string,
    serviceType: string,
    credentials?: ESRIServiceCredentials
  ): Promise<any> {
    try {
      // Ensure URL ends with the correct service type
      if (!serviceUrl.endsWith(`/${serviceType}`)) {
        serviceUrl = serviceUrl.endsWith('/') 
          ? `${serviceUrl}${serviceType}`
          : `${serviceUrl}/${serviceType}`;
      }
      
      // Add query parameters for JSON response
      const url = new URL(`${serviceUrl}?f=json`);
      
      // Get token if needed
      let token = credentials?.token;
      if (credentials?.clientId && credentials?.clientSecret && !token) {
        token = await this.getToken(serviceUrl, credentials);
      }
      
      // Add token if available
      if (token) {
        url.searchParams.append('token', token);
      }
      
      const response = await axios.get(url.toString());
      
      if (response.status !== 200 || !response.data) {
        throw new Error('Failed to get service metadata');
      }
      
      return response.data;
    } catch (error) {
      logger.error('Error getting ESRI service metadata:', error);
      return null;
    }
  }

  /**
   * Get service layers
   */
  private async getServiceLayers(
    serviceUrl: string,
    serviceType: string,
    credentials?: ESRIServiceCredentials
  ): Promise<ESRILayerInfo[]> {
    try {
      const metadata = await this.getServiceMetadata(serviceUrl, serviceType, credentials);
      
      if (!metadata || !metadata.layers) {
        return [];
      }
      
      // For each layer, get more detailed information
      const layerPromises = metadata.layers.map(async (layerInfo: any) => {
        try {
          // Construct layer URL
          const layerUrl = `${serviceUrl}/${layerInfo.id}?f=json`;
          
          // Get token if needed
          let token = credentials?.token;
          if (credentials?.clientId && credentials?.clientSecret && !token) {
            token = await this.getToken(serviceUrl, credentials);
          }
          
          // Add token if available
          const url = new URL(layerUrl);
          if (token) {
            url.searchParams.append('token', token);
          }
          
          const response = await axios.get(url.toString());
          
          if (response.status !== 200 || !response.data) {
            return {
              id: layerInfo.id,
              name: layerInfo.name,
              type: layerInfo.type
            };
          }
          
          return {
            id: layerInfo.id,
            name: layerInfo.name,
            type: layerInfo.type,
            geometryType: response.data.geometryType,
            fields: response.data.fields,
            description: response.data.description
          };
        } catch (error) {
          // If we can't get detailed info, return basic info
          logger.warn(`Couldn't get detailed layer info for ${layerInfo.id}:`, error);
          return {
            id: layerInfo.id,
            name: layerInfo.name,
            type: layerInfo.type
          };
        }
      });
      
      return await Promise.all(layerPromises);
    } catch (error) {
      logger.error('Error getting ESRI service layers:', error);
      return [];
    }
  }

  /**
   * Get a token for an ESRI service
   */
  private async getToken(
    serviceUrl: string,
    credentials: ESRIServiceCredentials
  ): Promise<string> {
    try {
      // Check if we have a cached token that's not expired
      const cacheKey = `${serviceUrl}:${credentials.clientId}`;
      const cachedToken = this.tokenCache.get(cacheKey);
      
      if (cachedToken && cachedToken.expires > new Date()) {
        return cachedToken.token;
      }
      
      // Determine the token endpoint
      // Usually it's https://www.arcgis.com/sharing/rest/oauth2/token
      // But could be on a different portal
      let tokenUrl = 'https://www.arcgis.com/sharing/rest/oauth2/token';
      
      // Check if this is a custom portal
      if (serviceUrl.includes('arcgis.com') === false) {
        // Try to extract the portal URL
        const urlParts = new URL(serviceUrl);
        const portalBase = `${urlParts.protocol}//${urlParts.hostname}`;
        tokenUrl = `${portalBase}/sharing/rest/oauth2/token`;
      }
      
      // Prepare request data
      const data = new URLSearchParams();
      
      if (credentials.clientId && credentials.clientSecret) {
        // Use client credentials flow
        data.append('client_id', credentials.clientId);
        data.append('client_secret', credentials.clientSecret);
        data.append('grant_type', 'client_credentials');
      } else if (credentials.username && credentials.password) {
        // Use username/password flow
        data.append('username', credentials.username);
        data.append('password', credentials.password);
        data.append('grant_type', 'password');
      } else {
        throw new Error('Invalid credentials for token generation');
      }
      
      data.append('f', 'json');
      
      // Request token
      const response = await axios.post(tokenUrl, data);
      
      if (!response.data || !response.data.access_token) {
        throw new Error('Failed to get token: Invalid response from token endpoint');
      }
      
      // Calculate expiration
      const expiresIn = response.data.expires_in || 7200; // Default to 2 hours if not specified
      const expires = new Date();
      expires.setSeconds(expires.getSeconds() + expiresIn);
      
      // Cache the token
      this.tokenCache.set(cacheKey, {
        token: response.data.access_token,
        expires
      });
      
      return response.data.access_token;
    } catch (error) {
      logger.error('Error getting ESRI token:', error);
      throw new Error(`Failed to get token: ${error.message}`);
    }
  }

  /**
   * List all ESRI services for an organization
   */
  async listServices(organizationId: string): Promise<ESRIService[]> {
    try {
      const { data, error } = await supabase
        .from('esri_services')
        .select('id, name, service_url, organization_id, service_type')
        .eq('organization_id', organizationId);
      
      if (error) throw new Error(`Failed to list ESRI services: ${error.message}`);
      
      return data.map(service => ({
        id: service.id,
        name: service.name,
        url: service.service_url,
        organizationId: service.organization_id,
        serviceType: service.service_type
      }));
    } catch (error) {
      logger.error('Error listing ESRI services:', error);
      throw error;
    }
  }

  /**
   * Get ESRI service details
   */
  async getService(serviceId: string): Promise<ESRIServiceDefinition> {
    try {
      const { data, error } = await supabase
        .from('esri_services')
        .select('*, esri_service_layers(id, layer_id, name, type, geometry_type, description, fields)')
        .eq('id', serviceId)
        .single();
      
      if (error) throw new Error(`Failed to get ESRI service: ${error.message}`);
      
      const layers = data.esri_service_layers?.map(layer => ({
        id: layer.layer_id,
        name: layer.name,
        type: layer.type,
        geometryType: layer.geometry_type,
        description: layer.description,
        fields: layer.fields
      })) || [];
      
      return {
        id: data.id,
        organizationId: data.organization_id,
        name: data.name,
        description: data.description,
        serviceUrl: data.service_url,
        serviceType: data.service_type,
        layers,
        credentials: data.credentials,
        isPublic: data.is_public,
        tags: data.tags,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      logger.error('Error getting ESRI service:', error);
      throw error;
    }
  }

  /**
   * Query features from an ESRI Feature Service layer
   */
  async queryFeatures(
    serviceId: string,
    layerId: number,
    options: ESRIQueryOptions = {}
  ): Promise<ESRIFeatureSet> {
    try {
      // Get service details
      const service = await this.getService(serviceId);
      
      if (!service) {
        throw new Error(`Service with ID ${serviceId} not found`);
      }
      
      // Construct query URL
      const baseUrl = service.serviceUrl;
      const url = new URL(`${baseUrl}/${layerId}/query`);
      
      // Set default parameters
      url.searchParams.append('f', 'json');
      url.searchParams.append('where', options.where || '1=1');
      url.searchParams.append('outFields', options.outFields?.join(',') || '*');
      url.searchParams.append('returnGeometry', options.returnGeometry?.toString() || 'true');
      
      // Add spatial query parameters if provided
      if (options.geometry) {
        url.searchParams.append('geometry', JSON.stringify(options.geometry));
        url.searchParams.append('geometryType', options.geometryType || 'esriGeometryEnvelope');
        url.searchParams.append('spatialRel', options.spatialRel || 'esriSpatialRelIntersects');
        
        if (options.inSR) {
          url.searchParams.append('inSR', options.inSR.toString());
        }
      }
      
      // Add additional parameters if provided
      if (options.distance) {
        url.searchParams.append('distance', options.distance.toString());
        url.searchParams.append('units', options.units || 'esriSRUnit_Meter');
      }
      
      if (options.orderByFields) {
        url.searchParams.append('orderByFields', options.orderByFields.join(','));
      }
      
      if (options.limit) {
        url.searchParams.append('resultRecordCount', options.limit.toString());
      }
      
      if (options.offset) {
        url.searchParams.append('resultOffset', options.offset.toString());
      }
      
      // Add token if available
      let token: string = null;
      if (service.credentials) {
        if (service.credentials.token) {
          token = service.credentials.token;
        } else if (service.credentials.clientId && service.credentials.clientSecret) {
          token = await this.getToken(service.serviceUrl, service.credentials);
        }
        
        if (token) {
          url.searchParams.append('token', token);
        }
      }
      
      // Execute query
      const response = await axios.get(url.toString());
      
      if (response.status !== 200 || !response.data) {
        throw new Error('Failed to query features: Invalid response');
      }
      
      if (response.data.error) {
        throw new Error(`ESRI API Error: ${response.data.error.message || JSON.stringify(response.data.error)}`);
      }
      
      return {
        features: response.data.features || [],
        geometryType: response.data.geometryType,
        spatialReference: response.data.spatialReference,
        fields: response.data.fields
      };
    } catch (error) {
      logger.error('Error querying ESRI features:', error);
      throw error;
    }
  }

  /**
   * Convert ESRI features to GeoJSON
   */
  convertToGeoJSON(featureSet: ESRIFeatureSet): GeoJSON.FeatureCollection {
    try {
      if (!featureSet || !featureSet.features) {
        return {
          type: 'FeatureCollection',
          features: []
        };
      }
      
      const features = featureSet.features.map(feature => {
        let geometry: any = null;
        
        // Convert ESRI geometry to GeoJSON geometry
        if (feature.geometry) {
          if (featureSet.geometryType === 'esriGeometryPoint') {
            geometry = {
              type: 'Point',
              coordinates: [feature.geometry.x, feature.geometry.y]
            };
          } else if (featureSet.geometryType === 'esriGeometryPolyline') {
            geometry = {
              type: 'MultiLineString',
              coordinates: feature.geometry.paths
            };
          } else if (featureSet.geometryType === 'esriGeometryPolygon') {
            geometry = {
              type: 'Polygon',
              coordinates: feature.geometry.rings
            };
          }
        }
        
        return {
          type: 'Feature',
          geometry,
          properties: feature.attributes
        };
      });
      
      return {
        type: 'FeatureCollection',
        features
      };
    } catch (error) {
      logger.error('Error converting to GeoJSON:', error);
      throw error;
    }
  }

  /**
   * Delete an ESRI service
   */
  async deleteService(serviceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('esri_services')
        .delete()
        .eq('id', serviceId);
      
      if (error) throw new Error(`Failed to delete ESRI service: ${error.message}`);
    } catch (error) {
      logger.error('Error deleting ESRI service:', error);
      throw error;
    }
  }

  /**
   * Update an ESRI service
   */
  async updateService(
    serviceId: string,
    updates: {
      name?: string;
      description?: string;
      credentials?: ESRIServiceCredentials;
      isPublic?: boolean;
      tags?: string[];
    }
  ): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.credentials !== undefined) updateData.credentials = updates.credentials;
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      
      updateData.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('esri_services')
        .update(updateData)
        .eq('id', serviceId);
      
      if (error) throw new Error(`Failed to update ESRI service: ${error.message}`);
    } catch (error) {
      logger.error('Error updating ESRI service:', error);
      throw error;
    }
  }

  /**
   * Refresh ESRI service metadata and layers
   */
  async refreshService(serviceId: string): Promise<void> {
    try {
      // Get service details
      const { data: service, error } = await supabase
        .from('esri_services')
        .select('*')
        .eq('id', serviceId)
        .single();
      
      if (error) throw new Error(`Failed to get ESRI service: ${error.message}`);
      
      // Get updated metadata
      const metadata = await this.getServiceMetadata(
        service.service_url, 
        service.service_type, 
        service.credentials
      );
      
      // Update service metadata
      await supabase
        .from('esri_services')
        .update({
          metadata: metadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);
      
      // For feature and map services, refresh layers
      if (['FeatureService', 'MapService'].includes(service.service_type)) {
        // Delete existing layers
        await supabase
          .from('esri_service_layers')
          .delete()
          .eq('service_id', serviceId);
        
        // Get updated layers
        const layers = await this.getServiceLayers(
          service.service_url, 
          service.service_type, 
          service.credentials
        );
        
        // Insert updated layers
        if (layers && layers.length > 0) {
          const layerRecords = layers.map(layer => ({
            service_id: serviceId,
            layer_id: layer.id,
            name: layer.name,
            type: layer.type,
            geometry_type: layer.geometryType,
            description: layer.description,
            fields: layer.fields || [],
            organization_id: service.organization_id
          }));
          
          await supabase
            .from('esri_service_layers')
            .insert(layerRecords);
        }
      }
    } catch (error) {
      logger.error('Error refreshing ESRI service:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const esriService = new ESRIServiceImplementation(); 