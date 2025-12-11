"use client";

import { useState } from "react";

export default function RequestToBookModal({
  onClose,
  conversation,
  onProposalSent,
  onSuccess,
  isOffer = false,
}) {
  const [form, setForm] = useState({
    description: "",
    price: "",
    startDate: "",
    deadline: "",
    attachment: "",
  });

  const [loading, setLoading] = useState(false);

  // Determine context and user roles
  const listing = conversation.listing;
  const request = conversation.request;
  const context = listing ? "listing" : request ? "request" : "unknown";

  // Get the appropriate recipient based on context
  const getRecipient = () => {
    if (context === "listing") {
      // Service listing: client requesting to resolver
      // Handle both nested (resolver.userId) and flat (resolverId) structures
      return listing.resolver?.userId || listing.resolverId;
    } else if (context === "request") {
      // Service request: resolver offering to client
      // Handle both nested (client.userId) and flat (clientId) structures
      return request.client?.userId || request.clientId;
    }
    return null;
  };

  const recipientId = getRecipient();
  console.log("🔍 Modal recipientId calculation:", {
    recipientId,
    context,
    isOffer,
    requestClientId: request?.clientId,
    currentUserId: "resolver (sending the offer)",
  });
  const modalTitle = isOffer ? "Send Offer to Book" : "Request to Book";
  const submitButtonText = isOffer ? "Send Offer" : "Send Request";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.description.trim() || !form.price || !form.startDate) {
      alert("Please fill in description, price, and start date");
      return;
    }

    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price");
      return;
    }

    if (!recipientId) {
      alert("Unable to determine recipient for this proposal");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        conversationId: conversation.conversationId,
        description: form.description,
        price: price,
        startDate: form.startDate,
        receiverId: recipientId,
      };

      // Add context-specific IDs
      if (listing?.id) {
        payload.serviceListingId = listing.id;
        // Include bookingId if re-proposing on existing booking
        if (conversation.bookingId) {
          payload.bookingId = conversation.bookingId;
        }
      }

      if (request?.id) payload.serviceRequestId = request.id;
      if (form.deadline) payload.deadline = form.deadline;
      if (form.attachment) payload.attachment = form.attachment;

      console.log("Sending proposal with payload:", payload);

      const res = await fetch("/api/booking-proposals/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send proposal");
      }

      // Call all callbacks
      if (onProposalSent) onProposalSent(data.proposal);
      if (onSuccess) onSuccess(data);

      alert(`${isOffer ? "Offer" : "Request"} sent successfully!`);
      onClose();
    } catch (err) {
      console.error("Error submitting proposal:", err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {isOffer ? "💼" : "📅"} {modalTitle}
        </h2>

        {/* Context Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            {context === "listing"
              ? `Service: ${listing?.title || "Unknown Service"}`
              : context === "request"
                ? `Request: ${request?.title || "Unknown Request"}`
                : "General Inquiry"}
          </p>
          {context === "request" && request?.minPrice && request?.maxPrice && (
            <p className="text-xs text-blue-600 mt-1">
              Budget Range: ₱{Number(request.minPrice).toFixed(2)} - ₱
              {Number(request.maxPrice).toFixed(2)}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isOffer ? "Service Offer Description" : "Service Description"} *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={
                isOffer
                  ? "Describe how you'll fulfill this request..."
                  : "Describe the service you're requesting..."
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isOffer ? "Offer Price" : "Proposed Budget"} *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₱
              </span>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {context === "request" &&
              request?.minPrice &&
              request?.maxPrice && (
                <p className="text-xs text-gray-500 mt-1">
                  Suggested range: ₱{Number(request.minPrice).toFixed(2)} - ₱
                  {Number(request.maxPrice).toFixed(2)}
                </p>
              )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isOffer ? "Available Start Date" : "Preferred Start Date"} *
            </label>
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isOffer ? "Completion Deadline" : "Project Deadline"}
            </label>
            <input
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={form.startDate || new Date().toISOString().slice(0, 10)}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isOffer
                ? "When will you complete this service?"
                : "When do you need this completed?"}
            </p>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachment URL
            </label>
            <input
              name="attachment"
              type="url"
              value={form.attachment}
              onChange={handleChange}
              placeholder="https://example.com/requirements.pdf"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional - Link to any relevant documents
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={handleSubmit}
            className={`px-4 py-2 text-sm font-medium text-white border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isOffer
                ? "bg-green-600 border-green-600 hover:bg-green-700"
                : "bg-blue-600 border-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Sending..." : submitButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
