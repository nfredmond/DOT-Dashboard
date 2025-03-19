export interface PolicyPackage {
  id: string;
  name: string;
  description?: string;
  policies: Record<string, any>[];
  impacts?: Record<string, any>;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
} 