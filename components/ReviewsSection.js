"use client";

import { useState } from "react";
import { Star, Clock, History } from "lucide-react";
import ReviewCard from "./ReviewCard";
import Divider from "./Divider";
import Button from "./Button";
import { ChevronDown } from "lucide-react";

export default function ReviewsSection({ reviews }) {
  const [selectedRating, setSelectedRating] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(5); // Start with 5 reviews

  const totalReviews = reviews.length;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (star) => reviews.filter((r) => r.rating === star).length
  );

  const averageRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
  ).toFixed(1);

  const filteredReviews =
    selectedRating === "all"
      ? reviews
      : reviews.filter((r) => r.rating === selectedRating);

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
  });

  const visibleReviews = sortedReviews.slice(0, visibleCount);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  };

  const handleBrowseMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  return (
    <div className="mt-10 px-4 sm:px-10 w-full">
      <h3 className="text-2xl sm:text-2xl font-bold text-[#094074] mb-4">
        Reviews
      </h3>
      <Divider orientation="horizontal" className="mb-4" />

      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center">
        <div className="text-center sm:text-left sm:w-1/4 w-full">
          <div className="text-3xl sm:text-4xl font-bold text-[#094074]">
            {averageRating}
          </div>
          <div className="flex justify-center sm:justify-start mt-1 text-[#c89933]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                fill={i < Math.round(averageRating) ? "#c89933" : "none"}
                stroke="#c89933"
                className="w-5 h-5"
              />
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {totalReviews} ratings
          </div>
        </div>

        {/* Rating Bars */}
        <div className="flex flex-col gap-1 w-full">
          {[5, 4, 3, 2, 1].map((star, index) => {
            const count = ratingCounts[5 - star];
            const percentage = (count / totalReviews) * 100;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-5 sm:w-6">{star}</span>
                <Star fill="#c89933" stroke="#c89933" className="w-4 h-4" />
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: "#c89933",
                    }}
                  />
                </div>
                <div className="flex justify-end items-center gap-1 text-xs text-gray-700 w-14 sm:w-16">
                  <span>{count}</span> <span>reviews</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Buttons + Sort Button */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-start sm:justify-between items-start sm:items-center gap-2 mt-4 w-full">
        <div className="flex flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
          {["all", 5, 4, 3, 2, 1].map((rating) => (
            <Button
              key={rating}
              size="xs" // smaller button on mobile
              color="primary"
              variant={selectedRating === rating ? "filled" : "outline"}
              onClick={() => {
                setSelectedRating(rating);
                setVisibleCount(5);
              }}
              className="text-xs px-2 py-1 sm:px-3 sm:py-1.5"
            >
              {rating === "all" ? (
                "All"
              ) : (
                <>
                  {rating}
                  <Star className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          ))}
        </div>

        <Button
          onClick={toggleSortOrder}
          color="primary"
          variant="outline"
          size="xs" // smaller button
          iconStart={
            sortOrder === "newest" ? (
              <Clock className="w-3 h-3" />
            ) : (
              <History className="w-3 h-3" />
            )
          }
          className="mt-2 sm:mt-0 text-xs px-2 py-1 sm:px-3 sm:py-1.5"
        >
          {sortOrder === "newest" ? "Newest" : "Oldest"}
        </Button>
      </div>

      {/* Reviews List */}
      <div className="flex flex-col items-center gap-6 sm:gap-10 w-full mt-6">
        {visibleReviews.length > 0 ? (
          visibleReviews.map((review, index) => (
            <ReviewCard key={index} {...review} />
          ))
        ) : (
          <p className="text-gray-500 mt-4">
            No reviews found for this rating.
          </p>
        )}

        {/* Browse More */}
        {visibleCount < sortedReviews.length && (
          <button
            onClick={handleBrowseMore}
            className="mt-4 flex items-center text-sm text-[#094074] font-medium hover:underline"
          >
            Read more reviews
            <ChevronDown className="w-4 h-4 ml-1 text-[#094074]" />
          </button>
        )}
      </div>
    </div>
  );
}
