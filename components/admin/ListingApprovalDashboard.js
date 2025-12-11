import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  User,
  Tag,
  MapPin,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function ListingApprovalDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("on_review");
  const [selectedListing, setSelectedListing] = useState(null);
  const [transactionFeeEnabled, setTransactionFeeEnabled] = useState(false);
  const [feePercentage, setFeePercentage] = useState(3);
  const [actionModal, setActionModal] = useState({
    open: false,
    type: "",
    listing: null,
  });
  const [actionInput, setActionInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const url =
        filter === "on_review"
          ? "/api/admin/listings/pending"
          : `/api/admin/listings?status=${filter}`;

      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setListings(data.listings || []);
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchSetting() {
      try {
        const res = await fetch("/api/admin/toggle-transaction-fee");
        const data = await res.json();
        setTransactionFeeEnabled(data.enabled);
        setFeePercentage(data.feePercentage ?? 3);
      } catch (err) {
        showToast("Failed to load transaction fee setting", "error");
      }
    }

    fetchSetting();
  }, []);

  const handleToggle = async () => {
    const newValue = !transactionFeeEnabled;
    setTransactionFeeEnabled(newValue);

    try {
      const res = await fetch("/api/admin/toggle-transaction-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newValue }),
      });

      await res.json(); // you can ignore this response now

      const message = newValue
        ? `Transaction Fee enabled\nFee: ${feePercentage}%`
        : "Transaction Fee disabled";

      showToast(message, "success");
    } catch (err) {
      setTransactionFeeEnabled(!newValue); // revert
      showToast("Failed to update transaction fee setting", "error");
    }
  };

  const handleAction = async () => {
    if (!actionModal.listing) return;

    const { type, listing } = actionModal;

    if ((type === "decline" || type === "revision") && !actionInput.trim()) {
      alert(
        type === "decline"
          ? "Please provide a reason"
          : "Please provide revision notes"
      );
      return;
    }

    setActionLoading(true);
    try {
      const endpoint = `/api/admin/listings/${listing.id}/${
        type === "approve"
          ? "approve"
          : type === "decline"
            ? "decline"
            : "request-revision"
      }`;

      const body =
        type === "approve"
          ? { notes: actionInput }
          : type === "decline"
            ? { reason: actionInput }
            : { revisionNotes: actionInput };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        closeActionModal();
        fetchListings();
      } else {
        alert(data.message || "Action failed");
      }
    } catch (err) {
      alert("Failed to perform action");
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (type, listing) => {
    setActionModal({ open: true, type, listing });
    setActionInput("");
  };

  const closeActionModal = () => {
    setActionModal({ open: false, type: "", listing: null });
    setActionInput("");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "on_review":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (min, max) => {
    if (min && max)
      return `₱${parseFloat(min).toLocaleString()} - ₱${parseFloat(max).toLocaleString()}`;
    if (min) return `From ₱${parseFloat(min).toLocaleString()}`;
    if (max) return `Up to ₱${parseFloat(max).toLocaleString()}`;
    return "Price negotiable";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Service Listing Management
          </h1>
          <p className="text-gray-600">Review and approve service listings</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <div className="flex gap-2">
              {["on_review", "approved", "rejected", "draft"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                    filter === status
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="transactionFeeToggle"
                  className="text-sm font-medium text-gray-700"
                >
                  Transaction Fee
                </label>
                <button
                  id="transactionFeeToggle"
                  onClick={handleToggle}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition ${
                    transactionFeeEnabled ? "bg-blue-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${
                      transactionFeeEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {transactionFeeEnabled && (
                <span className="text-sm text-gray-500">
                  Fee: {feePercentage}%
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-4">Loading listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No listings found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {listing.serviceImage &&
                      listing.serviceImage.trim() !== "" ? (
                        <img
                          src={
                            listing.serviceImage.startsWith("http")
                              ? listing.serviceImage
                              : `/${listing.serviceImage}`
                          }
                          alt={listing.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextElementSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          display:
                            listing.serviceImage &&
                            listing.serviceImage.trim() !== ""
                              ? "none"
                              : "flex",
                        }}
                      >
                        <Tag className="w-16 h-16 text-gray-400" />
                      </div>
                      <span
                        className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(listing.status)}`}
                      >
                        {listing.status.replace("_", " ")}
                      </span>
                      {listing.isFeatured && (
                        <span className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                        {listing.title}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {listing.resolver.firstName}{" "}
                            {listing.resolver.lastName}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Tag className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {listing.service.category.categoryName} -{" "}
                            {listing.service.serviceName}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span>
                            {formatPrice(listing.minPrice, listing.maxPrice)}
                          </span>
                        </div>
                        {listing.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="capitalize">
                              {listing.location}
                            </span>
                          </div>
                        )}
                      </div>

                      {listing.revisionRequested && (
                        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <p className="font-semibold text-yellow-800">
                            Revision Requested
                          </p>
                          <p className="text-yellow-700 line-clamp-2">
                            {listing.revisionNotes}
                          </p>
                        </div>
                      )}

                      {listing.status === "on_review" && (
                        <div className="flex gap-2 mb-2">
                          <button
                            onClick={() => openActionModal("approve", listing)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>

                          <button
                            onClick={() => openActionModal("decline", listing)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Decline
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedListing(listing)}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {actionModal.type === "approve"
                ? "Approve Listing"
                : actionModal.type === "decline"
                  ? "Decline Listing"
                  : "Request Revision"}
            </h3>

            <p className="text-gray-600 mb-4">
              Listing: <strong>{actionModal.listing?.title}</strong>
            </p>

            <textarea
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              placeholder={
                actionModal.type === "approve"
                  ? "Optional notes..."
                  : actionModal.type === "decline"
                    ? "Reason for decline (required)"
                    : "Revision notes (required)"
              }
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-3">
              <button
                onClick={closeActionModal}
                disabled={actionLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`flex-1 py-2 rounded-lg font-medium text-white disabled:opacity-50 ${
                  actionModal.type === "approve"
                    ? "bg-green-500 hover:bg-green-600"
                    : actionModal.type === "decline"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                }`}
              >
                {actionLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedListing.title}
                </h2>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedListing.status)}`}
                >
                  {selectedListing.status.replace("_", " ")}
                </span>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              {selectedListing.serviceImage &&
              selectedListing.serviceImage.trim() !== "" ? (
                <img
                  src={
                    selectedListing.serviceImage.startsWith("http")
                      ? selectedListing.serviceImage
                      : `/${selectedListing.serviceImage}`
                  }
                  alt={selectedListing.title}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <div
                className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center"
                style={{
                  display:
                    selectedListing.serviceImage &&
                    selectedListing.serviceImage.trim() !== ""
                      ? "none"
                      : "flex",
                }}
              >
                <Tag className="w-24 h-24 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Resolver</p>
                <p className="font-medium">
                  {selectedListing.resolver.firstName}{" "}
                  {selectedListing.resolver.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedListing.resolver.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-medium">
                  {selectedListing.service.serviceName}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedListing.service.category.categoryName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price Range</p>
                <p className="font-medium">
                  {formatPrice(
                    selectedListing.minPrice,
                    selectedListing.maxPrice
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium capitalize">
                  {selectedListing.location || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Availability</p>
                <p className="font-medium capitalize">
                  {selectedListing.availabilityStatus || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="font-medium">
                  {selectedListing.isFeatured ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {selectedListing.description && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-800 whitespace-pre-wrap">
                  {selectedListing.description}
                </p>
              </div>
            )}

            {selectedListing.revisionRequested && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-semibold text-yellow-800 mb-2">
                  Revision Requested
                </p>
                <p className="text-yellow-700">
                  {selectedListing.revisionNotes}
                </p>
              </div>
            )}

            {selectedListing.adminNotes && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-semibold text-blue-800 mb-2">Admin Notes</p>
                <p className="text-blue-700">{selectedListing.adminNotes}</p>
              </div>
            )}

            {selectedListing.status === "on_review" && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedListing(null);
                    openActionModal("approve", selectedListing);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedListing(null);
                    openActionModal("revision", selectedListing);
                  }}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium"
                >
                  Request Revision
                </button>
                <button
                  onClick={() => {
                    setSelectedListing(null);
                    openActionModal("decline", selectedListing);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
