-- Benefit Cost Analysis Tables

-- Monetization parameters
CREATE TABLE IF NOT EXISTS benefit_cost_parameters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  value FLOAT NOT NULL,
  unit TEXT NOT NULL,
  description TEXT,
  source TEXT,
  year_valid INTEGER,
  adjustment_factor FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Benefit cost analysis templates
CREATE TABLE IF NOT EXISTS benefit_cost_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parameters JSONB NOT NULL,
  benefit_categories TEXT[] NOT NULL,
  cost_categories TEXT[] NOT NULL,
  default_analysis_horizon INTEGER NOT NULL DEFAULT 20,
  default_discount_rate FLOAT NOT NULL DEFAULT 0.07,
  methodologies TEXT[] NOT NULL,
  sensitivity_defaults JSONB,
  distributional_defaults JSONB,
  grant_program JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Main benefit cost analyses table
CREATE TABLE IF NOT EXISTS benefit_cost_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Core analysis parameters
  discount_rate FLOAT NOT NULL DEFAULT 0.07,
  base_year INTEGER NOT NULL,
  analysis_horizon INTEGER NOT NULL DEFAULT 20,
  
  -- Results by method
  net_present_value FLOAT DEFAULT 0,
  benefit_cost_ratio FLOAT DEFAULT 0,
  internal_rate_of_return FLOAT,
  payback_period FLOAT,
  
  -- Detailed calculations
  benefits JSONB NOT NULL DEFAULT '[]',
  costs JSONB NOT NULL DEFAULT '[]',
  
  -- Annual streams
  annual_benefits JSONB NOT NULL DEFAULT '[]',
  annual_costs JSONB NOT NULL DEFAULT '[]',
  
  -- Monetization parameters used
  parameters JSONB NOT NULL,
  
  -- Risk and sensitivity analysis
  sensitivity_analysis JSONB,
  monte_carlo_simulation JSONB,
  distributional_analysis JSONB,
  
  -- Flags and metadata
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft',
  methodology TEXT,
  assumptions JSONB DEFAULT '[]',
  limitations JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for storing Monte Carlo simulation detailed results
CREATE TABLE IF NOT EXISTS monte_carlo_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES benefit_cost_analyses(id) ON DELETE CASCADE,
  iteration INTEGER NOT NULL,
  input_parameters JSONB NOT NULL,
  output_results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for tracking shared and exported analyses
CREATE TABLE IF NOT EXISTS benefit_cost_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES benefit_cost_analyses(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL, -- 'pdf', 'excel', 'grant'
  file_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security Policies

-- Benefit cost parameters: organization admins can manage, others can read
ALTER TABLE benefit_cost_parameters ENABLE ROW LEVEL SECURITY;

CREATE POLICY benefit_cost_parameters_select ON benefit_cost_parameters
  FOR SELECT USING (
    (auth.uid() IN (SELECT user_id FROM organization_members WHERE organization_id = benefit_cost_parameters.organization_id)) OR
    benefit_cost_parameters.organization_id IS NULL
  );

CREATE POLICY benefit_cost_parameters_insert ON benefit_cost_parameters
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = benefit_cost_parameters.organization_id 
      AND role = 'admin'
    )
  );

CREATE POLICY benefit_cost_parameters_update ON benefit_cost_parameters
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = benefit_cost_parameters.organization_id 
      AND role = 'admin'
    )
  );

CREATE POLICY benefit_cost_parameters_delete ON benefit_cost_parameters
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = benefit_cost_parameters.organization_id 
      AND role = 'admin'
    )
  );

-- Benefit cost templates
ALTER TABLE benefit_cost_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY benefit_cost_templates_select ON benefit_cost_templates
  FOR SELECT USING (
    (auth.uid() IN (SELECT user_id FROM organization_members WHERE organization_id = benefit_cost_templates.organization_id)) OR
    benefit_cost_templates.organization_id IS NULL
  );

CREATE POLICY benefit_cost_templates_insert ON benefit_cost_templates
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = benefit_cost_templates.organization_id 
      AND role = 'admin'
    )
  );

CREATE POLICY benefit_cost_templates_update ON benefit_cost_templates
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = benefit_cost_templates.organization_id 
      AND role = 'admin'
    )
  );

CREATE POLICY benefit_cost_templates_delete ON benefit_cost_templates
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = benefit_cost_templates.organization_id 
      AND role = 'admin'
    )
  );

-- Benefit cost analyses
ALTER TABLE benefit_cost_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY benefit_cost_analyses_select ON benefit_cost_analyses
  FOR SELECT USING (
    -- Public analyses can be viewed by anyone in the organization
    (is_public AND auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = (
        SELECT organization_id FROM projects WHERE id = benefit_cost_analyses.project_id
      )
    )) OR
    -- Created by user or user is admin
    (auth.uid() = created_by OR auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = (
        SELECT organization_id FROM projects WHERE id = benefit_cost_analyses.project_id
      ) AND role = 'admin'
    ))
  );

CREATE POLICY benefit_cost_analyses_insert ON benefit_cost_analyses
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = (
        SELECT organization_id FROM projects WHERE id = benefit_cost_analyses.project_id
      )
    )
  );

CREATE POLICY benefit_cost_analyses_update ON benefit_cost_analyses
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = (
        SELECT organization_id FROM projects WHERE id = benefit_cost_analyses.project_id
      ) AND role = 'admin'
    )
  );

CREATE POLICY benefit_cost_analyses_delete ON benefit_cost_analyses
  FOR DELETE USING (
    auth.uid() = created_by OR 
    auth.uid() IN (
      SELECT user_id FROM organization_members 
      WHERE organization_id = (
        SELECT organization_id FROM projects WHERE id = benefit_cost_analyses.project_id
      ) AND role = 'admin'
    )
  );

-- Monte Carlo results
ALTER TABLE monte_carlo_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY monte_carlo_results_select ON monte_carlo_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM benefit_cost_analyses
      WHERE id = monte_carlo_results.analysis_id
      AND (
        (is_public AND auth.uid() IN (
          SELECT user_id FROM organization_members 
          WHERE organization_id = (
            SELECT organization_id FROM projects WHERE id = benefit_cost_analyses.project_id
          )
        )) OR
        auth.uid() = created_by OR 
        auth.uid() IN (
          SELECT user_id FROM organization_members 
          WHERE organization_id = (
            SELECT organization_id FROM projects WHERE id = benefit_cost_analyses.project_id
          ) AND role = 'admin'
        )
      )
    )
  );

-- Benefit cost exports
ALTER TABLE benefit_cost_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY benefit_cost_exports_select ON benefit_cost_exports
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM benefit_cost_analyses
      WHERE id = benefit_cost_exports.analysis_id
      AND (
        auth.uid() = created_by OR 
        auth.uid() IN (
          SELECT user_id FROM organization_members 
          WHERE organization_id = (
            SELECT organization_id FROM projects WHERE id = benefit_cost_analyses.project_id
          ) AND role = 'admin'
        )
      )
    )
  ); 