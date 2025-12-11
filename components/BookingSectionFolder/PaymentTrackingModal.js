"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, AlertCircle, Plus, X } from "lucide-react";

export default function PaymentTrackingModal({
  booking,
  currentUserId,
  isOpen,
  onClose,
}) {
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isLogPaymentOpen, setIsLogPaymentOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [loading, setLoading] = useState(false);

  const isProvider =
    booking.serviceListing?.resolverId === currentUserId ||
    booking.serviceRequest?.resolverId === currentUserId;
  const isClient = booking.clientId === currentUserId;

  useEffect(() => {
    if (isOpen && booking?.id) {
      fetchPaymentData();
    }
  }, [isOpen, booking?.id]);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const planRes = await fetch(`/api/bookings/${booking.id}/payment-plan`);
      if (planRes.ok) {
        const planData = await planRes.json();
        setPaymentPlan(planData.paymentPlan);
      }

      const paymentsRes = await fetch(`/api/bookings/${booking.id}/payments`);
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments || []);
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = (milestone) => {
    const payment = payments.find((p) => p.milestoneId === milestone.id);
    if (!payment) return "pending";

    if (payment.providerAcknowledged && payment.clientAcknowledged) {
      return "completed";
    } else if (payment.loggedBy) {
      return "awaiting-confirmation";
    }
    return "pending";
  };

  const getTotalPaid = () => {
    return payments
      .filter((p) => p.providerAcknowledged && p.clientAcknowledged)
      .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
  };

  const getRemainingBalance = () => {
    return parseFloat(booking.totalPrice || 0) - getTotalPaid();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900">
                Payment Tracking
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {isProvider && !paymentPlan && (
                <button
                  onClick={() => setIsCreatePlanOpen(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                  Create Plan
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : !paymentPlan ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-2 font-medium text-lg">
                  No payment plan created yet
                </p>
                <p className="text-sm text-gray-500">
                  {isProvider
                    ? "Create a payment plan to track payments"
                    : "Waiting for provider to set up payment plan"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                      Total Amount
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      ₱{parseFloat(booking.totalPrice || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                      Paid
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      ₱{getTotalPaid().toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                      Remaining
                    </p>
                    <p className="text-xl font-bold text-orange-600">
                      ₱{getRemainingBalance().toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Payments</h4>
                  {paymentPlan.milestones?.map((milestone) => {
                    const status = getPaymentStatus(milestone);
                    const payment = payments.find(
                      (p) => p.milestoneId === milestone.id
                    );

                    return (
                      <PaymentMilestone
                        key={milestone.id}
                        milestone={milestone}
                        payment={payment}
                        status={status}
                        currentUserId={currentUserId}
                        isProvider={isProvider}
                        isClient={isClient}
                        onLogPayment={() => {
                          setSelectedMilestone(milestone);
                          setIsLogPaymentOpen(true);
                        }}
                        onAcknowledge={async (paymentId) => {
                          try {
                            const res = await fetch(
                              `/api/payments/${paymentId}/acknowledge`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId: currentUserId }),
                              }
                            );
                            if (res.ok) {
                              await fetchPaymentData();
                            }
                          } catch (error) {
                            console.error(
                              "Error acknowledging payment:",
                              error
                            );
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isCreatePlanOpen && (
        <CreatePaymentPlanModal
          booking={booking}
          currentUserId={currentUserId}
          onClose={() => setIsCreatePlanOpen(false)}
          onSuccess={() => {
            setIsCreatePlanOpen(false);
            fetchPaymentData();
          }}
        />
      )}

      {isLogPaymentOpen && selectedMilestone && (
        <LogPaymentModal
          booking={booking}
          milestone={selectedMilestone}
          currentUserId={currentUserId}
          onClose={() => {
            setIsLogPaymentOpen(false);
            setSelectedMilestone(null);
          }}
          onSuccess={() => {
            setIsLogPaymentOpen(false);
            setSelectedMilestone(null);
            fetchPaymentData();
          }}
        />
      )}
    </>
  );
}

function PaymentMilestone({
  milestone,
  payment,
  status,
  currentUserId,
  isProvider,
  isClient,
  onLogPayment,
  onAcknowledge,
}) {
  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "awaiting-confirmation":
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "awaiting-confirmation":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canAcknowledge = () => {
    if (!payment) return false;
    if (isProvider && !payment.providerAcknowledged) return true;
    if (isClient && !payment.clientAcknowledged) return true;
    return false;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h5 className="font-medium text-gray-900">{milestone.name}</h5>
            <p className="text-sm text-gray-600">
              ₱{parseFloat(milestone.amount || 0).toFixed(2)}
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge()}`}
        >
          {status === "completed"
            ? "Paid"
            : status === "awaiting-confirmation"
              ? "Pending"
              : "Unpaid"}
        </span>
      </div>

      {milestone.dueDate && (
        <p className="text-xs text-gray-500 mb-3">
          Due: {new Date(milestone.dueDate).toLocaleDateString()}
        </p>
      )}

      {payment && (
        <div className="bg-gray-50 rounded p-3 mb-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Logged by: {payment.loggedByName}
            </span>
            <span className="text-gray-500 text-xs">
              {new Date(payment.loggedAt).toLocaleDateString()}
            </span>
          </div>
          {payment.paymentMethod && (
            <p className="text-sm text-gray-600">
              Method: {payment.paymentMethod}
            </p>
          )}
          {payment.notes && (
            <p className="text-sm text-gray-600">Notes: {payment.notes}</p>
          )}

          {/* ✅ FILE VIEWER SECTION */}
          {payment.attachments?.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Proof of Payment:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {payment.attachments.map((file, index) => {
                  const isImage = file.fileType?.startsWith("image/");
                  const isPDF = file.fileType === "application/pdf";

                  return (
                    <div
                      key={index}
                      className="relative border rounded-lg bg-white p-2 shadow-sm hover:shadow-md transition"
                    >
                      {isImage ? (
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={file.fileUrl}
                            alt={file.fileName}
                            className="w-full h-32 object-cover rounded"
                          />
                        </a>
                      ) : isPDF ? (
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center h-32"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-10 w-10 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          <span className="text-xs text-gray-600 mt-1">
                            PDF File
                          </span>
                        </a>
                      ) : (
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-blue-600 underline truncate"
                        >
                          {file.fileName}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acknowledgment status */}
          <div className="flex items-center gap-4 text-xs pt-2">
            <span
              className={`flex items-center gap-1 ${payment.providerAcknowledged ? "text-green-600" : "text-gray-400"}`}
            >
              {payment.providerAcknowledged ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              Provider {payment.providerAcknowledged ? "confirmed" : "pending"}
            </span>
            <span
              className={`flex items-center gap-1 ${payment.clientAcknowledged ? "text-green-600" : "text-gray-400"}`}
            >
              {payment.clientAcknowledged ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              Client {payment.clientAcknowledged ? "confirmed" : "pending"}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {!payment && (
          <button
            onClick={onLogPayment}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Payment
          </button>
        )}

        {canAcknowledge() && (
          <button
            onClick={() => onAcknowledge(payment.id)}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Payment
          </button>
        )}
      </div>
    </div>
  );
}

function CreatePaymentPlanModal({
  booking,
  currentUserId,
  onClose,
  onSuccess,
}) {
  const [milestones, setMilestones] = useState([
    { name: "Deposit", percentage: 30, dueDate: "", required: true },
  ]);
  const [loading, setLoading] = useState(false);

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { name: "", percentage: 0, dueDate: "", required: false },
    ]);
  };

  const removeMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const getTotalPercentage = () => {
    return milestones.reduce(
      (sum, m) => sum + parseFloat(m.percentage || 0),
      0
    );
  };

  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    const maxSize = 5 * 1024 * 1024;

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not supported (use JPG, PNG, or PDF).`);
        return;
      }
      if (file.size > maxSize) {
        alert(`${file.name} is too large (max 5MB).`);
        return;
      }
    }

    setUploading(true);
    try {
      const uploadedFiles = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "payment");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedFiles.push({
            fileName: file.name,
            fileUrl: data.url,
            fileType: file.type,
            fileSize: file.size,
          });
        }
      }
      setAttachments([...attachments, ...uploadedFiles]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("File upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (getTotalPercentage() !== 100) {
      alert("Total percentage must equal 100%");
      return;
    }

    setLoading(true);
    try {
      const totalAmount = parseFloat(booking.totalPrice);
      const milestonesWithAmounts = milestones.map((m) => ({
        name: m.name,
        percentage: parseFloat(m.percentage),
        amount: parseFloat(((totalAmount * m.percentage) / 100).toFixed(2)),
        dueDate: m.dueDate || null,
        required: m.required || false,
      }));

      const res = await fetch(`/api/bookings/${booking.id}/payment-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestones: milestonesWithAmounts,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          createdBy: currentUserId,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        console.error("API Error:", data);
        alert(data.error || "Failed to create payment plan");
      }
    } catch (error) {
      console.error("Error creating payment plan:", error);
      alert(`Error creating payment plan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create Payment Plan</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-gray-700">
              Total Booking Amount: ₱
              {parseFloat(booking.totalPrice || 0).toFixed(2)}
            </p>
          </div>

          {milestones.map((milestone, index) => (
            <div key={index} className="border rounded p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Payment {index + 1}</h4>
                {milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Payment Name
                  </label>
                  <input
                    type="text"
                    value={milestone.name}
                    onChange={(e) =>
                      updateMilestone(index, "name", e.target.value)
                    }
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="e.g., Deposit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={milestone.percentage}
                    onChange={(e) =>
                      updateMilestone(index, "percentage", e.target.value)
                    }
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={milestone.dueDate}
                  onChange={(e) =>
                    updateMilestone(index, "dueDate", e.target.value)
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="bg-gray-50 p-2 rounded">
                <p className="text-sm text-gray-700">
                  Amount:{" "}
                  <span className="font-semibold">
                    ₱
                    {(
                      (parseFloat(booking.totalPrice) * milestone.percentage) /
                        100 || 0
                    ).toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addMilestone}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Another Payment
          </button>

          <div
            className={`text-sm font-medium p-3 rounded ${getTotalPercentage() === 100 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
          >
            Total Percentage: {getTotalPercentage()}%{" "}
            {getTotalPercentage() !== 100 && "(Must equal 100%)"}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || getTotalPercentage() !== 100}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Payment Plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogPaymentModal({
  booking,
  milestone,
  currentUserId,
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    amount: milestone.amount || "",
    paymentMethod: "",
    notes: "",
  });
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not supported. Use JPG, PNG, or PDF files.`);
        return;
      }
      if (file.size > maxSize) {
        alert(`${file.name} exceeds 5MB limit.`);
        return;
      }
    }

    setUploading(true);
    try {
      const uploadedFiles = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "payment-proof");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          uploadedFiles.push({
            fileName: file.name,
            fileUrl: data.url,
            fileType: file.type,
            fileSize: file.size,
          });
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      setAttachments((prev) => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.paymentMethod) {
      alert("Please select a payment method");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: milestone.id,
          loggedBy: currentUserId,
          attachments,
          ...formData,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to log payment");
      }
    } catch (error) {
      console.error("Error logging payment:", error);
      alert("Error logging payment");
    } finally {
      setLoading(false);
    }
  };

  const isImage = (type) => type.startsWith("image/");
  const isPDF = (type) => type === "application/pdf";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Log Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="font-medium text-gray-900">{milestone.name}</p>
            <p className="text-sm text-gray-600 mt-1">
              Expected Amount: ₱{parseFloat(milestone.amount || 0).toFixed(2)}
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Amount Paid *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: e.target.value }))
              }
              className={`w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                milestone.amount
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                  : ""
              }`}
              placeholder="0.00"
              disabled={!!milestone.amount} // 👈 disable when milestone.amount exists
            />
            {milestone.amount && (
              <p className="text-xs text-gray-500 mt-1">
                This amount is fixed based on the payment plan.
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Method *
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  paymentMethod: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select payment method</option>
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="PayMaya">PayMaya</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Add any notes about this payment..."
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Attach Proof of Payment (optional)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              multiple
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-700 border border-gray-300 rounded px-3 py-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={uploading}
            />
            {uploading && (
              <p className="text-sm text-blue-600 mt-2">Uploading files...</p>
            )}

            {attachments.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="relative border rounded-lg p-2 bg-gray-50 shadow-sm"
                  >
                    {isImage(file.fileType) ? (
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={file.fileUrl}
                          alt={file.fileName}
                          className="w-full h-24 object-cover rounded"
                        />
                      </a>
                    ) : isPDF(file.fileType) ? (
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center h-24"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-10 w-10 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span className="text-xs text-gray-600 mt-1">
                          PDF File
                        </span>
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                loading ||
                !formData.amount ||
                !formData.paymentMethod ||
                uploading
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Logging..." : "Log Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
