"use client";
import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  MessageSquare,
} from "lucide-react";
import ReviewModal from "../ReviewModal";

const STEPS = ["AWAITING_START", "IN_PROGRESS", "COMPLETED", "AWAITING_REVIEW"];

const STEP_LABELS = {
  AWAITING_START: "Awaiting to Start",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  AWAITING_REVIEW: "Awaiting Review",
};

export default function BookingProgressControl({ bookingId, currentUserId }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateData, setUpdateData] = useState({
    description: "",
    imageUrl: "",
    videoUrl: "",
    fileUrl: "",
  });
  const [showReviewModal, setShowReviewModal] = useState(false);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      const data = await res.json();
      if (res.ok) {
        setBooking(data.booking);
      } else {
        console.error("Error fetching booking:", data.error);
      }
    } catch (err) {
      console.error("Error fetching booking:", err);
    }
  };

  useEffect(() => {
    fetchBooking();
    // Set up polling for real-time updates
    const interval = setInterval(fetchBooking, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [bookingId]);

  // Calculate if resolver needs to send update based on deadline
  const needsUpdate = (booking) => {
    if (!booking || booking.currentStepIndex !== 1) return false;
    const lastUpdate = booking.progressUpdates?.slice(-1)[0];
    if (!lastUpdate) return false;

    const now = new Date();
    const lastUpdateTime = new Date(lastUpdate.createdAt);
    const hoursSinceUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);

    // Check if we have booking deadline info
    const deadline = new Date(booking.deadline);
    const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

    if (hoursUntilDeadline < 48) {
      return hoursSinceUpdate >= 12; // Must update every 12 hours if deadline < 48h
    } else {
      return hoursSinceUpdate >= 24; // Must update every 24 hours if deadline > 48h
    }
  };

  const getStepStatus = (stepIndex) => {
    if (!booking) return "pending";
    const { currentStepIndex, clientAcknowledged } = booking;

    if (stepIndex < currentStepIndex) return "completed";
    if (stepIndex === currentStepIndex) {
      // Special case for COMPLETED step - show waiting if client hasn't acknowledged
      if (stepIndex === 2 && clientAcknowledged === null) return "waiting";
      if (stepIndex === 2 && clientAcknowledged === false) return "revision";
      return "active";
    }
    return "pending";
  };
  // DEBUG: Check booking object
  console.log("Booking object:", booking);
  if (!booking) return <div className="animate-pulse">Loading...</div>;

  // Only show progress bar if booking is CONFIRMED
  if (
    booking.status !== "CONFIRMED" &&
    booking.status !== "IN_PROGRESS" &&
    booking.status !== "COMPLETED" &&
    booking.status !== "AWAITING_REVIEW"
  ) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow">
        <h3 className="text-xl font-bold mb-4">{booking.title}</h3>
        <p className="text-gray-600">Booking status: {booking.status}</p>
        <p className="text-sm text-gray-500">
          Progress tracking will be available once the booking is confirmed.
        </p>

        {/* Show decline reason if booking was declined */}
        {booking.status === "DECLINED" &&
          booking.latestProposal?.declineReason && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Reason:</strong> {booking.latestProposal.declineReason}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Declined on{" "}
                {new Date(booking.latestProposal.updatedAt).toLocaleString()}
              </p>
            </div>
          )}
      </div>
    );
  }

  const {
    clientId,
    resolverId,
    progressUpdates,
    currentStepIndex,
    clientAcknowledged,
    reviewStatus,
    completedAt,
    timedOut,
    hasClientReview,
    hasResolverReview,
    needsUpdate: backendNeedsUpdate,
    bookingType, // NEW: Indicates 'SERVICE_LISTING' or 'SERVICE_REQUEST'
  } = booking;

  const isResolver = currentUserId === resolverId;
  const isClient = currentUserId === clientId;
  const showIdleWarning =
    (backendNeedsUpdate || needsUpdate(booking)) && isResolver;

  const userHasNotReviewedYet =
    (isClient && !hasClientReview) || (isResolver && !hasResolverReview);
  const canReview =
    currentStepIndex === 3 &&
    reviewStatus !== "REVIEW_COMPLETED" &&
    userHasNotReviewedYet;

  const reviewedUserId = isClient ? resolverId : clientId;

  // Handlers
  const handleStartWork = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updaterId: currentUserId,
          status: "IN_PROGRESS",
          description: "Work started.",
          mediaUrls: {},
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to start work");
      }
      fetchBooking();
    } catch (error) {
      alert("Failed to start work: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUpdate = async () => {
    if (!updateData.description.trim()) {
      alert("Please provide a description for the update");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updaterId: currentUserId,
          status: "IN_PROGRESS",
          description: updateData.description,
          mediaUrls: {
            imageUrl: updateData.imageUrl || null,
            videoUrl: updateData.videoUrl || null,
            fileUrl: updateData.fileUrl || null,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit update");
      }

      setUpdateData({
        description: "",
        imageUrl: "",
        videoUrl: "",
        fileUrl: "",
      });
      setShowUpdateForm(false);
      fetchBooking();
    } catch (error) {
      alert("Failed to submit update: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updaterId: currentUserId,
          status: "COMPLETED",
          description: "Work completed and ready for client review.",
          mediaUrls: {},
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to mark as completed");
      }
      fetchBooking();
    } catch (error) {
      alert("Failed to mark as completed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClientConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/client-confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: currentUserId,
          accepted: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to confirm");
      }
      fetchBooking();
    } catch (error) {
      alert("Failed to confirm: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClientReject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/client-confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: currentUserId,
          accepted: false,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to request revision");
      }
      fetchBooking();
    } catch (error) {
      alert("Failed to request revision: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    // This would redirect to a review page or open a modal
    window.location.href = `/bookings/${bookingId}/review`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow">
      <h3 className="text-xl font-bold mb-4">{booking.title}</h3>

      {/* NEW: Show booking type indicator */}
      <div className="mb-4">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            bookingType === "SERVICE_LISTING"
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {bookingType === "SERVICE_LISTING"
            ? "📋 Service Listing"
            : "🔍 Service Request"}
        </span>
      </div>

      {/* Stepper */}
      <div className="flex justify-between items-center relative mb-8">
        {STEPS.map((step, idx) => {
          const status = getStepStatus(idx);
          const isActive = idx === currentStepIndex;

          return (
            <div
              key={step}
              className="flex flex-col items-center w-full relative"
            >
              {/* Connection Line */}
              {idx > 0 && (
                <div
                  className={`absolute top-4 left-0 w-full h-0.5 -translate-x-full z-0 ${
                    status === "completed" ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}

              <div className="relative z-10">
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 relative ${
                    status === "completed"
                      ? "bg-green-500 text-white border-green-500"
                      : status === "active"
                        ? "bg-blue-500 text-white border-blue-500"
                        : status === "waiting"
                          ? "bg-yellow-500 text-white border-yellow-500"
                          : status === "revision"
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {status === "completed" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : status === "waiting" ? (
                    <Clock className="w-4 h-4" />
                  ) : status === "revision" ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Idle Warning Bubble */}
                {idx === 1 && showIdleWarning && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap animate-pulse shadow-lg z-20">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Update Required
                  </div>
                )}

                {/* Client Acknowledgment Warning */}
                {idx === 2 && status === "waiting" && isClient && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap shadow-lg z-20">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Awaiting Acknowledgment
                  </div>
                )}

                {/* Revision Request Indicator */}
                {idx === 2 && status === "revision" && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap shadow-lg z-20">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Revision Requested
                  </div>
                )}
              </div>

              <span className="text-xs mt-2 text-center max-w-20">
                {STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Resolver: Start Work */}
        {currentStepIndex === 0 &&
          isResolver &&
          booking.contract?.status === "AGREED" && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Ready to Start</h4>
              <p className="text-sm text-gray-600 mb-3">
                Click below to begin working on this project.
              </p>
              <button
                onClick={handleStartWork}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Starting..." : "Start Work"}
              </button>
            </div>
          )}

        {/* Resolver: In Progress Actions */}
        {currentStepIndex === 1 && isResolver && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Work in Progress</h4>
              <p className="text-sm text-gray-600 mb-4">
                Keep your client updated with progress reports and mark as
                completed when finished.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowUpdateForm(!showUpdateForm)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {showUpdateForm ? "Cancel Update" : "Send Update"}
                </button>
                <button
                  onClick={handleMarkCompleted}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Completing..." : "Mark as Completed"}
                </button>
              </div>
            </div>

            {/* Update Form */}
            {showUpdateForm && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 border">
                <h4 className="font-semibold">Send Progress Update</h4>
                <textarea
                  value={updateData.description}
                  onChange={(e) =>
                    setUpdateData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe your progress, what you've accomplished, next steps, etc..."
                  className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                  <input
                    type="url"
                    value={updateData.fileUrl}
                    onChange={(e) =>
                      setUpdateData((prev) => ({
                        ...prev,
                        fileUrl: e.target.value,
                      }))
                    }
                    placeholder="File URL (optional)"
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitUpdate}
                    disabled={loading || !updateData.description.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "Send Update"}
                  </button>
                  <button
                    onClick={() => setShowUpdateForm(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Client: Confirm or Reject */}
        {currentStepIndex === 2 && isClient && clientAcknowledged === null && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-3">Review Completed Work</h4>
            <p className="text-sm text-gray-600 mb-4">
              The resolver has marked this work as completed. Please review the
              deliverables and confirm if everything meets your expectations, or
              request revisions if needed.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleClientConfirm}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? "Confirming..." : "Confirm Completed"}
              </button>
              <button
                onClick={handleClientReject}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {loading ? "Requesting..." : "Request Revision"}
              </button>
            </div>
          </div>
        )}

        {/* Review Stage */}
        {currentStepIndex === 3 && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Review Period
            </h4>
            {reviewStatus === "REVIEW_COMPLETED" || timedOut ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Review period completed.{" "}
                  {timedOut
                    ? "Time limit reached."
                    : "Both parties have left reviews."}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span
                    className={`flex items-center gap-1 ${
                      hasClientReview ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Client Review {hasClientReview ? "Completed" : "Missing"}
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      hasResolverReview ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolver Review{" "}
                    {hasResolverReview ? "Completed" : "Missing"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Please leave a review for this booking. Review period ends in{" "}
                  <span className="font-semibold">
                    {completedAt
                      ? Math.max(
                          0,
                          7 -
                            Math.floor(
                              (new Date() - new Date(completedAt)) /
                                (1000 * 60 * 60 * 24)
                            )
                        )
                      : 7}{" "}
                    days
                  </span>
                  .
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span
                    className={`flex items-center gap-1 ${
                      hasClientReview ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Client Review {hasClientReview ? "Completed" : "Pending"}
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      hasResolverReview ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolver Review{" "}
                    {hasResolverReview ? "Completed" : "Pending"}
                  </span>
                </div>
                {canReview && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Leave Review
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Updates History */}
      {progressUpdates && progressUpdates.length > 0 && (
        <div className="mt-8">
          <h4 className="font-semibold mb-4 text-lg">Progress History</h4>
          <div className="space-y-3 max-h-80 overflow-y-auto border rounded-lg p-4 bg-gray-50">
            {progressUpdates
              .slice()
              .reverse()
              .map((update, idx) => (
                <div
                  key={update.id}
                  className="bg-white p-4 rounded-lg shadow-sm border"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      {update.status === "AWAITING_START" && "🚀 Work Started"}
                      {update.status === "IN_PROGRESS" && "📝 Progress Update"}
                      {update.status === "COMPLETED" && "✅ Work Completed"}
                      {update.status === "AWAITING_REVIEW" &&
                        "⏳ Review Started"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(update.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {update.message && (
                    <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                      {update.message}
                    </p>
                  )}
                  {(update.imageUrl || update.videoUrl || update.fileUrl) && (
                    <div className="flex gap-2 text-xs">
                      {update.imageUrl && (
                        <a
                          href={update.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                        >
                          📷 Image
                        </a>
                      )}
                      {update.videoUrl && (
                        <a
                          href={update.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                        >
                          🎥 Video
                        </a>
                      )}
                      {update.fileUrl && (
                        <a
                          href={update.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                        >
                          📄 File
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        bookingId={bookingId}
        reviewerId={currentUserId}
        reviewedUserId={reviewedUserId}
        serviceListingId={booking.serviceListingId}
        serviceRequestId={booking.serviceRequestId} // NEW: Support service request reviews
        bookingType={bookingType} // NEW: Pass booking type to modal
        onSuccess={() => {
          fetchBooking(); // Refresh after review is submitted
        }}
      />
    </div>
  );
}
