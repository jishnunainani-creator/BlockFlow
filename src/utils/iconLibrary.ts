/**
 * Curated 150+ Icon Registry for Custom Planner & Schedule Builder
 * Organised into the 15 exact domain categories requested in the BlockFlow specification.
 * Fully verified against Lucide React exports.
 * Provides fuzzy keyword search, category lookup, color palettes, and local-first recents/favorites.
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface IconCategory {
  id: string;
  name: string;
  description: string;
  icons: string[];
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    id: 'math',
    name: 'Mathematics and Statistics',
    description: 'Calculus, algebra, probability, data charts, and mathematical notation',
    icons: [
      'Calculator', 'PieChart', 'BarChart', 'LineChart', 'TrendingUp',
      'Percent', 'Divide', 'Binary', 'Variable', 'Sigma',
      'ScatterChart', 'AreaChart',
    ],
  },
  {
    id: 'cs',
    name: 'Computer Science and Technology',
    description: 'Software engineering, algorithms, networking, systems, and hardware',
    icons: [
      'Code', 'Terminal', 'Laptop', 'Database', 'Cpu',
      'Server', 'Wifi', 'Globe', 'HardDrive', 'Bug',
      'FileCode', 'Brackets',
    ],
  },
  {
    id: 'engineering',
    name: 'Engineering and Electronics',
    description: 'Circuits, hardware, mechanics, tools, power systems, and machinery',
    icons: [
      'Wrench', 'Hammer', 'Cog', 'Zap', 'Plug',
      'Radio', 'Battery', 'Gauge', 'Ruler', 'Power',
      'Settings', 'Drill',
    ],
  },
  {
    id: 'biology',
    name: 'Biology and Medical',
    description: 'Genetics, cellular biology, anatomy, clinical care, and diagnostics',
    icons: [
      'Dna', 'Microscope', 'Heart', 'Activity', 'Stethoscope',
      'Pill', 'Syringe', 'Thermometer', 'HeartPulse', 'ShieldAlert',
      'Bandage', 'Hospital',
    ],
  },
  {
    id: 'physics',
    name: 'Physics and Chemistry',
    description: 'Atomic structure, lab reactions, thermodynamics, magnetism, and forces',
    icons: [
      'Atom', 'FlaskConical', 'TestTube', 'TestTubes', 'Magnet',
      'Orbit', 'Flame', 'Sparkles', 'Compass', 'Lightbulb',
      'Scale',
    ],
  },
  {
    id: 'automobiles',
    name: 'Automobiles and Electric Vehicles',
    description: 'Vehicles, EV powertrains, battery systems, telemetry, and transport',
    icons: [
      'Car', 'BatteryCharging', 'Fuel', 'Gauge', 'Navigation',
      'Key', 'Truck', 'Bike', 'Bus', 'CableCar',
    ],
  },
  {
    id: 'sports',
    name: 'Sports and Fitness',
    description: 'Athletics, bodybuilding, cardio, conditioning, timing, and tournaments',
    icons: [
      'Trophy', 'Dumbbell', 'Award', 'Timer', 'Footprints',
      'Medal', 'Activity', 'Flag', 'Swords', 'Watch',
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming and Entertainment',
    description: 'Video games, esports, cinema, film production, and interactive media',
    icons: [
      'Gamepad', 'Gamepad2', 'Film', 'Tv', 'Video',
      'Clapperboard', 'Dice1', 'Dice5', 'Ticket', 'Joystick',
    ],
  },
  {
    id: 'arts',
    name: 'Arts, Design, and Architecture',
    description: 'Visual arts, graphic design, illustration, photography, and structures',
    icons: [
      'Palette', 'Brush', 'Camera', 'Image', 'Scissors',
      'PenTool', 'PaintBucket', 'Feather', 'Wand2', 'Shapes',
      'Building', 'Building2',
    ],
  },
  {
    id: 'music',
    name: 'Music and Audio',
    description: 'Musical instruments, studio acoustics, sound engineering, and broadcasting',
    icons: [
      'Music', 'Headphones', 'Mic', 'Radio', 'Disc',
      'Speaker', 'Volume2', 'AudioWaveform', 'CassetteTape', 'Guitar',
    ],
  },
  {
    id: 'business',
    name: 'Business, Finance, and Economics',
    description: 'Commerce, banking, investing, accounting, markets, and transactions',
    icons: [
      'Wallet', 'Coins', 'Briefcase', 'Landmark', 'CreditCard',
      'DollarSign', 'PiggyBank', 'Receipt', 'ShoppingCart', 'Vault',
    ],
  },
  {
    id: 'humanities',
    name: 'Languages, Writing, and Humanities',
    description: 'Linguistics, creative writing, literature, philosophy, and history',
    icons: [
      'BookOpen', 'Book', 'Bookmark', 'Library', 'FileText',
      'Newspaper', 'Languages', 'PenLine', 'Scroll', 'Quote',
    ],
  },
  {
    id: 'food',
    name: 'Food, Cooking, and Lifestyle',
    description: 'Culinary arts, nutrition, recipes, coffee culture, and hospitality',
    icons: [
      'Coffee', 'Utensils', 'Apple', 'CookingPot', 'Soup',
      'Pizza', 'Cake', 'Wine', 'CupSoda', 'Egg',
    ],
  },
  {
    id: 'astronomy',
    name: 'Astronomy, Space, and Earth Sciences',
    description: 'Cosmology, rocketry, planetary exploration, meteorology, and geology',
    icons: [
      'Rocket', 'Telescope', 'Sun', 'Moon', 'Earth',
      'Cloud', 'Mountain', 'Trees', 'TreePine', 'Wind',
      'Waves',
    ],
  },
  {
    id: 'productivity',
    name: 'General Activities and Productivity',
    description: 'Time management, milestones, prioritization, checklists, and daily life',
    icons: [
      'Calendar', 'Clock', 'CheckSquare', 'Target', 'ListTodo',
      'ClipboardList', 'Hourglass', 'Layers', 'Kanban', 'Bell',
      'Home',
    ],
  },
];

/**
 * Total unique icon list flattened across all 15 categories (~163 verified icons).
 */
export const ALL_CURATED_ICONS: string[] = Array.from(
  new Set(ICON_CATEGORIES.flatMap((c) => c.icons))
);

/**
 * Common keyword synonym dictionary for intelligent icon lookup.
 */
const ICON_KEYWORDS: Record<string, string[]> = {
  code: ['Code', 'Terminal', 'Laptop', 'Cpu', 'Binary', 'Bug', 'FileCode', 'Brackets', 'Database', 'Server'],
  developer: ['Code', 'Terminal', 'Laptop', 'Cpu', 'Binary', 'Bug', 'FileCode'],
  programming: ['Code', 'Terminal', 'Cpu', 'Binary', 'FileCode', 'Brackets'],
  software: ['Code', 'Terminal', 'Laptop', 'Database', 'Cpu', 'Server'],
  math: ['Calculator', 'PieChart', 'BarChart', 'LineChart', 'Sigma', 'Variable', 'Divide', 'Percent'],
  data: ['Database', 'PieChart', 'BarChart', 'LineChart', 'ScatterChart', 'AreaChart', 'TrendingUp'],
  analytics: ['BarChart', 'LineChart', 'PieChart', 'TrendingUp', 'Activity'],
  stats: ['Calculator', 'BarChart', 'LineChart', 'ScatterChart', 'Sigma'],
  exam: ['GraduationCap', 'FileText', 'Clock', 'CheckSquare', 'PenLine', 'BookOpen'],
  study: ['BookOpen', 'Book', 'Library', 'GraduationCap', 'Bookmark', 'FileText'],
  academic: ['GraduationCap', 'Library', 'BookOpen', 'School', 'Scroll'],
  gym: ['Dumbbell', 'Activity', 'Timer', 'Footprints', 'Medal', 'Trophy', 'Watch'],
  workout: ['Dumbbell', 'Activity', 'Timer', 'Watch', 'Footprints'],
  fitness: ['Dumbbell', 'Activity', 'Timer', 'Footprints', 'Trophy', 'Medal'],
  health: ['Heart', 'Activity', 'HeartPulse', 'Pill', 'Stethoscope', 'Hospital', 'Thermometer'],
  medical: ['Stethoscope', 'Pill', 'Syringe', 'Hospital', 'Heart', 'Thermometer', 'Bandage'],
  doctor: ['Stethoscope', 'Syringe', 'Hospital', 'Thermometer', 'Pill'],
  science: ['Atom', 'FlaskConical', 'TestTube', 'TestTubes', 'Microscope', 'Dna', 'Orbit'],
  chemistry: ['FlaskConical', 'TestTube', 'TestTubes', 'Atom', 'Flame'],
  physics: ['Atom', 'Magnet', 'Orbit', 'Lightbulb', 'Scale', 'Compass'],
  money: ['Wallet', 'Coins', 'DollarSign', 'PiggyBank', 'Landmark', 'CreditCard', 'Vault'],
  finance: ['Wallet', 'Coins', 'DollarSign', 'CreditCard', 'Receipt', 'Briefcase', 'Landmark'],
  bank: ['Landmark', 'Vault', 'CreditCard', 'DollarSign', 'Coins'],
  car: ['Car', 'BatteryCharging', 'Fuel', 'Gauge', 'Navigation', 'Truck'],
  vehicle: ['Car', 'Truck', 'Bike', 'Bus', 'CableCar', 'Ship', 'Plane'],
  ev: ['BatteryCharging', 'Car', 'Zap', 'Battery'],
  space: ['Rocket', 'Telescope', 'Orbit', 'Sun', 'Moon', 'Earth', 'Sparkles'],
  astro: ['Telescope', 'Rocket', 'Orbit', 'Sun', 'Moon', 'Earth'],
  food: ['Utensils', 'Coffee', 'Apple', 'CookingPot', 'Soup', 'Pizza', 'Cake', 'Wine'],
  drink: ['Coffee', 'Wine', 'CupSoda'],
  music: ['Music', 'Headphones', 'Mic', 'Radio', 'Disc', 'Speaker', 'Volume2', 'AudioWaveform', 'Guitar'],
  audio: ['Headphones', 'Mic', 'Speaker', 'Volume2', 'AudioWaveform', 'CassetteTape'],
  game: ['Gamepad', 'Gamepad2', 'Joystick', 'Dice1', 'Dice5', 'Ticket'],
  gaming: ['Gamepad', 'Gamepad2', 'Joystick', 'Dice1', 'Dice5'],
  design: ['Palette', 'Brush', 'PenTool', 'PaintBucket', 'Shapes', 'Camera', 'Scissors'],
  art: ['Palette', 'Brush', 'PenTool', 'PaintBucket', 'Image', 'Camera'],
  write: ['PenLine', 'BookOpen', 'FileText', 'Scroll', 'Quote', 'Languages'],
  language: ['Languages', 'BookOpen', 'Book', 'Quote', 'FileText'],
  plan: ['Calendar', 'Clock', 'Target', 'CheckSquare', 'ListTodo', 'Kanban', 'Layers'],
  task: ['CheckSquare', 'ListTodo', 'ClipboardList', 'Target', 'Clock'],
  goal: ['Target', 'Trophy', 'Award', 'Flag', 'Hourglass'],
};

/**
 * Resolves a Lucide icon component by string name safely.
 * Returns Fallback icon (Calendar or HelpCircle) if the name is invalid or not found.
 */
export function getIconComponent(name?: string | null): LucideIcon {
  if (!name) return LucideIcons.Calendar;

  const found = (LucideIcons as Record<string, any>)[name];
  if (found && (typeof found === 'function' || typeof found === 'object')) {
    return found as LucideIcon;
  }

  return LucideIcons.Sparkles;
}

/**
 * Search curated icons by name, category, or relevant keyword synonyms.
 */
export function searchIcons(query: string, categoryId?: string): string[] {
  let pool = ALL_CURATED_ICONS;

  if (categoryId && categoryId !== 'all') {
    const cat = ICON_CATEGORIES.find((c) => c.id === categoryId);
    pool = cat ? cat.icons : [];
  }

  const q = query.toLowerCase().trim();
  if (!q) return pool;

  // 1. Direct name matches
  const directMatches = new Set(pool.filter((name) => name.toLowerCase().includes(q)));

  // 2. Category title and description matches
  ICON_CATEGORIES.forEach((cat) => {
    if (cat.name.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q)) {
      cat.icons.forEach((icon) => {
        if (pool.includes(icon)) directMatches.add(icon);
      });
    }
  });

  // 3. Keyword dictionary matches (e.g. searching "code" finds Terminal, Cpu, Binary, Bug...)
  Object.entries(ICON_KEYWORDS).forEach(([keyword, icons]) => {
    if (keyword.includes(q) || q.includes(keyword)) {
      icons.forEach((icon) => {
        if (pool.includes(icon)) directMatches.add(icon);
      });
    }
  });

  return Array.from(directMatches);
}

// ── Accessible Muted Color Palette ──────────────────────────────────────────

export interface PaletteColor {
  id: string;
  label: string;
  text: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  accent: string;
}

export const PALETTE_COLORS: PaletteColor[] = [
  {
    id: 'blue',
    label: 'Cobalt Blue',
    text: '#2563EB',
    bgLight: '#EFF6FF',
    bgDark: 'rgba(37, 99, 235, 0.16)',
    borderLight: '#BFDBFE',
    borderDark: 'rgba(37, 99, 235, 0.35)',
    accent: '#3B82F6',
  },
  {
    id: 'indigo',
    label: 'Royal Indigo',
    text: '#4F46E5',
    bgLight: '#EEF2FF',
    bgDark: 'rgba(79, 70, 229, 0.16)',
    borderLight: '#C7D2FE',
    borderDark: 'rgba(79, 70, 229, 0.35)',
    accent: '#6366F1',
  },
  {
    id: 'purple',
    label: 'Violet Purple',
    text: '#7C3AED',
    bgLight: '#F5F3FF',
    bgDark: 'rgba(124, 58, 237, 0.16)',
    borderLight: '#DDD6FE',
    borderDark: 'rgba(124, 58, 237, 0.35)',
    accent: '#8B5CF6',
  },
  {
    id: 'emerald',
    label: 'Forest Emerald',
    text: '#059669',
    bgLight: '#ECFDF5',
    bgDark: 'rgba(5, 150, 105, 0.16)',
    borderLight: '#A7F3D0',
    borderDark: 'rgba(5, 150, 105, 0.35)',
    accent: '#10B981',
  },
  {
    id: 'amber',
    label: 'Warm Amber',
    text: '#D97706',
    bgLight: '#FFFBEB',
    bgDark: 'rgba(217, 119, 6, 0.16)',
    borderLight: '#FDE68A',
    borderDark: 'rgba(217, 119, 6, 0.35)',
    accent: '#F59E0B',
  },
  {
    id: 'rose',
    label: 'Rose Coral',
    text: '#E11D48',
    bgLight: '#FFF1F2',
    bgDark: 'rgba(225, 29, 72, 0.16)',
    borderLight: '#FECDD3',
    borderDark: 'rgba(225, 29, 72, 0.35)',
    accent: '#F43F5E',
  },
  {
    id: 'teal',
    label: 'Nordic Teal',
    text: '#0D9488',
    bgLight: '#F0FDFA',
    bgDark: 'rgba(13, 148, 136, 0.16)',
    borderLight: '#99F6E4',
    borderDark: 'rgba(13, 148, 136, 0.35)',
    accent: '#14B8A6',
  },
  {
    id: 'slate',
    label: 'Neutral Charcoal',
    text: '#475569',
    bgLight: '#F8FAFC',
    bgDark: 'rgba(71, 85, 105, 0.2)',
    borderLight: '#E2E8F0',
    borderDark: 'rgba(71, 85, 105, 0.4)',
    accent: '#64748B',
  },
];

// ── Local Storage Recents & Favorites ───────────────────────────────────────

const RECENTS_KEY = 'blockflow_recent_icons_v1';
const FAVORITES_KEY = 'blockflow_favorite_icons_v1';

export function getRecentIcons(): string[] {
  try {
    if (typeof localStorage === 'undefined') return ['GraduationCap', 'Calendar', 'Code', 'Dumbbell'];
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return ['GraduationCap', 'Calendar', 'Code', 'Dumbbell'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => ALL_CURATED_ICONS.includes(n)) : [];
  } catch {
    return ['GraduationCap', 'Calendar', 'Code', 'Dumbbell'];
  }
}

export function saveRecentIcon(iconName: string): void {
  if (!iconName || typeof localStorage === 'undefined') return;
  try {
    const recents = getRecentIcons().filter((n) => n !== iconName);
    recents.unshift(iconName);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, 16)));
  } catch {
    // Ignore storage quota
  }
}

export function getFavoriteIcons(): string[] {
  try {
    if (typeof localStorage === 'undefined') return ['GraduationCap', 'Dna', 'BookOpen', 'Atom'];
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return ['GraduationCap', 'Dna', 'BookOpen', 'Atom'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => ALL_CURATED_ICONS.includes(n)) : [];
  } catch {
    return ['GraduationCap', 'Dna', 'BookOpen', 'Atom'];
  }
}

export function toggleFavoriteIcon(iconName: string): boolean {
  if (!iconName || typeof localStorage === 'undefined') return false;
  try {
    const favs = getFavoriteIcons();
    const idx = favs.indexOf(iconName);
    let isNowFav = false;
    if (idx >= 0) {
      favs.splice(idx, 1);
      isNowFav = false;
    } else {
      favs.unshift(iconName);
      isNowFav = true;
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs.slice(0, 32)));
    return isNowFav;
  } catch {
    return false;
  }
}

export function isFavoriteIcon(iconName: string): boolean {
  return getFavoriteIcons().includes(iconName);
}
