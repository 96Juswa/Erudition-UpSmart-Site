"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import { useListingForm } from "@/app/context/ListingFormContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { debounce } from "lodash";
import InputBox from "./InputBox";
import Textarea from "./Textarea";
import Dropdown from "./Dropdown";

const STEPS = [
  "Service Details",
  "Pricing",
  "Availability",
  "Portfolio",
  "Publish",
];

export default function NewListingServiceDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawParam = searchParams.get("listingId");

  const { currentUser, loading: userLoading } = useCurrentUser(); // ✅ get user
  const { updateFormSection } = useListingForm();

  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [localTitle, setLocalTitle] = useState("");
  const [localCategory, setLocalCategory] = useState("");
  const [localDescription, setLocalDescription] = useState("");

  useEffect(() => {
    if (rawParam) {
      localStorage.setItem("activeListingId", rawParam);
    } else {
      localStorage.removeItem("activeListingId");
    }
  }, [rawParam]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch categories");
        }
        const data = await res.json();
        setAvailableCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try refreshing the page.");
      }
    }
    fetchCategories();
  }, []);

  // Debounced PATCH function
  const patchListing = debounce(async (field, value) => {
    if (!rawParam) return;

    let bodyData = {};

    bodyData[field] = value;

    try {
      await fetch(`/api/listings/${rawParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
    } catch (error) {
      console.error(`Auto-save failed for ${field}:`, error);
    }
  }, 800);

  useEffect(() => {
    if (!rawParam) return;

    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${rawParam}`);
        if (!res.ok) throw new Error("Failed to load existing draft");

        const data = await res.json();

        setLocalTitle(data.service?.serviceName || data.title || "");
        setLocalCategory(data.service?.category?.categoryName || "");
        setLocalDescription(
          data.service?.description || data.description || ""
        );
      } catch (err) {
        console.error("Error loading saved draft:", err);
        setError(
          "Failed to load saved listing. You can continue or start over."
        );
      }
    }

    fetchListing();
  }, [rawParam]);

  const handleSaveAndContinue = async () => {
    setError(null);

    if (!localTitle || !localDescription || !localCategory) {
      setError("Please fill in all required fields.");
      return;
    }

    if (userLoading || !currentUser?.email) {
      setError("User not authenticated. Please try logging in again.");
      return;
    }

    setLoading(true);

    try {
      const body = JSON.stringify({
        title: localTitle,
        serviceName: localTitle, // 👈 ADD THIS
        serviceDescription: localDescription,
        categoryName: localCategory,
        status: "draft",
      });

      const url = rawParam ? `/api/listings/${rawParam}` : "/api/listings";
      const method = rawParam ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || `Failed to save listing (Status: ${res.status})`
        );
      }

      const saved = await res.json();

      updateFormSection("serviceDetails", {
        title: localTitle,
        description: localDescription,
        category: localCategory,
      });

      localStorage.setItem("activeListingId", saved.id);
      router.push(`/resolver/new-listing/pricing?listingId=${saved.id}`);
    } catch (err) {
      console.error("Error saving listing:", err);
      setError(
        err.message || "An unexpected error occurred while saving your listing."
      );
    } finally {
      setLoading(false);
    }
  };

  // Show nothing until current user is loaded
  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading user...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white-50 min-h-screen">
      {/* Progress Nav */}
      <nav aria-label="Progress" className="flex justify-center mb-8">
        <ol className="flex items-center space-x-4 overflow-x-auto p-2 bg-white rounded-lg shadow-sm">
          {STEPS.map((label, index) => (
            <li key={label} className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold ${
                  index === 0
                    ? "bg-[#094074] text-white shadow-md"
                    : "bg-gray-200 text-gray-600"
                }`}
                aria-current={index === 0 ? "step" : undefined}
              >
                {index + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  index === 0 ? "text-[#094074]" : "text-gray-500"
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
          1. Service Details
        </h2>
        <p className="text-lg text-gray-700">
          Provide a clear and descriptive title, choose the most suitable
          category, and describe your service so clients know exactly what to
          expect.
        </p>
      </header>

      {error && (
        <div
          className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6"
          role="alert"
        >
          <XCircle className="w-5 h-5 mr-2" />
          <p>{error}</p>
        </div>
      )}

      {/* FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveAndContinue();
        }}
        className="bg-white p-6 md:p-10 rounded-xl shadow-lg space-y-8"
      >
        {/* Service Title */}
        <div>
          <InputBox
            name="service-title"
            label="Service Title"
            required={true}
            value={localTitle}
            onChange={(e) => {
              setLocalTitle(e.target.value);
              patchListing("title", e.target.value);
              patchListing("serviceName", e.target.value);
            }}
            placeholder="e.g. I will design UI UX for mobile app with Figma"
            maxLength={80}
          />
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-800 mb-2"
          >
            Category <span className="text-red-500">*</span>
          </label>
          <Dropdown
            selected={availableCategories.find(
              (cat) => cat.categoryName === localCategory
            )}
            onSelect={(option) => {
              // option is the full object from Dropdown
              const categoryName = option?.categoryName || option?.value || "";
              setLocalCategory(categoryName);
              patchListing("categoryName", categoryName);
            }}
            options={[
              { id: "empty", categoryName: "", label: "SELECT A CATEGORY" },
              ...availableCategories,
            ]}
            getLabel={(opt) => opt?.categoryName || opt?.label || ""}
            className="w-full"
          />
        </div>

        {/* Description */}
        <div>
          <Textarea
            name="description"
            label="About this service"
            required={true}
            value={localDescription}
            onChange={(e) => {
              setLocalDescription(e.target.value);
              patchListing("description", e.target.value);
            }}
            placeholder="Highlight your scope of work and availability..."
            rows={10}
            maxLength={500}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {localDescription.length}/500
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-red-600">
            ⚠️ Service listings are subject to SDO review and approval.
          </p>
          <Button
            type="submit"
            className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
            disabled={loading}
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                Save & Continue <ChevronRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </footer>
      </form>
    </div>
  );
}
