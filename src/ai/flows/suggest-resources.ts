// src/ai/flows/suggest-resources.ts
/**
 * @fileOverview A resource suggestion generator (static version for GitHub Pages).
 *
 * - suggestResources - A function that suggests relevant learning resources based on user data.
 * - SuggestResourcesInput - The input type for the suggestResources function.
 * - SuggestResourcesOutput - The return type for the suggestResources function.
 */

export type SuggestResourcesInput = {
  trackedSkills: string[];
  careerGoals: string;
  timelineEvents: string;
};

export type SuggestResourcesOutput = {
  suggestedResources: string[];
  reasoning: string;
};

// Static resource suggestions for GitHub Pages deployment
const resourceDatabase = {
  'Data Structures': [
    'LeetCode - Practice coding problems and algorithms',
    'GeeksforGeeks - Comprehensive DSA tutorials and practice',
    'Coursera Algorithm Specialization - Stanford University course'
  ],
  'Algorithms': [
    'Introduction to Algorithms (CLRS) - The definitive algorithms textbook',
    'Algorithm Visualizer - Interactive algorithm demonstrations',
    'HackerRank - Coding challenges and competitions'
  ],
  'Operating Systems': [
    'Operating System Concepts (Silberschatz) - Classic OS textbook',
    'MIT 6.828 Operating System Engineering - Free online course',
    'Linux From Scratch - Hands-on OS learning'
  ],
  'Database Management': [
    'SQLBolt - Interactive SQL tutorial',
    'MongoDB University - Free database courses',
    'Database System Concepts - Comprehensive DBMS textbook'
  ],
  'Machine Learning': [
    'Coursera Machine Learning Course - Andrew Ng',
    'Kaggle Learn - Free micro-courses on ML topics',
    'Fast.ai - Practical deep learning courses'
  ],
  'Web Development': [
    'MDN Web Docs - Comprehensive web development documentation',
    'FreeCodeCamp - Interactive coding bootcamp',
    'The Odin Project - Full-stack web development curriculum'
  ],
  'GATE Preparation': [
    'GATE Overflow - Previous year questions and discussions',
    'Made Easy Publications - Standard GATE preparation books',
    'Unacademy GATE - Online coaching and mock tests'
  ],
  'GRE Preparation': [
    'Magoosh GRE - Comprehensive GRE prep platform',
    'Manhattan Prep GRE - High-quality prep materials',
    'ETS Official GRE Materials - Practice tests from test makers'
  ]
};

export async function suggestResources(input: SuggestResourcesInput): Promise<SuggestResourcesOutput> {
  const { trackedSkills, careerGoals } = input;
  
  let suggestedResources: string[] = [];
  let reasoning = "Based on your profile, here are some curated resources: ";
  
  // Add resources based on tracked skills
  trackedSkills.forEach(skill => {
    const normalizedSkill = Object.keys(resourceDatabase).find(key => 
      key.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(key.toLowerCase())
    );
    
    if (normalizedSkill) {
      suggestedResources.push(...resourceDatabase[normalizedSkill as keyof typeof resourceDatabase]);
    }
  });
  
  // Add general computer science resources
  if (suggestedResources.length === 0) {
    suggestedResources = [
      'LeetCode - Essential for coding interview preparation',
      'GeeksforGeeks - Comprehensive computer science tutorials',
      'Coursera - University-level courses from top institutions',
      'edX - Free online courses from MIT, Harvard, and other universities',
      'Khan Academy - Free educational content across multiple subjects'
    ];
    reasoning = "Since you're starting your journey, here are some fundamental resources to build a strong foundation: ";
  }
  
  // Add career-specific resources based on goals
  if (careerGoals.toLowerCase().includes('software engineer')) {
    suggestedResources.push('System Design Interview - Preparing for senior roles');
  }
  if (careerGoals.toLowerCase().includes('data scientist')) {
    suggestedResources.push('Kaggle - Data science competitions and datasets');
  }
  
  // Remove duplicates and limit to 8 resources
  suggestedResources = [...new Set(suggestedResources)].slice(0, 8);
  
  reasoning += "These resources are selected to align with your current skills and career aspirations.";
  
  return {
    suggestedResources,
    reasoning
  };
}
