"use client";

import { useState } from "react";
import { format } from "date-fns";
import RespondToRequestModal from "./BookingSectionFolder/RespondToRequestModal";

export default function ProposalsSection({
  proposals,
  currentUserId,
  onProposalAction,
}) {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);

  if (!proposals || proposals.length === 0) {
    return null;
  }

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "PPpp");
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "declined":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "modified":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getProposalIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "✅";
      case "pending":
        return "⏳";
      case "declined":
        return "❌";
      case "modified":
        return "🔄";
      default:
        return "📋";
    }
  };

  const handleRespondToProposal = (proposal) => {
    setSelectedProposal(proposal);
    setIsRespondModalOpen(true);
  };

  const pendingProposals = proposals.filter((p) => p.status === "PENDING");
  const otherProposals = proposals.filter((p) => p.status !== "PENDING");

  return (
    <>
      <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-5 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Service Offers ({proposals.length})
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                {pendingProposals.length} pending • {otherProposals.length}{" "}
                reviewed
              </p>
            </div>
          </div>
        </div>

        {/* Pending Proposals */}
        {pendingProposals.length > 0 && (
          <div className="p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Pending Offers - Action Required
            </h4>
            <div className="space-y-3">
              {pendingProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="border border-amber-200 rounded-lg p-4 bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getProposalIcon(proposal.status)}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {proposal.sender?.firstName} {proposal.sender?.lastName}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          proposal.status
                        )}`}
                      >
                        {proposal.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ₱{Number(proposal.price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-700 mb-3">
                    <p className="mb-2">{proposal.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-medium">Start:</span>{" "}
                        {proposal.startDate
                          ? formatDate(proposal.startDate)
                          : "Not specified"}
                      </div>
                      <div>
                        <span className="font-medium">Deadline:</span>{" "}
                        {proposal.deadline
                          ? formatDate(proposal.deadline)
                          : "Not specified"}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Sent {formatDate(proposal.createdAt)}
                    </p>
                    <button
                      onClick={() => handleRespondToProposal(proposal)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                    >
                      Review Offer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Proposals (Accepted, Declined, Modified) */}
        {otherProposals.length > 0 && (
          <div className="p-5 border-t">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Previous Offers
            </h4>
            <div className="space-y-3">
              {otherProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getProposalIcon(proposal.status)}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {proposal.sender?.firstName} {proposal.sender?.lastName}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          proposal.status
                        )}`}
                      >
                        {proposal.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ₱{Number(proposal.price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    <p className="mb-1">{proposal.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-medium">Start:</span>{" "}
                        {proposal.startDate
                          ? formatDate(proposal.startDate)
                          : "Not specified"}
                      </div>
                      <div>
                        <span className="font-medium">Deadline:</span>{" "}
                        {proposal.deadline
                          ? formatDate(proposal.deadline)
                          : "Not specified"}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Sent {formatDate(proposal.createdAt)}
                    </p>
                    {proposal.declineReason && (
                      <p className="text-xs text-red-600 italic">
                        "{proposal.declineReason}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {isRespondModalOpen && selectedProposal && (
        <RespondToRequestModal
          onClose={() => {
            setIsRespondModalOpen(false);
            setSelectedProposal(null);
          }}
          proposal={selectedProposal}
          bookingId={null} // No booking yet for Flow B
          currentUserId={currentUserId}
          context="request"
          onSuccess={() => {
            setIsRespondModalOpen(false);
            setSelectedProposal(null);
            onProposalAction && onProposalAction();
          }}
        />
      )}
    </>
  );
}
