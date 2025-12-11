"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Plus } from "lucide-react";
import ListingCard from "./ListingCard";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { useToast } from "@/components/ToastProvider";
import Button from "./Button";

export default function ManageListings() {
  const router = useRouter();
  const { showToast } = useToast();

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/listings");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch listings");
      }
      const data = await res.json();
      setListings(data);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const toggleDropdown = (id) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const handleCreateNewListing = () => {
    router.push("new-listing/service-details");
  };

  const getEditRoute = (listing) => {
    const editableStatuses = ["draft", "on_review", "rejected"];

    if (editableStatuses.includes(listing.status)) {
      return `/resolver/new-listing/service-details?listingId=${listing.id}`;
    }

    // If approved or any other status
    return `/resolver/published/edit/${listing.id}`;
  };

  const handleEditClick = useCallback(
    (listing) => {
      router.push(getEditRoute(listing));
    },
    [router]
  );

  const handleDeleteClick = useCallback((listingId) => {
    setListingToDelete(listingId);
    setShowDeleteConfirm(true);
    setDropdownOpen(null);
  }, []);

  const confirmDeleteListing = async () => {
    if (!listingToDelete) return;

    const backup = [...listings];
    setListings((prev) =>
      prev.filter((listing) => listing.id !== listingToDelete)
    );

    try {
      const res = await fetch(`/api/listings/${listingToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(
          (await res.json()).error ||
            `Failed to delete listing ${listingToDelete}`
        );
      }

      showToast("Listing deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting listing:", error);
      setError(
        `Error deleting listing ID ${listingToDelete}: ${error.message}`
      );
      setListings(backup); // rollback
    } finally {
      setShowDeleteConfirm(false);
      setListingToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setListingToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-100 rounded-lg">
        <p className="text-sm font-medium">
          Error: <span className="font-semibold">{error}</span>
        </p>
        <button
          onClick={fetchListings}
          className="mt-2 text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8 bg-white-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Manage Your Service Listings
          </h2>
          <p className="text-lg text-gray-700">
            All listings are subject to approval by the Student Development
            Office (SDO) before being published.
          </p>
        </div>
        <Button
          onClick={handleCreateNewListing}
          className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Listing
        </Button>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center text-center space-y-4">
          <p className="text-xl text-gray-600">
            You don't have any listings yet. Time to create one!
          </p>
          <Button
            onClick={handleCreateNewListing}
            className="flex items-center px-6 py-3 bg-[#094074] text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Listing
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={confirmDeleteListing}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
