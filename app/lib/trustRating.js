// lib/trustRating.js
// Utility functions for trust rating calculations

/**
 * Trigger trust rating recalculation
 * Call this whenever user data changes (cancellation, new review, etc.)
 */
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; // make sure this exists in your .env

export async function recalculateTrustRating(userId, role) {
  try {
    const response = await fetch(`${BASE_URL}/api/trust-rating/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });

    const data = await response.json();

    if (!response.ok)
      throw new Error(data.error || "Failed to recalculate trust rating");

    return data;
  } catch (error) {
    console.error("Error recalculating trust rating:", error);
    throw error;
  }
}

export async function getTrustRating(userId, role) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/trust-rating/calculate?userId=${userId}&role=${role}`
    );
    const data = await response.json();

    if (!response.ok)
      throw new Error(data.error || "Failed to get trust rating");

    return data.trustRating;
  } catch (error) {
    console.error("Error getting trust rating:", error);
    throw error;
  }
}
