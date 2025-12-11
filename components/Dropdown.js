"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function Dropdown({
  label = "Select an option",
  options = [],
  selected,
  onSelect,
  onBlur,
  error = "",
  touched = false,
  className = "",
  getLabel = (opt) => (typeof opt === "string" ? opt : opt?.categoryName || ""),
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isInvalid = touched && error;

  const handleSelect = (option) => {
    onSelect(option); // ✅ pass full object
    setIsOpen(false);
  };

  const handleBlur = () => {
    if (selected && selected.id) return; // ✅ Skip validation if already selected
    if (onBlur) onBlur();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        handleBlur();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSelectedLabel = () => {
    return selected ? getLabel(selected) : label;
  };

  const isSelected = (option) => {
    if (!selected) return false;
    return selected.id === option.id; // ✅ compare by ID
  };

  return (
    <div
      className={`relative w-full ${className}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex justify-between items-center px-4 py-2 rounded-md text-sm transition focus:outline-none focus:ring-2
          ${
            isInvalid
              ? "bg-red-50 border border-red-600 text-red-900 placeholder-red-700 focus:ring-red-300 focus:border-red-300"
              : "bg-gray-50 border border-gray-300 text-gray-900 focus:ring-[#094074] focus:border-[#094074] hover:bg-[#f0f6fb]"
          }`}
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? getLabel(selected) : label}
        </span>
        <ChevronDown
          className={`w-4 h-4 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <ul className="absolute z-10 mt-2 w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md shadow-md max-h-60 overflow-y-auto">
          {options.map((option) => {
            console.log(
              "Rendering option:",
              option,
              "Label:",
              getLabel(option)
            );
            return (
              <li
                key={`dropdown-option-${option.id ?? getLabel(option)}`}
                onClick={() => handleSelect(option)}
                className={`px-4 py-2 text-sm text-[#094074] hover:bg-[#094074] hover:text-white cursor-pointer ${
                  isSelected(option) ? "bg-[#e6f0fa] font-semibold" : ""
                }`}
              >
                {getLabel(option)}
              </li>
            );
          })}
        </ul>
      )}

      {isInvalid && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
