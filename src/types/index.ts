export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'legal' | 'accountant';
  company: string;
  avatar?: string;
}

export interface LegalDecision {
  id: string;
  title: string;
  court: string;
  date: string;
  type: string;
  summary?: string;
  content: string;
  relatedDecisions?: string[];
}

export interface LegalArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
}

export interface Contract {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  status: 'draft' | 'final' | 'archived';
  fileUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}
