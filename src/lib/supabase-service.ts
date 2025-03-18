/**
 * Supabase Service
 * 
 * Handles initialization and management of Supabase clients.
 * Supports multiple configurations based on user organization,
 * as well as offline mode with IndexedDB.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isOfflineDatabaseEnabled, loadOfflineDatabaseConfig, getEnvVariable } from "./env-service";
import { createMockClient } from './mock-supabase';

// Store active clients for reuse
const clientStore: Record<string, SupabaseClient> = {};

// IndexedDB database version
const DB_VERSION = 1;

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';
const useMockSupabase = isDevelopment && getEnvVariable('NEXT_PUBLIC_ENABLE_MOCK_DATA', 'false') === 'true';

/**
 * Initialize Supabase client based on configuration
 * @param organizationId Optional organization ID to use for configuration lookup
 * @returns A Supabase client instance
 */
export function initSupabaseClient(organizationId?: string): SupabaseClient {
  if (useMockSupabase) {
    // Use mock client in development
    return createMockClient() as unknown as SupabaseClient;
  }

  // Get the appropriate configuration based on organization ID
  const config = getSupabaseConfig(organizationId);
  
  // Check if we already have a client for this config
  const clientKey = config.id;
  if (clientStore[clientKey]) {
    return clientStore[clientKey];
  }
  
  // Create and store a new client
  const client = createClient(config.url, config.anonKey);
  clientStore[clientKey] = client;
  
  return client;
}

/**
 * Initialize a Supabase client with service role permissions
 * For server-side operations only, never expose on client
 * @param organizationId Optional organization ID to use for configuration lookup
 * @returns A Supabase client instance with service role permissions
 */
export function initSupabaseAdmin(organizationId?: string): SupabaseClient {
  // Get the appropriate configuration based on organization ID
  const config = getSupabaseConfig(organizationId);
  
  if (!config.serviceKey) {
    throw new Error("Service key not configured for this Supabase instance");
  }
  
  // Create a new admin client (don't store for reuse to avoid accidental exposure)
  return createClient(config.url, config.serviceKey);
}

/**
 * Get a Supabase client based on organization ID
 * Will return an offline client if offline mode is enabled
 * @param organizationId Optional organization ID to use for configuration lookup
 * @returns A Supabase client or offline client
 */
export function getClient(organizationId?: string): SupabaseClient | OfflineClient {
  // In development with mock data enabled, return mock client
  if (useMockSupabase) {
    return createMockClient() as unknown as SupabaseClient;
  }

  // Check if offline mode is enabled and return appropriate client
  if (isOfflineDatabaseEnabled()) {
    return getOfflineClient();
  }
  
  return initSupabaseClient(organizationId);
}

/**
 * Interface for offline operations
 * Mimics a subset of Supabase client functionality
 */
export interface OfflineClient {
  from: (table: string) => OfflineTable;
}

/**
 * Interface for offline table operations
 * Mimics a subset of Supabase table functionality
 */
export interface OfflineTable {
  select: (columns?: string) => OfflineQuery;
  insert: (data: any | any[]) => Promise<{ data: any | null; error: Error | null }>;
  update: (data: any) => OfflineQuery;
  delete: () => OfflineQuery;
}

/**
 * Interface for offline query operations
 * Mimics a subset of Supabase query functionality
 */
export interface OfflineQuery {
  eq: (column: string, value: any) => OfflineQuery;
  neq: (column: string, value: any) => OfflineQuery;
  match: (query: Record<string, any>) => OfflineQuery;
  order: (column: string, options?: { ascending?: boolean }) => OfflineQuery;
  limit: (count: number) => OfflineQuery;
  single: () => Promise<{ data: any | null; error: Error | null }>;
  then: (callback: (response: { data: any | null; error: Error | null }) => void) => Promise<any>;
}

// Offline client singleton
let offlineClientInstance: OfflineClient | null = null;

/**
 * Get an offline database client
 * Uses IndexedDB for storage with a similar API to Supabase
 * @returns An offline client instance
 */
export function getOfflineClient(): OfflineClient {
  if (offlineClientInstance) {
    return offlineClientInstance;
  }
  
  const offlineClient: OfflineClient = {
    from: (table: string) => {
      // Create table functions
      const offlineTable: OfflineTable = {
        select: (columns = '*') => {
          const query: OfflineQuery & { 
            _table: string; 
            _columns: string; 
            _conditions: Array<{column: string; operator: string; value: any}>;
            _execute: () => Promise<{ data: any | null; error: Error | null }>;
          } = {
            _table: table,
            _columns: columns,
            _conditions: [],
            
            eq(column, value) {
              this._conditions.push({ column, operator: 'eq', value });
              return this;
            },
            
            neq(column, value) {
              this._conditions.push({ column, operator: 'neq', value });
              return this;
            },
            
            match(query) {
              Object.entries(query).forEach(([column, value]) => {
                this._conditions.push({ column, operator: 'eq', value });
              });
              return this;
            },
            
            order(column, _options = {}) {
              // Implement if needed
              return this;
            },
            
            limit(_count) {
              // Implement if needed
              return this;
            },
            
            async single() {
              try {
                const result = await this._execute();
                if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                  return { data: result.data[0], error: null };
                }
                return { data: null, error: null };
              } catch (error) {
                return { data: null, error: error as Error };
              }
            },
            
            then(callback) {
              return this._execute().then(callback);
            },
            
            async _execute() {
              return new Promise((resolve, reject) => {
                openDatabase().then(db => {
                  try {
                    const transaction = db.transaction([table], 'readonly');
                    const store = transaction.objectStore(table);
                    const request = store.getAll();
                    
                    request.onsuccess = () => {
                      let data = request.result;
                      
                      // Apply filters based on conditions
                      if (this._conditions.length > 0) {
                        data = data.filter(item => {
                          return this._conditions.every(condition => {
                            if (condition.operator === 'eq') {
                              return item[condition.column] === condition.value;
                            } else if (condition.operator === 'neq') {
                              return item[condition.column] !== condition.value;
                            }
                            return true;
                          });
                        });
                      }
                      
                      resolve({ data, error: null });
                    };
                    
                    request.onerror = () => {
                      reject({ data: null, error: new Error('Failed to read from offline database') });
                    };
                  } catch (error) {
                    reject({ data: null, error });
                  }
                }).catch(error => {
                  reject({ data: null, error });
                });
              });
            }
          };
          
          return query;
        },
        
        async insert(data) {
          return new Promise((resolve, reject) => {
            openDatabase().then(db => {
              try {
                const transaction = db.transaction([table], 'readwrite');
                const store = transaction.objectStore(table);
                
                // Handle arrays or single objects
                const items = Array.isArray(data) ? data : [data];
                
                // Add timestamp for sync operations
                const timestamp = new Date().toISOString();
                const itemsWithTimestamp = items.map(item => ({
                  ...item,
                  _created_at: timestamp,
                  _updated_at: timestamp,
                  _offline_created: true
                }));
                
                // Insert items
                let count = 0;
                itemsWithTimestamp.forEach(item => {
                  const request = store.add(item);
                  
                  request.onsuccess = () => {
                    count++;
                    if (count === items.length) {
                      resolve({ 
                        data: Array.isArray(data) ? itemsWithTimestamp : itemsWithTimestamp[0], 
                        error: null 
                      });
                    }
                  };
                  
                  request.onerror = (_event) => {
                    reject({ 
                      data: null, 
                      error: new Error('Failed to insert data to offline database') 
                    });
                  };
                });
              } catch (error) {
                reject({ data: null, error });
              }
            }).catch(error => {
              reject({ data: null, error });
            });
          });
        },
        
        update(data) {
          const query: OfflineQuery & { 
            _table: string; 
            _data: any;
            _conditions: Array<{column: string; operator: string; value: any}>;
            _execute: () => Promise<{ data: any | null; error: Error | null }>;
          } = {
            _table: table,
            _data: data,
            _conditions: [],
            
            eq(column, value) {
              this._conditions.push({ column, operator: 'eq', value });
              return this;
            },
            
            neq(column, value) {
              this._conditions.push({ column, operator: 'neq', value });
              return this;
            },
            
            match(query) {
              Object.entries(query).forEach(([column, value]) => {
                this._conditions.push({ column, operator: 'eq', value });
              });
              return this;
            },
            
            order(column, _options = {}) {
              // Not relevant for update
              return this;
            },
            
            limit(_count) {
              // Not relevant for update
              return this;
            },
            
            async single() {
              try {
                const result = await this._execute();
                if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                  return { data: result.data[0], error: null };
                }
                return { data: null, error: null };
              } catch (error) {
                return { data: null, error: error as Error };
              }
            },
            
            then(callback) {
              return this._execute().then(callback);
            },
            
            async _execute() {
              return new Promise((resolve, reject) => {
                openDatabase().then(db => {
                  try {
                    // First get all matching records
                    const readTransaction = db.transaction([table], 'readonly');
                    const readStore = readTransaction.objectStore(table);
                    const readRequest = readStore.getAll();
                    
                    readRequest.onsuccess = () => {
                      let records = readRequest.result;
                      
                      // Apply filters based on conditions
                      if (this._conditions.length > 0) {
                        records = records.filter(item => {
                          return this._conditions.every(condition => {
                            if (condition.operator === 'eq') {
                              return item[condition.column] === condition.value;
                            } else if (condition.operator === 'neq') {
                              return item[condition.column] !== condition.value;
                            }
                            return true;
                          });
                        });
                      }
                      
                      if (records.length === 0) {
                        resolve({ data: [], error: null });
                        return;
                      }
                      
                      // Now update the matching records
                      const writeTransaction = db.transaction([table], 'readwrite');
                      const writeStore = writeTransaction.objectStore(table);
                      
                      // Add update timestamp
                      const timestamp = new Date().toISOString();
                      const updatedRecords: any[] = [];
                      
                      let updateCount = 0;
                      records.forEach(record => {
                        const updatedRecord = { 
                          ...record,
                          ...this._data, 
                          _updated_at: timestamp,
                          _offline_updated: true 
                        };
                        
                        const updateRequest = writeStore.put(updatedRecord);
                        
                        updateRequest.onsuccess = () => {
                          updatedRecords.push(updatedRecord);
                          updateCount++;
                          
                          if (updateCount === records.length) {
                            resolve({ data: updatedRecords, error: null });
                          }
                        };
                        
                        updateRequest.onerror = () => {
                          reject({ 
                            data: null, 
                            error: new Error('Failed to update data in offline database') 
                          });
                        };
                      });
                    };
                    
                    readRequest.onerror = () => {
                      reject({ 
                        data: null, 
                        error: new Error('Failed to read from offline database') 
                      });
                    };
                  } catch (error) {
                    reject({ data: null, error });
                  }
                }).catch(error => {
                  reject({ data: null, error });
                });
              });
            }
          };
          
          return query;
        },
        
        delete() {
          const query: OfflineQuery & { 
            _table: string; 
            _conditions: Array<{column: string; operator: string; value: any}>;
            _execute: () => Promise<{ data: any | null; error: Error | null }>;
          } = {
            _table: table,
            _conditions: [],
            
            eq(column, value) {
              this._conditions.push({ column, operator: 'eq', value });
              return this;
            },
            
            neq(column, value) {
              this._conditions.push({ column, operator: 'neq', value });
              return this;
            },
            
            match(query) {
              Object.entries(query).forEach(([column, value]) => {
                this._conditions.push({ column, operator: 'eq', value });
              });
              return this;
            },
            
            order(column, _options = {}) {
              // Not relevant for delete
              return this;
            },
            
            limit(_count) {
              // Not relevant for delete
              return this;
            },
            
            async single() {
              try {
                const result = await this._execute();
                if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                  return { data: result.data[0], error: null };
                }
                return { data: null, error: null };
              } catch (error) {
                return { data: null, error: error as Error };
              }
            },
            
            then(callback) {
              return this._execute().then(callback);
            },
            
            async _execute() {
              return new Promise((resolve, reject) => {
                openDatabase().then(db => {
                  try {
                    // First get all matching records
                    const readTransaction = db.transaction([table], 'readonly');
                    const readStore = readTransaction.objectStore(table);
                    const readRequest = readStore.getAll();
                    
                    readRequest.onsuccess = () => {
                      let records = readRequest.result;
                      
                      // Apply filters based on conditions
                      if (this._conditions.length > 0) {
                        records = records.filter(item => {
                          return this._conditions.every(condition => {
                            if (condition.operator === 'eq') {
                              return item[condition.column] === condition.value;
                            } else if (condition.operator === 'neq') {
                              return item[condition.column] !== condition.value;
                            }
                            return true;
                          });
                        });
                      }
                      
                      if (records.length === 0) {
                        resolve({ data: [], error: null });
                        return;
                      }
                      
                      // Now delete the matching records
                      const writeTransaction = db.transaction([table], 'readwrite');
                      const writeStore = writeTransaction.objectStore(table);
                      
                      // Also store deletion metadata for sync
                      const deletionLog = writeTransaction.objectStore('_deletions');
                      const timestamp = new Date().toISOString();
                      
                      let deleteCount = 0;
                      records.forEach(record => {
                        // First log the deletion
                        if (record.id) {
                          const logEntry = {
                            table,
                            record_id: record.id,
                            deleted_at: timestamp
                          };
                          deletionLog.add(logEntry);
                        }
                        
                        // Then delete the record
                        const deleteRequest = writeStore.delete(record.id || `${table}_${Date.now()}`);
                        
                        deleteRequest.onsuccess = () => {
                          deleteCount++;
                          
                          if (deleteCount === records.length) {
                            resolve({ data: records, error: null });
                          }
                        };
                        
                        deleteRequest.onerror = () => {
                          reject({ 
                            data: null, 
                            error: new Error('Failed to delete data from offline database') 
                          });
                        };
                      });
                    };
                    
                    readRequest.onerror = () => {
                      reject({ 
                        data: null, 
                        error: new Error('Failed to read from offline database') 
                      });
                    };
                  } catch (error) {
                    reject({ data: null, error });
                  }
                }).catch(error => {
                  reject({ data: null, error });
                });
              });
            }
          };
          
          return query;
        }
      };
      
      return offlineTable;
    }
  };
  
  offlineClientInstance = offlineClient;
  return offlineClient;
}

/**
 * Open the IndexedDB database
 * @returns A promise resolving to the database instance
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Check if IndexedDB is available
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }
    
    // Get database configuration
    const _config = loadOfflineDatabaseConfig();
    
    // Open the database
    const request = window.indexedDB.open('planning_manager_offline_db', DB_VERSION);
    
    // Handle database upgrade
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create tables for our main data types
      const tableNames = [
        'projects', 
        'users', 
        'comments', 
        'spatial_features',
        'settings'
      ];
      
      // Create object stores for each table
      tableNames.forEach(tableName => {
        if (!db.objectStoreNames.contains(tableName)) {
          db.createObjectStore(tableName, { keyPath: 'id', autoIncrement: true });
        }
      });
      
      // Create a special store for tracking deletions (for sync)
      if (!db.objectStoreNames.contains('_deletions')) {
        db.createObjectStore('_deletions', { keyPath: 'id', autoIncrement: true });
      }
      
      // Create a store for sync metadata
      if (!db.objectStoreNames.contains('_sync_metadata')) {
        db.createObjectStore('_sync_metadata', { keyPath: 'key' });
      }
    };
    
    // Handle success
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    // Handle errors
    request.onerror = (_event) => {
      reject(new Error('Failed to open offline database'));
    };
  });
}

/**
 * Sync offline database with Supabase when online
 * This is called when the app detects it's back online
 * @param organizationId Optional organization ID for the Supabase config
 */
export async function syncOfflineData(organizationId?: string): Promise<{
  success: boolean;
  synced: number;
  errors: number;
}> {
  // Only run on client
  if (typeof window === 'undefined') {
    return { success: false, synced: 0, errors: 0 };
  }
  
  // Get offline database config
  const config = loadOfflineDatabaseConfig();
  if (!config.syncOnConnect) {
    return { success: false, synced: 0, errors: 0 };
  }
  
  try {
    // Get Supabase client for online operations
    const supabase = initSupabaseClient(organizationId);
    
    // Open the offline database
    const db = await openDatabase();
    
    // Initialize counters
    let syncedCount = 0;
    let errorCount = 0;
    
    // Get all offline modified records
    // For each table: read all _offline_created and _offline_updated records
    const tables = ['projects', 'users', 'comments', 'spatial_features'];
    
    for (const table of tables) {
      // Skip if the object store doesn't exist
      if (!db.objectStoreNames.contains(table)) {
        continue;
      }
      
      // Get all records with offline flags
      const transaction = db.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      const request = store.getAll();
      
      const records = await new Promise<any[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(`Failed to read ${table} from offline database`));
      });
      
      // Filter for offline records
      const offlineRecords = records.filter(
        record => record._offline_created || record._offline_updated
      );
      
      // Skip if no offline records
      if (offlineRecords.length === 0) {
        continue;
      }
      
      // Process each offline record
      for (const record of offlineRecords) {
        try {
          // Remove offline flags before uploading
          const { _offline_created, _offline_updated, ...cleanRecord } = record;
          
          // Determine if this is a new record or an update
          if (_offline_created) {
            // Insert the record
            const { data, error } = await supabase
              .from(table)
              .insert(cleanRecord)
              .select();
              
            if (error) {
              throw error;
            }
            
            // Update the local record to remove the offline flag
            if (data && data.length > 0) {
              const updateTx = db.transaction([table], 'readwrite');
              const updateStore = updateTx.objectStore(table);
              
              // Merge the server and local record
              const updatedRecord = {
                ...record,
                ...data[0],
                _offline_created: false,
                _offline_updated: false
              };
              
              await new Promise<void>((resolve, reject) => {
                const updateRequest = updateStore.put(updatedRecord);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(new Error('Failed to update local record'));
              });
              
              syncedCount++;
            }
          } else if (_offline_updated) {
            // Update the record
            const { data, error } = await supabase
              .from(table)
              .update(cleanRecord)
              .eq('id', record.id)
              .select();
              
            if (error) {
              throw error;
            }
            
            // Update the local record to remove the offline flag
            if (data && data.length > 0) {
              const updateTx = db.transaction([table], 'readwrite');
              const updateStore = updateTx.objectStore(table);
              
              // Merge the server and local record
              const updatedRecord = {
                ...record,
                ...data[0],
                _offline_updated: false
              };
              
              await new Promise<void>((resolve, reject) => {
                const updateRequest = updateStore.put(updatedRecord);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(new Error('Failed to update local record'));
              });
              
              syncedCount++;
            }
          }
        } catch (error) {
          console.error(`Error syncing ${table} record:`, error);
          errorCount++;
        }
      }
    }
    
    // Process deletions
    if (db.objectStoreNames.contains('_deletions')) {
      const deletionsTx = db.transaction(['_deletions'], 'readwrite');
      const deletionsStore = deletionsTx.objectStore('_deletions');
      const deletionsRequest = deletionsStore.getAll();
      
      const deletions = await new Promise<any[]>((resolve, reject) => {
        deletionsRequest.onsuccess = () => resolve(deletionsRequest.result);
        deletionsRequest.onerror = () => reject(new Error('Failed to read deletions from offline database'));
      });
      
      for (const deletion of deletions) {
        try {
          // Delete the record from the server
          const { error } = await supabase
            .from(deletion.table)
            .delete()
            .eq('id', deletion.record_id);
            
          if (error) {
            throw error;
          }
          
          // Remove the deletion log entry
          await new Promise<void>((resolve, reject) => {
            const deleteRequest = deletionsStore.delete(deletion.id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(new Error('Failed to remove deletion log entry'));
          });
          
          syncedCount++;
        } catch (error) {
          console.error('Error syncing deletion:', error);
          errorCount++;
        }
      }
    }
    
    // Update sync metadata
    const metadataTx = db.transaction(['_sync_metadata'], 'readwrite');
    const metadataStore = metadataTx.objectStore('_sync_metadata');
    await new Promise<void>((resolve, reject) => {
      const metadataRequest = metadataStore.put({
        key: 'last_sync',
        timestamp: new Date().toISOString(),
        synced: syncedCount,
        errors: errorCount
      });
      metadataRequest.onsuccess = () => resolve();
      metadataRequest.onerror = () => reject(new Error('Failed to update sync metadata'));
    });
    
    return { success: true, synced: syncedCount, errors: errorCount };
  } catch (error) {
    console.error('Error syncing offline data:', error);
    return { success: false, synced: 0, errors: 1 };
  }
} 