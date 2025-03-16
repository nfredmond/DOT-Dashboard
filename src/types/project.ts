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
  
  // Construction Project Specific Fields
  constructionBudget?: number; // Total construction cost
  rightOfWayBudget?: number; // Right of Way acquisition cost
  peAmount?: number; // Preliminary Engineering amount
  contingencyAmount?: number; // Contingency funds
  
  // Funding Sources Tracking
  detailedFundingSources?: DetailedFundingSource[];
  grantFunding?: GrantFunding[];
  
  // Invoice and Payment Tracking
  invoices?: ProjectInvoice[];
  contracts?: ProjectContract[];
  
  // Environmental Documentation
  environmentalDocumentation: EnvironmentalDocumentation;
  nepaStatus: EnvironmentalStatus;
  ceqaStatus: EnvironmentalStatus;
  environmentalDocumentType: EnvironmentalDocumentType;
  environmentalClearanceDate: string;
  
  // Project Phases and Deadlines
  phases: ProjectPhase[];
  milestones: ProjectMilestone[];
  
  // Construction Progress Tracking
  constructionProgress?: ConstructionProgress;
  
  // Construction Documents
  constructionDocuments?: ConstructionDocument[];
  
  // Scoring and Metrics
  scores: ProjectScores;
  benefits: ProjectBenefits;
  
  // GIS/Mapping
  coordinates: GeoCoordinates;
  boundingBox?: BoundingBox;
  geometry?: ProjectGeometry;
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
  organizationId: string;
  organizationName?: string;
  createdBy: string;
  updatedBy?: string;
  
  // Member Agency tracking
  parentOrgId?: string; // If this project belongs to a member agency, this links to the parent org
  isMemberAgencyProject?: boolean; // Flag to indicate this is a member agency project
  reportingData?: ReportingData[]; // Data reported to parent organization
  originalOrgId?: string; // Original organization ID that created the project
  sharedWithOrgs?: string[]; // IDs of organizations this project is shared with
  
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
  id: string;
  type: 'user' | 'organization';
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
  | "Highway" 
  | "Transit" 
  | "Bicycle" 
  | "Pedestrian" 
  | "Multimodal" 
  | "Safety" 
  | "Bridge" 
  | "Maintenance"
  | "ITS"
  | "Planning Study"
  | "Other"
  // New construction-specific categories
  | "Bridge Construction"
  | "Bridge Rehabilitation"
  | "Roadway Construction"
  | "Roadway Rehabilitation"
  | "Sidewalk Construction"
  | "Sidewalk Repair"
  | "Traffic Signal Installation"
  | "Infrastructure Improvement"
  | "Drainage System"
  | "Intersection Improvement";

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'on_hold';

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

export type ProjectVisibility = 'public' | 'private' | 'organization';

// GeoJSON types
export type GeoJSONType = 
  'Point' | 
  'LineString' | 
  'Polygon' | 
  'MultiPoint' | 
  'MultiLineString' | 
  'MultiPolygon' | 
  'GeometryCollection';

export type Coordinates = number[] | number[][] | number[][][] | number[][][][];

export interface ProjectGeometry {
  type: GeoJSONType;
  coordinates: Coordinates;
}

export interface GeospatialFile {
  id: string;
  name: string;
  originalName: string;
  fileType: 'kmz' | 'kml' | 'geojson' | 'shapefile';
  uploadedAt: string;
  uploadedBy: string;
  fileSize: number; // In bytes
  projectId: string;
  url: string;
  geometry?: ProjectGeometry; // Processed geometry from the file
}

// Define interface for reporting data to parent organizations
export interface ReportingData {
  id: string;
  fieldId: string; // References the customReportingField ID from parent organization
  fieldName: string;
  value: any;
  reportedAt: string;
  reportedBy: string;
  reportPeriod: string; // e.g., "Q1 2023", "March 2023"
  notes?: string;
}

export interface DetailedFundingSource {
  id: string;
  name: string;
  type: 'federal' | 'state' | 'local' | 'grant' | 'private' | 'other';
  amount: number;
  secured: boolean;
  fiscalYear?: string;
  description?: string;
  restrictions?: string;
  expirationDate?: string;
  contactInfo?: string;
  documents?: string[]; // References to document IDs
}

export interface GrantFunding {
  id: string;
  name: string;
  grantNumber: string;
  amount: number;
  amountSpent: number;
  agency: string;
  program?: string;
  applicationDate?: string;
  awardDate?: string;
  expirationDate?: string;
  matchRequirement?: number; // Percentage match required
  matchSource?: string;
  matchAmount?: number;
  documents?: string[]; // References to document IDs
  status: 'pending' | 'awarded' | 'denied' | 'closed';
}

export interface ProjectInvoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  date: string;
  dueDate?: string;
  description?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  paymentDate?: string;
  fundingSource?: string; // Which funding source this invoice is charged to
  category: 'construction' | 'design' | 'planning' | 'rightOfWay' | 'environmental' | 'other';
  documents?: string[]; // References to document IDs
}

export interface ProjectContract {
  id: string;
  name: string;
  contractor: string;
  contractNumber: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'completed' | 'terminated';
  description?: string;
  scope?: string;
  amendments?: ContractAmendment[];
  documents?: string[]; // References to document IDs
}

export interface ContractAmendment {
  id: string;
  number: number;
  description: string;
  amount: number; // Can be positive or negative
  approvalDate: string;
  newEndDate?: string;
}

export interface ConstructionProgress {
  overallCompletion: number; // Percentage 0-100
  currentPhase: string;
  startDate?: string;
  estimatedCompletionDate?: string;
  delayReason?: string;
  contractorNotes?: string;
  inspectionStatus?: string;
  lastUpdated: string;
  segments?: ConstructionSegment[];
}

export interface ConstructionSegment {
  id: string;
  name: string;
  description?: string;
  completion: number; // Percentage 0-100
  startDate?: string;
  endDate?: string;
  contractor?: string;
  issues?: string[];
}

export interface ConstructionDocument {
  id: string;
  name: string;
  description?: string;
  documentType: 'blueprint' | 'permit' | 'specification' | 'contract' | 'change_order' | 
                'inspection_report' | 'progress_photo' | 'safety_document' | 
                'meeting_minutes' | 'submittal' | 'rfi' | 'invoice' | 'other';
  phase?: string;
  url: string;
  fileSize?: number;
  contentType?: string;
  isApproved: boolean;
  approvalDate?: string;
  approvedBy?: string;
  version?: string;
  revisionNumber: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const createNewProject = (): Partial<Project> => {
  const baseProject: Partial<Project> = {
    name: '',
    description: '',
    location: '',
    category: 'Highway',
    status: 'draft',
    priority: 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 year from now
    estimatedCost: 0,
    allocatedBudget: 0,
    pseBudget: 0,
    ceBudget: 0,
    constructionBudget: 0,
    rightOfWayBudget: 0,
    peAmount: 0,
    contingencyAmount: 0,
    environmentalDocumentation: {
      leadAgency: '',
    },
    nepaStatus: 'Not Started',
    ceqaStatus: 'Not Started',
    environmentalDocumentType: 'Not Required',
    environmentalClearanceDate: '',
    phases: [],
    milestones: [],
    constructionProgress: {
      overallCompletion: 0,
      currentPhase: 'Not Started',
      lastUpdated: new Date().toISOString(),
    },
    constructionDocuments: [],
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
    geometry: undefined,
    mapType: 'default',
    leadAgency: '',
    partners: [],
    fundingSources: [],
    detailedFundingSources: [],
    grantFunding: [],
    invoices: [],
    contracts: [],
    tags: [],
    attachments: [],
    isPublic: false,
    accessControl: [],
    organizationId: '',
    createdBy: '',
    isMemberAgencyProject: false,
    reportingData: [],
  };
  
  return baseProject;
}; 