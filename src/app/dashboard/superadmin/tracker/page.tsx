import TimeTracker from '@/components/Superadmin/Tracker/Tracker';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Time Tracker | Superadmin Dashboard',
  description: 'Track time and capture screenshots for project tasks',
};

export default function TimeTrackerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Time Tracker</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-1">
        <TimeTracker />
      </div>
    </div>
  );
}