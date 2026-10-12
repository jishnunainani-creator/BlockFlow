export type ResourceCategory =
  | 'all'
  | 'presentations'
  | 'research'
  | 'reasoning'
  | 'study'
  | 'coding'
  | 'writing'
  | 'productivity';

export interface TaskShortcut {
  id: string;
  label: string;
  query: string;
  category?: ResourceCategory;
  description: string;
}

export interface ResourceItem {
  id: string;
  name: string;
  url: string;
  category: ResourceCategory;
  categoryLabel: string;
  badge?: string;
  description: string;
  bestFor: string[];
  primaryUseCases: string[];
  pricing: string;
  guidance?: string;
  examplePrompt: string;
  strengths: string[];
  limitations: string[];
  searchKeywords: string[];
  accentColor: string;
  monogram: string;
}
