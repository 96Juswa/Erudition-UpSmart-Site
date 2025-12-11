"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Upload,
  X,
  Eye,
  Star,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Button from "@/components/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { useListingForm } from "@/app/context/ListingFormContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Dropdown from "./Dropdown";
import InputBox from "./InputBox";
import Textarea from "./Textarea";
import Badge from "./Badge";

const STEPS = [
  "Service Details",
  "Pricing",
  "Availability",
  "Portfolio",
  "Publish",
];

export default function NewListingPortfolio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");

  const { formData, updateFormSection } = useListingForm();
  const selectedPortfolioItem = formData.selectedPortfolioItem || null;

  const { currentUser, loading: userLoading } = useCurrentUser();
  const resolverId = currentUser?.userId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Portfolio management states
  const [portfolioData, setPortfolioData] = useState({});
  const [categories, setCategories] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Create new portfolio form state
  const [newPortfolioForm, setNewPortfolioForm] = useState({
    category: "",
    itemName: "",
    description: "",
    files: [],
    thumbnailUrl: null,
  });

  const dropdownRefs = useRef({});

  // Fetch categories on component mount - FIXED TO MATCH ManagePortfolio.js
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Categories data:", data); // Debug log
        setCategories(data); // This is correct - data is array of {id, categoryName} objects
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        toast.error("Failed to load categories for the form.");
      }
    };
    fetchCategories();
  }, []);

  // Fetch portfolio items when user is available
  useEffect(() => {
    if (!userLoading && currentUser && resolverId) {
      fetchPortfolioItems();
    }
  }, [userLoading, currentUser, resolverId]);

  const fetchPortfolioItems = async () => {
    if (!resolverId) {
      toast.info("User not loaded. Cannot fetch portfolio items.");
      return;
    }

    try {
      const response = await fetch(`/api/portfolio`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to fetch portfolio items: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Raw portfolio data:", data); // Debug log

      // FIXED: Categorize portfolio data with proper thumbnail handling
      const categorizedData = data.reduce((acc, item) => {
        const categoryName = item.category?.categoryName || "Uncategorized";

        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }

        acc[categoryName].push({
          ...item,
          PortfolioFile:
            item.portfolioFiles?.map((file) => ({
              ...file,
              isThumbnail: file.isThumbnail,
            })) || [],
          // FIXED: Ensure thumbnailUrl is properly set
          thumbnailUrl:
            item.portfolioFiles?.find((f) => f.isThumbnail === true)?.url ||
            (item.portfolioFiles && item.portfolioFiles.length > 0
              ? item.portfolioFiles[0].url
              : null),
        });

        return acc;
      }, {});

      console.log("Categorized portfolio data:", categorizedData); // Debug log
      setPortfolioData(categorizedData);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error(err.message || "Failed to fetch portfolio items.");
    }
  };

  const handleSelectImportedItem = (item) => {
    console.log("Selecting portfolio item:", item); // Debug log

    const itemFileUrls = Array.isArray(item.portfolioFiles)
      ? item.portfolioFiles.map((file) => file.url)
      : [];

    // FIXED: Ensure proper thumbnail URL handling
    const thumbnailUrl =
      item.portfolioFiles?.find((f) => f.isThumbnail === true)?.url ||
      (item.portfolioFiles && item.portfolioFiles.length > 0
        ? item.portfolioFiles[0].url
        : null);

    const selectedItem = {
      id: item.id,
      name: item.itemName || "Untitled",
      fileUrls: itemFileUrls,
      category: item.category?.categoryName || "",
      description: item.description || "",
      status: item.status,
      thumbnailUrl: thumbnailUrl,
    };

    console.log("Selected portfolio item structure:", selectedItem); // Debug log

    updateFormSection("selectedPortfolioItem", selectedItem);

    setCurrentImageIndex(0);
    setIsImportModalOpen(false);
    toast.success(`'${item.itemName || "Item"}' selected for listing!`);
  };

  const handleRemoveSelectedItem = () => {
    updateFormSection("selectedPortfolioItem", null);
    setCurrentImageIndex(0);
    toast.info("Portfolio item removed from selection.");
  };

  const handleNewPortfolioFileChange = (e) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => {
        file.preview = URL.createObjectURL(file);
        return file;
      });

    if (newFiles.length < e.target.files.length) {
      toast.warn("Only image files are allowed. Some files were ignored.");
    }

    setNewPortfolioForm((prev) => {
      const updatedFiles = [...prev.files, ...newFiles];
      let newThumbnail = prev.thumbnailUrl;

      // Set first file as thumbnail if none selected
      if (!prev.thumbnailUrl && updatedFiles.length > 0) {
        newThumbnail = updatedFiles[0].preview;
      }

      return {
        ...prev,
        files: updatedFiles,
        thumbnailUrl: newThumbnail,
      };
    });
  };

  const handleRemoveNewPortfolioFile = (fileToRemove) => {
    setNewPortfolioForm((prev) => {
      const updatedFiles = prev.files.filter((file) => file !== fileToRemove);

      // Clean up object URL
      URL.revokeObjectURL(fileToRemove.preview);

      let newThumbnail = prev.thumbnailUrl;

      // Update thumbnail if the removed file was the thumbnail
      if (prev.thumbnailUrl === fileToRemove.preview) {
        newThumbnail = updatedFiles.length > 0 ? updatedFiles[0].preview : null;
      }

      return {
        ...prev,
        files: updatedFiles,
        thumbnailUrl: newThumbnail,
      };
    });
  };

  const handleSetNewThumbnail = (file) => {
    setNewPortfolioForm((prev) => {
      const updatedFiles = [file, ...prev.files.filter((f) => f !== file)];
      return {
        ...prev,
        files: updatedFiles,
        thumbnailUrl: file.preview,
      };
    });
  };

  const handleCreateNewPortfolioSubmit = async (e) => {
    e.preventDefault();
    const { category, itemName, description, files } = newPortfolioForm;

    if (!itemName || !category || files.length === 0) {
      toast.error(
        "Please fill all required fields and upload at least one file."
      );
      return;
    }

    if (!resolverId) {
      toast.error("User not authenticated. Cannot create portfolio item.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("categoryName", category);
    formDataToSend.append("itemName", itemName);
    formDataToSend.append("description", description || "");

    // Handle thumbnail
    let thumbnailIdentifier = null;
    if (newPortfolioForm.thumbnailUrl) {
      const thumbnailFileIndex = files.findIndex(
        (file) => file.preview === newPortfolioForm.thumbnailUrl
      );
      if (thumbnailFileIndex >= 0) {
        thumbnailIdentifier = `NEW_FILE_${thumbnailFileIndex}`;
      }
    }
    formDataToSend.append("thumbnailUrl", thumbnailIdentifier || "");

    files.forEach((file) => formDataToSend.append("newFiles", file));

    try {
      setLoading(true);
      const res = await fetch("/api/portfolio", {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || `Failed to create new portfolio: ${res.status}`
        );
      }

      const data = await res.json();

      const newFileUrls = Array.isArray(data.PortfolioFile)
        ? data.PortfolioFile.map((file) => file.url)
        : [];

      // Select the newly created item
      updateFormSection("selectedPortfolioItem", {
        id: data.id,
        name: data.itemName,
        fileUrls: newFileUrls,
        category: category,
        description: description || "",
        status: data.status,
        thumbnailUrl:
          data.PortfolioFile?.find((f) => f.isThumbnail)?.url || null,
      });

      // Reset form and close modal
      setNewPortfolioForm({
        category: "",
        itemName: "",
        description: "",
        files: [],
        thumbnailUrl: null,
      });
      setIsCreateModalOpen(false);
      setCurrentImageIndex(0);

      // Refresh portfolio data to reflect changes in ManagePortfolio
      await fetchPortfolioItems();

      toast.success("New portfolio item created and selected for listing!");
    } catch (err) {
      console.error("Create portfolio error:", err);
      toast.error(err.message || "Failed to create portfolio item.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!listingId) {
      toast.error("Missing listing ID. Please go back and select a listing.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: formData.serviceDetails?.title || "",
        description: formData.serviceDetails?.description || "",
        serviceId: formData.serviceDetails?.serviceId,
        categoryName: formData.serviceDetails?.categoryName || "",
        minPrice: formData.pricingDelivery?.minPrice,
        maxPrice: formData.pricingDelivery?.maxPrice,
        location: formData.pricingDelivery?.location,
        availabilityStatus: formData.availability?.status,
        portfolioItemIds: selectedPortfolioItem
          ? [selectedPortfolioItem.id]
          : [],
        status: formData.status || "draft",
      };

      // Convert string numbers to numbers
      if (typeof payload.minPrice === "string")
        payload.minPrice = Number(payload.minPrice);
      if (typeof payload.maxPrice === "string")
        payload.maxPrice = Number(payload.maxPrice);
      if (
        payload.serviceId !== undefined &&
        typeof payload.serviceId === "string"
      ) {
        payload.serviceId = Number(payload.serviceId);
      }

      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([key, value]) => {
          if (key === "resolverEmail") return false;
          return value !== undefined && value !== null;
        })
      );

      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || `Failed to save listing data: ${res.status}`
        );
      }

      toast.success("Listing data saved successfully!");
      router.push(`/resolver/new-listing/publish?listingId=${listingId}`);
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save listing data.");
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (selectedPortfolioItem && selectedPortfolioItem.fileUrls.length > 1) {
      setCurrentImageIndex(
        (prev) => (prev + 1) % selectedPortfolioItem.fileUrls.length
      );
    }
  };

  const prevImage = () => {
    if (selectedPortfolioItem && selectedPortfolioItem.fileUrls.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedPortfolioItem.fileUrls.length - 1 : prev - 1
      );
    }
  };

  const handleBack = () => {
    router.push(
      `/resolver/new-listing/availability-status?listingId=${listingId}`
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600 bg-green-50 border-green-200";
      case "REJECTED":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-orange-600 bg-orange-50 border-orange-200";
    }
  };

  if (userLoading) {
    return (
      <div className="text-center py-8 text-gray-600">Loading user data...</div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-8 text-red-600">
        Please log in to create a new listing.
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white-50 min-h-screen">
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Progress Stepper */}
      <nav className="flex justify-center mb-8">
        <ol className="flex items-center space-x-4 overflow-x-auto p-2 bg-white rounded-lg shadow-sm">
          {STEPS.map((label, index) => (
            <li key={label} className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold ${
                  index === 3
                    ? "bg-[#094074] text-white shadow-md"
                    : index < 3
                      ? "bg-gray-200 text-gray-600"
                      : "bg-gray-200 text-gray-600 opacity-50"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  index === 3 ? "text-[#094074]" : "text-gray-500"
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

      {/* Page Header */}
      <header>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          4. Portfolio
        </h2>
        <p className="text-lg text-gray-700">
          Showcase your best work by selecting one portfolio item for this
          listing.
        </p>
      </header>

      {/* Main Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveAndContinue();
        }}
        className="bg-white p-6 md:p-10 rounded-xl shadow-lg space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Portfolio Showcase
              </label>
              <p className="text-sm text-gray-500 max-w-md">
                Select one portfolio item to highlight your work for this
                service listing. Only approved portfolios can be used in
                listings.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Enhanced Portfolio Display */}
            <div className="w-full h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center relative overflow-hidden group hover:border-gray-400 transition-colors">
              {selectedPortfolioItem ? (
                <div className="relative w-full h-full">
                  {/* Main Image Display */}
                  <div className="relative w-full h-full">
                    {selectedPortfolioItem?.thumbnailUrl ||
                    (selectedPortfolioItem?.portfolioFiles &&
                      selectedPortfolioItem.portfolioFiles.length > 0) ? (
                      <Image
                        src={
                          selectedPortfolioItem.thumbnailUrl ||
                          selectedPortfolioItem.portfolioFiles[0].url
                        }
                        alt={
                          selectedPortfolioItem.itemName || "Portfolio Image"
                        }
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}

                    {/* Overlay with item info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h4 className="font-semibold text-lg truncate">
                          {selectedPortfolioItem.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          {selectedPortfolioItem.category && (
                            <p className="text-sm opacity-90">
                              {selectedPortfolioItem.category}
                            </p>
                          )}
                          <Badge
                            text={selectedPortfolioItem.status}
                            icon={getStatusIcon(selectedPortfolioItem.status)}
                            variant={
                              selectedPortfolioItem.status === "APPROVED"
                                ? "success"
                                : selectedPortfolioItem.status === "PENDING"
                                  ? "warning"
                                  : selectedPortfolioItem.status === "REJECTED"
                                    ? "danger"
                                    : "primary"
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={handleRemoveSelectedItem}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Remove portfolio item"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Navigation arrows for multiple images */}
                    {selectedPortfolioItem.fileUrls.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Image counter */}
                    {selectedPortfolioItem.fileUrls.length > 1 && (
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        {currentImageIndex + 1} /{" "}
                        {selectedPortfolioItem.fileUrls.length}
                      </div>
                    )}

                    {/* Thumbnail indicator */}
                    {selectedPortfolioItem.thumbnailUrl && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        Thumbnail
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <Eye className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium mb-2">
                    No portfolio item selected
                  </p>
                  <p className="text-sm text-gray-400">
                    Choose an approved item to showcase your work
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <Button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Portfolio
              </Button>

              <Button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
              >
                <Upload className="h-5 w-5 mr-2" />
                Import from Portfolio
              </Button>
            </div>

            {selectedPortfolioItem && (
              <div
                className={`mt-4 p-4 border rounded-lg ${getStatusColor(selectedPortfolioItem.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Selected: {selectedPortfolioItem.name}
                    </p>
                    {selectedPortfolioItem.category && (
                      <span className="mt-1 inline-block px-2 py-0.5 bg-white/50 rounded text-xs">
                        {selectedPortfolioItem.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(selectedPortfolioItem.status)}
                    <span className="text-sm font-medium ml-1">
                      {selectedPortfolioItem.status}
                    </span>
                  </div>
                </div>
                {selectedPortfolioItem.status !== "APPROVED" && (
                  <p className="text-xs mt-2 opacity-75">
                    Note: Only approved portfolios can be used in published
                    listings.
                  </p>
                )}
              </div>
            )}
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

      {/* CREATE NEW PORTFOLIO MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-auto my-8 relative shadow-2xl">
            {/* Modal Header */}
            <div className="bg-white rounded-t-2xl border-b border-gray-200 px-8 py-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Create New Portfolio Item
                </h3>
                <p className="text-gray-600 mt-1">
                  Create a new portfolio item that will be available in your
                  portfolio management
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewPortfolioForm({
                    category: "",
                    itemName: "",
                    description: "",
                    files: [],
                    thumbnailUrl: null,
                  });
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6">
              <form
                onSubmit={handleCreateNewPortfolioSubmit}
                className="space-y-8"
              >
                {/* Basic Information */}
                <div className="bg-white-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      1
                    </span>
                    Basic Information
                  </h4>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <Dropdown
                        required
                        name="category"
                        label="Category"
                        selected={categories.find(
                          (cat) =>
                            cat.categoryName === newPortfolioForm.category
                        )}
                        onSelect={(option) =>
                          setNewPortfolioForm((prev) => ({
                            ...prev,
                            category: option.categoryName,
                          }))
                        }
                        options={[
                          {
                            id: "empty",
                            value: "",
                            categoryName: "",
                            label: "Select a category",
                          },
                          ...categories,
                        ]}
                        getLabel={(opt) =>
                          opt?.categoryName || opt?.label || ""
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Portfolio Title <span className="text-red-500">*</span>
                      </label>
                      <InputBox
                        type="text"
                        className="w-full px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={newPortfolioForm.itemName}
                        onChange={(e) =>
                          setNewPortfolioForm((prev) => ({
                            ...prev,
                            itemName: e.target.value,
                          }))
                        }
                        placeholder="e.g., Wedding Photography Showcase"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 h-32 resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newPortfolioForm.description}
                      onChange={(e) =>
                        setNewPortfolioForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe this portfolio item..."
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="bg-white-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      2
                    </span>
                    Image Gallery
                  </h4>

                  {/* Upload Area */}
                  <div className="relative mb-6">
                    <input
                      type="file"
                      multiple
                      onChange={handleNewPortfolioFileChange}
                      id="newPortfolioFileUpload"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      accept="image/*"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                          <Plus className="w-6 h-6" />
                        </div>
                        <h6 className="text-lg font-medium text-gray-900 mb-2">
                          Upload Images
                        </h6>
                        <p className="text-gray-600 text-sm">
                          Click to select multiple image files or drag and drop
                          them here
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          Supports: JPG, PNG, GIF, WebP
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Files Preview */}
                  {newPortfolioForm.files.length > 0 && (
                    <div>
                      <h5 className="text-md font-medium text-gray-800 mb-3">
                        Images to Upload ({newPortfolioForm.files.length})
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {newPortfolioForm.files.map((file, idx) => (
                          <div key={file.name + idx} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-transparent hover:border-blue-300 transition-colors">
                              <img
                                src={file.preview}
                                className={`w-full h-full object-cover transition-all duration-200 ${
                                  newPortfolioForm.thumbnailUrl === file.preview
                                    ? "ring-4 ring-yellow-400"
                                    : ""
                                }`}
                                alt={`New image ${idx + 1}`}
                              />
                            </div>

                            <div className="absolute inset-0 hidden group-hover:flex transition-all duration-200 rounded-lg items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSetNewThumbnail(file)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    newPortfolioForm.thumbnailUrl ===
                                    file.preview
                                      ? "bg-yellow-500 text-white"
                                      : "bg-white text-gray-700 hover:bg-yellow-100"
                                  }`}
                                >
                                  {newPortfolioForm.thumbnailUrl ===
                                  file.preview
                                    ? "★ Thumbnail"
                                    : "Set Thumbnail"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveNewPortfolioFile(file)
                                  }
                                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                  aria-label="Remove image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* First image badge */}
                            {idx === 0 && !newPortfolioForm.thumbnailUrl && (
                              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                Auto Thumbnail
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Thumbnail Info */}
                  {newPortfolioForm.thumbnailUrl && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <Star className="text-yellow-600 mr-2 w-4 h-4" />
                        <span className="text-sm font-medium text-yellow-800">
                          Thumbnail selected - This image will be shown as the
                          main preview
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-200 px-8 py-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setNewPortfolioForm({
                        category: "",
                        itemName: "",
                        description: "",
                        files: [],
                        thumbnailUrl: null,
                      });
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {newPortfolioForm.files.length} file
                      {newPortfolioForm.files.length !== 1 ? "s" : ""} selected
                    </span>
                    <Button
                      type="submit"
                      className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
                      disabled={
                        loading ||
                        newPortfolioForm.files.length === 0 ||
                        !newPortfolioForm.category ||
                        !newPortfolioForm.itemName
                      }
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg
                            className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating...
                        </span>
                      ) : (
                        "Create & Select Portfolio"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT FROM PORTFOLIO MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
          <div className="bg-white p-6 rounded-xl max-w-6xl w-full relative shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Import Portfolio Item
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Select an approved portfolio item from your collection to use
                  in this listing
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <Dropdown
                name="categoryFilter"
                selected={
                  categories.find(
                    (cat) => cat.categoryName === selectedCategory
                  ) || {
                    id: "empty",
                    categoryName: "",
                    label: "All Categories",
                  }
                }
                onSelect={(option) => setSelectedCategory(option.categoryName)}
                options={[
                  {
                    id: "empty",
                    categoryName: "",
                    label: "All Categories",
                  },
                  ...categories,
                ]}
                getLabel={(opt) => opt?.categoryName || opt?.label || ""}
                className="w-full md:w-1/3"
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {Object.keys(portfolioData).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">
                    No portfolio items found
                  </p>
                  <p className="text-sm text-gray-500">
                    Create your first portfolio item to get started!
                  </p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-96 pr-2 -mr-2">
                  {Object.keys(portfolioData)
                    .filter(
                      (categoryName) =>
                        portfolioData[categoryName] &&
                        portfolioData[categoryName].length > 0 &&
                        (!selectedCategory || categoryName === selectedCategory)
                    )
                    .map((categoryName) => (
                      <div key={categoryName} className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 top-0 bg-white py-2">
                          {categoryName}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {portfolioData[categoryName]
                            .filter(
                              (item) =>
                                !selectedCategory ||
                                item.category?.categoryName === selectedCategory
                            )
                            .map((item) => {
                              const isSelected =
                                selectedPortfolioItem &&
                                String(selectedPortfolioItem.id) ===
                                  String(item.id);
                              const isApproved = item.status === "APPROVED";

                              return (
                                <div
                                  key={String(item.id)}
                                  className={`relative border rounded-lg transition-all hover:shadow-md cursor-pointer ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                      : isApproved
                                        ? "border-gray-200 hover:border-gray-300"
                                        : "border-gray-200 opacity-60 cursor-not-allowed"
                                  } ${!isApproved ? "bg-gray-50" : ""}`}
                                  onClick={() =>
                                    isApproved && handleSelectImportedItem(item)
                                  }
                                >
                                  {/* Status Indicator */}
                                  <div className="absolute top-2 right-2 z-10 md:z-20">
                                    <Badge
                                      text={item.status}
                                      variant={
                                        item.status === "APPROVED"
                                          ? "success"
                                          : item.status === "PENDING"
                                            ? "warning"
                                            : item.status === "REJECTED"
                                              ? "danger"
                                              : "primary"
                                      }
                                    />
                                  </div>

                                  {/* Thumbnail Badge */}
                                  {item.thumbnailUrl && (
                                    <div className="absolute top-2 left-2 z-10 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                      <Star className="w-3 h-3 mr-1" />
                                      Thumb
                                    </div>
                                  )}

                                  {/* Image Preview */}
                                  <div className="h-48 w-full bg-gray-100 rounded-t-lg relative overflow-hidden">
                                    {item.thumbnailUrl ||
                                    (item.portfolioFiles &&
                                      item.portfolioFiles.length > 0) ? (
                                      <Image
                                        src={
                                          item.thumbnailUrl ||
                                          item.portfolioFiles[0].url
                                        }
                                        alt={item.itemName || "Portfolio Image"}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        No Image
                                      </div>
                                    )}

                                    {/* File count badge */}
                                    {item.portfolioFiles &&
                                      item.portfolioFiles.length > 1 && (
                                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                          +{item.portfolioFiles.length - 1} more
                                        </div>
                                      )}
                                  </div>

                                  {/* Item Info */}
                                  <div className="p-4">
                                    <h5 className="font-semibold text-gray-900 truncate mb-1">
                                      {item.itemName || "Untitled Item"}
                                    </h5>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {item.portfolioFiles?.length || 0} file
                                      {item.portfolioFiles?.length !== 1
                                        ? "s"
                                        : ""}
                                    </p>
                                    {item.description && (
                                      <p className="text-xs text-gray-500 truncate">
                                        {item.description}
                                      </p>
                                    )}

                                    {!isApproved && (
                                      <p className="text-xs text-orange-600 mt-2 font-medium">
                                        Only approved items can be used in
                                        listings
                                      </p>
                                    )}
                                  </div>

                                  {/* Selected Indicator */}
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                      <div className="bg-blue-500 text-white rounded-full p-2">
                                        <CheckCircle className="w-6 h-6" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}

                  {Object.keys(portfolioData).filter(
                    (categoryName) =>
                      portfolioData[categoryName] &&
                      portfolioData[categoryName].length > 0 &&
                      (!selectedCategory || categoryName === selectedCategory)
                  ).length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium mb-2">
                        No items found in selected category
                      </p>
                      <p className="text-sm text-gray-500">
                        Try selecting a different category or create a new
                        portfolio item.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {selectedPortfolioItem ? (
                  <span className="text-blue-600 font-medium">
                    Currently selected: {selectedPortfolioItem.name}
                  </span>
                ) : (
                  "Select a portfolio item to continue"
                )}
              </div>
              <Button
                onClick={() => setIsImportModalOpen(false)}
                className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
