"use client";

import { format, differenceInCalendarDays, isBefore } from "date-fns";
import { useState } from "react";
import RespondToRequestModal from "../BookingSectionFolder/RespondToRequestModal";
import BookingProgressControl from "./BookingProgressControl";
import SendContractModal from "../SendContractModal";
import ClientContractsInbox from "../ClientContractsInbox";
import ResolverContractsInbox from "../ResolverContractsInbox";
import AlterBookingModal from "./AlterBookingModal";
import RequestToBookModal from "./RequestToBookModal";
import PaymentTrackingModal from "./PaymentTrackingModal";

export default function BookingSection({ booking, currentUserId }) {
  const [isAlterModalOpen, setIsAlterModalOpen] = useState(false);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!booking) return null;

  console.log("Full booking object:", booking);
  console.log("Change requests:", booking.changeRequests);
  console.log("Current user ID:", currentUserId);
  console.log("Conversation:", booking.conversation);
  console.log(
    "hasValidConversation check:",
    booking.conversation?.conversationId != null
  );
  console.log("Actual conversationId:", booking.conversation?.conversationId);
  console.log("serviceListing structure:", booking.serviceListing);
  console.log("Is listing nested?", booking.serviceListing?.resolver);

  // --- Helpers ---
  const formatDate = (date) => {
    if (!date) return "Not set";
    try {
      return format(new Date(date), "PP");
    } catch {
      return "Invalid Date";
    }
  };

  const isClient = booking?.client?.userId === currentUserId;
  const isResolver =
    booking?.serviceListing?.resolver?.userId === currentUserId ||
    booking?.serviceRequest?.resolverId === currentUserId;

  const otherUser = isClient
    ? booking?.serviceListing?.resolver
    : booking?.client;
  const otherUserLabel = isClient ? "Resolver" : "Client";

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
      case "service_requested":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "declined":
      case "canceled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    if (isBefore(deadlineDate, now)) {
      return (
        <span className="ml-3 text-rose-600 font-medium text-sm">Overdue</span>
      );
    }
    const daysLeft = differenceInCalendarDays(deadlineDate, now);
    return (
      <span className="ml-3 text-blue-600 text-sm font-medium">
        {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
      </span>
    );
  };

  const getStartStatus = (startDate, status) => {
    if (!startDate || status === "IN_PROGRESS") return null;
    const now = new Date();
    const start = new Date(startDate);
    if (isBefore(start, now)) {
      return (
        <span className="ml-3 text-rose-600 font-medium text-sm">
          Not started
        </span>
      );
    }
    const daysUntilStart = differenceInCalendarDays(start, now);
    return (
      <span className="ml-3 text-blue-600 text-sm font-medium">
        Starts in {daysUntilStart} day{daysUntilStart !== 1 ? "s" : ""}
      </span>
    );
  };

  const latestProposal = booking?.latestProposal || null;

  const hasApprovedAlteration = booking.changeRequests?.some(
    (req) => req.status === "APPROVED" && req.type === "ALTERATION"
  );

  const displayPrice = hasApprovedAlteration
    ? booking.totalPrice
    : (latestProposal?.price ?? booking.totalPrice ?? 0);

  const displayDeadline = hasApprovedAlteration
    ? booking.deadline
    : (latestProposal?.deadline ?? booking.bookingDate);

  const displayBookingDate =
    booking.status === "CONFIRMED"
      ? booking.bookingDate
      : (latestProposal?.createdAt ?? booking.bookingDate);

  const displayStartDate = hasApprovedAlteration
    ? booking.startDate
    : (booking.startDate ??
      latestProposal?.startDate ??
      latestProposal?.newStartDate ??
      null);

  const getProposalStatus = () => {
    if (!latestProposal)
      return { label: "No proposals", icon: "○", color: "text-gray-400" };
    switch (latestProposal.status) {
      case "ACCEPTED":
        return { label: "Accepted", icon: "●", color: "text-emerald-600" };
      case "PENDING":
        return { label: "Under review", icon: "◐", color: "text-amber-600" };
      case "DECLINED":
        return { label: "Declined", icon: "○", color: "text-rose-600" };
      default:
        return { label: "Counter proposal", icon: "◒", color: "text-blue-600" };
    }
  };
  const proposalStatus = getProposalStatus();

  // Check if conversation exists and is valid for sending new proposals
  const hasValidConversation = booking.conversation?.conversationId != null;

  // --- Actions ---

  const handleAlterationResponse = async (action) => {
    if (!booking.changeRequests || booking.changeRequests.length === 0) {
      console.log("No change requests found!");
      return;
    }

    console.log("Change request data:", booking.changeRequests[0]);
    console.log("Sending request with:", {
      changeRequestId: booking.changeRequests[0].id,
      action: action === "APPROVED" ? "APPROVE" : "DECLINE",
    });

    try {
      const res = await fetch("/api/bookings/alter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeRequestId: booking.changeRequests[0].id,
          action: action === "APPROVED" ? "APPROVE" : "DECLINE",
        }),
      });

      const data = await res.json();

      console.log("API Response status:", res.status);
      console.log("API Response data:", data);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to respond to alteration");
      }

      const message =
        action === "APPROVED"
          ? "Modification request approved! Booking has been updated with new details."
          : "Modification request declined. Original booking terms remain.";

      alert(message);
      window.location.reload();
    } catch (err) {
      console.error("Full error details:", err);
      alert("Error: " + err.message);
    }
  };

  const handleCancelBooking = async () => {
    const proceed = window.confirm(
      "Cancelling will affect your trust rating.\nDo you want to proceed?"
    );
    if (!proceed) {
      const alter = window.confirm(
        "Would you like to alter your booking instead?"
      );
      if (alter) setIsAlterModalOpen(true);
      return;
    }

    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          requesterId: currentUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Cancellation failed");

      alert(
        data.booking
          ? "Booking successfully canceled."
          : "Cancellation request sent. Awaiting approval."
      );
      window.location.reload();
    } catch (err) {
      alert("Error: " + err.message);
      console.error(err);
    }
  };

  const renderAlterationStatus = () => {
    if (!booking.changeRequests || booking.changeRequests.length === 0) {
      return null;
    }

    const latestRequest = booking.changeRequests.find(
      (req) => req.type === "ALTERATION"
    );

    if (!latestRequest) return null;

    const isRequester = latestRequest?.requesterId === currentUserId;
    const otherPartyName = isClient ? "Resolver" : "Client";

    const getStatusConfig = () => {
      switch (latestRequest.status) {
        case "PENDING":
          return {
            bgColor: "bg-amber-50",
            borderColor: "border-amber-200",
            textColor: "text-amber-800",
            iconColor: "text-amber-600",
            icon: "⏳",
            title: isRequester
              ? "Modification Request Sent"
              : "Modification Request Received",
            message: isRequester
              ? `Waiting for ${otherPartyName.toLowerCase()} to respond...`
              : `${otherPartyName} has requested modifications. Please review and respond.`,
            actionRequired: !isRequester,
          };
        case "APPROVED":
          return {
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            textColor: "text-green-800",
            iconColor: "text-green-600",
            icon: "✅",
            title: "Modification Approved",
            message: "The booking has been updated with the new details.",
            actionRequired: false,
          };
        case "DECLINED":
          return {
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
            textColor: "text-red-800",
            iconColor: "text-red-600",
            icon: "❌",
            title: "Modification Declined",
            message:
              "The modification request was declined. Original booking terms remain.",
            actionRequired: false,
          };
        default:
          return null;
      }
    };

    const config = getStatusConfig();
    if (!config) return null;

    return (
      <div
        className={`${config.bgColor} rounded-lg p-4 border ${config.borderColor} mb-4`}
      >
        <div className="flex items-start space-x-3">
          <span className={`text-xl ${config.iconColor}`}>{config.icon}</span>
          <div className="flex-1">
            <h4 className={`font-semibold ${config.textColor} mb-2`}>
              {config.title}
            </h4>
            <p className={`text-sm ${config.textColor} mb-3`}>
              {config.message}
            </p>

            <div className="space-y-2 mb-3">
              {latestRequest.newPrice && (
                <div className="flex justify-between text-sm">
                  <span className={config.textColor}>New Price:</span>
                  <span className={`font-medium ${config.textColor}`}>
                    ₱{Number(latestRequest.newPrice).toFixed(2)}
                  </span>
                </div>
              )}
              {latestRequest.newStartDate && (
                <div className="flex justify-between text-sm">
                  <span className={config.textColor}>New Start Date:</span>
                  <span className={`font-medium ${config.textColor}`}>
                    {formatDate(latestRequest.newStartDate)}
                  </span>
                </div>
              )}
              {latestRequest.newDeadline && (
                <div className="flex justify-between text-sm">
                  <span className={config.textColor}>New Deadline:</span>
                  <span className={`font-medium ${config.textColor}`}>
                    {formatDate(latestRequest.newDeadline)}
                  </span>
                </div>
              )}
              {latestRequest.reason && (
                <div className="text-sm">
                  <span className={config.textColor}>Reason:</span>
                  <p className={`mt-1 ${config.textColor} italic`}>
                    "{latestRequest.reason}"
                  </p>
                </div>
              )}
            </div>

            {config.actionRequired && latestRequest.status === "PENDING" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAlterationResponse("APPROVED")}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                >
                  Approve Changes
                </button>
                <button
                  onClick={() => handleAlterationResponse("DECLINED")}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                >
                  Decline Changes
                </button>
              </div>
            )}

            {!config.actionRequired && latestRequest.status === "PENDING" && (
              <div className="flex items-center text-xs">
                <div className="animate-pulse w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                <span className={config.textColor}>
                  Awaiting response from {otherPartyName.toLowerCase()}...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Booking #{booking.id}
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                {otherUser?.firstName} {otherUser?.lastName} ({otherUserLabel})
              </p>
              {(otherUser?.program || otherUser?.yearStarted) && (
                <p className="text-xs text-gray-500 mt-1">
                  {otherUser?.program && <span>{otherUser.program}</span>}{" "}
                  Started:{" "}
                  {otherUser?.program && otherUser?.yearStarted && (
                    <span> </span>
                  )}
                  {otherUser?.yearStarted && (
                    <span>{otherUser.yearStarted}</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <span
            className={`self-start px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(
              booking.status
            )}`}
          >
            {booking.status?.replace("_", " ").toLowerCase() ?? "pending"}
          </span>
        </div>

        {/* Booking Details */}
        <div className="p-5">
          <h4 className="text-base font-semibold text-gray-900 mb-6">
            {booking.serviceListing?.title ||
              booking.serviceRequest?.title ||
              "Service not specified"}
          </h4>
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Proposal Status
              </label>
              <p className="text-gray-900 flex items-center">
                <span className={`text-lg mr-2 ${proposalStatus.color}`}>
                  {proposalStatus.icon}
                </span>
                <span className="font-medium text-sm">
                  {proposalStatus.label}
                </span>
              </p>
            </div>

            {renderAlterationStatus()}

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Total Amount
              </label>
              <p className="text-2xl font-bold text-gray-900">
                ₱{Number(displayPrice).toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Booking Date
                </label>
                <p className="text-gray-900 text-sm font-medium">
                  {formatDate(displayBookingDate)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Start Date
                </label>
                <div className="flex flex-col">
                  <p className="text-gray-900 text-sm font-medium">
                    {formatDate(displayStartDate)}
                  </p>
                  {getStartStatus(displayStartDate, booking.status)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Deadline
                </label>
                <div className="flex flex-col">
                  <p className="text-gray-900 text-sm font-medium">
                    {formatDate(displayDeadline)}
                  </p>
                  {getDeadlineStatus(displayDeadline)}
                </div>
              </div>

              {/* Contracts Section */}
              <div className="mt-6">
                {isClient && (
                  <ClientContractsInbox
                    currentUserId={currentUserId}
                    bookingId={booking.id}
                  />
                )}
                {isResolver && (
                  <ResolverContractsInbox
                    currentUserId={currentUserId}
                    bookingId={booking.id}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-5 flex flex-col gap-3">
            {/* Cancel and Modify buttons */}
            {(booking.status === "CONFIRMED" ||
              booking.status === "IN_PROGRESS") && (
              <>
                <button
                  onClick={handleCancelBooking}
                  className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel Booking
                </button>
                <button
                  onClick={() => setIsAlterModalOpen(true)}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-900 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all"
                >
                  Modify Booking
                </button>
              </>
            )}

            {/* Send Contract button */}
            {!isClient && latestProposal?.status === "ACCEPTED" && booking && (
              <button
                onClick={() => setShowContractModal(true)}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 border border-green-600 rounded-lg hover:from-green-500 hover:to-green-600 transition-all"
              >
                Send Contract
              </button>
            )}

            {/* Payment Tracking Button - Show when booking is confirmed or completed */}
            {(booking.status === "CONFIRMED" ||
              booking.status === "COMPLETED" ||
              booking.status === "AWAITING_REVIEW" ||
              (booking.status === "FAILED" && booking.hasPendingPayment)) && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 border border-green-600 rounded-lg hover:from-green-500 hover:to-green-600 transition-all flex items-center justify-center gap-2"
              >
                Payment Tracking
              </button>
            )}

            {/* Send New Proposal button - only if conversation exists */}
            {/* Send New Proposal button - only if conversation exists */}
            {(booking.status === "CANCELED" ||
              latestProposal?.status === "DECLINED") &&
              hasValidConversation && (
                <>
                  {/* Flow A: Only CLIENT can re-request on service listings */}
                  {booking.serviceListingId && isClient && (
                    <button
                      onClick={() => setShowRequestModal(true)}
                      className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-600 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all"
                    >
                      Request to Book Again
                    </button>
                  )}

                  {/* Flow B: Only RESOLVER can re-offer on service requests */}
                  {booking.serviceRequestId && isResolver && (
                    <button
                      onClick={() => setShowRequestModal(true)}
                      className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 border border-green-600 rounded-lg hover:from-green-500 hover:to-green-600 transition-all"
                    >
                      Offer to Book Again
                    </button>
                  )}
                </>
              )}

            {/* Warning message if no conversation exists */}
            {(booking.status === "CANCELED" ||
              latestProposal?.status === "DECLINED") &&
              !hasValidConversation && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    Unable to send new proposal: No active conversation found.
                    Please start a new conversation with the{" "}
                    {otherUserLabel.toLowerCase()}.
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAlterModalOpen && (
        <AlterBookingModal
          onClose={() => setIsAlterModalOpen(false)}
          booking={booking}
          currentUserId={currentUserId}
        />
      )}

      {isRespondModalOpen && (
        <RespondToRequestModal
          onClose={() => setIsRespondModalOpen(false)}
          proposal={latestProposal}
          bookingId={booking.id}
          currentUserId={currentUserId}
          isAlteration={false}
        />
      )}

      {showContractModal && (
        <SendContractModal
          booking={booking}
          currentUserId={currentUserId}
          onClose={() => setShowContractModal(false)}
        />
      )}

      {showRequestModal && hasValidConversation && (
        <RequestToBookModal
          onClose={() => setShowRequestModal(false)}
          conversation={{
            conversationId: booking.conversation.conversationId,
            bookingId: booking.id, // ADD THIS
            listing: booking.serviceListing,
            request: booking.serviceRequest,
          }}
          isOffer={!isClient}
          onSuccess={() => {
            alert("Proposal sent successfully!");
            window.location.reload();
          }}
        />
      )}
      {/* Booking Progress */}
      <BookingProgressControl
        bookingId={booking.id}
        initialStatus={booking.status}
        initialPaymentStatus={booking.paymentStatus}
        currentUserId={currentUserId}
        onStatusChange={(newStatus, newProgress) =>
          console.log("Booking updated:", newStatus, newProgress)
        }
      />

      {/* Payment Tracking Modal */}
      {showPaymentModal && (
        <PaymentTrackingModal
          booking={booking}
          currentUserId={currentUserId}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
}
