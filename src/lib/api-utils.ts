import { NextApiRequest, NextApiResponse } from 'next';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type RouteHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
type RouteHandlers = Partial<Record<HttpMethod, RouteHandler>>;

/**
 * Creates a unified route handler for Next.js API routes
 * that handles different HTTP methods with appropriate handlers
 */
export function createRouteHandler(handlers: RouteHandlers) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const method = req.method as HttpMethod;
    
    // Check if handler exists for this method
    if (!method || !handlers[method]) {
      return res.status(405).json({ error: `Method ${method || 'unknown'} Not Allowed` });
    }
    
    try {
      // Execute the appropriate handler
      await handlers[method]!(req, res);
    } catch (error) {
      console.error(`Error in ${method} handler:`, error);
      
      // Send a generic error response if no response has been sent yet
      if (!res.writableEnded) {
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
      }
    }
  };
}

/**
 * Validates required query parameters
 */
export function validateQueryParams(
  req: NextApiRequest, 
  res: NextApiResponse, 
  requiredParams: string[]
): boolean {
  const missingParams = requiredParams.filter(param => !req.query[param]);
  
  if (missingParams.length > 0) {
    res.status(400).json({ 
      error: 'Missing required parameters',
      missingParams
    });
    return false;
  }
  
  return true;
}

/**
 * Validates required body parameters
 */
export function validateBodyParams(
  req: NextApiRequest, 
  res: NextApiResponse, 
  requiredParams: string[]
): boolean {
  const body = req.body || {};
  const missingParams = requiredParams.filter(param => body[param] === undefined);
  
  if (missingParams.length > 0) {
    res.status(400).json({ 
      error: 'Missing required body parameters',
      missingParams
    });
    return false;
  }
  
  return true;
} 