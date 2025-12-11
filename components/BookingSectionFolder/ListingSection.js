export default function ListingSection({ listing }) {
  const resolver = listing?.resolver;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">{listing.title}</h4>
            <p className="text-sm text-gray-500">Service Listing</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Provider:
          </p>
          <p className="text-gray-900">
            {resolver?.firstName} {resolver?.lastName || ""}
          </p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Category
          </p>
          <p className="text-gray-900">
            {listing.service?.category?.categoryName || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
