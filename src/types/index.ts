export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ArticleRecord {
  id: number;
  researchRunId: number;
  title: string;
  url: string;
  source: string;
  publishedDate: string | null;
  snippet: string | null;
  aiSummary: string | null;
  aiAnalysis: string | null;
  importance: number;
  starred: boolean;
  createdAt: string;
}

export interface ResearchRunRecord {
  id: number;
  query: string;
  status: string;
  articleCount: number;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ResearchRunWithArticles extends ResearchRunRecord {
  articles: ArticleRecord[];
}
