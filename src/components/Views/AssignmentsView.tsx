import React from 'react';
import AssignmentTracker from '../Assignments/AssignmentTracker';
import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';

interface AssignmentsViewProps {
  onNavigate?: (view: NavView) => void;
}

export default function AssignmentsView({ onNavigate }: AssignmentsViewProps = {}) {
  return (
    <div className="w-full min-h-screen bg-slate-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        {onNavigate && (
          <PageBreadcrumb items={[{ label: 'Assignment Tracker' }]} onNavigate={onNavigate} />
        )}
        <AssignmentTracker />
      </div>
    </div>
  );
}
