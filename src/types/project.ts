export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  
  // Dates
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate: string;
  
  // Funding and Budget
  estimatedCost: number;
  allocatedBudget: number;
  pseBudget: number; // Plans, Specifications & Estimates budget
  ceBudget: number; // Construction Engineering budget
  
  // Environmental Documentation
  environmentalDocumentation: EnvironmentalDocumentation;
  nepaStatus: EnvironmentalStatus;
  ceqaStatus: EnvironmentalStatus;
  environmentalDocumentType: EnvironmentalDocumentType;
  environmentalClearanceDate: string;
  
  // Project Phases and Deadlines
  phases: ProjectPhase[];
  milestones: ProjectMilestone[];
  
  // Scoring and Metrics
  scores: ProjectScores;
  benefits: ProjectBenefits;
  
  // GIS/Mapping
  coordinates: GeoCoordinates;
  boundingBox?: BoundingBox;
  geojson?: any;
  
  // Additional Metadata
  mapType: string;
  leadAgency: string;
  partners: string[];
  fundingSources: FundingSource[];
  tags: string[];
  attachments: Attachment[];
  
  // Settings
  isPublic: boolean;
  accessControl: AccessControl[];
  
  // Organization
  organizationId?: string;
  organizationName?: string;
  
  // New properties
  isReviewCompleted?: boolean;
  
  // Prioritization properties
  type?: string;
  metadata?: Record<string, any>;
  scenarioAnalysis?: Record<string, any>;
  grantAlignments?: any[];
  rank?: number;
  totalScore?: number;
  categoryScores?: Record<string, number>;
  weightedScores?: any[];
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  northEast: GeoCoordinates;
  southWest: GeoCoordinates;
}

export interface AccessControl {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface FundingSource {
  id: string;
  name: string;
  amount: number;
  secured: boolean;
  description?: string;
}

export interface ProjectPhase {
  id: string;
  name: ProjectPhaseName;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  completionPercentage: number;
  description?: string;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  dueDate: string;
  completed: boolean;
  description?: string;
  phaseId?: string; // Reference to which phase this milestone belongs to
}

export interface ProjectScores {
  safety: number;
  equity: number;
  climate: number;
  congestion: number;
  costEffectiveness: number;
  multimodal: number;
  // Additional custom scoring categories can be added per client requirements
  [key: string]: number;
}

export interface ProjectBenefits {
  vmtReduction: number; // Vehicle Miles Traveled reduction
  ghgReduction: number; // Greenhouse Gas emissions reduction (metric tons)
  jobsCreated: number;
  safetyImprovement: number; // Percentage improvement in safety
  congestionReduction: number; // Percentage reduction in congestion
  
  // Economic Benefits
  benefitCostRatio: number;
  economicBenefitEstimate: number;
  
  // Accessibility Benefits
  improvedAccessibility: number; // Number of people with improved access
  
  // Custom Benefits
  [key: string]: number;
}

export interface EnvironmentalDocumentation {
  nepaDocumentNumber?: string;
  ceqaDocumentNumber?: string;
  leadAgency: string;
  consultingAgencies?: string[];
  documentationComments?: string;
}

export type ProjectCategory = 
  | 'Transit' 
  | 'Highway' 
  | 'Pedestrian' 
  | 'Bicycle' 
  | 'Multimodal'
  | 'Bridge'
  | 'Safety'
  | 'Operational'
  | 'Technology'
  | 'Planning'
  | 'Other';

export type ProjectStatus =
  | 'Planned'
  | 'Approved'
  | 'In Progress'
  | 'On Hold'
  | 'Delayed'
  | 'Completed'
  | 'Cancelled';

export type ProjectPriority =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

export type EnvironmentalStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Exempt'
  | 'Completed'
  | 'Not Required';

export type EnvironmentalDocumentType =
  | 'Categorical Exclusion'
  | 'FONSI'
  | 'EIS'
  | 'EIR'
  | 'Negative Declaration'
  | 'Mitigated Negative Declaration'
  | 'Statutory Exemption'
  | 'Categorical Exemption'
  | 'Not Required'
  | 'Other';

export type ProjectPhaseName =
  | 'Planning'
  | 'Preliminary Engineering'
  | 'Environmental Documentation'
  | 'Design' 
  | 'Right of Way'
  | 'PS&E'
  | 'Construction'
  | 'Project Closeout';

// Template for creating a new project with default values
export const createNewProject = (): Partial<Project> => {
  return {
    name: '',
    description: '',
    location: '',
    category: 'Transit',
    status: 'Planned',
    priority: 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 year from now
    estimatedCost: 0,
    allocatedBudget: 0,
    pseBudget: 0,
    ceBudget: 0,
    environmentalDocumentation: {
      leadAgency: '',
    },
    nepaStatus: 'Not Started',
    ceqaStatus: 'Not Started',
    environmentalDocumentType: 'Not Required',
    environmentalClearanceDate: '',
    phases: [],
    milestones: [],
    scores: {
      safety: 0,
      equity: 0,
      climate: 0,
      congestion: 0,
      costEffectiveness: 0,
      multimodal: 0,
    },
    benefits: {
      vmtReduction: 0,
      ghgReduction: 0,
      jobsCreated: 0,
      safetyImprovement: 0,
      congestionReduction: 0,
      benefitCostRatio: 0,
      economicBenefitEstimate: 0,
      improvedAccessibility: 0,
    },
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    mapType: 'default',
    leadAgency: '',
    partners: [],
    fundingSources: [],
    tags: [],
    attachments: [],
    isPublic: false,
    accessControl: [],
    organizationId: '',
    organizationName: '',
  };
}; 