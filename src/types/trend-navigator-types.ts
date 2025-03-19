export interface ScenarioDefinition {
  id?: string;
  name: string;
  description?: string;
  baseYear: number;
  horizonYears: number[];
  assumptions?: Record<string, any>[];
  policyPackages?: Record<string, any>[];
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  organizationId?: string;
  userId?: string;
} 