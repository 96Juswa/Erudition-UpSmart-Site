"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react"; // you can replace with Star or BadgeCheck

export default function UserInfo({ name, profileImageUrl, trustRating }) {
  const firstInitial = name?.trim().charAt(0).toUpperCase() || "U";
  const [imgError, setImgError] = useState(false);
  const showImage = profileImageUrl && !imgError;
  const isTopRated = trustRating >= 4.5;

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {showImage ? (
          <img
            src={profileImageUrl}
            alt={name}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#094074]"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="w-10 h-10 rounded-full bg-gray-200 text-[#094074] font-semibold text-sm flex items-center justify-center border-2 border-[#094074]">
            {firstInitial}
          </span>
        )}

        {/* ⭐ Badge Overlay (shows if trustRating ≥ 4.5) */}
        {isTopRated && (
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
            <ShieldCheck size={14} className="text-[#FFD700]" />{" "}
            {/* gold badge */}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[#094074] font-medium text-sm">{name}</span>
        {trustRating !== undefined && (
          <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-full w-fit">
            <ShieldCheck size={12} className="text-[#094074]" />
            <span className="text-xs font-bold text-[#094074]">
              Trust Rating: {trustRating ?? "-"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
