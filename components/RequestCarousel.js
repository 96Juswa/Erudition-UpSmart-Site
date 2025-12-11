"use client";

import { useState } from "react";
import ServiceRequestCard from "./ServiceRequestCard";

export default function RequestCarousel({ allRequests }) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(allRequests.length / itemsPerPage);

  const getCurrentPageItems = () => {
    const startIndex = currentPage * itemsPerPage;
    return allRequests.slice(startIndex, startIndex + itemsPerPage);
  };

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-[#094074]">
          All Service Requests
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Showing {currentPage * itemsPerPage + 1}-
            {Math.min((currentPage + 1) * itemsPerPage, allRequests.length)} of{" "}
            {allRequests.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={prevPage}
              disabled={totalPages <= 1}
              className="p-2 rounded-lg border border-gray-300 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={nextPage}
              disabled={totalPages <= 1}
              className="p-2 rounded-lg border border-gray-300 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getCurrentPageItems().map((request, index) => (
          <ServiceRequestCard
            key={currentPage * itemsPerPage + index}
            title={request.title}
            description={request.description}
            client={request.client}
            budget={request.budget}
            category={request.category}
            deadline={request.deadline}
            postedTime={request.postedTime}
            urgency={request.urgency}
            clientImageUrl={request.clientImageUrl}
            responses={request.responses}
          />
        ))}
      </div>

      {/* Page Indicators */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentPage
                  ? "bg-[#c89933]"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* View More Button */}
      <div className="flex justify-center mt-4">
        <button className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-[#c89933] hover:text-[#c89933] transition-colors duration-200">
          View More Requests
        </button>
      </div>
    </div>
  );
}
