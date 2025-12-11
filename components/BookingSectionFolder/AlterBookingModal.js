"use client";

import { useState } from "react";

export default function AlterBookingModal({ onClose, booking, currentUserId }) {
  const [form, setForm] = useState({
    newPrice: booking?.totalPrice || "",
    newStartDate: booking?.startDate
      ? new Date(booking.startDate).toISOString().slice(0, 16)
      : "",
    newDeadline: booking?.paymentDue
      ? new Date(booking.paymentDue).toISOString().slice(0, 16)
      : "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        bookingId: booking.id,
        requesterId: currentUserId,
        newPrice: parseFloat(form.newPrice) || null,
        newStartDate: form.newStartDate
          ? new Date(form.newStartDate).toISOString()
          : null,
        newDeadline: form.newDeadline
          ? new Date(form.newDeadline).toISOString()
          : null,
        reason: form.reason.trim(),
      };

      const res = await fetch("/api/bookings/alter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send alteration");

      alert("Alteration request sent!");
      onClose();
      window.location.reload();
    } catch (err) {
      alert(err.message);
      console.error("Alteration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 overflow-auto">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4">🛠 Modify Booking</h2>

        <div className="space-y-3">
          <label>Reason for Change</label>
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows={3}
            placeholder="Explain why you're requesting a change..."
          />

          <label>New Price</label>
          <input
            type="number"
            name="newPrice"
            value={form.newPrice}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <label>New Start Date</label>
          <input
            type="datetime-local"
            name="newStartDate"
            value={form.newStartDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <label>New Deadline</label>
          <input
            type="datetime-local"
            name="newDeadline"
            value={form.newDeadline}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="bg-blue-600 text-white rounded p-2 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Alteration Request"}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 rounded p-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
