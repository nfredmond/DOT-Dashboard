import { Project, ProjectCategory } from '@/types/project';
import { WizardCategory } from '@/contexts/ProjectWizardContext';

/**
 * Service to handle AI assistance for project creation and updates
 */
export interface AIProjectSuggestion {
  confidence: number;
  fieldsChanged: string[];
  suggestedValues: Record<string, any>;
  explanation: string;
}

export interface AIProjectAnalysis {
  similarProjects: Array<{id: string, name: string, similarity: number}>;
  suggestedImprovements: string[];
  potentialRisks: string[];
  scorePrediction: Record<string, number>;
  benefitsPrediction: Record<string, number>;
}

// Mock function to simulate AI processing of unstructured text
export async function processUnstructuredText(
  text: string,
  targetFields?: string[]
): Promise<AIProjectSuggestion> {
  // In a real implementation, this would call an API to process the text
  console.log('Processing text with AI:', text, 'for fields:', targetFields);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock response - in a real app, this would come from an AI service
  return {
    confidence: 0.85,
    fieldsChanged: targetFields || ['name', 'description', 'category', 'priority'],
    suggestedValues: {
      name: 'Main Street Corridor Improvement',
      description: 'Comprehensive improvement of Main Street corridor including bike lanes, pedestrian safety features, and transit signal priority.',
      category: 'Multimodal',
      priority: 'High',
      location: 'Downtown',
      estimatedCost: 1500000,
    },
    explanation: 'Based on the text provided, I identified this as a multimodal transportation project focused on corridor improvements with multiple elements including bike lanes and pedestrian features.'
  };
}

// Function to extract project data from a file
export async function extractProjectDataFromFile(
  file: File
): Promise<AIProjectSuggestion> {
  // In a real implementation, this would send the file to an API for processing
  console.log('Extracting project data from file:', file.name);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock response
  return {
    confidence: 0.78,
    fieldsChanged: ['scores', 'benefits', 'fundingSources'],
    suggestedValues: {
      scores: {
        safety: 85,
        equity: 70,
        climate: 60,
        congestion: 75,
        costEffectiveness: 65,
        multimodal: 80
      },
      benefits: {
        vmtReduction: 15000,
        ghgReduction: 500,
        jobsCreated: 125,
        safetyImprovement: 30,
        congestionReduction: 25,
      },
      fundingSources: [
        { name: 'Federal CMAQ', amount: 800000, secured: true },
        { name: 'State ATP Grant', amount: 450000, secured: false },
      ]
    },
    explanation: 'I extracted key performance metrics and funding details from the uploaded document.'
  };
}

// Function to analyze a project based on its current data
export async function analyzeProject(project: Partial<Project>): Promise<AIProjectAnalysis> {
  console.log('Analyzing project with AI:', project);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1800));
  
  // Mock response
  return {
    similarProjects: [
      { id: '123', name: 'Broadway Street Redesign', similarity: 0.85 },
      { id: '456', name: 'North Transit Corridor', similarity: 0.72 },
      { id: '789', name: 'Downtown Pedestrian Improvement', similarity: 0.68 }
    ],
    suggestedImprovements: [
      'Consider adding dedicated bus lanes to improve transit performance',
      'Expand pedestrian safety elements at key intersections',
      'Add green infrastructure elements to improve stormwater management'
    ],
    potentialRisks: [
      'Project timeline may overlap with seasonal weather constraints',
      'Cost estimates for signal improvements may be underestimated based on similar projects',
      'Stakeholder concerns from adjacent businesses may require additional outreach'
    ],
    scorePrediction: {
      safety: 82,
      equity: 75,
      climate: 68,
      congestion: 78,
      costEffectiveness: 70,
      multimodal: 85
    },
    benefitsPrediction: {
      vmtReduction: 18500,
      ghgReduction: 620,
      jobsCreated: 140,
      safetyImprovement: 35,
      congestionReduction: 28,
      benefitCostRatio: 2.3,
      economicBenefitEstimate: 3200000,
      improvedAccessibility: 12000
    }
  };
}

// Function to batch process multiple projects
export async function batchUpdateProjects(
  textInput: string,
  projectIds: string[]
): Promise<Record<string, AIProjectSuggestion>> {
  console.log('Batch processing projects with AI:', projectIds);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // Mock response with a suggestion for each project
  const results: Record<string, AIProjectSuggestion> = {};
  
  for (const id of projectIds) {
    results[id] = {
      confidence: 0.8 + (Math.random() * 0.15),
      fieldsChanged: ['status', 'updatedAt', 'priority'],
      suggestedValues: {
        status: 'In Progress',
        priority: Math.random() > 0.5 ? 'High' : 'Medium',
        updatedAt: new Date().toISOString(),
      },
      explanation: `Updated project ${id} based on the provided text input.`
    };
  }
  
  return results;
}

// Function to generate project template based on similar successful projects
export async function generateProjectTemplate(
  category: ProjectCategory,
  location: string
): Promise<Partial<Project>> {
  console.log('Generating project template for:', category, 'in', location);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock template based on category and location
  // In a real implementation, this would use ML to generate a realistic template
  return {
    name: `New ${category} Project in ${location}`,
    description: `A ${category.toLowerCase()} improvement project in ${location} designed to enhance mobility, safety, and accessibility.`,
    category,
    location,
    priority: 'Medium',
    status: 'Planned',
    estimatedCost: category === 'Highway' ? 5000000 : 
                  category === 'Transit' ? 3000000 : 
                  category === 'Multimodal' ? 2000000 : 1000000,
    scores: {
      safety: 70,
      equity: 65,
      climate: 60,
      congestion: 75,
      costEffectiveness: 80,
      multimodal: category === 'Multimodal' ? 90 : 60,
    },
    benefits: {
      vmtReduction: 10000,
      ghgReduction: 300,
      jobsCreated: 85,
      safetyImprovement: 20,
      congestionReduction: 15,
      benefitCostRatio: 1.8,
      economicBenefitEstimate: 1800000,
      improvedAccessibility: 8000
    },
  };
}

// Function to suggest improvements to specific sections of a project
export async function suggestImprovements(
  project: Partial<Project>,
  section: WizardCategory
): Promise<{ suggestions: string[], explanation: string }> {
  console.log(`Suggesting improvements for ${section} section of project:`, project.name);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock suggestions based on the section
  const suggestions: string[] = [];
  let explanation = '';
  
  switch(section) {
    case 'basic':
      suggestions.push(
        'Make the project title more specific to its primary goal',
        'Include key stakeholders in the project description',
        'Specify the primary transportation problem being addressed'
      );
      explanation = 'Clear project definitions help with stakeholder communication and funding eligibility.';
      break;
    
    case 'funding':
      suggestions.push(
        'Consider additional federal grant opportunities like RAISE',
        'Include dedicated maintenance funding in the budget',
        'Clarify matching fund sources'
      );
      explanation = 'More comprehensive funding identification improves project viability.';
      break;
      
    case 'environmental':
      suggestions.push(
        'Address potential stormwater impacts more specifically',
        'Include mitigation measures for construction noise',
        'Consider air quality benefits in the documentation'
      );
      explanation = 'More comprehensive environmental analysis can prevent delays in approval.';
      break;
      
    case 'scoring':
      suggestions.push(
        'Strengthen the safety score justification with crash data',
        'Better quantify equity benefits with demographic analysis',
        'Include more specific climate benefit calculations'
      );
      explanation = 'Data-driven scoring improves competitiveness for limited funding.';
      break;
      
    default:
      suggestions.push(
        'Consider adding more specific metrics to measure success',
        'Include references to similar successful projects',
        'Add more detail about implementation challenges'
      );
      explanation = 'Greater specificity improves project definition and execution.';
  }
  
  return { suggestions, explanation };
}; 