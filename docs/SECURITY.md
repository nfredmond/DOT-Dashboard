# Security Documentation

This document outlines the security measures, best practices, and protocols implemented in the Planning Manager application to ensure data protection, user privacy, and system integrity.

## Security Architecture

### 1. Authentication

The application uses Supabase Authentication for secure user management.

```typescript
// Authentication configuration
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
};

// Protected route wrapper
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading]);

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? children : null;
};
```

#### Key Features
- Email/password authentication
- OAuth providers (Google, GitHub)
- JWT token management
- Session persistence
- Password reset flow
- Email verification
- MFA support

### 2. Authorization

Row Level Security (RLS) policies in Supabase ensure data access control.

```sql
-- Example RLS policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Read policy
CREATE POLICY "Users can read their own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

-- Write policy
CREATE POLICY "Users can modify their own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Organization-level access
CREATE POLICY "Users can access organization projects"
ON projects FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM organization_members 
    WHERE organization_id = projects.organization_id
  )
);
```

#### Access Levels
1. **Public Access**
   - Landing page
   - Public documentation
   - Registration

2. **User Access**
   - Personal projects
   - User profile
   - Basic features

3. **Organization Access**
   - Team projects
   - Shared resources
   - Collaboration features

4. **Admin Access**
   - User management
   - System settings
   - Analytics

### 3. Data Protection

#### Encryption

```typescript
// Data encryption utilities
export const encryption = {
  // At-rest encryption
  encryptData: async (data: any): Promise<string> => {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(JSON.stringify(data))
    );
    
    return btoa(JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    }));
  },
  
  // Decryption
  decryptData: async (encrypted: string): Promise<any> => {
    const key = await getEncryptionKey();
    const { iv, data } = JSON.parse(atob(encrypted));
    const decoder = new TextDecoder();
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    
    return JSON.parse(decoder.decode(decrypted));
  }
};
```

#### Data Classification
1. **Public Data**
   - Project names
   - Public descriptions
   - General statistics

2. **Sensitive Data**
   - User information
   - Project details
   - Location data

3. **Critical Data**
   - Authentication credentials
   - API keys
   - Financial information

### 4. API Security

```typescript
// API middleware configuration
export const apiSecurity = {
  // Rate limiting
  rateLimit: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }),
  
  // Request validation
  validateRequest: (schema: Schema) => (
    req: NextApiRequest,
    res: NextApiResponse,
    next: NextFunction
  ) => {
    try {
      schema.validateSync(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  // CORS configuration
  cors: cors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
};
```

#### Security Headers

```typescript
// Security headers middleware
export const securityHeaders = {
  'Content-Security-Policy': contentSecurityPolicy,
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

## Security Measures

### 1. Input Validation

```typescript
// Input validation utilities
export const validation = {
  // XSS prevention
  sanitizeInput: (input: string): string => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
      ALLOWED_ATTR: ['href']
    });
  },
  
  // SQL injection prevention
  validateQuery: (query: string): boolean => {
    const sqlInjectionPattern = /('|"|;|--|\/\*|\*\/|xp_)/i;
    return !sqlInjectionPattern.test(query);
  }
};
```

### 2. Error Handling

```typescript
// Secure error handling
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error securely
  logger.error('Error occurred', {
    error: {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    request: {
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers)
    }
  });

  // Return safe error response
  res.status(500).json({
    error: 'An error occurred',
    requestId: req.id
  });
};
```

### 3. Session Management

```typescript
// Session configuration
export const sessionConfig = {
  name: 'sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'session:'
  })
};
```

### 4. File Upload Security

```typescript
// File upload configuration
export const uploadConfig = {
  // File validation
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type'));
      return;
    }
    
    cb(null, true);
  },
  
  // Size limits
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  
  // Storage configuration
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix);
    }
  })
};
```

## Security Monitoring

### 1. Logging

```typescript
// Security logging configuration
export const securityLogger = {
  // Audit logging
  audit: (event: AuditEvent) => {
    logger.info('Security audit', {
      timestamp: new Date().toISOString(),
      event: {
        type: event.type,
        user: event.user,
        action: event.action,
        resource: event.resource,
        status: event.status
      }
    });
  },
  
  // Alert logging
  alert: (severity: 'low' | 'medium' | 'high', event: SecurityEvent) => {
    logger.warn('Security alert', {
      severity,
      timestamp: new Date().toISOString(),
      event: {
        type: event.type,
        source: event.source,
        details: event.details
      }
    });
  }
};
```

### 2. Monitoring

```typescript
// Security monitoring setup
export const securityMonitoring = {
  // Failed login attempts
  trackLoginAttempts: async (userId: string) => {
    const key = `login_attempts:${userId}`;
    const attempts = await redis.incr(key);
    await redis.expire(key, 15 * 60); // 15 minutes
    
    if (attempts > 5) {
      await lockAccount(userId);
      securityLogger.alert('medium', {
        type: 'excessive_login_attempts',
        source: userId
      });
    }
  },
  
  // Suspicious activity detection
  detectSuspiciousActivity: async (event: ActivityEvent) => {
    const isSupicious = await analyzeActivity(event);
    
    if (isSupicious) {
      securityLogger.alert('high', {
        type: 'suspicious_activity',
        source: event.userId,
        details: event
      });
    }
  }
};
```

## Incident Response

### 1. Response Plan

1. **Detection**
   - Automated monitoring
   - User reports
   - System alerts

2. **Analysis**
   - Impact assessment
   - Scope determination
   - Root cause analysis

3. **Containment**
   - Account suspension
   - API rate limiting
   - Access restriction

4. **Recovery**
   - Data restoration
   - System hardening
   - Security patch deployment

### 2. Communication Plan

```typescript
// Incident communication
export const incidentCommunication = {
  // User notification
  notifyUsers: async (incident: SecurityIncident) => {
    const affectedUsers = await getAffectedUsers(incident);
    
    await Promise.all(affectedUsers.map(user => 
      sendSecurityNotification(user, {
        type: incident.type,
        impact: incident.impact,
        actions: incident.recommendedActions
      })
    ));
  },
  
  // Team notification
  notifySecurityTeam: async (incident: SecurityIncident) => {
    await Promise.all([
      slackAlert(incident),
      emailSecurityTeam(incident),
      createIncidentTicket(incident)
    ]);
  }
};
```

## Compliance

### 1. Data Privacy

```typescript
// Privacy compliance utilities
export const privacyCompliance = {
  // GDPR data export
  exportUserData: async (userId: string): Promise<UserDataExport> => {
    const userData = await getUserData(userId);
    
    return {
      personalData: userData.profile,
      projectData: userData.projects,
      activityLog: userData.activities,
      exportDate: new Date().toISOString()
    };
  },
  
  // Data deletion
  deleteUserData: async (userId: string): Promise<void> => {
    await Promise.all([
      deleteUserProfile(userId),
      deleteUserProjects(userId),
      deleteUserActivities(userId)
    ]);
  }
};
```

### 2. Audit Trail

```typescript
// Audit trail configuration
export const auditTrail = {
  // Activity logging
  logActivity: async (activity: UserActivity) => {
    await db.activities.create({
      userId: activity.userId,
      action: activity.action,
      resource: activity.resource,
      timestamp: new Date(),
      metadata: activity.metadata
    });
  },
  
  // Audit report generation
  generateAuditReport: async (
    startDate: Date,
    endDate: Date
  ): Promise<AuditReport> => {
    const activities = await db.activities.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: true,
        resource: true
      }
    });
    
    return generateReport(activities);
  }
};
```

## Security Updates

### 1. Dependency Management

```typescript
// Dependency security configuration
export const dependencyManagement = {
  // Vulnerability scanning
  checkVulnerabilities: async () => {
    const { stdout } = await exec('npm audit');
    const vulnerabilities = parseAuditOutput(stdout);
    
    if (vulnerabilities.high.length > 0) {
      securityLogger.alert('high', {
        type: 'vulnerable_dependencies',
        details: vulnerabilities
      });
    }
  },
  
  // Automatic updates
  updateDependencies: async () => {
    await exec('npm update');
    await exec('npm audit fix');
  }
};
```

### 2. Security Patches

```typescript
// Security patch management
export const patchManagement = {
  // System updates
  applySecurityPatches: async () => {
    const patches = await getSecurityPatches();
    
    for (const patch of patches) {
      try {
        await applyPatch(patch);
        await verifyPatch(patch);
        
        securityLogger.audit({
          type: 'security_patch',
          status: 'success',
          details: patch
        });
      } catch (error) {
        securityLogger.alert('high', {
          type: 'patch_failure',
          details: error
        });
      }
    }
  }
};
```

## Best Practices

1. **Password Security**
   - Minimum length: 12 characters
   - Complexity requirements
   - Regular password rotation
   - Secure password reset

2. **Access Control**
   - Principle of least privilege
   - Regular access review
   - Role-based access control
   - Session management

3. **Data Security**
   - Encryption at rest
   - Encryption in transit
   - Regular backups
   - Secure data disposal

4. **Code Security**
   - Code review process
   - Security testing
   - Dependency management
   - Secure deployment

## Future Improvements

1. **Enhanced Security**
   - Hardware security keys
   - Biometric authentication
   - Zero trust architecture
   - Blockchain integration

2. **Monitoring Improvements**
   - AI-powered threat detection
   - Real-time monitoring
   - Automated response
   - Predictive analytics

3. **Compliance Expansion**
   - Additional certifications
   - Regional compliance
   - Industry standards
   - Security frameworks 