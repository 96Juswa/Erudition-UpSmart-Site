"use client";

import { useState } from "react";
import Modal from "./Modal";
import { StarIcon } from "@heroicons/react/24/solid";

export default function ReviewModal({
  isOpen,
  onClose,
  bookingId,
  reviewerId,
  reviewedUserId,
  serviceListingId,
  onSuccess,
}) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStarClick = (value) => setRating(value);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId,
          reviewedUserId,
          serviceListingId,
          rating,
          reviewText,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      if (onSuccess) onSuccess(); // Refresh or notify parent
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leave a Review">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rating
          </label>
          <div className="flex space-x-1 mt-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <StarIcon
                key={val}
                className={`w-6 h-6 cursor-pointer ${
                  val <= rating ? "text-yellow-400" : "text-gray-300"
                }`}
                onClick={() => handleStarClick(val)}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Optional Comment
          </label>
          <textarea
            className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
            rows={4}
            placeholder="Share your thoughts about this service..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            className="text-sm text-gray-500 hover:underline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded"
            onClick={handleSubmit}
            disabled={loading || rating === 0}
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
