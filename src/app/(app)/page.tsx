
import TimelineView from '@/components/timeline/TimelineView';
import TodaysPlanCard from '@/components/timeline/TodaysPlanCard';

export default function ActualDashboardPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <h1 className="font-headline text-3xl font-semibold text-primary">Your Career Dashboard</h1>
      <p className="text-foreground/80">
        Visualize your milestones, track your progress, and plan your journey to success.
      </p>
      <div className="flex-1 min-h-0"> {/* This allows TimelineView to take remaining space */}
        <TimelineView />
      </div>
      <TodaysPlanCard />
    </div>
  );
}
