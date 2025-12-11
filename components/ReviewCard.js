'use client';

import UserInfo from './UserInfo';
import StarRating from './StarRating';
function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ReviewCard({
  reviewer,
  profileImageUrl,
  trustRating,
  rating,
  comment,
  createdAt,
}) {
  return (
    <div className="w-full space-y-2">
      {/* Header: User Info + Rating */}
      <div className="flex justify-between items-start">
        {/* Left: User Info */}
        <UserInfo
          name={reviewer}
          profileImageUrl={profileImageUrl}
          trustRating={trustRating}
        />

        {/* Right: Star Rating */}
        <StarRating rating={rating} />
      </div>

      {/* Comment */}
      <p className="text-sm text-gray-800 leading-snug">{comment}</p>

      {/* Formatted Date */}
      <span className="text-xs text-gray-500">{formatDate(createdAt)}</span>

      {/* Divider */}
      <hr className="mt-4 border-gray-200" />
    </div>
  );
}
