"use client";
import { useEffect, useState } from "react";

export default function ResolverContractsInbox({ currentUserId, bookingId }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!currentUserId || !bookingId) return;

      try {
        const res = await fetch(
          `/api/contracts/resolver-inbox?userId=${currentUserId}&bookingId=${bookingId}`
        );
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Failed to parse JSON:", text);
          data = {};
        }

        if (!res.ok) throw new Error(data.error || "Failed to fetch contracts");

        setContracts(data.contracts || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [currentUserId, bookingId]);

  if (loading) return <p>Loading contracts...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (contracts.length === 0) return <p>No contracts for this booking yet.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Contracts</h2>

      {contracts.map((contract) => (
        <div
          key={contract.id}
          className="border rounded p-4 shadow-sm bg-white space-y-1"
        >
          <p className="font-semibold">
            Service:{" "}
            {contract.booking.serviceListing?.title ||
              contract.booking.serviceRequest?.title ||
              "Untitled"}
          </p>
          <p>
            Client:{" "}
            <span className="font-medium">
              {contract.receiver
                ? `${contract.receiver.firstName} ${contract.receiver.lastName}`
                : "N/A"}
            </span>
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
              {contract.status}
            </span>
          </p>
          <p className="text-sm text-gray-500">
            Sent on: {new Date(contract.createdAt).toLocaleDateString()}
          </p>
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
      ))}

      {/* Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
            <h3 className="text-lg font-semibold mb-3">Contract Preview</h3>
            <pre className="whitespace-pre-wrap text-sm border p-4 h-80 overflow-y-auto rounded bg-gray-50">
              {selectedContract.text}
            </pre>
            <div className="mt-4 flex justify-end gap-2">
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
    </div>
  );
}
