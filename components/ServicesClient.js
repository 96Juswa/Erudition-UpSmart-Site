"use client";

import { useState, useMemo } from "react";
import FilterSidebar from "./FilterSidebar";
import ServiceList from "./ServiceList";
import Divider from "./Divider";
import { X, SlidersHorizontal } from "lucide-react";

export default function ServicesClient({ allServices = [] }) {
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 99999,
    categories: [],
    location: "",
    availability: "",
    trustRating: 0.0,
    search: "",
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleFilterChange = (updatedFilters) => {
    const parse = (val, fallback = 0) => {
      const num = parseFloat(val);
      return isNaN(num) ? fallback : num;
    };

    setFilters({
      ...updatedFilters,
      minPrice: parse(updatedFilters.minPrice),
      maxPrice: parse(updatedFilters.maxPrice),
    });
  };

  const filteredServices = useMemo(() => {
    const lowerSearch = filters.search?.toLowerCase() || "";

    return allServices.filter((service) => {
      const serviceMin = parseFloat(service.minPrice);
      const serviceMax = parseFloat(service.maxPrice);

      const matchesPriceRange =
        serviceMin <= filters.maxPrice && serviceMax >= filters.minPrice;

      const matchesCategory =
        filters.categories.length === 0 ||
        filters.categories.includes(service.category);

      const matchesLocation =
        filters.location === "" || filters.location === service.location;

      const matchesAvailability =
        filters.availability === "" ||
        filters.availability === service.availability;

      const matchesSearch =
        lowerSearch === "" ||
        (service.title?.toLowerCase().includes(lowerSearch) ?? false) ||
        (service.description?.toLowerCase().includes(lowerSearch) ?? false);

      return (
        matchesPriceRange &&
        matchesCategory &&
        matchesLocation &&
        matchesAvailability &&
        matchesSearch
      );
    });
  }, [allServices, filters]);

  return (
    <div className="flex flex-col md:flex-row gap-5 pt-6 md:pt-10 w-full relative">
      {/* Mobile Filter Button */}
      <div className="md:hidden flex justify-end px-4">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-2 bg-gray-100 text-sm px-3 py-2 rounded-md shadow-sm border border-gray-300"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Sidebar (Desktop only) */}
      <div className="hidden md:block w-1/4">
        <FilterSidebar onFilterChange={handleFilterChange} />
      </div>

      {/* Divider (Desktop only) */}
      <div className="hidden md:block">
        <Divider orientation="vertical" />
      </div>

      {/* Service List */}
      <div className="w-full px-4 sm:px-6 md:px-0">
        <ServiceList services={filteredServices} />
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center md:hidden">
          <div className="bg-white w-[90%] max-h-[90vh] rounded-md shadow-lg p-4 relative overflow-y-auto">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
              onClick={() => setShowMobileFilters(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <FilterSidebar onFilterChange={handleFilterChange} />
          </div>
        </div>
      )}
    </div>
  );
}
