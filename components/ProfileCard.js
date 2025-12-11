"use client";
import { useEffect, useState } from "react";

export default function ProfileCard({ userId, role }) {
  const [trustRating, setTrustRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrustRating() {
      try {
        if (!userId || !role) return;

        const ratingRes = await fetch(
          `/api/trust-rating/calculate?userId=${userId}&role=${role}`
        );
        const ratingData = await ratingRes.json();

        if (!ratingRes.ok)
          throw new Error(ratingData.error || "Failed to load rating");

        setTrustRating(ratingData.trustRating);
      } catch (error) {
        console.error("Error fetching trust rating:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrustRating();
  }, [userId, role]);

  if (loading)
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-gray-500">
        Loading {role} trust rating...
      </div>
    );

  if (trustRating == null)
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-gray-500">
        No trust rating available for this {role}.
      </div>
    );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4 capitalize">{role} Trust Rating</h3>

      <div className="flex items-center gap-4">
        {/* Circular Progress Indicator */}
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke={getRatingColor(trustRating)}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${((trustRating - 1) / 4) * 251.2} 251.2`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">
              {trustRating?.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-lg font-semibold">{getRatingLabel(trustRating)}</p>
          <p className="text-sm text-gray-600">
            Based on{" "}
            {role === "resolver"
              ? "service quality and reliability"
              : "booking and transaction history"}
          </p>
        </div>
      </div>

      {/* Numeric Rating */}
      <div className="mt-4 flex items-center gap-1 text-sm text-gray-600">
        ({trustRating?.toFixed(2)} / 5.00)
      </div>
    </div>
  );
}

/* ---------- Helper Functions ---------- */

function getRatingColor(rating) {
  if (rating >= 4.5) return "#10b981"; // green - Excellent
  if (rating >= 3.5) return "#3b82f6"; // blue - Good
  if (rating >= 2.5) return "#f59e0b"; // yellow - Fair
  return "#ef4444"; // red - Needs Improvement
}

function getRatingLabel(rating) {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Good";
  if (rating >= 2.5) return "Fair";
  return "Needs Improvement";
}
