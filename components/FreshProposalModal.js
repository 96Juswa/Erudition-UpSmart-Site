"use client";

import { useState, useEffect } from "react";

export default function FreshProposalModal({
  onClose,
  conversation, // might be undefined
  listing,
  request,
  isOffer = false,
  senderId, // who is sending
  onSuccess,
  onProposalSent,
}) {
  const [form, setForm] = useState({
    description: "",
    price: "",
    startDate: "",
    deadline: "",
    attachment: "",
  });

  const [loading, setLoading] = useState(false);
  const [conversationData, setConversationData] = useState(conversation);
  const [fetchingConversation, setFetchingConversation] = useState(false);

  // Determine context
  const context = listing ? "listing" : request ? "request" : "unknown";

  // Safely determine recipient ID
  const recipientId = (() => {
    if (listing) return listing?.resolverId || listing?.resolver?.userId;
    if (request) return request?.clientId || request?.client?.userId;
    return null;
  })();

  const modalTitle = isOffer ? "Send Offer to Book" : "Request to Book";
  const submitButtonText = isOffer ? "Send Offer" : "Send Request";

  // Fetch or create conversation if missing
  useEffect(() => {
    if (!conversationData && (listing || request) && recipientId && senderId) {
      fetchOrCreateConversation();
    }
  }, []);

  const fetchOrCreateConversation = async () => {
    setFetchingConversation(true);
    try {
      // Try to find existing conversation
      const searchParams = new URLSearchParams({
        userId: senderId,
        otherUserId: recipientId,
      });

      if (listing) searchParams.append("listingId", listing.id);
      if (request) searchParams.append("requestId", request.id);

      const res = await fetch(`/api/conversations/find?${searchParams}`);
      const data = await res.json();

      if (res.ok && data.conversation) {
        setConversationData(data.conversation);
      } else {
        // Create new conversation if none exists
        const createRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initiatedById: senderId,
            participantIds: [senderId, recipientId],
            listingId: listing?.id || null,
            requestId: request?.id || null,
          }),
        });

        const createData = await createRes.json();
        if (createRes.ok) {
          setConversationData(createData.conversation);
        } else {
          console.error("Failed to create conversation:", createData);
        }
      }
    } catch (err) {
      console.error("Error fetching/creating conversation:", err);
    } finally {
      setFetchingConversation(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Validation
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
      console.error("Recipient ID missing!", { listing, request });
      return;
    }

    if (!conversationData?.conversationId) {
      alert("No conversation found. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        conversationId: conversationData.conversationId,
        description: form.description,
        price: price,
        startDate: form.startDate,
        receiverId: recipientId,
      };

      // Add context-specific IDs
      if (listing?.id) payload.serviceListingId = listing.id;
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
        console.error("Backend returned error:", data);
        throw new Error(data.error || "Failed to send proposal");
      }

      console.log("Proposal sent successfully:", data);
      alert(`${isOffer ? "Offer" : "Request"} sent successfully!`);

      if (onProposalSent) onProposalSent(data.proposal);
      if (onSuccess) onSuccess(data);

      onClose();
    } catch (err) {
      console.error("Error submitting proposal:", err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingConversation) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
        <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Setting up conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {isOffer ? "💼" : "📅"} {modalTitle}
        </h2>

        {/* Context Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          {context === "listing" && (
            <p className="text-sm text-blue-800">
              Service: {listing?.title || "Unknown Service"}
            </p>
          )}
          {context === "request" && (
            <>
              <p className="text-sm text-blue-800">
                Request: {request?.title || "Unknown Request"}
              </p>
              {request?.minPrice && request?.maxPrice && (
                <p className="text-xs text-blue-600 mt-1">
                  Budget Range: ₱{Number(request.minPrice).toFixed(2)} - ₱
                  {Number(request.maxPrice).toFixed(2)}
                </p>
              )}
            </>
          )}
        </div>

        {/* Form */}
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

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={loading || fetchingConversation}
            onClick={handleSubmit}
            className={`px-4 py-2 text-sm font-medium text-white border rounded-md transition-colors disabled:opacity-50 ${
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
