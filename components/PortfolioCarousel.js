'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';

export default function PortfolioCarousel({ items, onItemClick }) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 2;
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const startIndex = currentPage * itemsPerPage;
  const visibleItems = items.slice(startIndex, startIndex + itemsPerPage);

  const goToPrev = () => {
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full bg-[#f4f9fd] rounded-lg shadow-md p-4">
      <div className="relative flex items-center">
        {/* Left Arrow */}
        <button
          onClick={goToPrev}
          className="absolute left-0 z-10 p-2 text-[#094074] hover:text-[#072c57]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Items */}
        <div className="flex gap-4 mx-10 w-full justify-center">
          {visibleItems.map((item, index) => (
            <div
              key={index}
              className="w-1/2 h-36 bg-white rounded-md border overflow-hidden flex items-center justify-center cursor-pointer hover:shadow"
              onClick={() => onItemClick(item)} // ✅ Replaces window.open
            >
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={`Portfolio item ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-[#094074]">
                  <FileText className="w-8 h-8" />
                  <span className="text-sm mt-1">PDF File</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={goToNext}
          className="absolute right-0 z-10 p-2 text-[#094074] hover:text-[#072c57]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: totalPages }).map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`w-3 h-3 rounded-full cursor-pointer ${
              currentPage === i
                ? 'bg-[#094074]'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
