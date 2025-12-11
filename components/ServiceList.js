"use client";

import { useState } from "react";
import { ArrowUpWideNarrow, ArrowDownWideNarrow } from "lucide-react";
import Divider from "@/components/Divider";
import Button from "./Button";
import ServiceCard from "@/components/ServiceCard";

export default function ServiceList({ services }) {
  const [sortField, setSortField] = useState("trustRating"); // "price" or "trustRating"
  const [sortOrder, setSortOrder] = useState("desc"); // descending for trustRating

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const toggleSortField = () => {
    setSortField((prev) => (prev === "price" ? "trustRating" : "price"));
    setSortOrder("desc"); // default descending for trustRating
  };

  const sortedServices = [...services].sort((a, b) => {
    if (sortField === "trustRating") {
      const ratingA = parseFloat(a.trustRating || 0);
      const ratingB = parseFloat(b.trustRating || 0);
      return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
    } else if (sortField === "price") {
      const priceA_min = parseFloat(a.minPrice);
      const priceB_min = parseFloat(b.minPrice);
      const priceA_max = parseFloat(a.maxPrice);
      const priceB_max = parseFloat(b.maxPrice);

      if (priceA_min === priceB_min) {
        return sortOrder === "asc"
          ? priceA_max - priceB_max
          : priceB_max - priceA_max;
      }

      return sortOrder === "asc"
        ? priceA_min - priceB_min
        : priceB_min - priceA_min;
    }
    return 0;
  });

  // Assign ranking with special colors
  const rankedServices = sortedServices.map((service, index) => {
    let badgeColor = "bg-gray-400 text-white"; // default for 4th–5th
    if (index === 0)
      badgeColor = "bg-yellow-400 text-white"; // Gold
    else if (index === 1)
      badgeColor = "bg-gray-300 text-black"; // Silver
    else if (index === 2)
      badgeColor = "bg-yellow-700 text-white"; // Bronze
    else if (index < 5) badgeColor = "bg-gray-400 text-white"; // 4th–5th

    return {
      ...service,
      rank: index + 1,
      isTopRanked: index < 5,
      badgeColor,
    };
  });

  return (
    <div className="w-full h-auto bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col cursor-pointer relative">
      {/* Header and Sort Buttons */}
      <div className="flex justify-between items-center px-2 py-4 shrink-0 gap-2 flex-wrap">
        <p className="text-2xl font-bold text-[#094074]">
          {services.length}{" "}
          <span className="text-[#c89933]">Listings Found</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={toggleSortField}
            color="primary"
            variant="outline"
            size="sm"
          >
            Sort by: {sortField === "price" ? "Price" : "Trust Rating"}
          </Button>
          <Button
            onClick={toggleSortOrder}
            color="primary"
            variant="outline"
            size="sm"
            iconStart={
              sortOrder === "asc" ? (
                <ArrowUpWideNarrow className="w-4 h-4" />
              ) : (
                <ArrowDownWideNarrow className="w-4 h-4" />
              )
            }
          >
            {sortField === "price"
              ? `Price: ${sortOrder === "asc" ? "Low → High" : "High → Low"}`
              : `Trust: ${sortOrder === "asc" ? "Low → High" : "High → Low"}`}
          </Button>
        </div>
      </div>

      <Divider orientation="horizontal" />

      {/* Scrollable Grid */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-4 relative">
          {rankedServices.map((service) => (
            <div key={service.id} className="relative">
              {service.isTopRanked && (
                <span
                  className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold z-10 ${service.badgeColor}`}
                >
                  #{service.rank}
                </span>
              )}
              <ServiceCard
                id={service.id}
                title={service.title}
                description={service.description}
                provider={service.provider}
                minPrice={service.minPrice}
                maxPrice={service.maxPrice}
                category={service.category}
                imageUrl={service.imageUrl}
                profileImageUrl={service.profileImageUrl}
                location={service.location}
                availability={service.availability}
                trustRating={service.trustRating}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
