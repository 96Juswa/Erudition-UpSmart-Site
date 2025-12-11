"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import Button from "@/components/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { useListingForm } from "@/app/context/ListingFormContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const STEPS = [
  "Service Details",
  "Pricing",
  "Availability",
  "Portfolio",
  "Publish",
];

export default function NewListingPricing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");

  const { currentUser, loading: userLoading } = useCurrentUser();
  const { updateFormSection } = useListingForm();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [localMinPrice, setLocalMinPrice] = useState("");
  const [localMaxPrice, setLocalMaxPrice] = useState("");

  useEffect(() => {
    if (!listingId) {
      router.push("/new-listing-service-details");
      return;
    }

    const parsedListingId = Number(listingId);
    if (isNaN(parsedListingId)) {
      setError("Invalid listing ID. Please start from the first step.");
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/listings/${parsedListingId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to load listing");
        }

        const data = await res.json();
        if (data?.minPrice !== undefined && data.minPrice !== null)
          setLocalMinPrice(String(data.minPrice));
        if (data?.maxPrice !== undefined && data.maxPrice !== null)
          setLocalMaxPrice(String(data.maxPrice));
      } catch (err) {
        setError(err.message || "Error loading listing.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [listingId, router]);

  const isInvalidRange =
    !localMinPrice ||
    !localMaxPrice ||
    Number(localMinPrice) > Number(localMaxPrice) ||
    Number(localMinPrice) < 0 ||
    Number(localMaxPrice) < 0 ||
    Number(localMinPrice) > 10000 ||
    Number(localMaxPrice) > 10000;

  const handleMinPriceChange = (value) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      const min = Number(value);
      const max = Number(localMaxPrice);

      setLocalMinPrice(value);
      if (value !== "" && !isNaN(min) && !isNaN(max) && min > max) {
        setLocalMaxPrice(value);
      }
    }
  };

  const handleMaxPriceChange = (value) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      const max = Number(value);
      const min = Number(localMinPrice);

      setLocalMaxPrice(value);
      if (value !== "" && !isNaN(max) && !isNaN(min) && max < min) {
        setLocalMinPrice(value);
      }
    }
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    setError(null);

    if (userLoading || !currentUser?.email) {
      setError("User not authenticated. Please log in again.");
      return;
    }

    const parsedListingId = Number(listingId);
    if (!listingId || isNaN(parsedListingId)) {
      setError("Missing or invalid listing ID.");
      return;
    }

    if (
      isNaN(Number(localMinPrice)) ||
      isNaN(Number(localMaxPrice)) ||
      isInvalidRange
    ) {
      setError(
        "Invalid price format or range. Ensure numbers are valid and the minimum is not greater than the maximum."
      );
      return;
    }

    setLoading(true);

    try {
      updateFormSection("pricing", {
        minPrice: localMinPrice,
        maxPrice: localMaxPrice,
      });

      const res = await fetch(`/api/listings/${parsedListingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minPrice: parseFloat(localMinPrice).toFixed(2),
          maxPrice: parseFloat(localMaxPrice).toFixed(2),
          status: "draft",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update listing.");
      }

      await res.json();
      router.push(
        `/resolver/new-listing/availability-status?listingId=${parsedListingId}`
      );
    } catch (err) {
      setError(err.message || "Unexpected error during update.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/resolver/new-listing/service-details?listingId=${listingId}`);
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading user...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white-50 min-h-screen">
      <nav aria-label="Progress" className="flex justify-center mb-8">
        <ol className="flex items-center space-x-4 overflow-x-auto p-2 bg-white rounded-lg shadow-sm">
          {STEPS.map((label, index) => (
            <li key={label} className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold ${
                  index === 1
                    ? "bg-[#094074] text-white shadow-md"
                    : index < 1
                      ? "bg-gray-200 text-gray-600"
                      : "bg-gray-200 text-gray-600 opacity-50"
                }`}
                aria-current={index === 1 ? "step" : undefined}
              >
                {index + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  index === 1 ? "text-[#094074]" : "text-gray-500"
                } whitespace-nowrap`}
              >
                {label}
              </span>
              {index < STEPS.length - 1 && (
                <div className="w-8 border-t-2 border-gray-300 mx-2" />
              )}
            </li>
          ))}
        </ol>
      </nav>

      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          2. Pricing
        </h2>
        <p className="text-lg text-gray-700">
          Set your price range and describe how you'll deliver your service.
        </p>
      </header>

      {error && (
        <div className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">
          <XCircle className="w-5 h-5 mr-2" />
          <p>{error}</p>
        </div>
      )}

      <form
        onSubmit={handleContinue}
        className="bg-white p-6 md:p-10 rounded-xl shadow-lg space-y-8"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Price Range <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-4 max-w-md">
              Indicate the minimum and maximum amount you typically charge.
            </p>

            <div className="flex flex-col space-y-6">
              {/* Max */}
              <div className="flex items-center gap-4 w-full">
                {/* Slider */}
                <input
                  type="range"
                  min={Number(localMinPrice) || 0}
                  max="10000"
                  value={localMaxPrice}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  className="flex-grow accent-[#094074] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                {/* Input */}
                <div className="flex items-center gap-2 w-40">
                  <span className="text-gray-700 font-bold">₱</span>
                  <input
                    type="number"
                    min={Number(localMinPrice) || 0}
                    step="0.01"
                    value={localMaxPrice}
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                  />
                  <span className="text-gray-600 text-sm whitespace-nowrap">
                    Max.
                  </span>
                </div>
              </div>

              {/* Min */}
              <div className="flex items-center gap-4 w-full">
                {/* Slider */}
                <input
                  type="range"
                  min="0"
                  max={Number(localMaxPrice) || 10000}
                  value={localMinPrice}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  className="flex-grow accent-[#094074] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                {/* Input */}
                <div className="flex items-center gap-2 w-40">
                  <span className="text-gray-700 font-bold">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={localMinPrice}
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                  />
                  <span className="text-gray-600 text-sm whitespace-nowrap">
                    Min.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="pt-8 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-red-600">
            ⚠️ Service listings are subject to SDO review and approval.
          </p>
          <div className="flex space-x-4">
            <Button
              color="outline"
              type="button"
              onClick={handleBack}
              disabled={loading}
            >
              <ChevronLeft className="mr-2 w-5 h-5" />
              Back
            </Button>

            <Button
              type="submit"
              className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
              disabled={loading || isInvalidRange}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  Save & Continue <ChevronRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  );
}
