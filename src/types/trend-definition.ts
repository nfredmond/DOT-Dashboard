export default interface TrendDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters?: Record<string, any>;
  impacts?: Record<string, any>;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
} 