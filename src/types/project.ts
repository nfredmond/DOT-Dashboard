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
  scoreData?: ProjectScores;
  analysisResults?: AnalysisResultsMap;
  scenarios?: ScenarioAnalysis[];
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
  environmental: number;
  economic: number;
  feasibility: number;
  overall: number;
  lastUpdated?: string;
  method?: 'ai' | 'manual' | 'hybrid';
  // Additional custom scoring categories can be added per client requirements
  [key: string]: number | string | undefined;
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
  | "Intersection Improvement"
  | "Road";

// Project Status Types
export type ProjectStatus = 
  | "Planning" 
  | "Design" 
  | "Environmental" 
  | "RightOfWay" 
  | "Construction" 
  | "Complete" 
  | "Cancelled" 
  | "On Hold" 
  | "Not Started";

// Project Priority Types
export type ProjectPriority = 
  | "High" 
  | "Medium" 
  | "Low" 
  | "Critical";

// Project Phase Name
export type ProjectPhaseName = 
  | "Planning" 
  | "Preliminary Engineering" 
  | "Environmental" 
  | "Design" 
  | "Right of Way" 
  | "PS&E" 
  | "Construction" 
  | "Close-out";

// Environmental Types
export type EnvironmentalStatus = 
  | "Not Started" 
  | "In Progress" 
  | "Complete" 
  | "Not Required" 
  | "Exempt";

export type EnvironmentalDocumentType = 
  | "None" 
  | "CE" 
  | "CE/CE" 
  | "EA" 
  | "EIR" 
  | "EIS" 
  | "FONSI" 
  | "Other";

// Construction Types
export interface ConstructionProgress {
  percentComplete: number;
  startDate: string;
  estimatedEndDate: string;
  actualEndDate?: string;
  currentPhase: string;
  delays?: string[];
  notes?: string;
}

export interface ConstructionDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
}

// Geometry Types
export interface ProjectGeometry {
  type: string;
  coordinates: any[];
  properties?: Record<string, any>;
}

// Analysis Types
export interface AnalysisResultsMap {
  [key: string]: any;
}

export interface ScenarioAnalysis {
  id: string;
  name: string;
  description: string;
  timeline?: string;
  cost?: number;
  benefits?: string[];
  drawbacks?: string[];
  feasibility?: number;
  createdAt?: string;
  updatedBy?: string;
}

// Reporting Types
export interface ReportingData {
  id: string;
  reportDate: string;
  reportType: string;
  data: Record<string, any>;
  submittedBy: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  fieldId?: string;
  fieldName?: string;
  value?: any;
  reportPeriod?: string;
  reportedAt?: string;
  reportedBy?: string;
  notes?: string;
}

// Funding Source Types
export interface DetailedFundingSource {
  id: string;
  name: string;
  type: string;
  amount: number;
  fiscal_year: string;
  secured: boolean;
  agency: string;
  dateApplied?: string;
  dateAwarded?: string;
  notes?: string;
}

export interface GrantFunding {
  id: string;
  grantName: string;
  grantingAgency: string;
  amount: number;
  applicationDate: string;
  awardDate?: string;
  expirationDate?: string;
  status: "Applied" | "Awarded" | "Denied" | "Expired";
  matchRequired?: number;
  matchSource?: string;
  notes?: string;
}

// Invoice and Contract Types
export interface ProjectInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  vendor: string;
  description: string;
  status: "Pending" | "Paid" | "Rejected";
  paymentDate?: string;
  phaseId?: string;
}

export interface ProjectContract {
  id: string;
  contractNumber: string;
  title: string;
  contractor: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: "Draft" | "Executed" | "Complete" | "Terminated";
  description?: string;
  attachmentIds?: string[];
}

/**
 * Creates a new empty project with default values
 * @returns A partial project object with sensible defaults
 */
export function createNewProject(): Partial<Project> {
  return {
    name: "",
    description: "",
    status: "Planning" as ProjectStatus,
    category: "Other" as ProjectCategory,
    phases: [],
    leadAgency: "",
    partners: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0], // One year from now
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedCost: 0,
    allocatedBudget: 0,
    fundingSources: [],
    coordinates: { latitude: 0, longitude: 0 },
    mapType: "streets",
    location: "",
    isPublic: false,
    tags: [],
    attachments: [],
    milestones: [],
    priority: "Medium" as ProjectPriority,
    accessControl: [],
    environmentalDocumentation: {
      leadAgency: ""
    },
    nepaStatus: "Not Started" as EnvironmentalStatus,
    ceqaStatus: "Not Started" as EnvironmentalStatus,
    environmentalDocumentType: "None" as EnvironmentalDocumentType,
    environmentalClearanceDate: "",
    pseBudget: 0,
    ceBudget: 0,
    scores: {
      safety: 0,
      equity: 0,
      climate: 0,
      congestion: 0,
      costEffectiveness: 0,
      multimodal: 0,
      environmental: 0,
      economic: 0,
      feasibility: 0,
      overall: 0
    },
    benefits: {
      vmtReduction: 0,
      ghgReduction: 0,
      jobsCreated: 0,
      safetyImprovement: 0,
      congestionReduction: 0,
      benefitCostRatio: 0,
      economicBenefitEstimate: 0,
      improvedAccessibility: 0
    }
  };
}