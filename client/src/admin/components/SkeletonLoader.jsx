export default function SkeletonLoader() {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="p-4 border-t border-gray-800 animate-pulse">
          <div className="md:flex md:justify-between">
            <div className="h-4 bg-gray-800 rounded w-full md:w-1/4 mb-2 md:mb-0"></div>
            <div className="h-4 bg-gray-800 rounded w-full md:w-1/6 mb-2 md:mb-0"></div>
            <div className="h-4 bg-gray-800 rounded w-full md:w-1/6 mb-2 md:mb-0"></div>
            <div className="h-4 bg-gray-800 rounded w-full md:w-1/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}