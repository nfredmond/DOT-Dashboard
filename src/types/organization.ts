export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  logoUrl?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  adminIds: string[]; // IDs of users who are admins for this organization
  memberIds: string[]; // IDs of regular members
  settings?: OrganizationSettings;
  
  // Hierarchy support
  parentId?: string; // ID of parent organization if this is a member agency
  parentName?: string; // Name of parent organization (for display purposes)
  memberAgencyIds?: string[]; // IDs of member agencies under this organization
  isParent?: boolean; // Whether this organization can have member agencies
  tier?: number; // Hierarchical level (0 for top-level, 1 for first-level member agencies, etc.)
}

export interface OrganizationSettings {
  defaultMapCenter?: [number, number];
  defaultMapZoom?: number;
  projectCategories?: string[];
  projectStatuses?: string[];
  customFields?: Record<string, any>[];
  projectApprovalRequired?: boolean;
  publicProjectsEnabled?: boolean;
  allowMemberAgencyCreation?: boolean; // Whether users can create new member agencies under this org
  inheritParentSettings?: boolean; // Whether member agencies inherit settings from parent
  customReportingFields?: ReportingField[]; // Fields that member agencies need to report on
}

export interface ReportingField {
  id: string;
  name: string;
  description?: string;
  type: 'number' | 'text' | 'date' | 'boolean' | 'select';
  required: boolean;
  options?: string[]; // For select type
  unit?: string; // For number type (e.g., "feet", "miles", "dollars")
  frequency?: 'monthly' | 'quarterly' | 'annually'; // How often this needs to be reported
}

export type UserRole = 'global_admin' | 'org_admin' | 'org_member' | 'public';

export interface OrganizationMember {
  userId: string;
  organizationId: string;
  role: UserRole;
  joinedAt: string;
  invitedBy?: string; // User ID who invited this member
  permissions?: string[]; // Specific permissions if needed
}

export interface OrganizationInvite {
  id: string;
  email: string;
  organizationId: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
}

// Helper function to create a new organization
export const createNewOrganization = (): Partial<Organization> => {
  return {
    name: '',
    description: '',
    adminIds: [],
    memberIds: [],
    settings: {
      defaultMapCenter: [39.8283, -98.5795], // Center of US
      defaultMapZoom: 4,
      projectApprovalRequired: false,
      publicProjectsEnabled: false,
      allowMemberAgencyCreation: false,
      inheritParentSettings: true,
    },
    isParent: false,
    memberAgencyIds: [],
    tier: 0,
  };
}; 