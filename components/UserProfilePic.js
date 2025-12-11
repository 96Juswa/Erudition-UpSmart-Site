'use client';

import Image from 'next/image';

export default function UserProfilePic({ user, width = 40, height = 40 }) {
  const firstInitial = user?.firstName?.trim().charAt(0).toUpperCase() || 'U';
  const hasProfilePic = !!user?.profilePicture;

  return hasProfilePic ? (
    <Image
      src={user.profilePicture}
      alt="User photo"
      width={width}
      height={height}
      className="rounded-full object-cover border-2 border-[#094074]"
    />
  ) : (
    <span
      className="text-[#094074] font-semibold text-sm flex items-center justify-center bg-gray-200 rounded-full"
      style={{ width, height }}
    >
      {firstInitial}
    </span>
  );
}
