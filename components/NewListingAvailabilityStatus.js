"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { useListingForm } from "@/app/context/ListingFormContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Dropdown from "./Dropdown";
const STEPS = [
  "Service Details",
  "Pricing",
  "Availability",
  "Portfolio",
  "Publish",
];

export default function NewListingAvailabilityStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const { updateFormSection } = useListingForm();
  const { currentUser, loading: userLoading } = useCurrentUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localStatus, setLocalStatus] = useState("available");
  const [localLocation, setLocalLocation] = useState("offsite");
  const [hasSynced, setHasSynced] = useState(false);
  useEffect(() => {
    if (!listingId || hasSynced) return;

    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (!res.ok) throw new Error("Failed to fetch listing.");

        const data = await res.json();

        setLocalStatus(data.availabilityStatus || "available");
        setLocalLocation(data.location || "offsite");

        updateFormSection("availability", {
          status: data.availabilityStatus || "available",
          location: data.location || "offsite",
        });

        setHasSynced(true);
      } catch (err) {
        console.error("Error loading availability:", err);
        setError("Failed to load availability settings.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [listingId, hasSynced]);

  const getIndicatorColorClass = () => {
    switch (localStatus) {
      case "available":
        return "bg-green-500";
      case "busy":
        return "bg-orange-500";
      case "inactive":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getAvailabilityMessage = () => {
    switch (localStatus) {
      case "available":
        return "You are accepting new service requests.";
      case "busy":
        return "You are currently busy and may decline new requests.";
      case "inactive":
        return "You are not accepting service bookings right now.";
      default:
        return "";
    }
  };

  const handleSaveAndContinue = async () => {
    if (!listingId || !currentUser?.email) {
      setError("Missing listing ID or user session.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityStatus: localStatus,
          location: localLocation,
        }),
      });

      if (!res.ok) throw new Error("Failed to update availability.");
      await res.json();

      updateFormSection("availability", {
        status: localStatus,
        location: localLocation,
      });

      router.push(`portfolio?listingId=${listingId}`);
    } catch (err) {
      console.error("Availability update error:", err);
      setError(err.message || "Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/resolver/new-listing/pricing?listingId=${listingId}`);
  };

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white-50 min-h-screen">
      {/* Progress Stepper */}
      <nav className="flex justify-center mb-8">
        <ol className="flex items-center space-x-4 overflow-x-auto p-2 bg-white rounded-lg shadow-sm">
          {STEPS.map((label, index) => (
            <li key={label} className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold ${
                  index === 2
                    ? "bg-[#094074] text-white shadow-md"
                    : index < 2
                      ? "bg-gray-200 text-gray-600"
                      : "bg-gray-200 text-gray-600 opacity-50"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  index === 2 ? "text-[#094074]" : "text-gray-500"
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
      <header>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          3. Availability & Location
        </h2>
        <p className="text-lg text-gray-700">
          Indicate your current availability and how your services are
          delivered.
        </p>
      </header>

      {error && (
        <div className="text-red-700 bg-red-100 border border-red-300 p-4 rounded">
          {error}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveAndContinue();
        }}
        className="bg-white p-6 md:p-10 rounded-xl shadow-lg space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Availability Status
            </label>
            <div className="flex items-center mb-2">
              <span
                className={`w-3 h-3 rounded-full mr-2 ${getIndicatorColorClass()}`}
              ></span>
              <p className="text-sm text-gray-600">
                {getAvailabilityMessage()}
              </p>
            </div>
            <Dropdown
              options={[
                { value: "available", label: "Available" },
                { value: "busy", label: "Busy" },
                { value: "inactive", label: "Inactive" },
              ]}
              selected={{
                value: localStatus,
                label:
                  localStatus === "available"
                    ? "Available"
                    : localStatus === "busy"
                      ? "Busy"
                      : "Inactive",
              }}
              onSelect={(option) => setLocalStatus(option.value)}
              getLabel={(opt) => opt.label}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Service Location
            </label>
            <p className="text-sm text-gray-600 mb-2">
              {localLocation === "offsite"
                ? "Offsite: service delivered remotely."
                : "Onsite: service provided in person."}
            </p>
            <Dropdown
              options={[
                { value: "offsite", label: "Offsite" },
                { value: "onsite", label: "Onsite" },
              ]}
              selected={{
                value: localLocation,
                label: localLocation === "offsite" ? "Offsite" : "Onsite",
              }}
              onSelect={(option) => setLocalLocation(option.value)}
              getLabel={(opt) => opt.label}
              className="w-full"
            />
          </div>
        </div>

        <footer className="pt-8 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-red-600">
            ⚠️ Service listings are subject to SDO review and approval.
          </p>
          <div className="flex space-x-4">
            <Button color="outline" onClick={handleBack} disabled={loading}>
              <ChevronLeft className="mr-2 w-5 h-5" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
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
