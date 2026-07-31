import { DailyExecutionScore, DailyReflection, HabitCorrelation } from '../types/execution';
import { ScheduledBlock } from '../types/timetable';

export const detectHabitCorrelations = (
  scores: Record<string, DailyExecutionScore>,
  reflections: Record<string, DailyReflection>,
  blocks: ScheduledBlock[] // In a full implementation, this might be a historical map, but keeping interface simple
): HabitCorrelation[] => {
  const correlations: HabitCorrelation[] = [];
  const scoreDates = Object.keys(scores);
  
  if (scoreDates.length < 3) return correlations; // Need min 3 data points

  // Example: High energy correlation
  const highEnergyScores: number[] = [];
  const otherEnergyScores: number[] = [];

  scoreDates.forEach(date => {
    const ref = reflections[date];
    const score = scores[date]?.overallScore;
    
    if (ref && score !== undefined) {
      if (ref.energyLevel === 'high' || ref.energyLevel === 'very_high') {
        highEnergyScores.push(score);
      } else {
        otherEnergyScores.push(score);
      }
    }
  });

  if (highEnergyScores.length >= 3) {
    const avgHigh = highEnergyScores.reduce((a,b) => a+b, 0) / highEnergyScores.length;
    const avgOther = otherEnergyScores.length > 0 ? (otherEnergyScores.reduce((a,b) => a+b, 0) / otherEnergyScores.length) : 50;
    
    if (avgHigh > avgOther + 10) {
      correlations.push({
        id: `corr-energy-${Date.now()}`,
        description: "High energy days result in significantly better execution scores.",
        confidence: Math.min(100, highEnergyScores.length * 15),
        impactDirection: 'positive',
        dataPoints: highEnergyScores.length,
        category: 'energy'
      });
    }
  }

  // Example: Distraction-free days
  const noDistractScores: number[] = [];
  scoreDates.forEach(date => {
    const ref = reflections[date];
    const score = scores[date]?.overallScore;
    
    if (ref && score !== undefined) {
      if (!ref.distractions || ref.distractions.length === 0) {
        noDistractScores.push(score);
      }
    }
  });

  if (noDistractScores.length >= 3) {
    const avgNoDistract = noDistractScores.reduce((a,b) => a+b, 0) / noDistractScores.length;
    if (avgNoDistract > 75) {
      correlations.push({
        id: `corr-distract-${Date.now()}`,
        description: "Zero distractions recorded correlates with high productivity.",
        confidence: Math.min(100, noDistractScores.length * 15),
        impactDirection: 'positive',
        dataPoints: noDistractScores.length,
        category: 'focus'
      });
    }
  }

  return correlations;
};
