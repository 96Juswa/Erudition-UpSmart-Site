export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No Activity Yet
      </h3>
      <p className="text-gray-500 text-sm max-w-sm">
        No booking, listing, request, or messages have been created for this
        conversation.
      </p>
    </div>
  );
}
