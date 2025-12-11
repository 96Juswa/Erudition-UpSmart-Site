"use client";

import { useEffect, useState } from "react";
import ContractESignatureModal from "./ContractESignatureModal";

export default function ClientContractsInbox({ currentUserId, bookingId }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showESignModal, setShowESignModal] = useState(false);
  const [error, setError] = useState(null);

  // Fetch contracts from the API
  useEffect(() => {
    const fetchContracts = async () => {
      if (!currentUserId || !bookingId) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/contracts/inbox?userId=${currentUserId}&bookingId=${bookingId}`
        );
        const text = await res.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          console.error("Failed to parse JSON:", text);
          data = {};
        }

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch contracts");
        }

        // Ensure contracts array is always defined
        setContracts(Array.isArray(data.contracts) ? data.contracts : []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [currentUserId, bookingId]);

  // Handle E-Signature submission
  const handleESign = async (signaturePayload) => {
    try {
      const res = await fetch("/api/contracts/respond", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: signaturePayload.contractId,
          action: "AGREED",
          signatureData: signaturePayload.signatureData,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || "Signature failed");

      setContracts((prev) =>
        prev.map((c) =>
          c.id === signaturePayload.contractId
            ? {
                ...c,
                status: "AGREED",
                respondedAt: result.contract.respondedAt,
                signatureData: signaturePayload.signatureData,
              }
            : c
        )
      );

      setShowESignModal(false);
      setSelectedContract(null);
      alert("Contract signed successfully!");
    } catch (err) {
      console.error("E-Sign error:", err);
      alert("Error: " + err.message);
    }
  };

  // Handle Decline action
  const handleDecline = async (contractId) => {
    if (!confirm("Are you sure you want to decline this contract?")) return;

    try {
      const res = await fetch("/api/contracts/respond", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, action: "DECLINED" }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || "Update failed");

      setContracts((prev) =>
        prev.map((c) =>
          c.id === contractId
            ? {
                ...c,
                status: "DECLINED",
                respondedAt: new Date().toISOString(),
              }
            : c
        )
      );

      setSelectedContract(null);
      alert("Contract declined successfully!");
    } catch (err) {
      console.error("Decline error:", err);
      alert("Error: " + err.message);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    try {
      return new Date(timestamp).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return null;
    }
  };

  if (loading) return <p>Loading contracts...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (contracts.length === 0) return <p>No contracts for this booking yet.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">My Contracts</h2>

      {contracts.map((contract) => {
        const serviceTitle =
          contract?.booking?.serviceListing?.title ||
          contract?.booking?.serviceRequest?.title ||
          "Untitled";
        const providerName = contract?.provider
          ? `${contract.provider.firstName || ""} ${contract.provider.lastName || ""}`
          : "N/A";

        return (
          <div
            key={contract.id}
            className="border rounded p-4 shadow-sm bg-white space-y-1"
          >
            <p className="font-semibold">Service: {serviceTitle}</p>
            <p>
              Provider: <span className="font-medium">{providerName}</span>
            </p>
            <p>
              Status:{" "}
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  contract.status === "AGREED"
                    ? "bg-green-100 text-green-700"
                    : contract.status === "DECLINED"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {contract.status || "PENDING"}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Sent on: {new Date(contract.createdAt).toLocaleDateString()}
            </p>
            {contract.respondedAt && (
              <p className="text-xs text-gray-600 mt-1">
                Responded: {formatTimestamp(contract.respondedAt)}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setSelectedContract(contract)}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
              >
                View
              </button>
              <a
                href={`/api/contracts/${contract.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-3 py-1 bg-green-600 text-white rounded"
              >
                Download PDF
              </a>
            </div>
          </div>
        );
      })}

      {/* View Modal */}
      {selectedContract && !showESignModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
            <h3 className="text-lg font-semibold mb-3">Contract Preview</h3>
            <pre className="whitespace-pre-wrap text-sm border p-4 h-80 overflow-y-auto rounded bg-gray-50">
              {selectedContract.text || "No contract text available."}
            </pre>
            <div className="mt-4 flex justify-end gap-2">
              {selectedContract.status === "PENDING" && (
                <>
                  <button
                    onClick={() => setShowESignModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Sign Contract
                  </button>
                  <button
                    onClick={() => handleDecline(selectedContract.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Decline
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E-Signature Modal */}
      {showESignModal && selectedContract && (
        <ContractESignatureModal
          contract={selectedContract}
          onClose={() => {
            setShowESignModal(false);
            setSelectedContract(null);
          }}
          onSign={handleESign}
        />
      )}
    </div>
  );
}
