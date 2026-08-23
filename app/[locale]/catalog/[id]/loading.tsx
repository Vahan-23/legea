export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-[3/4] bg-off-white" />
        <div className="space-y-6">
          <div className="h-8 w-2/3 bg-off-white" />
          <div className="h-4 w-1/4 bg-off-white" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 w-9 rounded-full bg-off-white" />
            ))}
          </div>
          <div className="h-40 bg-off-white" />
          <div className="h-12 bg-off-white" />
        </div>
      </div>
    </div>
  );
}
