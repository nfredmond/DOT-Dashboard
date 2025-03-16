// Remove reference to auth which doesn't exist
// import { User } from './auth';

// Measure status options
export type MeasureStatus = 'draft' | 'active' | 'completed' | 'renewed' | 'expired';

// Reporting frequency options
export type ReportingFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

// Organization role within a measure
export type MeasureOrgRole = 'owner' | 'administrator' | 'reporter' | 'member';

// Report status options
export type MeasureReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'revision_requested';

// Main Measure interface
export interface Measure {
  id: string;
  name: string;
  code: string; // e.g., "Measure A", "Prop 1"
  description: string;
  organizationId: string;
  organizationName?: string;
  parentMeasureId?: string;
  parentMeasureName?: string;
  startDate?: string;
  endDate?: string;
  status: MeasureStatus;
  fundingAmount?: number;
  fundingCurrency?: string;
  reportingFrequency?: ReportingFrequency;
  reportingRequirements?: string;
  metadata?: Record<string, any>;
  customReportingFields?: MeasureReportingField[];
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  // Associations (populated separately)
  projectCount?: number;
  organizationCount?: number;
  linkedMeasures?: LinkedMeasure[];
}

// Linked measure (continuation or related measure)
export interface LinkedMeasure {
  id: string;
  name: string;
  code: string;
  relationshipType: 'parent' | 'child' | 'continuation' | 'related';
  startDate?: string;
  endDate?: string;
  status: MeasureStatus;
}

// Custom reporting field for a measure
export interface MeasureReportingField {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'file';
  required: boolean;
  options?: string[]; // For select fields
  unit?: string; // For number fields (e.g., "miles", "dollars")
  subOrganizationSpecific?: boolean; // Whether this field is collected from sub-organizations
}

// Association between a measure and a project
export interface MeasureProject {
  id: string;
  measureId: string;
  measureName?: string;
  measureCode?: string;
  projectId: string;
  projectName?: string;
  fundingAmount?: number;
  reportingData?: MeasureProjectReportingData[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Data reported for a project under a measure
export interface MeasureProjectReportingData {
  fieldId: string;
  fieldName: string;
  value: any;
  reportedAt: string;
  reportedBy: string;
  reportPeriod: string;
  notes?: string;
}

// Association between a measure and an organization
export interface MeasureOrganization {
  id: string;
  measureId: string;
  measureName?: string;
  measureCode?: string;
  organizationId: string;
  organizationName?: string;
  role: MeasureOrgRole;
  permissions: {
    canEdit?: boolean;
    canAddProjects?: boolean;
    canReport?: boolean;
    canApproveReports?: boolean;
    canManageOrganizations?: boolean;
  };
  createdAt: string;
}

// Periodic report for a measure
export interface MeasureReport {
  id: string;
  measureId: string;
  measureName?: string;
  measureCode?: string;
  organizationId: string;
  organizationName?: string;
  reportingPeriod: string; // e.g., "Q1 2023", "2023-03"
  submissionDate: string;
  status: MeasureReportStatus;
  reportData: Record<string, any>;
  notes?: string;
  submittedBy: string;
  submittedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  createdAt: string;
  updatedAt: string;
  // Populated separately
  projectReports?: MeasureReportProject[];
}

// Project-specific reporting for a measure report
export interface MeasureReportProject {
  id: string;
  reportingId: string;
  projectId: string;
  projectName?: string;
  expenditureAmount?: number;
  expenditureDescription?: string;
  status?: string;
  progressPercentage?: number;
  milestonesCompleted?: MeasureMilestone[];
  reportingData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Milestone for measure reporting
export interface MeasureMilestone {
  id: string;
  name: string;
  description?: string;
  date: string;
  completed: boolean;
}

// Helper function to create a new measure
export const createNewMeasure = (organizationId: string, createdBy: string): Partial<Measure> => {
  return {
    name: '',
    code: '',
    description: '',
    organizationId,
    status: 'draft',
    fundingCurrency: 'USD',
    reportingFrequency: 'quarterly',
    createdBy,
    customReportingFields: [],
  };
};

// Helper function to create a new measure report
export const createNewMeasureReport = (
  measureId: string, 
  organizationId: string, 
  submittedBy: string,
  reportingPeriod: string
): Partial<MeasureReport> => {
  return {
    measureId,
    organizationId,
    reportingPeriod,
    status: 'draft',
    reportData: {},
    submittedBy,
    submissionDate: new Date().toISOString(),
  };
}; 