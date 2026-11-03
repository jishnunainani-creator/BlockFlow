import { NavView } from '../components/Navigation/Sidebar';

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';
export type TourStepType = 'informational' | 'action';

export interface TourStepConfig {
  id: string;
  stepNumber: number;
  route: NavView;
  targetSelector: string;
  fallbackSelector?: string;
  title: string;
  subtitle?: string;
  description: string;
  practicalUsage: string; // "💡 How to use: ..."
  actionPrompt?: string; // "👉 Action required: Click '...' to advance"
  placement: TourPlacement;
  type: TourStepType;
  expectedActionSelector?: string;
  borderRadius?: number; // Spot cutout border radius in px
  padding?: number; // Spot cutout padding around target in px
}
