import { useState, useEffect } from "react";
import Dropdown from "./Dropdown";
import RadioButton from "./RadioButton";
import Checkbox from "./Checkbox";
import Button from "./Button";
import InputBox from "./InputBox";

export default function FilterSidebar({ onFilterChange }) {
  const categories = [
    "Freelance Work",
    "Creative Services",
    "Technical Services",
    "Educational Services",
    "Performing Arts",
  ];

  const initialFilters = {
    minPrice: 0,
    maxPrice: 999999,
    availability: "",
    categories: [],
    location: "",
    search: "", // 🔍 Added search filter
  };

  const [filters, setFilters] = useState(initialFilters);
  const [minPriceInput, setMinPriceInput] = useState(
    String(initialFilters.minPrice)
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    String(initialFilters.maxPrice)
  );
  const [searchInput, setSearchInput] = useState(initialFilters.search); // 🔍 Search input state

  // Debounced filter update
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (typeof onFilterChange === "function") {
        onFilterChange(filters);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters]);

  const handleCategoryChange = (e) => {
    const { name, checked } = e.target;
    const updated = checked
      ? [...filters.categories, name]
      : filters.categories.filter((cat) => cat !== name);
    setFilters((prev) => ({ ...prev, categories: updated }));
  };

  const handleLocationChange = (e) => {
    setFilters((prev) => ({ ...prev, location: e.target.value }));
  };

  const handleAvailabilityChange = (value) => {
    setFilters((prev) => ({ ...prev, availability: value }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setMinPriceInput(String(initialFilters.minPrice));
    setMaxPriceInput(String(initialFilters.maxPrice));
    setSearchInput(initialFilters.search); // 🔄 Reset search
  };

  const handleMinPriceChange = (e) => {
    const raw = e.target.value;
    if (/^\d*$/.test(raw)) {
      const cleaned = raw.replace(/^0+(?=\d)/, "");
      setMinPriceInput(cleaned);
      const parsed = parseInt(cleaned, 10);
      if (!isNaN(parsed)) {
        setFilters((prev) => ({ ...prev, minPrice: parsed }));
      }
    }
  };

  const handleMaxPriceChange = (e) => {
    const raw = e.target.value;
    if (/^\d*$/.test(raw)) {
      const cleaned = raw.replace(/^0+(?=\d)/, "");
      setMaxPriceInput(cleaned);
      const parsed = parseInt(cleaned, 10);
      if (!isNaN(parsed)) {
        setFilters((prev) => ({ ...prev, maxPrice: parsed }));
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 h-screen text-[#094074]">
      <div className="flex justify-between items-center font-semibold">
        <p className="text-lg">Filters</p>
        <button
          onClick={handleReset}
          className="mt-8 text-sm underline text-[#094074] hover:text-[#062c4d]"
        >
          Reset
        </button>
      </div>

      {/* 🔍 Search Filter */}
      <div className="flex flex-col gap-2 pt-2">
        <p className="font-bold">Search</p>
        <InputBox
          name="search"
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search services..."
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2 pt-2 font-bold">
        <p>Category</p>
        <div className="flex flex-col">
          {categories.map((category) => (
            <Checkbox
              key={category}
              label={category}
              name={category}
              checked={filters.categories.includes(category)}
              onChange={handleCategoryChange}
              className="text-sm"
            />
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-2 pt-2 font-bold">
        <p>Price Range</p>
        <div className="grid grid-cols-2 gap-2 font-normal">
          <InputBox
            label="Min Price"
            name="minPrice"
            type="number"
            value={minPriceInput}
            onChange={handleMinPriceChange}
            placeholder="₱0"
          />
          <InputBox
            label="Max Price"
            name="maxPrice"
            type="number"
            value={maxPriceInput}
            onChange={handleMaxPriceChange}
            placeholder="₱5000"
          />
        </div>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-2 pt-2">
        <p className="font-bold">Location</p>
        {["", "Onsite", "Offsite"].map((loc) => (
          <RadioButton
            key={loc || "Any"}
            name="location"
            value={loc}
            label={loc || "Any"}
            checked={filters.location === loc}
            onChange={handleLocationChange}
          />
        ))}
      </div>

      {/* Availability */}
      <div className="flex flex-col gap-2 pt-2">
        <p className="font-bold">Availability</p>
        <Dropdown
          label="Select Availability"
          options={["Available", "Busy", "Inactive"]}
          selected={filters.availability}
          onSelect={handleAvailabilityChange}
        />
      </div>
    </div>
  );
}
