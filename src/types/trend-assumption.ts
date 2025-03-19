export interface TrendAssumption {
  id: string;
  name: string;
  description?: string;
  trendId: string;
  parameters: Record<string, any>;
  impacts?: Record<string, any>;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
} 