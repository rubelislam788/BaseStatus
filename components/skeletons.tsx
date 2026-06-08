export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card p-4" aria-hidden="true">
      <div className="skeleton h-4 w-32" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="skeleton h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading dashboard">
      <div className="card p-5">
        <div className="skeleton h-5 w-40" />
        <div className="mt-3 skeleton h-8 w-full max-w-xl" />
        <div className="mt-3 skeleton h-4 w-64" />
      </div>
      <div className="stat-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="card p-4">
            <div className="skeleton h-3 w-24" />
            <div className="mt-3 skeleton h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="space-y-5">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
        <div className="space-y-5">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
        </div>
      </div>
    </div>
  );
}
