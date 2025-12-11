"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import ServiceCard from "./ServiceCard";

export default function BrowseServicesCarousel({ allServices }) {
  const itemsPerPage = 4;
  const totalPages = Math.ceil(allServices.length / itemsPerPage);
  const [currentPage, setCurrentPage] = useState(0);

  // Auto-advance every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalPages]);

  const handlePageClick = (index) => {
    setCurrentPage(index);
  };

  const startIndex = currentPage * itemsPerPage;
  const currentServices = (allServices || []).slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="bg-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with Link */}
        <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-8 gap-4 sm:gap-0">
          <h2 className="text-3xl font-bold text-[#094074] text-center sm:text-left">
            <span className="text-[#c89933]">Browse</span> Services
          </h2>
          <Link
            href="/client/services"
            className="flex items-center gap-2 text-[#094074] hover:text-[#062f4f] font-medium transition"
          >
            View All
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
          {currentServices.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>

        {/* Pagination Bars */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-8">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageClick(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentPage === index
                    ? "w-12 bg-[#094074]"
                    : "w-6 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
