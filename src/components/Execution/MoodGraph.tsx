import React from 'react';
import { MoodEntry, MoodType, MOOD_CONFIG } from '../../types/execution';

interface Props {
  moods: Record<string, MoodEntry>;
  days?: 7 | 30;
}

export const MoodGraph: React.FC<Props> = ({ moods, days = 7 }) => {
  const height = 150;
  const width = 1000; // viewbox width
  
  const moodToNum = (mood: MoodType) => {
    const map: Record<MoodType, number> = { excellent: 5, good: 4, neutral: 3, low: 2, difficult: 1 };
    return map[mood];
  };

  // Generate last N dates
  const dates = Array.from({ length: days }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1) + i);
    return d.toISOString().split('T')[0];
  });

  const points = dates.map((date, i) => {
    const x = (i / (days - 1)) * width;
    const moodEntry = moods[date];
    const val = moodEntry ? moodToNum(moodEntry.mood) : null;
    const y = val ? height - ((val - 1) / 4) * height : null;
    return { x, y, date, val, mood: moodEntry?.mood };
  });

  const validPoints = points.filter(p => p.y !== null) as {x: number, y: number, date: string, val: number, mood: MoodType}[];

  // Create path
  let pathD = '';
  if (validPoints.length > 0) {
    pathD = `M ${validPoints[0].x},${validPoints[0].y}`;
    for (let i = 1; i < validPoints.length; i++) {
      const prev = validPoints[i - 1];
      const curr = validPoints[i];
      const cpX = (prev.x + curr.x) / 2;
      pathD += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
    }
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 w-full overflow-x-auto">
      <div className="min-w-[300px] h-48 relative">
        <svg viewBox={`0 -20 ${width} ${height + 40}`} className="w-full h-full overflow-visible">
          {/* Background bands */}
          {[1,2,3,4,5].map(level => {
            const y = height - ((level - 1) / 4) * height;
            return (
              <line key={level} x1="0" y1={y} x2={width} y2={y} className="stroke-slate-800/50" strokeWidth="1" strokeDasharray="4 4" />
            )
          })}
          
          {/* Line */}
          {pathD && (
            <path d={pathD} fill="none" className="stroke-indigo-500/50" strokeWidth="4" />
          )}

          {/* Points & Emojis */}
          {validPoints.map((p, i) => (
            <g key={i} transform={`translate(${p.x}, ${p.y})`}>
              <circle r="12" className="fill-slate-900 stroke-indigo-500" strokeWidth="2" />
              <text textAnchor="middle" dominantBaseline="central" fontSize="14">
                {MOOD_CONFIG[p.mood].emoji}
              </text>
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-semibold px-2">
          {dates.map((d, i) => {
            const show = days === 7 || i % 5 === 0 || i === days - 1;
            return (
              <span key={d} className={show ? 'opacity-100' : 'opacity-0'}>
                {new Date(d).toLocaleDateString(undefined, { weekday: days===7?'short':'narrow' })}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
