import React from 'react';
import AssignmentTracker from '../Assignments/AssignmentTracker';

export default function AssignmentsView() {
  return (
    <div className="w-full min-h-screen bg-slate-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <AssignmentTracker />
      </div>
    </div>
  );
}
