"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MoreVertical, Edit, Plus, X, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Dropdown from "./Dropdown";
import Textarea from "./Textarea";
import InputBox from "./InputBox";

export default function ManagePortfolio() {
  const {
    currentUser,
    loading: userLoading,
    error: userError,
  } = useCurrentUser();

  const [portfolioData, setPortfolioData] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    category: "",
    itemName: "",
    description: "",
    files: [],
    existingFileUrls: [],
    filesToRemove: [],
    isEditing: false,
    editId: null,
    thumbnailUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  const resolverId = currentUser?.userId;

  const dropdownRefs = useRef({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        toast.error("Failed to load categories for the form.");
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!userLoading && currentUser && resolverId) {
      fetchPortfolioItems();
    } else if (!userLoading && !currentUser) {
      setLoading(false);
      setError("Please log in to manage your portfolio.");
    }
  }, [userLoading, currentUser, resolverId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      let isClickInsideAnyDropdown = false;
      for (const key in dropdownRefs.current) {
        if (
          dropdownRefs.current[key] &&
          dropdownRefs.current[key].contains(event.target)
        ) {
          isClickInsideAnyDropdown = true;
          break;
        }
      }
      if (!isClickInsideAnyDropdown && dropdownOpen) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const fetchPortfolioItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/portfolio`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }
      const data = await response.json();

      console.log("Raw portfolio data from API:", data); // DEBUG

      const categorizedData = data.reduce((acc, item) => {
        const categoryName = item.category?.categoryName || "Uncategorized";

        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }

        // Ensure consistent data structure with proper thumbnail handling
        acc[categoryName].push({
          ...item,
          PortfolioFile:
            item.portfolioFiles?.map((file) => ({
              ...file,
              isThumbnail: file.isThumbnail,
            })) || [],
          // Ensure thumbnailUrl is properly set
          thumbnailUrl:
            item.portfolioFiles?.find((f) => f.isThumbnail === true)?.url ||
            (item.portfolioFiles && item.portfolioFiles.length > 0
              ? item.portfolioFiles[0].url
              : null),
        });
        return acc;
      }, {});

      console.log("Categorized portfolio data:", categorizedData); // DEBUG
      setPortfolioData(categorizedData);
    } catch (err) {
      console.error("Failed to fetch portfolio items:", err);
      setError("Failed to load portfolio items. Please try again.");
      toast.error(`Error loading portfolio: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (category, id) => {
    setDropdownOpen(
      dropdownOpen === `${category}-${id}` ? null : `${category}-${id}`
    );
  };

  const handleDelete = async (portfolioId) => {
    if (!portfolioId) {
      toast.error("Invalid portfolio item ID");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this portfolio item?\n\n" +
        "This action cannot be undone and will remove the item from all listings."
    );

    if (!confirmDelete) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/portfolio/${portfolioId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (
          errorData?.error?.includes("Cannot delete portfolio item used") &&
          errorData.listingPortfolios
        ) {
          const listingTitles = errorData.listingPortfolios
            .map((lp) => `• ${lp.listingTitle}`)
            .join("\n");

          alert(
            `This portfolio item is used in the following active listing(s):\n\n${listingTitles}\n\nPlease remove it from those listings before deleting.`
          );
          return;
        }

        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      toast.success("Portfolio deleted successfully");
      await fetchPortfolioItems();
      setDropdownOpen(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete portfolio item.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => {
        file.preview = URL.createObjectURL(file);
        return file;
      });

    if (newFiles.length < e.target.files.length) {
      toast.warn("Only image files are allowed. Some files were ignored.");
    }

    setForm((prev) => {
      const updatedFiles = [...prev.files, ...newFiles];
      let newThumbnail = prev.thumbnailUrl;

      if (!prev.thumbnailUrl && updatedFiles.length > 0) {
        newThumbnail = updatedFiles[0].preview;
      } else if (!prev.thumbnailUrl && prev.existingFileUrls.length > 0) {
        newThumbnail = prev.existingFileUrls[0];
      }

      return {
        ...prev,
        files: updatedFiles,
        thumbnailUrl: newThumbnail,
      };
    });
  };

  const handleRemoveNewFile = (fileToRemove) => {
    setForm((prev) => {
      const updatedFiles = prev.files.filter((file) => file !== fileToRemove);

      URL.revokeObjectURL(fileToRemove.preview);

      let newThumbnail = prev.thumbnailUrl;

      if (prev.thumbnailUrl === fileToRemove.preview) {
        if (updatedFiles.length > 0) {
          newThumbnail = updatedFiles[0].preview;
        } else if (prev.existingFileUrls.length > 0) {
          newThumbnail = prev.existingFileUrls[0];
        } else {
          newThumbnail = null;
        }
      }

      return {
        ...prev,
        files: updatedFiles,
        thumbnailUrl: newThumbnail,
      };
    });
  };

  const handleRemoveExistingFile = (urlToRemove) => {
    setForm((prev) => {
      const updatedExistingFileUrls = prev.existingFileUrls.filter(
        (url) => url !== urlToRemove
      );

      if (prev.thumbnailUrl && prev.thumbnailUrl === urlToRemove) {
        let newThumbnail = null;
        if (updatedExistingFileUrls.length > 0) {
          newThumbnail = updatedExistingFileUrls[0];
        } else if (prev.files.length > 0) {
          newThumbnail = URL.createObjectURL(prev.files[0]);
        }
        return {
          ...prev,
          existingFileUrls: updatedExistingFileUrls,
          filesToRemove: [...prev.filesToRemove, urlToRemove],
          thumbnailUrl: newThumbnail,
        };
      }
      return {
        ...prev,
        existingFileUrls: updatedExistingFileUrls,
        filesToRemove: [...prev.filesToRemove, urlToRemove],
      };
    });
  };

  const handleEdit = (categoryName, id) => {
    const item = portfolioData[categoryName]?.find((i) => i.id === id);
    if (item) {
      setForm({
        category: categoryName,
        itemName: item.itemName || "",
        description: item.description || "",
        files: [],
        existingFileUrls:
          Array.isArray(item.portfolioFiles) && item.portfolioFiles.length > 0
            ? item.portfolioFiles.map((f) => f.url)
            : [],
        filesToRemove: [],
        isEditing: true,
        editId: id,
        thumbnailUrl: item.thumbnailUrl || null,
      });
      setIsModalOpen(true);
      setDropdownOpen(null);
    } else {
      toast.error("Could not find portfolio item for editing.");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setForm({
      category: "",
      itemName: "",
      description: "",
      files: [],
      existingFileUrls: [],
      filesToRemove: [],
      isEditing: false,
      editId: null,
      thumbnailUrl: null,
    });
    setError(null);
  };

  const handleSetThumbnail = (itemToSet, isNewFile = false) => {
    setForm((prev) => {
      let newThumbnailUrl = null;
      let updatedFiles = [...prev.files];
      let updatedExistingFileUrls = [...prev.existingFileUrls];

      if (isNewFile) {
        updatedFiles = [
          itemToSet,
          ...updatedFiles.filter((f) => f !== itemToSet),
        ];
        newThumbnailUrl = itemToSet.preview;
      } else {
        updatedExistingFileUrls = [
          itemToSet,
          ...updatedExistingFileUrls.filter((url) => url !== itemToSet),
        ];
        newThumbnailUrl = itemToSet;
      }

      return {
        ...prev,
        files: updatedFiles,
        existingFileUrls: updatedExistingFileUrls,
        thumbnailUrl: newThumbnailUrl,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!form.category || !form.itemName) {
      setError("Category and Portfolio Title are required.");
      toast.error("Category and Portfolio Title are required.");
      setLoading(false);
      return;
    }

    if (!form.isEditing && form.files.length === 0) {
      setError("Please upload at least one file for a new portfolio item.");
      toast.error("Please upload at least one file for a new portfolio item.");
      setLoading(false);
      return;
    }

    if (
      form.isEditing &&
      form.files.length === 0 &&
      form.existingFileUrls.length === 0
    ) {
      setError("At least one file must be present for a portfolio item.");
      toast.error("At least one file must be present for a portfolio item.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("categoryName", form.category);
    formData.append("itemName", form.itemName);
    formData.append("description", form.description || "");

    let finalThumbnailIdentifier = null;

    if (form.thumbnailUrl) {
      if (form.existingFileUrls.includes(form.thumbnailUrl)) {
        finalThumbnailIdentifier = form.thumbnailUrl;
      } else {
        const thumbnailFileIndex = form.files.findIndex(
          (file) => file.preview === form.thumbnailUrl
        );
        if (thumbnailFileIndex >= 0) {
          finalThumbnailIdentifier = `NEW_FILE_${thumbnailFileIndex}`;
        }
      }
    }

    formData.append("thumbnailUrl", finalThumbnailIdentifier || "");

    form.files.forEach((file) => {
      formData.append("newFiles", file);
    });

    formData.append("filesToRemove", JSON.stringify(form.filesToRemove));
    formData.append("filesToKeep", JSON.stringify(form.existingFileUrls));

    try {
      let response;
      const fetchOptions = {
        method: form.isEditing ? "PATCH" : "POST",
        body: formData,
        credentials: "include",
      };

      if (form.isEditing) {
        response = await fetch(`/api/portfolio/${form.editId}`, fetchOptions);
      } else {
        response = await fetch("/api/portfolio", fetchOptions);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      await fetchPortfolioItems();
      handleModalClose();
      toast.success(
        `Portfolio ${form.isEditing ? "updated" : "saved"} successfully!`
      );
    } catch (err) {
      console.error("Error submitting portfolio:", err);
      setError(err.message || "Failed to save portfolio. Please try again.");
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="text-center py-8 text-gray-600">Loading user data...</div>
    );
  }

  if (userError) {
    return (
      <div className="text-center py-8 text-red-600">
        Error loading user: {userError.message || "Unknown error"}. Please
        refresh or try again.
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-8 text-red-600">
        Please log in to manage your portfolio.
      </div>
    );
  }

  if (loading && Object.keys(portfolioData).length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">Loading portfolio...</div>
    );
  }

  if (error && Object.keys(portfolioData).length === 0) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-2 p-4 md:p-8 bg-white-50 min-h-screen">
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manage Portfolio</h2>
          <p className="text-gray-600">
            Organize your works by category. Portfolios must be approved by SDO
            before becoming visible in listings.
          </p>
        </div>
        <Button
          onClick={() => {
            setIsModalOpen(true);
            setError(null);
            setForm({
              category: "",
              itemName: "",
              description: "",
              files: [],
              existingFileUrls: [],
              filesToRemove: [],
              isEditing: false,
              editId: null,
              thumbnailUrl: null,
            });
          }}
          className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
        >
          <Plus className="w-5 h-5 mr-1" /> Add Portfolio
        </Button>
      </div>

      {Object.keys(portfolioData).length === 0 && !loading && (
        <div className="text-center py-10 text-gray-500">
          No portfolio items added yet. Click "+ Add Portfolio" to get started!
        </div>
      )}

      {/* Portfolio Cards */}
      {Object.keys(portfolioData).length > 0 &&
        Object.keys(portfolioData).map((categoryName) => {
          const itemsInCategory = portfolioData[categoryName];
          if (!itemsInCategory || itemsInCategory.length === 0) {
            return null;
          }
          return (
            <div key={categoryName}>
              <h3 className="text-xl font-semibold text-gray-700 mb-4 mt-6">
                {categoryName}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {itemsInCategory.map((item) => (
                  <div
                    key={item.id}
                    className="relative border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition bg-white overflow-hidden min-h-[340px] flex flex-col"
                  >
                    <div className="h-40 w-full bg-gray-100 flex items-center justify-center relative">
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt={`${item.itemName} Thumbnail`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
                          className="rounded-t-lg object-cover"
                        />
                      ) : item.portfolioFiles?.length > 0 ? (
                        <Image
                          src={item.portfolioFiles[0].url}
                          alt={`${item.itemName} Portfolio Image`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
                          className="rounded-t-lg object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col justify-between flex-grow">
                      <div>
                        {/* Status Badge */}
                        <div className="flex flex-wrap gap-3 text-sm mb-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : item.status === "REJECTED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-[#094074] mt-2 mb-1">
                          {item.itemName || "Untitled Portfolio"}
                        </h3>

                        {/* Description */}
                        {item.description && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-4 flex flex-wrap items-center justify-between text-sm">
                        <div className="flex flex-col">
                          <span className="text-[#094074] font-medium">
                            {item.portfolioFiles?.length ?? 0} file(s)
                          </span>
                        </div>

                        {/* Dropdown Menu */}
                        <div
                          className="relative"
                          ref={(el) =>
                            (dropdownRefs.current[
                              `${categoryName}-${item.id}`
                            ] = el)
                          }
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(categoryName, item.id);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                            aria-label="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {dropdownOpen === `${categoryName}-${item.id}` && (
                            <>
                              {/* Backdrop */}
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setDropdownOpen(null)}
                              />
                              {/* Dropdown */}
                              <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-lg border py-1 min-w-[120px] z-20">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(categoryName, item.id);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item.id);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      {/* Modal for Add/Edit Portfolio Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-6xl mx-auto my-8 relative shadow-2xl">
            {/* Modal Header */}
            <div className=" top-0 bg-white rounded-t-2xl border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {form.isEditing
                    ? "Edit Portfolio Item"
                    : "Create New Portfolio Item"}
                </h3>
                <p className="text-gray-600 mt-1">
                  {form.isEditing
                    ? "Update your portfolio details and manage your images"
                    : "Add a new portfolio item to showcase your work"}
                </p>
              </div>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6 flex items-start">
                  <div className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0">
                    ⚠
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Error</h4>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information Section */}
                <div className="bg-white-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      1
                    </span>
                    Basic Information
                  </h4>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Category <span className="text-red-500">*</span>
                      </label>
                      <Dropdown
                        label="Select a category"
                        options={[
                          { id: "empty", categoryName: "" }, // placeholder option
                          ...categories,
                        ]}
                        selected={categories.find(
                          (cat) => cat.categoryName === form.category
                        )}
                        onSelect={(option) =>
                          setForm((prev) => ({
                            ...prev,
                            category: option.categoryName,
                          }))
                        }
                        getLabel={(opt) =>
                          opt?.categoryName || "Select a category"
                        }
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="itemName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Portfolio Title <span className="text-red-500">*</span>
                      </label>
                      <InputBox
                        type="text"
                        id="itemName"
                        name="itemName"
                        value={form.itemName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            itemName: e.target.value,
                          }))
                        }
                        placeholder="e.g., Wedding Photography Showcase"
                        maxLength={255}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Description
                    </label>
                    <Textarea
                      id="description"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 h-32 resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Provide a detailed description of this portfolio item. What makes it special? What techniques did you use?"
                    />
                  </div>
                </div>

                {/* Image Management Section */}
                <div className="bg-white-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      2
                    </span>
                    Image Gallery
                  </h4>

                  {/* Existing Files Display */}
                  {form.isEditing && form.existingFileUrls.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-md font-medium text-gray-800 mb-3">
                        Current Images
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {form.existingFileUrls.map((url, index) => (
                          <div key={url} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-transparent hover:border-blue-300 transition-colors">
                              <img
                                src={url}
                                alt={`Existing image ${index + 1}`}
                                className={`w-full h-full object-cover transition-all duration-200 ${
                                  form.thumbnailUrl === url
                                    ? "ring-4 ring-yellow-400"
                                    : ""
                                }`}
                                loading="lazy"
                              />
                            </div>

                            <div className="absolute inset-0 hidden group-hover:flex transition-all duration-200 rounded-lg items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSetThumbnail(url, false)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    form.thumbnailUrl === url
                                      ? "bg-yellow-500 text-white"
                                      : "bg-white text-gray-700 hover:bg-yellow-100"
                                  }`}
                                >
                                  {form.thumbnailUrl === url
                                    ? "★ Thumbnail"
                                    : "Set Thumbnail"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExistingFile(url)}
                                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                  aria-label="Remove image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Files Upload */}
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">
                      {form.files.length > 0
                        ? "New Images to Upload"
                        : "Upload New Images"}
                    </h5>

                    {/* Upload Area */}
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        id="fileUpload"
                        name="newFiles"
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
                            Click to select multiple image files or drag and
                            drop them here
                          </p>
                          <p className="text-gray-500 text-xs mt-2">
                            Supports: JPG, PNG, GIF, WebP
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* New Files Preview */}
                    {form.files.length > 0 && (
                      <div className="mt-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {form.files.map((file, idx) => (
                            <div
                              key={file.name + idx}
                              className="relative group"
                            >
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-transparent hover:border-blue-300 transition-colors">
                                <img
                                  src={file.preview}
                                  className={`w-full h-full object-cover transition-all duration-200 ${
                                    form.thumbnailUrl === file.preview
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
                                    onClick={() =>
                                      handleSetThumbnail(file, true)
                                    }
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                      form.thumbnailUrl === file.preview
                                        ? "bg-yellow-500 text-white"
                                        : "bg-white text-gray-700 hover:bg-yellow-100"
                                    }`}
                                  >
                                    {form.thumbnailUrl === file.preview
                                      ? "★ Thumbnail"
                                      : "Set Thumbnail"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveNewFile(file)}
                                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    aria-label="Remove image"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* New Badge */}
                              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                NEW
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Info */}
                  {form.thumbnailUrl && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-yellow-600 mr-2">★</span>
                        <span className="text-sm font-medium text-yellow-800">
                          Thumbnail selected - This image will be shown as the
                          main preview
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="bottom-0 bg-white border-t border-gray-200 px-8 py-6 flex items-center justify-between rounded-b-2xl">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center space-x-4">
                    {form.isEditing && (
                      <span className="text-sm text-gray-500">
                        {form.existingFileUrls.length + form.files.length} total
                        images
                      </span>
                    )}
                    <Button
                      type="submit"
                      className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
                      disabled={
                        loading ||
                        (!form.isEditing && form.files.length === 0) ||
                        (form.isEditing &&
                          form.files.length === 0 &&
                          form.existingFileUrls.length === 0) ||
                        !form.category ||
                        !form.itemName
                      }
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                          Saving...
                        </span>
                      ) : form.isEditing ? (
                        "Update Portfolio"
                      ) : (
                        "Create Portfolio"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
