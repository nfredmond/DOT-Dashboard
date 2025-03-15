import { createClient } from '@/utils/supabase/client';
import { getEnvVariable } from "./env-service";
import { LLMProvider, ModelType, ResponseFormat, getCompletion } from './llm-service';

// Types
export interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  category: string;
  type: 'numeric' | 'boolean' | 'enum';
  isActive: boolean;
  formulaType?: 'linear' | 'stepped' | 'threshold' | 'custom';
  formula?: string;
  dataSource?: string;
  metricUnit?: string;
  customPrompt?: string;
  agencyId: string;
}

export interface Score {
  id: string;
  projectId: string;
  criterionId: string;
  score: number;
  notes: string;
  createdBy: string;
  createdAt: string;
  criterionName?: string;
  criterionWeight?: number;
}

export interface ScoringTemplate {
  id: string;
  name: string;
  description: string;
  projectTypes: string[];
  isDefault: boolean;
  criteria: string[]; // Array of criteria IDs
  agencyId: string;
}

export interface WeightedScore {
  criterionId: string;
  criterionName: string;
  rawScore: number;
  weight: number;
  weightedScore: number;
  category: string;
  notes?: string;
}

export interface ProjectScoreSummary {
  projectId: string;
  totalScore: number;
  categoryScores: Record<string, number>;
  weightedScores: WeightedScore[];
}

// Add new interfaces for prioritization
export interface PrioritizationScenario {
  id: string;
  name: string;
  description: string;
  criteriaWeights: Record<string, number>;
  filterSettings: Record<string, any>;
  agencyId: string;
  createdBy: string;
  createdAt: string;
}

export interface PrioritizationResult {
  scenarioId: string;
  projectId: string;
  rank: number;
  normalizedScore: number;
  categoryScores: Record<string, number>;
  metadata: Record<string, any>;
}

export interface GrantAlignment {
  projectId: string;
  grantId: string;
  grantName?: string;
  alignmentScore: number;
  criteriaMatches: Record<string, number>;
  recommendations: string[];
}

// Default criteria - for initial setup
export const DefaultCriteria: Omit<Criterion, 'id' | 'agencyId'>[] = [
  {
    name: 'Safety',
    description: 'Improves safety for all road users and reduces accidents',
    weight: 20,
    category: 'transportation',
    type: 'numeric',
    isActive: true,
    formulaType: 'linear',
    metricUnit: 'Estimated accident reduction per year'
  },
  {
    name: 'Equity',
    description: 'Provides benefits to disadvantaged communities',
    weight: 15,
    category: 'social',
    type: 'numeric',
    isActive: true,
    formulaType: 'linear',
    metricUnit: 'Percentage of benefits to disadvantaged communities'
  },
  {
    name: 'Climate Impact',
    description: 'Reduces greenhouse gas emissions and supports climate goals',
    weight: 15,
    category: 'environmental',
    type: 'numeric',
    isActive: true,
    formulaType: 'linear',
    metricUnit: 'Metric tons CO2e reduced per year'
  },
  {
    name: 'Congestion Relief',
    description: 'Reduces traffic congestion and improves travel times',
    weight: 20,
    category: 'transportation',
    type: 'numeric',
    isActive: true,
    formulaType: 'linear',
    metricUnit: 'Vehicle hours of delay reduced per day'
  },
  {
    name: 'Cost Effectiveness',
    description: 'Provides good value for the investment',
    weight: 15,
    category: 'economic',
    type: 'numeric',
    isActive: true,
    formulaType: 'linear',
    metricUnit: 'Benefit-cost ratio'
  },
  {
    name: 'Multimodal',
    description: 'Supports multiple transportation modes',
    weight: 15,
    category: 'transportation',
    type: 'numeric',
    isActive: true,
    formulaType: 'linear',
    metricUnit: 'Number of modes served'
  }
];

/**
 * Get all criteria for an agency
 */
export async function getCriteria(agencyId: string): Promise<Criterion[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('criteria')
    .select('*')
    .eq('agency_id', agencyId)
    .order('name');
  
  if (error) {
    console.error('Error fetching criteria:', error);
    throw error;
  }
  
  // Transform from snake_case to camelCase
  return data.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    weight: item.weight * 100, // Convert 0-1 to 0-100
    category: item.category,
    type: item.type,
    isActive: item.is_active,
    formulaType: item.metadata?.formula_type || 'linear',
    formula: item.metadata?.formula,
    dataSource: item.metadata?.data_source,
    metricUnit: item.metadata?.metric_unit,
    customPrompt: item.metadata?.custom_prompt,
    agencyId: item.agency_id
  }));
}

/**
 * Create a new criterion
 */
export async function createCriterion(criterion: Omit<Criterion, 'id'>): Promise<Criterion> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('criteria')
    .insert({
      name: criterion.name,
      description: criterion.description,
      weight: criterion.weight / 100, // Convert 0-100 to 0-1
      category: criterion.category,
      type: criterion.type,
      is_active: criterion.isActive,
      agency_id: criterion.agencyId,
      metadata: {
        formula_type: criterion.formulaType || 'linear',
        formula: criterion.formula,
        data_source: criterion.dataSource,
        metric_unit: criterion.metricUnit,
        custom_prompt: criterion.customPrompt
      }
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating criterion:', error);
    throw error;
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    weight: data.weight * 100, // Convert 0-1 to 0-100
    category: data.category,
    type: data.type,
    isActive: data.is_active,
    formulaType: data.metadata?.formula_type || 'linear',
    formula: data.metadata?.formula,
    dataSource: data.metadata?.data_source,
    metricUnit: data.metadata?.metric_unit,
    customPrompt: data.metadata?.custom_prompt,
    agencyId: data.agency_id
  };
}

/**
 * Update an existing criterion
 */
export async function updateCriterion(criterion: Criterion): Promise<Criterion> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('criteria')
    .update({
      name: criterion.name,
      description: criterion.description,
      weight: criterion.weight / 100, // Convert 0-100 to 0-1
      category: criterion.category,
      type: criterion.type,
      is_active: criterion.isActive,
      metadata: {
        formula_type: criterion.formulaType || 'linear',
        formula: criterion.formula,
        data_source: criterion.dataSource,
        metric_unit: criterion.metricUnit,
        custom_prompt: criterion.customPrompt
      }
    })
    .eq('id', criterion.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating criterion:', error);
    throw error;
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    weight: data.weight * 100, // Convert 0-1 to 0-100
    category: data.category,
    type: data.type,
    isActive: data.is_active,
    formulaType: data.metadata?.formula_type || 'linear',
    formula: data.metadata?.formula,
    dataSource: data.metadata?.data_source,
    metricUnit: data.metadata?.metric_unit,
    customPrompt: data.metadata?.custom_prompt,
    agencyId: data.agency_id
  };
}

/**
 * Delete a criterion
 */
export async function deleteCriterion(criterionId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('criteria')
    .delete()
    .eq('id', criterionId);
  
  if (error) {
    console.error('Error deleting criterion:', error);
    throw error;
  }
}

/**
 * Get all scores for a project
 */
export async function getProjectScores(projectId: string): Promise<Score[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('scoring')
    .select(`
      *,
      criteria:criteria_id(name, weight)
    `)
    .eq('project_id', projectId);
  
  if (error) {
    console.error('Error fetching scores:', error);
    throw error;
  }
  
  return data.map(item => ({
    id: item.id,
    projectId: item.project_id,
    criterionId: item.criteria_id,
    score: item.score,
    notes: item.notes || '',
    createdBy: item.created_by,
    createdAt: item.created_at,
    criterionName: item.criteria?.name,
    criterionWeight: item.criteria?.weight * 100 // Convert 0-1 to 0-100
  }));
}

/**
 * Create or update a score
 */
export async function saveScore(
  projectId: string, 
  criterionId: string, 
  score: number, 
  notes: string,
  userId: string
): Promise<Score> {
  const supabase = createClient();
  
  // First check if a score already exists for this project/criterion
  const { data: existingScores } = await supabase
    .from('scoring')
    .select('id')
    .eq('project_id', projectId)
    .eq('criteria_id', criterionId)
    .limit(1);
  
  let result;
  
  if (existingScores && existingScores.length > 0) {
    // Update existing score
    const { data, error } = await supabase
      .from('scoring')
      .update({
        score: score,
        notes: notes
      })
      .eq('id', existingScores[0].id)
      .select(`
        *,
        criteria:criteria_id(name, weight)
      `)
      .single();
    
    if (error) {
      console.error('Error updating score:', error);
      throw error;
    }
    
    result = data;
  } else {
    // Create new score
    const { data, error } = await supabase
      .from('scoring')
      .insert({
        project_id: projectId,
        criteria_id: criterionId,
        score: score,
        notes: notes,
        created_by: userId
      })
      .select(`
        *,
        criteria:criteria_id(name, weight)
      `)
      .single();
    
    if (error) {
      console.error('Error creating score:', error);
      throw error;
    }
    
    result = data;
  }
  
  return {
    id: result.id,
    projectId: result.project_id,
    criterionId: result.criteria_id,
    score: result.score,
    notes: result.notes || '',
    createdBy: result.created_by,
    createdAt: result.created_at,
    criterionName: result.criteria?.name,
    criterionWeight: result.criteria?.weight * 100 // Convert 0-1 to 0-100
  };
}

/**
 * Calculate the overall score for a project
 */
export async function calculateProjectScore(projectId: string): Promise<ProjectScoreSummary> {
  const scores = await getProjectScores(projectId);
  
  if (!scores || scores.length === 0) {
    return {
      projectId,
      totalScore: 0,
      categoryScores: {},
      weightedScores: []
    };
  }
  
  // Get all criteria to access category information
  const supabase = createClient();
  const { data: criteriaData, error } = await supabase
    .from('criteria')
    .select('*')
    .in('id', scores.map(s => s.criterionId));
  
  if (error) {
    console.error('Error fetching criteria for scoring:', error);
    throw error;
  }
  
  const criteria = criteriaData.map(c => ({
    id: c.id,
    name: c.name,
    weight: c.weight * 100, // Convert 0-1 to 0-100
    category: c.category
  }));
  
  let totalWeight = 0;
  let weightedTotal = 0;
  const categoryScores: Record<string, { total: number, weight: number }> = {};
  const weightedScores: WeightedScore[] = [];
  
  // Calculate weighted scores
  scores.forEach(score => {
    const criterion = criteria.find(c => c.id === score.criterionId);
    if (!criterion) return;
    
    const weight = criterion.weight / 100; // Convert back to 0-1 for calculation
    const weightedScore = score.score * weight;
    
    totalWeight += weight;
    weightedTotal += weightedScore;
    
    // Add to category totals
    if (!categoryScores[criterion.category]) {
      categoryScores[criterion.category] = { total: 0, weight: 0 };
    }
    categoryScores[criterion.category].total += weightedScore;
    categoryScores[criterion.category].weight += weight;
    
    // Add to weighted scores list
    weightedScores.push({
      criterionId: score.criterionId,
      criterionName: criterion.name,
      rawScore: score.score,
      weight: criterion.weight,
      weightedScore: weightedScore * 100, // Normalize to percentage
      category: criterion.category,
      notes: score.notes
    });
  });
  
  // Normalize the total score
  const normalizedTotal = totalWeight > 0 ? (weightedTotal / totalWeight) * 100 : 0;
  
  // Normalize category scores
  const normalizedCategoryScores: Record<string, number> = {};
  Object.entries(categoryScores).forEach(([category, data]) => {
    normalizedCategoryScores[category] = data.weight > 0 
      ? (data.total / data.weight) * 100 
      : 0;
  });
  
  return {
    projectId,
    totalScore: Math.round(normalizedTotal),
    categoryScores: normalizedCategoryScores,
    weightedScores: weightedScores.sort((a, b) => b.weight - a.weight)
  };
}

/**
 * Use AI to assist with scoring
 */
export async function getAIScoringAssistance(
  projectId: string,
  criterionId: string,
  projectDetails: any,
  criterionDetails: any
): Promise<{ suggestedScore: number; justification: string }> {
  try {
    const prompt = `
You are a transportation planning expert tasked with objectively scoring a project against a specific criterion.

PROJECT DETAILS:
${JSON.stringify(projectDetails, null, 2)}

SCORING CRITERION:
${JSON.stringify(criterionDetails, null, 2)}

Please analyze how well this project meets this criterion on a scale of 0-100, where:
0-20: Poor - Project has significant deficiencies in this area
21-40: Below Average - Project has some deficiencies in this area
41-60: Average - Project adequately addresses this criterion
61-80: Good - Project performs well in this criterion
81-100: Excellent - Project excels in this criterion

Provide:
1. A suggested numerical score (0-100)
2. A detailed justification for the score (3-5 sentences)

Format your response as valid JSON with two fields:
{
  "suggestedScore": [number between 0-100],
  "justification": "[your detailed justification]"
}
`;

    const response = await getCompletion(prompt, {
      provider: LLMProvider.OPENAI,
      modelType: ModelType.POWERFUL,
      temperature: 0.7,
      responseFormat: ResponseFormat.TEXT
    });

    try {
      const parsedResponse = JSON.parse(response);
      return {
        suggestedScore: parsedResponse.suggestedScore,
        justification: parsedResponse.justification
      };
    } catch (e) {
      console.error('Error parsing AI response:', e);
      return {
        suggestedScore: 50,
        justification: "Unable to generate AI scoring assistance. Please score manually."
      };
    }
  } catch (error) {
    console.error('Error getting AI scoring assistance:', error);
    return {
      suggestedScore: 50,
      justification: "Unable to generate AI scoring assistance. Please score manually."
    };
  }
}

/**
 * Get all scoring templates for an agency
 */
export async function getScoringTemplates(agencyId: string): Promise<ScoringTemplate[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('scoring_templates')
    .select(`
      *,
      scoring_template_criteria(criteria_id, weight)
    `)
    .eq('agency_id', agencyId);
  
  if (error) {
    console.error('Error fetching scoring templates:', error);
    throw error;
  }
  
  return data.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    projectTypes: item.metadata?.project_types || [],
    isDefault: item.is_default,
    criteria: item.scoring_template_criteria?.map((stc: any) => stc.criteria_id) || [],
    agencyId: item.agency_id
  }));
}

/**
 * Create a new scoring template
 */
export async function createScoringTemplate(
  template: Omit<ScoringTemplate, 'id'>,
  criteriaWeights: Record<string, number>,
  userId: string
): Promise<ScoringTemplate> {
  const supabase = createClient();
  
  // Create the template record
  const { data: templateData, error: templateError } = await supabase
    .from('scoring_templates')
    .insert({
      name: template.name,
      description: template.description,
      is_default: template.isDefault,
      metadata: {
        project_types: template.projectTypes
      },
      agency_id: template.agencyId,
      created_by: userId
    })
    .select()
    .single();
  
  if (templateError) {
    console.error('Error creating scoring template:', templateError);
    throw templateError;
  }
  
  // Add criteria associations
  const criteriaEntries = Object.entries(criteriaWeights);
  if (criteriaEntries.length > 0) {
    const templateCriteria = criteriaEntries.map(([criteriaId, weight]) => ({
      template_id: templateData.id,
      criteria_id: criteriaId,
      weight: weight / 100 // Convert from 0-100 to 0-1
    }));
    
    const { error: criteriaError } = await supabase
      .from('scoring_template_criteria')
      .insert(templateCriteria);
    
    if (criteriaError) {
      console.error('Error adding criteria to template:', criteriaError);
      
      // Clean up the template if criteria insertion fails
      await supabase.from('scoring_templates').delete().eq('id', templateData.id);
      
      throw criteriaError;
    }
  }
  
  return {
    id: templateData.id,
    name: templateData.name,
    description: templateData.description || '',
    projectTypes: templateData.metadata?.project_types || [],
    isDefault: templateData.is_default,
    criteria: Object.keys(criteriaWeights),
    agencyId: templateData.agency_id
  };
}

/**
 * Update an existing scoring template
 */
export async function updateScoringTemplate(
  templateId: string,
  templateUpdate: Partial<ScoringTemplate>,
  criteriaWeights?: Record<string, number>
): Promise<ScoringTemplate> {
  const supabase = createClient();
  
  // Update template record
  const updateData: any = {};
  if (templateUpdate.name) updateData.name = templateUpdate.name;
  if (templateUpdate.description !== undefined) updateData.description = templateUpdate.description;
  if (templateUpdate.isDefault !== undefined) updateData.is_default = templateUpdate.isDefault;
  if (templateUpdate.projectTypes) {
    updateData.metadata = {
      project_types: templateUpdate.projectTypes
    };
  }
  
  const { data: templateData, error: templateError } = await supabase
    .from('scoring_templates')
    .update(updateData)
    .eq('id', templateId)
    .select()
    .single();
  
  if (templateError) {
    console.error('Error updating scoring template:', templateError);
    throw templateError;
  }
  
  // Update criteria if provided
  if (criteriaWeights) {
    // First delete existing criteria associations
    const { error: deleteError } = await supabase
      .from('scoring_template_criteria')
      .delete()
      .eq('template_id', templateId);
    
    if (deleteError) {
      console.error('Error removing criteria from template:', deleteError);
      throw deleteError;
    }
    
    // Add new criteria associations
    const criteriaEntries = Object.entries(criteriaWeights);
    if (criteriaEntries.length > 0) {
      const templateCriteria = criteriaEntries.map(([criteriaId, weight]) => ({
        template_id: templateId,
        criteria_id: criteriaId,
        weight: weight / 100 // Convert from 0-100 to 0-1
      }));
      
      const { error: criteriaError } = await supabase
        .from('scoring_template_criteria')
        .insert(templateCriteria);
      
      if (criteriaError) {
        console.error('Error adding criteria to template:', criteriaError);
        throw criteriaError;
      }
    }
  }
  
  // Get criteria IDs
  const { data: criteriaData, error: criteriaFetchError } = await supabase
    .from('scoring_template_criteria')
    .select('criteria_id')
    .eq('template_id', templateId);
  
  if (criteriaFetchError) {
    console.error('Error fetching template criteria:', criteriaFetchError);
    throw criteriaFetchError;
  }
  
  return {
    id: templateData.id,
    name: templateData.name,
    description: templateData.description || '',
    projectTypes: templateData.metadata?.project_types || [],
    isDefault: templateData.is_default,
    criteria: criteriaData.map((item: any) => item.criteria_id),
    agencyId: templateData.agency_id
  };
}

/**
 * Apply a scoring template to a project
 */
export async function applyTemplateToProject(
  projectId: string, 
  templateId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient();
  
  // Get template with criteria
  const { data: templateData, error: templateError } = await supabase
    .from('scoring_templates')
    .select(`
      *,
      scoring_template_criteria(criteria_id, weight)
    `)
    .eq('id', templateId)
    .single();
  
  if (templateError) {
    console.error('Error fetching template for application:', templateError);
    throw templateError;
  }
  
  if (!templateData.scoring_template_criteria || templateData.scoring_template_criteria.length === 0) {
    console.error('Template has no criteria');
    return false;
  }
  
  // Get existing scores for this project
  const { data: existingScores, error: scoresError } = await supabase
    .from('scoring')
    .select('criteria_id')
    .eq('project_id', projectId);
  
  if (scoresError) {
    console.error('Error fetching existing scores:', scoresError);
    throw scoresError;
  }
  
  const existingCriteriaIds = new Set(existingScores.map((score: any) => score.criteria_id));
  
  // Create new scores for criteria in the template that don't already have scores
  const newScores = templateData.scoring_template_criteria
    .filter((stc: any) => !existingCriteriaIds.has(stc.criteria_id))
    .map((stc: any) => ({
      project_id: projectId,
      criteria_id: stc.criteria_id,
      score: 50, // Default starting score
      notes: 'Added from template',
      created_by: userId
    }));
  
  if (newScores.length > 0) {
    const { error: insertError } = await supabase
      .from('scoring')
      .insert(newScores);
    
    if (insertError) {
      console.error('Error applying template scores:', insertError);
      throw insertError;
    }
  }
  
  return true;
}

/**
 * Run a prioritization scenario
 */
export async function runPrioritizationScenario(
  scenarioId: string
): Promise<PrioritizationResult[]> {
  try {
    // Fetch the scenario
    const supabase = createClient();
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('prioritization_scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();
      
    if (scenarioError) {
      console.error('Error fetching scenario:', scenarioError);
      return [];
    }
    
    // Fetch all projects with scores
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*');
      
    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return [];
    }
    
    // Get scores for all projects
    const results: PrioritizationResult[] = [];
    const criteriaWeights = scenarioData.criteria_weights || {};
    
    // Calculate scores for each project
    for (const project of projectsData) {
      // Get project scores
      const { data: scoresData, error: scoresError } = await supabase
        .from('scoring')
        .select('*, criteria:criteria_id(*)')
        .eq('project_id', project.id);
        
      if (scoresError) {
        console.error(`Error fetching scores for project ${project.id}:`, scoresError);
        continue;
      }
      
      // Calculate weighted scores based on scenario weights
      let totalWeightedScore = 0;
      let totalWeightApplied = 0;
      const categoryScores: Record<string, { total: number, weight: number }> = {};
      
      for (const scoreRecord of scoresData) {
        const criterionId = scoreRecord.criteria_id;
        const criterionWeight = criteriaWeights[criterionId] || 0;
        const rawScore = scoreRecord.score;
        const category = scoreRecord.criteria?.category || 'uncategorized';
        
        // Skip if weight is 0
        if (criterionWeight === 0) continue;
        
        // Add to total
        const weightedScore = (rawScore * criterionWeight) / 100;
        totalWeightedScore += weightedScore;
        totalWeightApplied += criterionWeight;
        
        // Track by category
        if (!categoryScores[category]) {
          categoryScores[category] = { total: 0, weight: 0 };
        }
        categoryScores[category].total += weightedScore;
        categoryScores[category].weight += criterionWeight;
      }
      
      // Normalize the final score to 0-100
      const normalizedScore = totalWeightApplied > 0 ? 
        (totalWeightedScore / totalWeightApplied) * 100 : 0;
      
      // Calculate category scores
      const finalCategoryScores: Record<string, number> = {};
      for (const [category, scores] of Object.entries(categoryScores)) {
        const categoryData = scores as { total: number, weight: number };
        finalCategoryScores[category] = categoryData.weight > 0 ? 
          (categoryData.total / categoryData.weight) * 100 : 0;
      }
      
      results.push({
        scenarioId,
        projectId: project.id,
        rank: 0, // Will be set after sorting
        normalizedScore,
        categoryScores: finalCategoryScores,
        metadata: {
          projectType: project.type,
          projectCost: project.estimated_cost,
          projectLocation: project.location
        }
      });
    }
    
    // Sort by score and assign ranks
    results.sort((a, b) => b.normalizedScore - a.normalizedScore);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    // Save the results
    await savePrioritizationResults(scenarioId, results);
    
    return results;
  } catch (error) {
    console.error('Error running prioritization scenario:', error);
    return [];
  }
}

/**
 * Save prioritization results to the database
 */
async function savePrioritizationResults(
  scenarioId: string, 
  results: PrioritizationResult[]
): Promise<void> {
  const supabase = createClient();
  
  // First delete any existing results for this scenario
  const { error: deleteError } = await supabase
    .from('prioritization_results')
    .delete()
    .eq('scenario_id', scenarioId);
  
  if (deleteError) {
    console.error('Error deleting existing results:', deleteError);
    throw deleteError;
  }
  
  // Insert new results
  if (results.length > 0) {
    const { error: insertError } = await supabase
      .from('prioritization_results')
      .insert(results.map(result => ({
        scenario_id: result.scenarioId,
        project_id: result.projectId,
        rank: result.rank,
        normalized_score: result.normalizedScore,
        category_scores: result.categoryScores,
        metadata: result.metadata
      })));
    
    if (insertError) {
      console.error('Error inserting results:', insertError);
      throw insertError;
    }
  }
}

/**
 * Create a prioritization scenario
 */
export async function createPrioritizationScenario(
  scenario: Omit<PrioritizationScenario, 'id' | 'createdBy' | 'createdAt'>,
  userId: string
): Promise<PrioritizationScenario> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('prioritization_scenarios')
    .insert({
      name: scenario.name,
      description: scenario.description,
      criteria_weights: scenario.criteriaWeights,
      filter_settings: scenario.filterSettings,
      agency_id: scenario.agencyId,
      created_by: userId
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating scenario:', error);
    throw error;
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    criteriaWeights: data.criteria_weights,
    filterSettings: data.filter_settings,
    agencyId: data.agency_id,
    createdBy: data.created_by,
    createdAt: data.created_at
  };
}

/**
 * Get project grant alignment
 */
export async function getProjectGrantAlignment(
  projectId: string
): Promise<GrantAlignment[]> {
  const supabase = createClient();
  
  // First get the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  
  if (projectError) {
    console.error('Error fetching project:', projectError);
    throw projectError;
  }
  
  // Get all active grants
  const { data: grants, error: grantsError } = await supabase
    .from('grants')
    .select('*')
    .eq('agency_id', project.agency_id)
    .eq('is_active', true);
  
  if (grantsError) {
    console.error('Error fetching grants:', grantsError);
    throw grantsError;
  }
  
  if (!grants || grants.length === 0) {
    return [];
  }
  
  // Get project scores
  const { data: scores, error: scoresError } = await supabase
    .from('scoring')
    .select('*, criteria:criteria_id(*)')
    .eq('project_id', projectId);
  
  if (scoresError) {
    console.error('Error fetching scores:', scoresError);
    throw scoresError;
  }
  
  // Calculate alignment with each grant
  const alignments: GrantAlignment[] = [];
  
  for (const grant of grants) {
    const criteriaMatches = {};
    let totalAlignmentScore = 0;
    let totalWeight = 0;
    
    // Each grant has criteria weights in its metadata
    const grantCriteria = grant.metadata?.criteria || {};
    
    for (const [criterionId, grantWeight] of Object.entries(grantCriteria)) {
      if (grantWeight === 0) continue;
      
      // Find the project's score for this criterion
      const score = scores.find(s => s.criteria_id === criterionId);
      
      if (score) {
        const weight = Number(grantWeight);
        totalWeight += weight;
        
        // Calculate match score
        const matchScore = score.score * (weight / 100);
        totalAlignmentScore += matchScore;
        
        // Store in criteria matches
        criteriaMatches[score.criteria.name] = matchScore;
      }
    }
    
    // Normalize to 0-100
    const normalizedScore = totalWeight > 0 ? (totalAlignmentScore / totalWeight) * 100 : 0;
    
    // Generate recommendations based on alignment
    const recommendations = generateGrantRecommendations(
      project, 
      grant, 
      normalizedScore, 
      criteriaMatches
    );
    
    alignments.push({
      projectId,
      grantId: grant.id,
      grantName: grant.name,
      alignmentScore: normalizedScore,
      criteriaMatches,
      recommendations
    });
  }
  
  // Sort by alignment score
  alignments.sort((a, b) => b.alignmentScore - a.alignmentScore);
  
  return alignments;
}

/**
 * Generate grant recommendations
 */
function generateGrantRecommendations(
  project: any, 
  grant: any, 
  alignmentScore: number, 
  criteriaMatches: Record<string, number>
): string[] {
  const recommendations: string[] = [];
  
  // Find the top matching criteria
  const sortedCriteria = Object.entries(criteriaMatches)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
  
  // Generate recommendations based on alignment score
  if (alignmentScore >= 80) {
    recommendations.push('Strong overall alignment with grant requirements');
    
    if (sortedCriteria.length > 0) {
      const [topCriterion] = sortedCriteria[0];
      recommendations.push(`Particularly strong in ${topCriterion}`);
    }
    
    // Additional recommendation for highly aligned projects
    recommendations.push('Consider prioritizing this project for application');
  } else if (alignmentScore >= 60) {
    recommendations.push('Good alignment with grant requirements');
    
    if (sortedCriteria.length > 0) {
      const [topCriterion] = sortedCriteria[0];
      recommendations.push(`Strong in ${topCriterion}`);
    }
    
    // Find potential improvement areas
    const weakCriteria = sortedCriteria
      .filter(([, score]) => score < 60)
      .slice(0, 2);
    
    if (weakCriteria.length > 0) {
      const [weakCriterion] = weakCriteria[0];
      recommendations.push(`Consider improving ${weakCriterion} aspects`);
    }
  } else {
    recommendations.push('Limited alignment with grant requirements');
    
    if (sortedCriteria.length > 0) {
      // Find the strongest criterion even if overall alignment is low
      const [bestCriterion] = sortedCriteria[0];
      recommendations.push(`Best alignment in ${bestCriterion}`);
      
      // Suggest focus areas for improvement
      if (sortedCriteria.length > 1) {
        const neededImprovements = sortedCriteria
          .slice(-2)
          .map(([criterion]) => criterion)
          .join(' and ');
        
        recommendations.push(`Needs significant improvement in ${neededImprovements}`);
      }
    }
  }
  
  return recommendations;
}

/**
 * Analyze a project across multiple prioritization scenarios
 */
export async function analyzeProjectAcrossScenarios(
  projectId: string,
  scenarioIds: string[]
): Promise<Record<string, PrioritizationResult>> {
  const supabase = createClient();
  
  if (!scenarioIds || scenarioIds.length === 0) {
    return {};
  }
  
  // Get results for this project across all specified scenarios
  const { data, error } = await supabase
    .from('prioritization_results')
    .select('*')
    .eq('project_id', projectId)
    .in('scenario_id', scenarioIds);
  
  if (error) {
    console.error('Error fetching scenario results:', error);
    throw error;
  }
  
  // Format results by scenario ID
  const resultsByScenario: Record<string, PrioritizationResult> = {};
  
  for (const result of data) {
    resultsByScenario[result.scenario_id] = {
      scenarioId: result.scenario_id,
      projectId: result.project_id,
      rank: result.rank,
      normalizedScore: result.normalized_score,
      categoryScores: result.category_scores,
      metadata: result.metadata
    };
  }
  
  return resultsByScenario;
}

/**
 * Create a prioritization dashboard that provides a comprehensive view of all projects
 */
export async function generatePrioritizationDashboard(
  agencyId: string,
  filters: Record<string, any> = {}
): Promise<{
  topProjects: Array<any>;
  categorySummary: Array<{category: string, count: number, avgScore: number}>;
  trendAnalysis: Array<{month: string, projectCount: number, avgScore: number}>;
  fundingGaps: Array<{category: string, estimatedNeed: number, allocatedFunding: number, gap: number}>;
}> {
  try {
    const supabase = createClient();
    
    // Get all projects, with filters if provided
    let query = supabase
      .from('projects')
      .select('id, name, status, type, metadata, created_at')
      .eq('agency_id', agencyId);
      
    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    const { data: projects, error: projectsError } = await query;
    
    if (projectsError) {
      console.error('Error fetching projects for dashboard:', projectsError);
      throw projectsError;
    }
    
    // Get scores for all projects
    const projectScores = await Promise.all(
      projects.map(async (project) => {
        try {
          const scoreSummary = await calculateProjectScore(project.id);
          return {
            ...project,
            score: scoreSummary.totalScore,
            categorizedScores: scoreSummary.categoryScores
          };
        } catch (error) {
          console.error(`Error calculating score for project ${project.id}:`, error);
          return {
            ...project,
            score: 0,
            categorizedScores: {}
          };
        }
      })
    );
    
    // Sort projects by score (descending)
    const sortedProjects = [...projectScores].sort((a, b) => b.score - a.score);
    
    // Get top projects
    const topProjects = sortedProjects.slice(0, 10).map(project => ({
      id: project.id,
      name: project.name,
      type: project.type,
      status: project.status,
      score: project.score,
      metadata: project.metadata || {}
    }));
    
    // Category summary
    const categories = Array.from(new Set(projects.map(p => p.type)));
    const categorySummary = categories.map(category => {
      const categoryProjects = projectScores.filter(p => p.type === category);
      const avgScore = categoryProjects.length > 0
        ? Math.round(categoryProjects.reduce((sum, p) => sum + p.score, 0) / categoryProjects.length)
        : 0;
        
      return {
        category,
        count: categoryProjects.length,
        avgScore
      };
    });
    
    // Trend analysis (projects created per month)
    const projectsByMonth = projects.reduce<Record<string, {count: number, scores: number[]}>>(
      (acc, project) => {
        const date = new Date(project.created_at);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = { count: 0, scores: [] };
        }
        
        acc[monthYear].count += 1;
        
        const projectWithScore = projectScores.find(p => p.id === project.id);
        if (projectWithScore) {
          acc[monthYear].scores.push(projectWithScore.score);
        }
        
        return acc;
      },
      {}
    );
    
    const trendAnalysis = Object.entries(projectsByMonth)
      .map(([month, data]) => ({
        month,
        projectCount: data.count,
        avgScore: data.scores.length > 0
          ? Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length)
          : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    // Funding gap analysis
    // This requires project budget data and allocated funding data
    const fundingGaps = categories.map(category => {
      const categoryProjects = projectScores.filter(p => p.type === category);
      
      // Calculate estimated needs from project metadata
      const estimatedNeed = categoryProjects.reduce((sum, project) => {
        const budget = project.metadata?.budget || 0;
        return sum + (typeof budget === 'number' ? budget : parseFloat(budget) || 0);
      }, 0);
      
      // Calculate allocated funding (this is a placeholder - real implementation would pull from funding table)
      const allocatedFunding = estimatedNeed * (Math.random() * 0.5 + 0.2); // Random value between 20-70% of need
      
      return {
        category,
        estimatedNeed: Math.round(estimatedNeed),
        allocatedFunding: Math.round(allocatedFunding),
        gap: Math.round(estimatedNeed - allocatedFunding)
      };
    });
    
    return {
      topProjects,
      categorySummary,
      trendAnalysis,
      fundingGaps
    };
  } catch (error) {
    console.error('Error generating prioritization dashboard:', error);
    throw error;
  }
}

/**
 * Get prioritized projects based on scoring results
 */
export async function getPrioritizedProjects(scenarioId: string): Promise<any[]> {
  try {
    // Get the prioritization results for the scenario
    const results = await runPrioritizationScenario(scenarioId);
    
    // Return the project list with prioritization data
    return results;
  } catch (error) {
    console.error('Error getting prioritized projects:', error);
    return [];
  }
} 