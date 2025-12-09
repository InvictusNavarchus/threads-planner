export interface ThreadSegment {
  id: string;
  content: string;
  image?: string; // Placeholder for future image support
}

export interface ThreadPost {
  id: string;
  title: string; // Internal title for the planner
  segments: ThreadSegment[];
  status: 'draft' | 'scheduled' | 'published';
  time: string; // HH:mm format
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  dailyTheme: string;
  posts: ThreadPost[];
}

export interface MonthPlan {
  monthKey: string; // YYYY-MM
  monthlyTheme: string;
  weeklyThemes: { [weekNumber: number]: string };
}

export interface AppState {
  plans: { [date: string]: DayPlan };
  monthPlans: { [monthKey: string]: MonthPlan };
}

export const THREAD_CHAR_LIMIT = 500;