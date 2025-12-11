"use client";

import { useState, useEffect } from "react";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import Badge from "./Badge";

export default function ListingCard({ listing, onEdit, onDelete }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 🔹 NEW: track service image dynamically
  const [serviceImageUrl, setServiceImageUrl] = useState(
    listing.resolver?.profilePicture ||
      "https://placehold.co/400x200/cccccc/ffffff?text=Service+Image"
  );

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        if (!listing.id) return;

        const res = await fetch(`/api/fetch-portfolio/${listing.id}`);
        if (!res.ok) throw new Error("Failed to fetch portfolio items");
        const data = await res.json();

        // Flatten files for thumbnail detection
        const formatted = data.flatMap((item) =>
          item.files.map((file) => ({
            url: file.url,
            isThumbnail: file.isThumbnail,
          }))
        );

        // 🔹 Update main image if a thumbnail exists
        const thumbnailFile = formatted.find((f) => f.isThumbnail);
        if (thumbnailFile) setServiceImageUrl(thumbnailFile.url);
      } catch (err) {
        console.warn("ListingCard portfolio fetch error:", err);
      }
    }

    fetchPortfolio();
  }, [listing.id]); // 🔹 run when listing ID changes

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(listing);
    setDropdownOpen(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(listing.id);
    setDropdownOpen(false);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "approved":
      case "published":
        return "success";
      case "draft":
        return "info";
      case "on_review":
        return "warning";
      case "rejected":
        return "danger";
      default:
        return "primary";
    }
  };

  const formatStatus = (status) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatPrice = () => {
    if (listing.minPrice != null && listing.maxPrice != null) {
      return `₱${listing.minPrice.toLocaleString()} - ₱${listing.maxPrice.toLocaleString()}`;
    }
    return "Price not set";
  };

  return (
    <div className="w-full h-[460px] bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col relative cursor-pointer">
      {/* Dropdown Menu */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleDropdown();
          }}
          className="p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>

        {dropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            {/* Dropdown */}
            <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border py-1 min-w-[120px] z-20">
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Service Image */}
      <div className="w-full h-40">
        <img
          src={serviceImageUrl}
          alt={listing.title || "Service Thumbnail"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://placehold.co/400x200/cccccc/ffffff?text=Service+Image";
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col justify-between flex-grow">
        <div>
          {/* Badges */}
          <div className="flex flex-wrap gap-3 text-sm mb-3">
            <Badge
              text={formatStatus(listing.status)}
              variant={getStatusBadgeVariant(listing.status)}
            />
            {listing.category && (
              <Badge text={listing.category} variant="primary" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-[#094074] mt-2 mb-1">
            {listing.title || "Untitled Service"}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-3">
            {listing.description || "No description available"}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between text-sm">
          <div className="flex flex-col">
            <span className="text-[#094074] font-medium">
              {listing.USERS?.name || "Service Provider"}
            </span>
          </div>
          {listing.minPrice != null && listing.maxPrice != null && (
            <Badge
              text={formatPrice()}
              variant="warning"
              className="font-semibold"
            />
          )}
        </div>
      </div>
    </div>
  );
}
