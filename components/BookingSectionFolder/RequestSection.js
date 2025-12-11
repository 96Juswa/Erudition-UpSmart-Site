export default function RequestSection({ request }) {
  const client = request?.client;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">{request.title}</h4>
            <p className="text-sm text-gray-500">Service Request</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Client Info */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              CLIENT:
            </p>
            <p className="text-gray-900">
              {client?.firstName} {client?.lastName || ""}
            </p>
          </div>

          {/* Category */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Category
            </p>
            <p className="text-gray-900">
              {request.category?.categoryName || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
