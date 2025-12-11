"use client";

import { useState } from "react";
import { format } from "date-fns";

export default function RespondToRequestModal({
  onClose,
  proposal,
  bookingId,
  currentUserId,
  isAlteration = false,
  context = "listing",
  onSuccess,
}) {
  const [form, setForm] = useState({
    description: proposal?.description || "",
    price: proposal?.price || "",
    deadline: proposal?.deadline
      ? new Date(proposal.deadline).toISOString().slice(0, 16)
      : "",
    startDate: proposal?.startDate
      ? new Date(proposal.startDate).toISOString().slice(0, 16)
      : "",
    attachment: proposal?.attachment || "",
  });

  const [actionType, setActionType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const isReadOnly = actionType === "accept"; // 🆕 Prevent editing

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "PPpp");
    } catch {
      return "Invalid date";
    }
  };

  const getLabels = () => {
    if (context === "request") {
      return {
        modalTitle: isAlteration
          ? "Modify Service Offer"
          : "Respond to Service Request",
        acceptButton: "Accept Request",
        declineButton: "Decline Request",
        counterButton: "Counter Offer",
        newButton: "Send New Offer",
        acceptAction: "Accept & Confirm Service",
        declineAction: "Decline Request",
        counterAction: "Send Counter Offer",
        newAction: "Send New Offer",
      };
    } else {
      return {
        modalTitle: isAlteration
          ? "Modify Booking"
          : "Respond to Booking Request",
        acceptButton: "Accept Request",
        declineButton: "Decline Request",
        counterButton: "Counter Offer",
        newButton: "Send New Proposal",
        acceptAction: "Accept & Confirm Booking",
        declineAction: "Decline Request",
        counterAction: "Send Counter Offer",
        newAction: "Send New Proposal",
      };
    }
  };

  const labels = getLabels();

  const handleRespond = async (type) => {
    setLoading(true);
    try {
      let payload = {
        proposalId: proposal.id,
        action: type,
        currentUserId,
        context,
      };

      // ADD LOGGING HERE
      console.log("🔍 Proposal being responded to:", {
        proposalId: proposal.id,
        proposalStatus: proposal?.status,
        proposalBookingId: proposal?.bookingId,
        action: type,
        context,
        currentUserId,
      });

      if (type === "decline") {
        if (!declineReason.trim())
          throw new Error("Provide a reason for declining");
        payload.declineReason = declineReason.trim();
      } else if (type === "counter" || type === "new") {
        const price = parseFloat(form.price);
        if (isNaN(price) || price <= 0) throw new Error("Invalid price");

        payload.description = form.description;
        payload.price = price;
        payload.deadline = form.deadline
          ? new Date(form.deadline).toISOString()
          : null;
        payload.newStartDate = form.startDate
          ? new Date(form.startDate).toISOString()
          : null;
        payload.attachment = form.attachment || null;
      }

      console.log("🔍 Sending payload:", payload);

      const res = await fetch("/api/booking-proposals/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      console.log("🔍 API Response:", {
        ok: res.ok,
        status: res.status,
        data,
      });

      if (!res.ok)
        throw new Error(data?.error || "Failed to respond to proposal");

      if (onSuccess) {
        onSuccess(data);
      }

      const successMessages = {
        accept:
          context === "request"
            ? "Service request accepted!"
            : "Booking request accepted!",
        decline:
          context === "request"
            ? "Service request declined."
            : "Booking request declined.",
        counter: "Counter offer sent successfully!",
        new: "New proposal sent successfully!",
      };

      alert(successMessages[type] || "Action completed successfully!");

      onClose();
    } catch (err) {
      alert(err.message);
      console.error("Error responding to proposal:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 overflow-auto">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4">
          {context === "request" ? "💼" : "🛠"} {labels.modalTitle}
        </h2>

        <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-5 space-y-1">
          <p>
            <b>Status:</b> {proposal?.status || "Unknown"}
          </p>
          <p>
            <b>Description:</b> {proposal?.description || "No description"}
          </p>
          <p>
            <b>Price:</b> ₱
            {proposal?.price ? Number(proposal.price).toFixed(2) : "0.00"}
          </p>
          <p>
            <b>Start Date:</b>{" "}
            {proposal?.startDate ? formatDate(proposal.startDate) : "Not set"}
          </p>
          <p>
            <b>Deadline:</b>{" "}
            {proposal?.deadline ? formatDate(proposal.deadline) : "No deadline"}
          </p>
          {proposal?.attachments && (
            <p>
              <b>Attachment:</b>{" "}
              <a
                href={proposal.attachments}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View File
              </a>
            </p>
          )}
        </div>

        {(actionType === "accept" ||
          actionType === "counter" ||
          actionType === "new") && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {context === "request"
                  ? "Service Offer Description"
                  : "Service Description"}
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                readOnly={isReadOnly}
                className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                rows={3}
                placeholder={
                  context === "request"
                    ? "Describe how you'll fulfill this request..."
                    : "Describe the service details..."
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {context === "request" ? "Offer Price" : "Price"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₱
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {context === "request" ? "Available Start Date" : "Start Date"}
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                disabled={isReadOnly}
                className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {context === "request" ? "Completion Deadline" : "Deadline"}
              </label>
              <input
                type="datetime-local"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                disabled={isReadOnly}
                className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                min={form.startDate || new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachment URL
              </label>
              <input
                type="url"
                name="attachment"
                value={form.attachment}
                onChange={handleChange}
                readOnly={isReadOnly}
                className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                placeholder="https://example.com/file.pdf"
              />
            </div>
          </div>
        )}

        {actionType === "decline" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Declining
            </label>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Please provide a reason for declining..."
            />
          </div>
        )}

        {!actionType && (
          <div className="flex flex-col gap-2">
            {proposal.status !== "DECLINED" && (
              <>
                <button
                  onClick={() => setActionType("accept")}
                  className="bg-green-600 text-white rounded-lg p-3 hover:bg-green-700 transition-colors font-medium"
                >
                  ✅ {labels.acceptButton}
                </button>
                <button
                  onClick={() => setActionType("decline")}
                  className="bg-red-500 text-white rounded-lg p-3 hover:bg-red-600 transition-colors font-medium"
                >
                  ❌ {labels.declineButton}
                </button>
                <button
                  onClick={() => setActionType("counter")}
                  className="bg-yellow-500 text-white rounded-lg p-3 hover:bg-yellow-600 transition-colors font-medium"
                >
                  🔁 {labels.counterButton}
                </button>
              </>
            )}
            {proposal.status === "DECLINED" && (
              <button
                onClick={() => setActionType("new")}
                className="bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 transition-colors font-medium"
              >
                ✉️ {labels.newButton}
              </button>
            )}
          </div>
        )}

        {actionType && (
          <div className="flex flex-col gap-3 mt-6">
            <button
              disabled={loading}
              onClick={() => handleRespond(actionType)}
              className={`px-4 py-3 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                actionType === "accept"
                  ? "bg-green-600 hover:bg-green-700"
                  : actionType === "decline"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading
                ? "Processing..."
                : actionType === "accept"
                  ? labels.acceptAction
                  : actionType === "decline"
                    ? labels.declineAction
                    : actionType === "counter"
                      ? labels.counterAction
                      : labels.newAction}
            </button>
            <button
              onClick={() => setActionType(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Options
            </button>
          </div>
        )}

        <div className="flex justify-center mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
