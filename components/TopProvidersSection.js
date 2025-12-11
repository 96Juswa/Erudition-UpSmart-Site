import { Star } from 'lucide-react';

export default function TopProvidersSection({ providersByCategory }) {
  return (
    <div className="bg-white pt-10">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#094074] mb-10 text-start">
          <span className="text-[#c89933]">Top Service Providers</span> by
          Category
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {Object.entries(providersByCategory).map(([category, provider]) => (
            <div
              key={category}
              className="bg-[#f4f9fd] rounded-lg shadow-md p-4 flex flex-col items-center text-center"
            >
              {/* Profile Image */}
              <img
                src={provider.profileImage}
                alt={provider.name}
                className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-white shadow"
              />

              {/* Category */}
              <span className="text-sm font-medium text-[#094074] bg-yellow-100 px-3 py-1 rounded-full mb-2">
                {category}
              </span>

              {/* Name */}
              <h3 className="text-lg font-semibold text-[#094074]">
                {provider.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                {provider.rating.toFixed(1)} / 5.0
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
