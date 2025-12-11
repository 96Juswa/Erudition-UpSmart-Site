"use client";

import { createContext, useContext, useState } from "react";

const ListingFormContext = createContext();

export function ListingFormProvider({ children }) {
  const [formData, setFormData] = useState({
    serviceDetails: null,
    pricing: null,
    availability: null,
    portfolio: null,
    publish: null,
  });

  const updateFormSection = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  return (
    <ListingFormContext.Provider value={{ formData, updateFormSection }}>
      {children}
    </ListingFormContext.Provider>
  );
}

export function useListingForm() {
  const context = useContext(ListingFormContext);
  if (!context) {
    throw new Error("useListingForm must be used within a ListingFormProvider");
  }
  return context;
}
