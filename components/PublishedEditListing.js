"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useToast } from "@/components/ToastProvider";
import Button from "./Button";
import InputBox from "./InputBox";
import Textarea from "./Textarea";
import Dropdown from "./Dropdown";

const CATEGORY_OPTIONS = [
  "Freelance Work",
  "Creative Services",
  "Technical Services",
  "Educational Services",
  "Performing Arts",
];

export default function PublishedListingEdit() {
  const { id } = useParams();
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("serviceDetails");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [relatedPortfolio, setRelatedPortfolio] = useState(null);
  const [allPortfolios, setAllPortfolios] = useState([]);
  const [categories, setCategories] = useState([]);
  const { showToast } = useToast();
  const [initialListingData, setInitialListingData] = useState(null);

  // Refs for scrolling to sections
  const serviceDetailsRef = useRef(null);
  const pricingRef = useRef(null);
  const availabilityRef = useRef(null);
  const portfolioRef = useRef(null);

  const sectionRefs = {
    serviceDetails: serviceDetailsRef,
    pricing: pricingRef,
    availability: availabilityRef,
    portfolio: portfolioRef,
  };

  // Effect to fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await res.json();
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        toast.error("Failed to load categories.");
        // Fallback to CATEGORY_OPTIONS if API fails
        const fallbackCategories = CATEGORY_OPTIONS.map((name, index) => ({
          id: index + 1,
          categoryName: name,
        }));
        setCategories(fallbackCategories);
      }
    }
    fetchCategories();
  }, []);

  // Effect to fetch the main listing data
  useEffect(() => {
    async function fetchListing() {
      if (!id) {
        setLoading(false);
        toast.error("Invalid listing ID provided in URL.");
        router.push("/manage-listings");
        return;
      }
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) {
          let errorMessage = "Failed to update listing";

          try {
            const errorData = await res.json();
            console.error("Server Error Response:", errorData);
            errorMessage = errorData?.error || errorMessage;
          } catch (e) {
            console.error("Error parsing JSON response", e);
          }

          throw new Error(errorMessage);
        }
        const data = await res.json();

        // Fix the category extraction - use capital 'S' for Service
        const categoryName =
          data.Service?.Category?.categoryName || "Uncategorized";

        setInitialListingData({
          id: data.id,
          title: data.Service?.serviceName || data.title,
          description: data.Service?.description || data.description,
          category: categoryName,
          availabilityStatus: data.availabilityStatus || "available",
          location: data.location || "onsite",
          status: data.status || "published",
          priceRange: [
            Number(data.minPrice) || 0,
            Number(data.maxPrice) || 1000,
          ],
          portfolioId:
            data.ServiceListingPortfolioItem?.[0]?.Portfolio?.id || null,
        });

        // Use the Service data as the source of truth for title/name and description
        setListing({
          id: data.id,
          title: data.Service?.serviceName || data.title, // Prefer service name
          description: data.Service?.description || data.description, // Prefer service description
          category: categoryName, // Use the fixed category name
          availabilityStatus: data.availabilityStatus || "available",
          location: data.location || "onsite",
          status: data.status || "published",
        });
        setPriceRange([
          Number(data.minPrice) || 0,
          Number(data.maxPrice) || 1000,
        ]);

        // Fix portfolio extraction based on API response structure
        if (
          data.ServiceListingPortfolioItem &&
          data.ServiceListingPortfolioItem.length > 0
        ) {
          setRelatedPortfolio(data.ServiceListingPortfolioItem[0].Portfolio);
        } else {
          setRelatedPortfolio(null);
        }
      } catch (err) {
        console.error("Error fetching listing:", err);
        toast.error(err.message || "Failed to load listing.");
        router.push("/manage-listings");
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [id, router]);

  // Effect to fetch the portfolios based on the listing's category
  useEffect(() => {
    async function fetchPortfolios() {
      // Guard against running the fetch if there's no category yet
      if (!listing?.category || listing.category === "Uncategorized") {
        setAllPortfolios([]);
        return;
      }
      try {
        // The fetch URL now uses 'portfolio' (singular) as requested
        const res = await fetch(
          `/api/portfolio/by-category?category=${listing.category}`
        );
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch portfolios");
        }
        const data = await res.json();
        setAllPortfolios(data || []);
      } catch (err) {
        console.error("Failed to fetch portfolios:", err);
        toast.error(err.message || "Failed to load portfolio options.");
        setAllPortfolios([]);
      }
    }
    // Only call fetchPortfolios when a listing and category are loaded
    if (listing?.category) {
      fetchPortfolios();
    }
  }, [listing?.category]);

  // Intersection Observer for active section detection
  useEffect(() => {
    // Only set up observer when listing is loaded
    if (!listing || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -70% 0px",
      }
    );

    // Small delay to ensure DOM elements are rendered
    const timeoutId = setTimeout(() => {
      Object.values(sectionRefs).forEach((ref) => {
        if (ref.current) {
          observer.observe(ref.current);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [loading]); // Use loading state instead of listing object

  const scrollToSection = (sectionKey) => {
    const ref = sectionRefs[sectionKey];
    if (ref?.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const validateFields = () => {
    console.log("🔍 Validating fields...");
    console.log("Title:", listing?.title);
    console.log("Description:", listing?.description);
    console.log("Category:", listing?.category);

    if (!listing.title || !listing.description || !listing.category) {
      console.log("❌ Validation failed - missing required fields");
      toast.error("Please complete all required service details.");
      return false;
    }
    console.log("✅ Validation passed");
    return true;
  };

  const handleSave = async () => {
    const hasChanges =
      listing.title !== initialListingData.title ||
      listing.description !== initialListingData.description ||
      listing.category !== initialListingData.category ||
      listing.availabilityStatus !== initialListingData.availabilityStatus ||
      listing.location !== initialListingData.location ||
      // priceRange array comparison:
      priceRange[0] !== initialListingData.priceRange?.[0] ||
      priceRange[1] !== initialListingData.priceRange?.[1] ||
      // portfolio id comparison:
      (relatedPortfolio?.id || null) !== initialListingData.portfolioId;

    if (!hasChanges) {
      showToast("No changes to save", "info");
      console.log("⚠️ No changes detected - skipping PATCH.");
      return;
    }

    console.log("🔥 SAVE BUTTON CLICKED!");
    console.log("Current listing:", listing);

    if (!listing) {
      console.log("❌ No listing found, returning early");
      return;
    }

    // Validate fields before saving
    if (!validateFields()) {
      console.log("❌ Validation failed, returning early");
      return;
    }

    console.log("✅ Validation passed, proceeding with save...");

    try {
      const payload = {
        // Service table
        serviceName: listing.title,
        serviceDescription: listing.description,
        categoryName:
          typeof listing.category === "string"
            ? listing.category
            : listing.category?.categoryName || "",

        // ServiceListing table
        title: listing.title,
        description: listing.description,
        minPrice: priceRange?.[0] ?? 0,
        maxPrice: priceRange?.[1] ?? 0,
        availabilityStatus: listing.availabilityStatus,
        location: listing.location,
        status: hasChanges ? "on_review" : listing.status,

        // Portfolio relation
        portfolioItemIds: relatedPortfolio ? [relatedPortfolio.id] : [],
      };

      console.log("Payload being sent:", payload);

      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status);

      if (!res.ok) {
        let errorMessage = "Failed to update listing";

        try {
          const errorData = await res.json();
          console.error("Server Error Response:", errorData);
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }

        throw new Error(errorMessage);
      }

      const responseData = await res.json();
      console.log("Update successful:", responseData);

      showToast("Listing updated successfully", "success");

      // Don't reload the page yet - let's see what happens
      console.log("✅ Save completed successfully!");
    } catch (err) {
      console.error("Update error:", err);
      showToast("Failed to load listing.", "danger");
    }
  };

  const handleCancel = () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel? Any unsaved changes will be lost."
    );
    if (confirmed) {
      router.push("/resolver/manage-listings");
    }
  };

  const selectPortfolio = (item) => {
    setRelatedPortfolio(item.id === relatedPortfolio?.id ? null : item);
  };

  if (loading || !listing) {
    return <div className="p-4 text-gray-700">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white-50 p-4 sm:p-8 font-inter">
      <div className="min-h-screen bg-white p-8 rounded-lg shadow-sm max-w-8xl mx-auto mt-6">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-12">
          {/* Sidebar Navigation */}
          <div className="space-y-3 md:sticky md:top-28 self-start h-fit">
            {[
              { key: "serviceDetails", label: "Service Details" },
              { key: "pricing", label: "Pricing & Delivery" },
              { key: "availability", label: "Availability" },
              { key: "portfolio", label: "Portfolio" },
            ].map(({ key, label }) => (
              <div
                key={key}
                onClick={() => scrollToSection(key)}
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ease-in-out
                  ${
                    activeSection === key
                      ? "bg-[#094074] text-white shadow-lg transform translate-x-1"
                      : "bg-white text-gray-700 hover:bg-gray-100 hover:shadow-md border border-gray-200"
                  }`}
              >
                <h3 className="font-medium text-lg capitalize flex-grow">
                  {label}
                </h3>
                {activeSection === key && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-auto"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="md:col-span-1 space-y-12 flex flex-col ">
            {/* Service Details Section */}
            <div
              id="serviceDetails"
              ref={serviceDetailsRef}
              className="scroll-mt-24"
            >
              <div className="bg-white-50 rounded-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Edit Service Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <InputBox
                      rows={2}
                      maxLength={80}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:ring-[#094074] focus:border-[#094074] transition duration-150 ease-in-out resize-none"
                      value={listing.title || ""}
                      onChange={(e) =>
                        setListing({ ...listing, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Textarea
                      rows={5}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:ring-[#094074] focus:border-[#094074] transition duration-150 ease-in-out resize-none"
                      value={listing.description || ""}
                      onChange={(e) =>
                        setListing({ ...listing, description: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <Dropdown
                      label="Select a category"
                      options={[
                        { id: "empty", categoryName: "" },
                        ...categories,
                      ]}
                      selected={categories.find(
                        (cat) => cat.categoryName === listing.category
                      )}
                      onSelect={(option) =>
                        setListing((prev) => ({
                          ...prev,
                          category: option.categoryName,
                        }))
                      }
                      getLabel={(opt) => opt?.categoryName || opt?.label || ""}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div id="pricing" ref={pricingRef} className="scroll-mt-24">
              <div className="bg-white-50 rounded-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Edit Pricing & Delivery
                </h2>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Price Range:
                    <span className="font-semibold text-gray-900 ml-1">
                      ₱{priceRange[0]} - ₱{priceRange[1]}
                    </span>
                  </label>

                  {/* Min Price Row */}
                  <div className="flex items-center gap-4 w-full">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={priceRange[0]}
                      onChange={(e) => {
                        const newMin = Number(e.target.value);
                        setPriceRange([
                          newMin,
                          Math.max(newMin, priceRange[1]),
                        ]);
                      }}
                      className="flex-grow accent-[#094074] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center gap-2 w-40">
                      <span className="text-gray-700 font-bold">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceRange[0]}
                        onChange={(e) => {
                          const newMin = Number(e.target.value);
                          setPriceRange([
                            newMin,
                            Math.max(newMin, priceRange[1]),
                          ]);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        required
                      />
                      <span className="text-gray-600 text-sm whitespace-nowrap">
                        Min.
                      </span>
                    </div>
                  </div>

                  {/* Max Price Row */}
                  <div className="flex items-center gap-4 w-full">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => {
                        const newMax = Number(e.target.value);
                        setPriceRange([
                          Math.min(priceRange[0], newMax),
                          newMax,
                        ]);
                      }}
                      className="flex-grow accent-[#094074] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center gap-2 w-40">
                      <span className="text-gray-700 font-bold">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceRange[1]}
                        onChange={(e) => {
                          const newMax = Number(e.target.value);
                          setPriceRange([
                            Math.min(priceRange[0], newMax),
                            newMax,
                          ]);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        required
                      />
                      <span className="text-gray-600 text-sm whitespace-nowrap">
                        Max.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Availability Section */}
            <div
              id="availability"
              ref={availabilityRef}
              className="scroll-mt-24"
            >
              <div className="bg-white-50 rounded-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Edit Availability
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Availability Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Availability Status
                    </label>
                    <Dropdown
                      label="Select availability"
                      options={[
                        { id: "available", label: "Available" },
                        { id: "busy", label: "Busy" },
                        { id: "inactive", label: "Inactive" },
                      ]}
                      selected={{
                        id: listing.availabilityStatus || "available",
                        label: {
                          available: "Available",
                          busy: "Busy",
                          inactive: "Inactive",
                        }[listing.availabilityStatus || "available"],
                      }}
                      onSelect={(option) =>
                        setListing((prev) => ({
                          ...prev,
                          availabilityStatus: option.id,
                        }))
                      }
                      getLabel={(opt) => opt?.label || ""}
                    />
                  </div>
                  {/* Service Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Location
                    </label>
                    <Dropdown
                      label="Select location"
                      options={[
                        { id: "onsite", label: "Onsite" },
                        { id: "offsite", label: "Offsite" },
                      ]}
                      selected={{
                        id: listing.location || "onsite",
                        label: {
                          onsite: "Onsite",
                          offsite: "Offsite",
                        }[listing.location || "onsite"],
                      }}
                      onSelect={(option) =>
                        setListing((prev) => ({
                          ...prev,
                          location: option.id,
                        }))
                      }
                      getLabel={(opt) => opt?.label || ""}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Section */}
            <div id="portfolio" ref={portfolioRef} className="scroll-mt-24">
              <div className="bg-white-50 rounded-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Associate One Approved Portfolio
                </h2>
                {allPortfolios.length === 0 ? (
                  <div className="text-base text-gray-500 p-4 border border-gray-200 rounded-lg bg-white">
                    No approved portfolio items found for the selected category.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {allPortfolios.map((item) => {
                      const selected = relatedPortfolio?.id === item.id;

                      // 🔹 Find thumbnail dynamically
                      const thumbnailFile =
                        item.portfolioFiles?.find((f) => f.isThumbnail) ||
                        item.portfolioFiles?.[0] ||
                        null;

                      const imageUrl = thumbnailFile?.url || null;

                      return (
                        <div
                          key={item.id}
                          onClick={() => selectPortfolio(item)}
                          className={`border border-gray-200 rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-[1.03] ${
                            selected
                              ? "ring-2 ring-[#094074] bg-[#094074]/10 border-[#094074]"
                              : "hover:shadow-md bg-white"
                          }`}
                        >
                          <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.itemName || "Portfolio Image"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>No Image</span>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="font-semibold text-sm text-gray-800 truncate mb-1">
                              {item.itemName || "Untitled Portfolio Item"}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-3">
                              {item.description || "No description provided."}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto flex justify-end gap-3 pt-6">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-lg text-base border border-gray-300 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition duration-150 ease-in-out shadow-sm"
              >
                Close
              </button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("🔥 SAVE BUTTON CLICKED - ONCLICK FIRED!");
                  handleSave();
                }}
                className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
              >
                Save All Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
