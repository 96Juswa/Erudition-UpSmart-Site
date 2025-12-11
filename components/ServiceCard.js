"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "./Badge";
import UserInfo from "./UserInfo";

export default function ServiceCard({
  id,
  title,
  description,
  provider,
  minPrice,
  maxPrice,
  category,
  imageUrl,
  profileImageUrl,
  location,
  availability,
  trustRating,
  featured = false, // 🔹 new
}) {
  const [serviceImageUrl, setServiceImageUrl] = useState(imageUrl);

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const res = await fetch(`/api/fetch-portfolio/${id}`);
        if (!res.ok) throw new Error("Failed to fetch portfolio items");
        const data = await res.json();

        const formatted = data.flatMap((item) =>
          item.files.map((file) => ({
            url: file.url,
            isThumbnail: file.isThumbnail,
          }))
        );

        const thumbnailFile = formatted.find((f) => f.isThumbnail);
        if (thumbnailFile) setServiceImageUrl(thumbnailFile.url);
      } catch (err) {
        console.warn("ServiceCard portfolio fetch error:", err);
      }
    }

    fetchPortfolio();
  }, [id]);

  return (
    <Link
      href={`/client/services/${id}`}
      aria-label={`View details for ${title}`}
    >
      <div className="w-full h-[460px] bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col cursor-pointer relative">
        {/* Featured Badge */}
        {featured && (
          <Badge
            text="Featured"
            variant="gold"
            className="absolute top-2 right-2"
          />
        )}

        {/* Service Image */}
        {serviceImageUrl ? (
          <img
            src={serviceImageUrl}
            alt={title}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-[#f4f9fd] flex items-center justify-center text-[#094074]">
            <span className="text-lg font-bold">No Image</span>
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex flex-col justify-between flex-grow">
          <div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Badge text={category} variant="primary" />
              <Badge
                text={location}
                variant={location === "Onsite" ? "success" : "warning"}
                className="capitalize"
              />
              <Badge
                text={availability}
                variant={
                  availability === "Available"
                    ? "success"
                    : availability === "Busy"
                      ? "warning"
                      : "info"
                }
              />
            </div>
            <h3 className="text-lg font-semibold text-[#094074] mt-5">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-3">
              {description}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between text-sm text-gray-500">
            <UserInfo
              name={provider}
              profileImageUrl={profileImageUrl}
              trustRating={trustRating}
            />
            <Badge
              text={`₱${minPrice} - ₱${maxPrice}`}
              variant="warning"
              className="font-semibold"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
