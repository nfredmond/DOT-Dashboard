/**
 * Environment Variable Service
 * 
 * Manages environment variables for the application, combining
 * Next.js environment variables and user-configured ones from localStorage.
 * 
 * In a production environment, this would be connected to a backend service.
 */

/**
 * Environment Variable Categories
 */
export type EnvCategory = 
  | 'map' 
  | 'api'
  | 'auth'
  | 'other'
  | 'llm' 
  | 'census' 
  | 'traffic' 
  | 'planning'
  | 'supabase'  // Add Supabase category
  | 'database'  // Add database category (for offline mode)
  | 'mcp';      // Add Model Context Protocol category

/**
 * Environment Variable Interface
 */
export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  description: string;
  category: EnvCategory;
  isSecret: boolean;
  defaultValue?: string;
  required?: boolean;
}

/**
 * Supabase Configuration
 */
export interface SupabaseConfig {
  id: string;
  name: string;
  url: string;
  anonKey: string;
  serviceKey?: string;
  organizationId?: string;
  isDefault?: boolean;
}

/**
 * Offline Database Configuration
 */
export interface OfflineDatabaseConfig {
  enabled: boolean;
  maxStorageSize: number; // in MB
  syncOnConnect: boolean;
  syncInterval: number; // in minutes
  tables: string[];
}

/**
 * Model Context Protocol Server Configuration
 */
export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  provider: 'openai' | 'anthropic' | 'meta' | 'custom';
  capabilities: MCPCapability[];
  isActive: boolean;
  timeout?: number; // in milliseconds
}

/**
 * MCP Capability Types
 */
export type MCPCapability = 
  | 'file_search'
  | 'web_search'
  | 'code_execution'
  | 'image_generation'
  | 'data_analysis'
  | 'gis_processing'
  | 'database_query'
  | 'custom_tool';

// Default environment variables
const defaultEnvVariables: EnvVariable[] = [
  {
    id: "1",
    key: "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN",
    value: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
    description: "API key for Mapbox basemaps and services",
    category: "map",
    isSecret: true
  },
  {
    id: "2",
    key: "NEXT_PUBLIC_MAPTILER_ACCESS_TOKEN",
    value: process.env.NEXT_PUBLIC_MAPTILER_ACCESS_TOKEN || "",
    description: "API key for MapTiler basemaps and services",
    category: "map",
    isSecret: true
  },
  {
    id: "3",
    key: "NEXT_PUBLIC_API_URL",
    value: process.env.NEXT_PUBLIC_API_URL || "https://api.example.com",
    description: "Backend API URL for the application",
    category: "api",
    isSecret: false
  },
  {
    id: "4",
    key: "AUTH_SECRET",
    value: process.env.AUTH_SECRET || "",
    description: "Secret key for authentication",
    category: "auth",
    isSecret: true
  },
  {
    id: "5",
    key: "OPENAI_API_KEY",
    value: process.env.OPENAI_API_KEY || "",
    description: "API key for OpenAI services (ChatGPT, GPT-4, etc.)",
    category: "llm",
    isSecret: true
  },
  {
    id: "6",
    key: "ANTHROPIC_API_KEY",
    value: process.env.ANTHROPIC_API_KEY || "",
    description: "API key for Anthropic services (Claude)",
    category: "llm",
    isSecret: true
  },
  {
    id: "7",
    key: "META_AI_API_KEY",
    value: process.env.META_AI_API_KEY || "",
    description: "API key for Meta AI services (Llama)",
    category: "llm",
    isSecret: true
  },
  {
    id: "8",
    key: "CENSUS_API_KEY",
    value: process.env.CENSUS_API_KEY || "",
    description: "API key for US Census Bureau data access",
    category: "census",
    isSecret: true
  },
  {
    id: "9",
    key: "CENSUS_API_BASE_URL",
    value: process.env.CENSUS_API_BASE_URL || "https://api.census.gov/data",
    description: "Base URL for US Census Bureau API",
    category: "census",
    isSecret: false
  },
  {
    id: "10",
    key: "SWITRS_API_KEY",
    value: process.env.SWITRS_API_KEY || "",
    description: "API key for SWITRS (California traffic collision data)",
    category: "traffic",
    isSecret: true
  },
  {
    id: "11",
    key: "ESRI_API_KEY",
    value: process.env.ESRI_API_KEY || "",
    description: "API key for ESRI ArcGIS services",
    category: "planning",
    isSecret: true
  },
  {
    id: "12",
    key: "NEXT_PUBLIC_SUPABASE_URL",
    value: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    description: "URL for the default Supabase instance",
    category: "supabase",
    isSecret: false
  },
  {
    id: "13",
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    description: "Public anonymous key for Supabase client",
    category: "supabase",
    isSecret: true
  },
  {
    id: "14",
    key: "SUPABASE_SERVICE_KEY",
    value: process.env.SUPABASE_SERVICE_KEY || "",
    description: "Service role key for secure Supabase operations (server-side only)",
    category: "supabase",
    isSecret: true
  },
  {
    id: "15",
    key: "OFFLINE_DATABASE_ENABLED",
    value: process.env.OFFLINE_DATABASE_ENABLED || "false",
    description: "Enable offline database functionality",
    category: "database",
    isSecret: false
  },
  {
    id: "16",
    key: "MCP_ENABLED",
    value: process.env.MCP_ENABLED || "false",
    description: "Enable Model Context Protocol for enhanced LLM capabilities",
    category: "mcp",
    isSecret: false
  }
];

/**
 * Default Supabase configurations
 */
const defaultSupabaseConfigs: SupabaseConfig[] = [
  {
    id: 'default',
    name: 'Default Instance',
    url: '',
    anonKey: '',
    isDefault: true
  }
];

/**
 * Default offline database configuration
 */
const defaultOfflineDatabaseConfig: OfflineDatabaseConfig = {
  enabled: false,
  maxStorageSize: 50, // 50MB
  syncOnConnect: true,
  syncInterval: 30, // 30 minutes
  tables: ['projects', 'users', 'comments', 'spatial_features']
};

/**
 * Default MCP server configurations
 */
const defaultMCPServers: MCPServerConfig[] = [
  {
    id: 'openai-default',
    name: 'OpenAI Function Calling',
    url: 'https://api.openai.com/v1/',
    provider: 'openai',
    capabilities: ['file_search', 'web_search', 'code_execution'],
    isActive: false
  },
  {
    id: 'anthropic-default',
    name: 'Anthropic Claude Tools',
    url: 'https://api.anthropic.com/v1/',
    provider: 'anthropic',
    capabilities: ['file_search', 'web_search', 'code_execution', 'data_analysis'],
    isActive: false
  }
];

// In-memory cache for environment variables to reduce localStorage reads
let inMemoryEnvCache: EnvVariable[] | null = null;

/**
 * Get all environment variables
 * This combines Next.js env vars with user-configured values from localStorage
 */
export function getEnvironmentVariables(): EnvVariable[] {
  // Return cached values if available
  if (inMemoryEnvCache) {
    return inMemoryEnvCache;
  }
  
  // Load variables from storage or defaults
  const variables = loadEnvVariables();
  
  // Update cache
  inMemoryEnvCache = variables;
  
  return variables;
}

/**
 * Load all environment variables from localStorage or defaults
 */
export function loadEnvVariables(): EnvVariable[] {
  // Only run on client
  if (typeof window === 'undefined') {
    return defaultEnvVariables;
  }
  
  try {
    const storedVariables = localStorage.getItem("envVariables");
    if (storedVariables) {
      return JSON.parse(storedVariables);
    }
  } catch (error) {
    console.error("Failed to load environment variables from localStorage:", error);
  }
  
  return defaultEnvVariables;
}

/**
 * Save environment variables to localStorage
 */
export function saveEnvVariables(variables: EnvVariable[]): boolean {
  // Only run on client
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem("envVariables", JSON.stringify(variables));
    return true;
  } catch (error) {
    console.error("Failed to save environment variables to localStorage:", error);
    return false;
  }
}

/**
 * Get environment variable by key
 * @param key The environment variable key
 * @param defaultValue Default value to return if not found
 */
export function getEnvVariable(key: string, defaultValue: string = ""): string {
  // First check Next.js env vars for server-side pre-configured values
  if (process.env[key]) {
    return process.env[key] as string;
  }
  
  // Only run localStorage check on client
  if (typeof window !== 'undefined') {
    try {
      const variables = getEnvironmentVariables();
      const variable = variables.find(v => v.key === key);
      if (variable) {
        return variable.value;
      }
    } catch (error) {
      console.error(`Failed to get environment variable ${key}:`, error);
    }
  }
  
  return defaultValue;
}

/**
 * Determine if a map provider is configured
 * @param provider The map provider to check (mapbox, maptiler, etc.)
 */
export function isMapProviderConfigured(provider: 'mapbox' | 'maptiler' | 'carto'): boolean {
  switch (provider) {
    case 'mapbox':
      return !!getEnvVariable('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN');
    case 'maptiler':
      return !!getEnvVariable('NEXT_PUBLIC_MAPTILER_ACCESS_TOKEN');
    case 'carto':
      // CARTO doesn't need an API key for basic usage
      return true;
    default:
      return false;
  }
}

/**
 * Get saved Supabase configurations
 * @returns Array of Supabase configurations
 */
export function getSupabaseConfigs(): SupabaseConfig[] {
  if (typeof window === 'undefined') {
    return defaultSupabaseConfigs;
  }
  
  try {
    const savedConfigs = localStorage.getItem('supabase_configs');
    if (!savedConfigs) {
      // Initialize with default values and environment variables
      const configs = [...defaultSupabaseConfigs];
      
      // Update default config with environment values if available
      const defaultConfig = configs.find(config => config.isDefault);
      if (defaultConfig) {
        defaultConfig.url = getEnvVariable('NEXT_PUBLIC_SUPABASE_URL') || defaultConfig.url;
        defaultConfig.anonKey = getEnvVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY') || defaultConfig.anonKey;
        defaultConfig.serviceKey = getEnvVariable('SUPABASE_SERVICE_KEY') || defaultConfig.serviceKey;
      }
      
      saveSupabaseConfigs(configs);
      return configs;
    }
    
    return JSON.parse(savedConfigs);
  } catch (error) {
    console.error('Error loading Supabase configs:', error);
    return defaultSupabaseConfigs;
  }
}

/**
 * Save Supabase configurations
 * @param configs Array of configurations to save
 */
export function saveSupabaseConfigs(configs: SupabaseConfig[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('supabase_configs', JSON.stringify(configs));
  } catch (error) {
    console.error('Error saving Supabase configs:', error);
  }
}

/**
 * Get a Supabase configuration by organization ID
 * If no ID is provided or no config matches, return the default config
 * @param organizationId Optional organization ID
 * @returns A Supabase configuration
 */
export function getSupabaseConfig(organizationId?: string): SupabaseConfig {
  const configs = getSupabaseConfigs();
  
  if (organizationId) {
    const orgConfig = configs.find(config => config.organizationId === organizationId);
    if (orgConfig) {
      return orgConfig;
    }
  }
  
  // Return default config
  const defaultConfig = configs.find(config => config.isDefault);
  if (!defaultConfig) {
    throw new Error('No default Supabase configuration found');
  }
  
  return defaultConfig;
}

/**
 * Check if offline database mode is enabled
 * @returns True if offline mode is enabled
 */
export function isOfflineDatabaseEnabled(): boolean {
  const value = getEnvVariable('OFFLINE_DATABASE_ENABLED');
  return value === 'true';
}

/**
 * Load offline database configuration
 * @returns The offline database configuration
 */
export function loadOfflineDatabaseConfig(): OfflineDatabaseConfig {
  if (typeof window === 'undefined') {
    return defaultOfflineDatabaseConfig;
  }
  
  try {
    const savedConfig = localStorage.getItem('offline_db_config');
    if (!savedConfig) {
      // Initialize with default values and environment variables
      const config = { ...defaultOfflineDatabaseConfig };
      config.enabled = isOfflineDatabaseEnabled();
      config.syncOnConnect = getEnvVariable('OFFLINE_DATABASE_SYNC_ON_CONNECT') === 'true';
      
      saveOfflineDatabaseConfig(config);
      return config;
    }
    
    return JSON.parse(savedConfig);
  } catch (error) {
    console.error('Error loading offline database config:', error);
    return defaultOfflineDatabaseConfig;
  }
}

/**
 * Save offline database configuration
 * @param config Configuration to save
 */
export function saveOfflineDatabaseConfig(config: OfflineDatabaseConfig): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('offline_db_config', JSON.stringify(config));
    
    // Also update the environment variables
    setEnvVariable('OFFLINE_DATABASE_ENABLED', config.enabled ? 'true' : 'false');
    setEnvVariable('OFFLINE_DATABASE_SYNC_ON_CONNECT', config.syncOnConnect ? 'true' : 'false');
  } catch (error) {
    console.error('Error saving offline database config:', error);
  }
}

/**
 * Get MCP server configurations
 * @returns Array of MCP server configurations
 */
export function getMCPServers(): MCPServerConfig[] {
  if (typeof window === 'undefined') {
    return defaultMCPServers;
  }
  
  try {
    const savedServers = localStorage.getItem('mcp_servers');
    if (!savedServers) {
      // Initialize with default values
      const servers = [...defaultMCPServers];
      
      // Update with API keys from environment variables if available
      servers.forEach(server => {
        if (server.provider === 'openai') {
          server.apiKey = getEnvVariable('OPENAI_API_KEY') || server.apiKey;
        } else if (server.provider === 'anthropic') {
          server.apiKey = getEnvVariable('ANTHROPIC_API_KEY') || server.apiKey;
        } else if (server.provider === 'meta') {
          server.apiKey = getEnvVariable('META_AI_API_KEY') || server.apiKey;
        }
        
        // Set active if we have an API key
        if (server.apiKey) {
          server.isActive = true;
        }
      });
      
      saveMCPServers(servers);
      return servers;
    }
    
    return JSON.parse(savedServers);
  } catch (error) {
    console.error('Error loading MCP servers:', error);
    return defaultMCPServers;
  }
}

/**
 * Save MCP server configurations
 * @param servers Array of server configurations to save
 */
export function saveMCPServers(servers: MCPServerConfig[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('mcp_servers', JSON.stringify(servers));
    
    // Update the MCP_ENABLED environment variable
    const hasActiveServer = servers.some(server => server.isActive);
    setEnvVariable('MCP_ENABLED', hasActiveServer ? 'true' : 'false');
  } catch (error) {
    console.error('Error saving MCP servers:', error);
  }
}

/**
 * Check if MCP is enabled
 * @returns True if MCP is enabled and there is at least one active server
 */
export function isMCPEnabled(): boolean {
  // Check if MCP is enabled in environment variables
  const enabled = getEnvVariable('MCP_ENABLED') === 'true';
  
  if (!enabled) {
    return false;
  }
  
  // Check if there's at least one active server
  const servers = getMCPServers();
  return servers.some(server => server.isActive);
}

/**
 * Get all available MCP capabilities
 * @returns A list of unique MCP capabilities from all active servers
 */
export function getAvailableMCPCapabilities(): MCPCapability[] {
  const servers = getMCPServers();
  const activeServers = servers.filter(server => server.isActive);
  
  // Get unique capabilities from all active servers
  const allCapabilities = activeServers.flatMap(server => server.capabilities);
  const uniqueCapabilities = Array.from(new Set(allCapabilities));
  
  return uniqueCapabilities;
}

/**
 * Set an environment variable value
 * @param key The environment variable key
 * @param value The value to set
 * @returns True if successful, false otherwise
 */
export function setEnvVariable(key: string, value: string): boolean {
  // Only run on client
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    // Get current environment variables
    const envVars = getEnvironmentVariables();
    
    // Find the variable by key
    const varIndex = envVars.findIndex(v => v.key === key);
    if (varIndex >= 0) {
      // Update existing variable
      envVars[varIndex].value = value;
    } else {
      // Create new variable
      const id = `env_${Date.now()}`;
      envVars.push({
        id,
        key,
        value,
        description: 'Automatically added environment variable',
        category: 'other',
        isSecret: false
      });
    }
    
    // Save to localStorage
    localStorage.setItem('envVariables', JSON.stringify(envVars));
    
    // Update in-memory cache if exists
    if (inMemoryEnvCache) {
      inMemoryEnvCache = envVars;
    }
    
    return true;
  } catch (error) {
    console.error('Error setting environment variable:', error);
    return false;
  }
}