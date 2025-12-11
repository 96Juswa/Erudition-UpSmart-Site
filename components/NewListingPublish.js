"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronLeft, XCircle } from "lucide-react";
import Button from "@/components/Button";
import { useListingForm } from "@/app/context/ListingFormContext";
import Badge from "@/components/Badge";

const STEPS = [
  "Service Details",
  "Pricing",
  "Availability",
  "Portfolio",
  "Publish",
];

export default function NewListingPublish() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");

  const { formData } = useListingForm();
  const [loading, setLoading] = useState(false);
  const [listingData, setListingData] = useState(null);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (!listingId) return;

    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (!res.ok) {
          throw new Error("Failed to load listing data.");
        }
        const data = await res.json();
        setListingData(data);
      } catch (err) {
        console.error("Fetch listing error:", err);
        setFetchError(err.message);
      }
    };

    fetchListing();
  }, [listingId]);

  const serviceDetails = formData.serviceDetails || {
    title: "",
    description: "",
    category: "",
  };

  const pricingDetails = formData.pricing || {
    minPrice: "",
    maxPrice: "",
  };

  const availabilityLocation = formData.availability || {
    status: "",
    location: "",
  };

  const selectedPortfolioItem = formData.selectedPortfolioItem || null;

  const handleSubmit = async () => {
    if (!listingId) {
      alert("Listing ID is missing. Cannot submit listing.");
      return;
    }

    // Remove the problematic check completely

    setLoading(true);

    try {
      const payload = {
        title: serviceDetails.title, // Changed from serviceName
        description: serviceDetails.description, // Changed from serviceDescription
        categoryName: serviceDetails.category,
        minPrice: Number(pricingDetails.minPrice) || 0,
        maxPrice: Number(pricingDetails.maxPrice) || 0,
        availabilityStatus: availabilityLocation.status,
        location: availabilityLocation.location,
        status: "on_review",
        portfolioItemIds: formData.selectedPortfolioItem
          ? [formData.selectedPortfolioItem.id]
          : [],
      };

      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit listing");
      }

      alert("Your listing has been submitted for SDO approval!");
      router.push("/resolver/manage-listings");
    } catch (error) {
      console.error("Submit error:", error);
      alert(`Error submitting listing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!listingId) {
      alert("Listing ID is missing. Cannot save draft.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        serviceName: serviceDetails.title,
        serviceDescription: serviceDetails.description,
        categoryName: serviceDetails.category,
        minPrice: pricingDetails.minPrice,
        maxPrice: pricingDetails.maxPrice,
        availabilityStatus: availabilityLocation.status,
        location: availabilityLocation.location,
        status: "draft",
        portfolioItemIds: portfolioItems.map((item) => item.id),
      };

      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save draft");
      }

      alert("Draft saved successfully!");
      router.push("/resolver/manage-listings");
    } catch (error) {
      console.error("Draft save error:", error);
      alert(`Error saving draft: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  console.log("listingData", listingData);
  console.log(
    "listingData.associatedPortfolios",
    listingData?.associatedPortfolios
  );
  console.log("first item", listingData?.associatedPortfolios?.[0]);

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white-50 min-h-screen">
      {/* Step Tracker */}
      <nav aria-label="Progress" className="flex justify-center mb-8">
        <ol className="flex items-center space-x-4 overflow-x-auto p-2 bg-white rounded-lg shadow-sm">
          {STEPS.map((label, index) => (
            <li key={label} className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold ${
                  index === 4
                    ? "bg-[#094074] text-white shadow-md"
                    : index < 4
                      ? "bg-gray-200 text-gray-600"
                      : "bg-gray-200 text-gray-600 opacity-50"
                }`}
                aria-current={index === 4 ? "step" : undefined}
              >
                {index + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  index === 4 ? "text-[#094074]" : "text-gray-500"
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

      {/* Header */}
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          5. Publish Your Listing
        </h2>
        <p className="text-lg text-gray-700 max-w-2xl">
          Review your listing details below. Once confirmed, your listing will
          be submitted for SDO approval.
        </p>
      </header>

      {/* Error Display */}
      {fetchError && (
        <div className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">
          <XCircle className="w-5 h-5 mr-2" />
          <p>{fetchError}</p>
        </div>
      )}

      {/* Main Review Content */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 md:p-10 space-y-12">
          {/* Service Details Section */}
          <div className="border-b border-gray-200 pb-8">
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 bg-[#094074] rounded-full mr-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">
                Service Details
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Service Title
                </p>
                <p className="text-lg text-gray-900 font-medium">
                  {serviceDetails.title || "-"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Category
                </p>
                <p className="text-lg text-gray-900 font-medium">
                  {serviceDetails.category || "-"}
                </p>
              </div>
              <div className="lg:col-span-2 space-y-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  About this service
                </p>
                <div className="bg-white-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed">
                    {serviceDetails.description || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="border-b border-gray-200 pb-8">
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 bg-[#094074] rounded-full mr-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">Pricing</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Minimum Price
                </p>
                <p className="text-2xl text-gray-900 font-bold">
                  ₱{pricingDetails.minPrice || "0"}
                </p>
              </div>
              <div className="bg-white-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Maximum Price
                </p>
                <p className="text-2xl text-gray-900 font-bold">
                  ₱{pricingDetails.maxPrice || "0"}
                </p>
              </div>
            </div>
          </div>

          {/* Availability & Location Section */}
          <div className="border-b border-gray-200 pb-8">
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 bg-[#094074] rounded-full mr-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">
                Availability & Location
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Availability Status
                </p>
                <p className="text-lg text-gray-900 font-medium capitalize">
                  {availabilityLocation.status || "-"}
                </p>
              </div>
              <div className="bg-white-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Location
                </p>
                <p className="text-lg text-gray-900 font-medium capitalize">
                  {availabilityLocation.location || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="pb-2">
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 bg-[#094074] rounded-full mr-4"></div>
              <h3 className="text-xl font-semibold text-gray-900">Portfolio</h3>
            </div>

            {formData.selectedPortfolioItem ? (
              <div className="bg-white-50 rounded-lg overflow-hidden shadow-sm">
                {/* Portfolio Image */}
                <div className="aspect-w-16 aspect-h-12">
                  <img
                    src={
                      formData.selectedPortfolioItem.thumbnailUrl ||
                      formData.selectedPortfolioItem.fileUrls?.[0] ||
                      null
                    }
                    alt={
                      formData.selectedPortfolioItem.name || "Portfolio Item"
                    }
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      console.error("Image failed to load:", e.target.src);
                      e.target.style.display = "none";
                    }}
                  />
                </div>

                {/* Portfolio Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      {formData.selectedPortfolioItem.name || "Untitled"}
                    </h4>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium text-green-600">
                        {formData.selectedPortfolioItem.status || "APPROVED"}
                      </span>
                    </div>
                  </div>

                  {formData.selectedPortfolioItem.category && (
                    <p className="text-sm text-gray-600 mb-2">
                      category: {formData.selectedPortfolioItem.category}
                    </p>
                  )}

                  {formData.selectedPortfolioItem.description && (
                    <p className="text-sm text-gray-700 mb-3">
                      {formData.selectedPortfolioItem.description}
                    </p>
                  )}

                  <div className="flex items-center text-sm text-gray-500">
                    <span>
                      {formData.selectedPortfolioItem.fileUrls?.length || 0}{" "}
                      image
                      {formData.selectedPortfolioItem.fileUrls?.length !== 1
                        ? "s"
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500 italic">
                  No portfolio item selected.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Go back to the Portfolio step to select an item.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white-50 px-6 md:px-10 py-6 border-t border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-red-500 text-lg font-bold">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  <span className="font-semibold">Please note:</span> Your
                  listing will be submitted to the SDO for validation and
                  approval. It will not be visible to clients until approved.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <Button
              color="outline"
              className="inline-flex items-center w-full sm:w-auto"
              onClick={() => router.back()}
              disabled={loading}
            >
              <ChevronLeft className="mr-2 w-5 h-5" />
              Back
            </Button>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <Button
                color="outline"
                onClick={handleSaveDraft}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Save as Draft
              </Button>
              <Button
                className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
                onClick={handleSubmit}
                disabled={loading}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                {loading ? "Submitting..." : "Submit for Review"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
