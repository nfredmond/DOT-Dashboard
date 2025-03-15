// Mock data for projects
export const mockProjects = [
  {
    id: '1',
    name: 'City Transportation Plan',
    description: 'Mapping transportation infrastructure and planning future improvements for the downtown area. This comprehensive plan addresses traffic congestion, public transit improvements, and pedestrian safety measures.',
    createdAt: '2023-10-15',
    updatedAt: '2023-11-20',
    mapType: 'cartoPositron',
    location: 'Downtown',
    status: 'In Progress',
    category: 'Transit',
    priority: 'High',
    estimatedCost: 2500000,
    allocatedBudget: 1800000,
    pseBudget: 450000,
    ceBudget: 350000,
    startDate: '2023-08-15',
    endDate: '2024-12-31',
    leadAgency: 'Department of Transportation',
    organizationName: 'Example Organization',
    organizationId: '1',
    coordinates: {
      latitude: 34.42083,
      longitude: -119.698189
    },
    tags: ['Transit', 'Planning', 'Infrastructure', 'Downtown'],
    scores: {
      safety: 85,
      equity: 78,
      climate: 92,
      congestion: 65,
      costEffectiveness: 70,
      multimodal: 88
    },
    benefits: {
      vmtReduction: '15%',
      ghgReduction: '22 tons/year',
      jobsCreated: 45,
      safetyImprovement: 'High',
      congestionReduction: '18%',
      benefitCostRatio: 2.3,
      economicBenefitEstimate: '$5.2M',
      improvedAccessibility: 'Medium'
    },
    environmentalDocumentation: {
      leadAgency: 'Department of Transportation'
    },
    nepaStatus: 'Completed',
    ceqaStatus: 'Completed',
    environmentalDocumentType: 'Categorical Exclusion',
    environmentalClearanceDate: '2023-07-10',
    phases: [
      {
        id: '1-1',
        name: 'Planning',
        startDate: '2023-08-15',
        endDate: '2023-12-31',
        status: 'Completed',
        completionPercentage: 100,
        description: 'Initial planning and needs assessment'
      },
      {
        id: '1-2',
        name: 'Environmental Review',
        startDate: '2023-11-01',
        endDate: '2024-03-31',
        status: 'Completed',
        completionPercentage: 100,
        description: 'Environmental impact assessment and documentation'
      },
      {
        id: '1-3',
        name: 'Design',
        startDate: '2024-01-15',
        endDate: '2024-07-31',
        status: 'In Progress',
        completionPercentage: 60,
        description: 'Detailed design and engineering'
      },
      {
        id: '1-4',
        name: 'Construction',
        startDate: '2024-08-01',
        endDate: '2024-12-31',
        status: 'Not Started',
        completionPercentage: 0,
        description: 'Implementation and construction of improvements'
      }
    ],
    milestones: [
      {
        id: '1-m1',
        name: 'Project Kickoff',
        endDate: '2023-08-20',
        status: 'Completed'
      },
      {
        id: '1-m2',
        name: 'Public Consultation',
        endDate: '2023-10-15',
        status: 'Completed'
      },
      {
        id: '1-m3',
        name: 'Preliminary Design Approval',
        endDate: '2024-03-01',
        status: 'Completed'
      },
      {
        id: '1-m4',
        name: 'Final Design Completion',
        endDate: '2024-07-31',
        status: 'In Progress'
      },
      {
        id: '1-m5',
        name: 'Construction Commencement',
        endDate: '2024-08-15',
        status: 'Not Started'
      }
    ],
    fundingSources: [
      {
        id: '1-f1',
        name: 'Federal Transit Grant',
        amount: 1200000,
        secured: true,
        description: 'Federal funding for transit improvements'
      },
      {
        id: '1-f2',
        name: 'State Infrastructure Fund',
        amount: 800000,
        secured: true,
        description: 'State allocation for transportation projects'
      },
      {
        id: '1-f3',
        name: 'Local Transportation Tax',
        amount: 500000,
        secured: false,
        description: 'Pending approval from city council'
      }
    ],
    attachments: [
      {
        id: '1-a1',
        name: 'Project Proposal.pdf',
        type: 'application/pdf',
        url: '/files/project-proposal.pdf',
        uploadedAt: '2023-08-20',
        uploadedBy: 'Sarah Wilson'
      },
      {
        id: '1-a2',
        name: 'Environmental Assessment.pdf',
        type: 'application/pdf',
        url: '/files/environmental-assessment.pdf',
        uploadedAt: '2023-12-15',
        uploadedBy: 'Michael Chen'
      },
      {
        id: '1-a3',
        name: 'Budget Breakdown.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        url: '/files/budget-breakdown.xlsx',
        uploadedAt: '2024-01-10',
        uploadedBy: 'Robert Johnson'
      }
    ]
  },
  {
    id: '2',
    name: 'Urban Development Zones',
    description: 'Identifying and mapping urban development and zoning areas for future growth planning.',
    createdAt: '2023-09-05',
    updatedAt: '2023-11-18',
    mapType: 'cartoDarkMatter',
    location: 'Citywide',
    status: 'Planned',
    category: 'Planning',
    priority: 'Medium',
    estimatedCost: 1200000,
    allocatedBudget: 900000,
    pseBudget: 300000,
    ceBudget: 150000,
    startDate: '2023-10-01',
    endDate: '2024-09-30',
    leadAgency: 'Planning Department',
    organizationName: 'Partner Agency',
    organizationId: '2',
    coordinates: {
      latitude: 38.581572,
      longitude: -121.4944
    },
    tags: ['Urban Planning', 'Zoning', 'Development'],
    phases: [
      {
        id: '2-1',
        name: 'Data Collection',
        startDate: '2023-10-01',
        endDate: '2023-12-31',
        status: 'Completed',
        completionPercentage: 100,
        description: 'Gathering existing land use and zoning data'
      },
      {
        id: '2-2',
        name: 'Analysis',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        status: 'In Progress',
        completionPercentage: 40,
        description: 'Analyzing development patterns and needs'
      },
      {
        id: '2-3',
        name: 'Draft Plan',
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        status: 'Not Started',
        completionPercentage: 0,
        description: 'Creating draft zoning plan'
      },
      {
        id: '2-4',
        name: 'Public Review',
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        status: 'Not Started',
        completionPercentage: 0,
        description: 'Public review and revision process'
      }
    ],
    milestones: [
      {
        id: '2-m1',
        name: 'Initial Data Collection',
        endDate: '2023-11-15',
        status: 'Completed'
      },
      {
        id: '2-m2',
        name: 'Stakeholder Interviews',
        endDate: '2023-12-20',
        status: 'Completed'
      },
      {
        id: '2-m3',
        name: 'Analysis Completion',
        endDate: '2024-03-31',
        status: 'In Progress'
      }
    ]
  },
  {
    id: '3',
    name: 'Bike Lane Network Expansion',
    description: 'Adding 15 miles of protected bike lanes throughout San Francisco to improve cycling infrastructure and safety.',
    createdAt: '2023-07-22',
    updatedAt: '2023-11-10',
    mapType: 'cartoVoyager',
    location: 'San Francisco',
    status: 'Approved',
    category: 'Active Transportation',
    priority: 'Medium',
    estimatedCost: 1850000,
    allocatedBudget: 1500000,
    pseBudget: 250000,
    ceBudget: 200000,
    startDate: '2023-12-01',
    endDate: '2024-11-30',
    leadAgency: 'SFMTA',
    organizationName: 'Example Organization',
    organizationId: '1',
    coordinates: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    geojson: true,
    tags: ['Bicycle', 'Infrastructure', 'Safety', 'Sustainable Transportation']
  }
]; 