'use client';

import { Star } from 'lucide-react';

export default function StarRating({ rating }) {
  const fullStars = Math.round(rating); // Round to nearest whole number (no .5s)

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-bold text-[#094074]">
        {rating.toFixed(1)}
      </span>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < fullStars ? 'fill-[#094074] text-[#094074]' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}
