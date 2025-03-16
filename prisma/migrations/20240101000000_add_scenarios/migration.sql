-- Add scenario-related fields to Project table
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "scoreData" JSONB;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "analysisResults" JSONB;

-- CreateTable for ProjectScenario
CREATE TABLE IF NOT EXISTS "ProjectScenario" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "benefits" TEXT[],
    "drawbacks" TEXT[],
    "feasibility" DOUBLE PRECISION NOT NULL,
    "impact" JSONB,
    "analysis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "parentScenarioId" TEXT,

    CONSTRAINT "ProjectScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable for ScenarioComparison
CREATE TABLE IF NOT EXISTS "ScenarioComparison" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scenario1Id" TEXT NOT NULL,
    "scenario2Id" TEXT NOT NULL,
    "comparison" TEXT NOT NULL,
    "recommendation" TEXT,
    "scores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "ScenarioComparison_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "ProjectScenario" ADD CONSTRAINT "ProjectScenario_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectScenario" ADD CONSTRAINT "ProjectScenario_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectScenario" ADD CONSTRAINT "ProjectScenario_parentScenarioId_fkey" FOREIGN KEY ("parentScenarioId") REFERENCES "ProjectScenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ScenarioComparison" ADD CONSTRAINT "ScenarioComparison_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScenarioComparison" ADD CONSTRAINT "ScenarioComparison_scenario1Id_fkey" FOREIGN KEY ("scenario1Id") REFERENCES "ProjectScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScenarioComparison" ADD CONSTRAINT "ScenarioComparison_scenario2Id_fkey" FOREIGN KEY ("scenario2Id") REFERENCES "ProjectScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScenarioComparison" ADD CONSTRAINT "ScenarioComparison_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; 