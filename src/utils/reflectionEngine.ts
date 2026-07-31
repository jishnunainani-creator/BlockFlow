import { DailyReflection, DailyExecutionScore, ImprovementSuggestion, AIMemory } from '../types/execution';
import { ScheduledBlock } from '../types/timetable';

export const analyzeReflections = (
  reflections: Record<string, DailyReflection>,
  scores: Record<string, DailyExecutionScore>
): { insights: string[]; suggestions: ImprovementSuggestion[] } => {
  const insights: string[] = [];
  const suggestions: ImprovementSuggestion[] = [];
  
  const reflectionValues = Object.values(reflections);
  if (reflectionValues.length < 3) {
    insights.push("Keep journaling! Need more data to provide deep insights.");
    return { insights, suggestions };
  }

  // Energy vs Productivity correlation
  let highEnergyScores = 0;
  let lowEnergyScores = 0;
  let highEnergyCount = 0;
  let lowEnergyCount = 0;

  reflectionValues.forEach(ref => {
    const score = scores[ref.date]?.overallScore || 0;
    if (ref.energyLevel === 'high' || ref.energyLevel === 'very_high') {
      highEnergyScores += score;
      highEnergyCount++;
    } else if (ref.energyLevel === 'low' || ref.energyLevel === 'very_low') {
      lowEnergyScores += score;
      lowEnergyCount++;
    }
  });

  if (highEnergyCount > 0 && lowEnergyCount > 0) {
    const avgHigh = highEnergyScores / highEnergyCount;
    const avgLow = lowEnergyScores / lowEnergyCount;
    if (avgHigh > avgLow + 15) {
      insights.push("Your execution score is significantly higher on days with high energy. Consider optimizing your sleep and diet.");
      suggestions.push({
        id: `sug-${Date.now()}-energy`,
        suggestion: "Prioritize sleep tonight to boost tomorrow's execution score.",
        category: 'energy',
        confidence: 85,
        basedOn: "High correlation between energy levels and overall score."
      });
    }
  }

  // Common distractions
  const distractionCounts: Record<string, number> = {};
  reflectionValues.forEach(ref => {
    ref.distractions?.forEach(d => {
      distractionCounts[d] = (distractionCounts[d] || 0) + 1;
    });
  });

  const topDistraction = Object.entries(distractionCounts).sort((a, b) => b[1] - a[1])[0];
  if (topDistraction && topDistraction[1] > 2) {
    insights.push(`"${topDistraction[0]}" is a recurring distraction. It disrupted your work on ${topDistraction[1]} different days.`);
    suggestions.push({
      id: `sug-${Date.now()}-distract`,
      suggestion: `Set a specific limit or blocker for ${topDistraction[0]} during focus hours.`,
      category: 'focus',
      confidence: 90,
      basedOn: "Frequent mention in daily reflections."
    });
  }

  if (insights.length === 0) {
    insights.push("You're maintaining a steady reflection habit. Keep noting down what prevents your work to discover more patterns.");
  }

  return { insights, suggestions };
};

export const generateAIPerformanceSummary = (score: DailyExecutionScore, blocks: ScheduledBlock[]): string[] => {
  const summary: string[] = [];
  
  if (score.overallScore >= 80) {
    summary.push("Excellent execution today! You handled your priorities well.");
  } else if (score.overallScore >= 50) {
    summary.push("A solid day, though there's room for improvement in sticking strictly to the schedule.");
  } else {
    summary.push("A challenging day for execution. Don't be too hard on yourself, tomorrow is a fresh start.");
  }

  if (score.priorityScores.high < 50 && score.totalCount > 0) {
    summary.push("You missed or struggled with some high-priority tasks. Try tackling them earlier in the day.");
  } else if (score.priorityScores.high === 100) {
    summary.push("Great job clearing all your high-priority items!");
  }

  if (score.timeAccuracyPct < 70 && score.completedCount > 0) {
    summary.push("Task duration estimates were a bit off today. Consider padding your timeblocks slightly.");
  }

  return summary;
};

export const generateTomorrowSuggestions = (
  todayBlocks: ScheduledBlock[],
  reflection: DailyReflection | null,
  aiMemory: AIMemory | null
): string[] => {
  const suggestions: string[] = [];
  
  const skippedCount = todayBlocks.filter(b => b.status === 'skipped' || b.status === 'missed').length;
  if (skippedCount > 0) {
    suggestions.push(`Review the ${skippedCount} tasks you skipped today. Should they be rescheduled for tomorrow or dropped?`);
  }

  if (reflection?.distractions?.includes('social_media')) {
    suggestions.push("Plan a 'social media free' first hour tomorrow morning to build early momentum.");
  }

  if (aiMemory && aiMemory.preferredWorkingHours.start > 0) {
    suggestions.push(`Try to schedule your most difficult task during your peak hours around ${aiMemory.preferredWorkingHours.start}:00.`);
  } else {
    suggestions.push("Schedule your highest priority task as the very first thing tomorrow.");
  }

  return suggestions;
};
