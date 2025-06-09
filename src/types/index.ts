export interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  type: 'exam' | 'deadline' | 'goal' | 'project' | 'application' | 'custom';
  notes?: string;
  links?: { title: string; url: string }[];
  status?: 'pending' | 'in-progress' | 'completed' | 'missed';
  icon?: React.ElementType; // For custom icons per event type
}

export interface CareerGoal {
  id: string;
  title: string;
  description?: string;
  progress: number; // 0-100
  deadline?: Date;
}

export interface Skill {
  id: string;
  name: string;
  category: 'DSA' | 'OS' | 'DBMS' | 'AI' | 'WebDev' | 'MobileDev' | 'Other';
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  lastUpdated: Date;
  learningResources?: { title: string; url: string }[];
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedDate: Date;
  imageUrl?: string;
}

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: 'book' | 'course' | 'tool' | 'article' | 'website' | 'other';
  isAIRec_om_mended?: boolean;
}

export interface TodaysPlan {
  schedule: { time: string; activity: string }[];
  microGoals: string[];
}
