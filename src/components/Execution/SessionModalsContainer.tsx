import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { useTimetable } from '../../context/TimetableContext';
import { SessionLogModal } from './SessionLogModal';
import { ReplaceActivityModal } from './ReplaceActivityModal';
import { ExtendSessionModal } from './ExtendSessionModal';
import { EndOfBlockNudge } from './EndOfBlockNudge';
import { ScheduledBlock } from '../../types/timetable';

export const SessionModalsContainer: React.FC = () => {
  const {
    activeSessionLogBlock,
    closeSessionLogModal,
    activeReplaceBlock,
    closeReplaceModal,
  } = useSession();

  const { currentWeekScheduledBlocks } = useTimetable();

  const [nudgeBlock, setNudgeBlock] = useState<ScheduledBlock | null>(null);
  const [extendBlock, setExtendBlock] = useState<ScheduledBlock | null>(null);

  // Auto-detect when a scheduled block reaches its end time to offer End-of-Block Nudge (Part 20)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const todayIndex = (now.getDay() + 6) % 7;

      const endingBlock = currentWeekScheduledBlocks.find((b) => {
        if (b.dayOfWeek !== todayIndex) return false;
        if (
          b.status === 'completed' ||
          b.status === 'skipped' ||
          b.status === 'cancelled' ||
          b.status === 'replaced'
        )
          return false;

        const endMins = b.startMinutes + b.duration;
        // If current time is within 5 mins after block end time
        return currentMinutes >= endMins - 2 && currentMinutes <= endMins + 5;
      });

      if (endingBlock && (!nudgeBlock || nudgeBlock.id !== endingBlock.id)) {
        setNudgeBlock(endingBlock);
      }
    }, 15000);

    return () => clearInterval(checkInterval);
  }, [currentWeekScheduledBlocks, nudgeBlock]);

  return (
    <>
      <SessionLogModal
        isOpen={Boolean(activeSessionLogBlock)}
        block={activeSessionLogBlock}
        onClose={closeSessionLogModal}
      />

      <ReplaceActivityModal
        isOpen={Boolean(activeReplaceBlock)}
        block={activeReplaceBlock}
        onClose={closeReplaceModal}
      />

      <ExtendSessionModal
        isOpen={Boolean(extendBlock)}
        block={extendBlock}
        onClose={() => setExtendBlock(null)}
      />

      {nudgeBlock && (
        <EndOfBlockNudge
          block={nudgeBlock}
          onDismiss={() => setNudgeBlock(null)}
          onOpenExtendModal={(b) => setExtendBlock(b)}
        />
      )}
    </>
  );
};
