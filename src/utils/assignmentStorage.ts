import {
  Assignment,
  FutureMeMessage,
  DistractionLog,
  EnergyProfile,
} from '../types/executionOS';

const ASSIGNMENTS_KEY = 'blockflow_assignments_v1';
const FUTURE_ME_KEY = 'blockflow_future_me_v1';
const DISTRACTIONS_KEY = 'blockflow_distractions_v1';
const ENERGY_PROFILE_KEY = 'blockflow_energy_profile_v1';

export function loadAssignments(): Assignment[] {
  try {
    const data = localStorage.getItem(ASSIGNMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load assignments', error);
    return [];
  }
}

export function saveAssignments(assignments: Assignment[]): void {
  try {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.error('Failed to save assignments', error);
  }
}

export function loadFutureMeMessages(): FutureMeMessage[] {
  try {
    const data = localStorage.getItem(FUTURE_ME_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load future me messages', error);
    return [];
  }
}

export function saveFutureMeMessages(messages: FutureMeMessage[]): void {
  try {
    localStorage.setItem(FUTURE_ME_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save future me messages', error);
  }
}

export function loadDistractionLogs(): DistractionLog[] {
  try {
    const data = localStorage.getItem(DISTRACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load distraction logs', error);
    return [];
  }
}

export function saveDistractionLogs(logs: DistractionLog[]): void {
  try {
    localStorage.setItem(DISTRACTIONS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save distraction logs', error);
  }
}

export function loadEnergyProfile(): EnergyProfile {
  try {
    const data = localStorage.getItem(ENERGY_PROFILE_KEY);
    return data
      ? JSON.parse(data)
      : { morning: 'high', afternoon: 'medium', evening: 'low' };
  } catch (error) {
    console.error('Failed to load energy profile', error);
    return { morning: 'high', afternoon: 'medium', evening: 'low' };
  }
}

export function saveEnergyProfile(profile: EnergyProfile): void {
  try {
    localStorage.setItem(ENERGY_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save energy profile', error);
  }
}
