/**
 * Mock Supabase Client Implementation
 * 
 * This provides a mock implementation of the Supabase client for development and testing
 * purposes when a real Supabase instance is not available.
 */

import { mockProjects } from './mock-data';

// Define the types to match Supabase interface
export interface MockSupabaseClient {
  from: (table: string) => MockTable;
  auth: MockAuth;
}

interface MockTable {
  select: (columns?: string) => MockQuery;
  insert: (data: any) => MockMutation;
  update: (data: any) => MockQuery;
  delete: () => MockQuery;
}

interface MockQuery {
  eq: (column: string, value: any) => MockQuery;
  neq: (column: string, value: any) => MockQuery;
  match: (query: Record<string, any>) => MockQuery;
  order: (column: string, options?: { ascending?: boolean }) => MockQuery;
  limit: (count: number) => MockQuery;
  single: () => Promise<MockResponse>;
  then: (callback: (response: MockResponse) => void) => Promise<any>;
}

interface MockMutation {
  select: (columns?: string) => MockQuery;
  then: (callback: (response: MockResponse) => void) => Promise<any>;
}

interface MockResponse {
  data: any;
  error: Error | null;
}

interface MockAuth {
  signIn: (params: any) => Promise<MockResponse>;
  signOut: () => Promise<MockResponse>;
  signUp: (params: any) => Promise<MockResponse>;
  user: () => any;
  session: () => any;
  onAuthStateChange: (callback: (event: string, session: any) => void) => { data: { subscription: { unsubscribe: () => void } } };
}

// Database tables
const tables = {
  projects: mockProjects,
  users: [
    { id: '1', email: 'admin@example.com', role: 'admin', name: 'Admin User' },
    { id: '2', email: 'user@example.com', role: 'user', name: 'Regular User' }
  ],
  organizations: [
    { id: '1', name: 'Example Organization' },
    { id: '2', name: 'Partner Agency' }
  ]
};

/**
 * Creates a mock Supabase client for development and testing
 */
export function createMockClient(): MockSupabaseClient {
  return {
    from: (table: string): MockTable => {
      return {
        select: (columns?: string) => {
          return {
            eq: (column: string, value: any) => mockQuery(table, [{ column, value, op: 'eq' }]),
            neq: (column: string, value: any) => mockQuery(table, [{ column, value, op: 'neq' }]),
            match: (query: Record<string, any>) => {
              const conditions = Object.entries(query).map(([column, value]) => ({
                column, value, op: 'eq' as const
              }));
              return mockQuery(table, conditions);
            },
            order: (column: string, options?: { ascending?: boolean }) => {
              return mockQuery(table, [], { orderBy: column, ascending: options?.ascending });
            },
            limit: (count: number) => {
              return mockQuery(table, [], { limit: count });
            },
            single: () => {
              const data = tables[table as keyof typeof tables] || [];
              return Promise.resolve({
                data: data.length > 0 ? data[0] : null,
                error: null
              });
            },
            then: (callback) => {
              const data = tables[table as keyof typeof tables] || [];
              return Promise.resolve(callback({
                data,
                error: null
              }));
            }
          };
        },
        insert: (data: any) => {
          return {
            select: (columns?: string) => mockQuery(table),
            then: (callback) => {
              // In a real implementation, this would add to the table
              return Promise.resolve(callback({
                data,
                error: null
              }));
            }
          };
        },
        update: (data: any) => {
          return mockQuery(table);
        },
        delete: () => {
          return mockQuery(table);
        }
      };
    },
    auth: {
      signIn: async () => ({ data: { user: tables.users[0], session: {} }, error: null }),
      signOut: async () => ({ data: null, error: null }),
      signUp: async () => ({ data: { user: {}, session: null }, error: null }),
      user: () => tables.users[0],
      session: () => ({}),
      onAuthStateChange: (callback) => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  };
}

// Helper function to create a query object
function mockQuery(
  table: string, 
  conditions: Array<{ column: string, value: any, op: 'eq' | 'neq' }> = [],
  options: { orderBy?: string, ascending?: boolean, limit?: number } = {}
): MockQuery {
  return {
    eq: (column: string, value: any) => {
      return mockQuery(table, [...conditions, { column, value, op: 'eq' }], options);
    },
    neq: (column: string, value: any) => {
      return mockQuery(table, [...conditions, { column, value, op: 'neq' }], options);
    },
    match: (query: Record<string, any>) => {
      const conditions = Object.entries(query).map(([column, value]) => ({
        column, value, op: 'eq' as const
      }));
      return mockQuery(table, conditions);
    },
    order: (column: string, orderOptions?: { ascending?: boolean }) => {
      return mockQuery(table, conditions, { 
        ...options, 
        orderBy: column, 
        ascending: orderOptions?.ascending ?? true 
      });
    },
    limit: (count: number) => {
      return mockQuery(table, conditions, { ...options, limit: count });
    },
    single: async () => {
      const tableData = tables[table as keyof typeof tables] || [];
      
      // Apply all conditions
      let filteredData = tableData.filter((item) => {
        return conditions.every(({ column, value, op }) => {
          if (op === 'eq') return item[column] === value;
          if (op === 'neq') return item[column] !== value;
          return true;
        });
      });

      // Apply ordering if specified
      if (options.orderBy) {
        filteredData = filteredData.sort((a, b) => {
          if (options.ascending) {
            return a[options.orderBy!] > b[options.orderBy!] ? 1 : -1;
          } else {
            return a[options.orderBy!] < b[options.orderBy!] ? 1 : -1;
          }
        });
      }

      // Apply limit if specified
      if (options.limit) {
        filteredData = filteredData.slice(0, options.limit);
      }

      return {
        data: filteredData.length > 0 ? filteredData[0] : null,
        error: null
      };
    },
    then: async (callback: (response: MockResponse) => void) => {
      const tableData = tables[table as keyof typeof tables] || [];
      
      // Apply all conditions
      let filteredData = tableData.filter((item) => {
        return conditions.every(({ column, value, op }) => {
          if (op === 'eq') return item[column] === value;
          if (op === 'neq') return item[column] !== value;
          return true;
        });
      });

      // Apply ordering if specified
      if (options.orderBy) {
        filteredData = filteredData.sort((a, b) => {
          if (options.ascending) {
            return a[options.orderBy!] > b[options.orderBy!] ? 1 : -1;
          } else {
            return a[options.orderBy!] < b[options.orderBy!] ? 1 : -1;
          }
        });
      }

      // Apply limit if specified
      if (options.limit) {
        filteredData = filteredData.slice(0, options.limit);
      }

      callback({ data: filteredData, error: null });
      return filteredData;
    }
  };
} 