"use client";

import { useState, useEffect } from "react";
import RequestToBookModal from "./BookingSectionFolder/RequestToBookModal";
import RespondToRequestModal from "./BookingSectionFolder/RespondToRequestModal";
import BookingSection from "./BookingSectionFolder/BookingSection";
import ListingSection from "./BookingSectionFolder/ListingSection";
import RequestSection from "./BookingSectionFolder/RequestSection";
import InquirySection from "./BookingSectionFolder/InquirySection";
import EmptyState from "./BookingSectionFolder/EmptyState";
import ProposalsSection from "./ProposalsSection";

export default function MessageBookingDetails({
  conversation,
  currentUserId,
  refreshConversation, // Parent should provide this
}) {
  const listing = conversation.listing || null;
  const request = conversation.request || null;

  // Keep latestProposal only if current user is involved
  const booking = conversation.booking
    ? {
        ...conversation.booking,
        conversation: conversation, // ✅ ADD THIS LINE - pass the conversation back
        latestProposal:
          conversation.booking.latestProposal?.receiverId === currentUserId ||
          conversation.booking.latestProposal?.senderId === currentUserId
            ? conversation.booking.latestProposal
            : null,
      }
    : null;

  const latestProposal = booking?.latestProposal || null;
  const hasMessages = conversation.messages?.length > 0;

  const [isRequestModalOpen, setRequestModalOpen] = useState(false);
  const [isRespondModalOpen, setRespondModalOpen] = useState(false);
  const [proposals, setProposals] = useState([]); // For Flow B proposals
  const [resolverProposalStatus, setResolverProposalStatus] = useState(null); // For Flow B resolver status

  // Determine user roles
  const getUserRoles = () => {
    if (listing) {
      const isResolver = listing.resolverId === currentUserId;
      const isClient = !isResolver;
      return {
        resolverId: listing.resolverId,
        clientId: conversation.participants?.find(
          (p) => p.userId !== listing.resolverId
        )?.userId,
        isClient,
        isResolver,
        context: "listing",
      };
    }

    if (request) {
      const isClient = request.clientId === currentUserId;
      const isResolver = !isClient;
      return {
        clientId: request.clientId,
        resolverId: conversation.participants?.find(
          (p) => p.userId !== request.clientId
        )?.userId,
        isClient,
        isResolver,
        context: "request",
      };
    }

    if (latestProposal) {
      const isClient =
        latestProposal.receiverId === currentUserId && !listing && !request;
      const isResolver =
        latestProposal.senderId === currentUserId && !listing && !request;
      return {
        resolverId: latestProposal.senderId,
        clientId: latestProposal.receiverId,
        isClient,
        isResolver,
        context: "proposal",
      };
    }

    return {
      resolverId: null,
      clientId: null,
      isClient: false,
      isResolver: false,
      context: "unknown",
    };
  };

  const { isClient, isResolver, context } = getUserRoles();
  const hasNoBookingYet = !booking;

  // FIXED: Better pending proposal detection
  const hasPendingProposal = (() => {
    // For service requests, check the proposals array for any pending proposal where current user is receiver
    if (context === "request" && proposals.length > 0) {
      return proposals.some(
        (p) => p.status === "PENDING" && p.receiverId === currentUserId
      );
    }

    // For listings or when we have latestProposal from booking
    return (
      latestProposal?.status === "PENDING" &&
      latestProposal?.receiverId === currentUserId
    );
  })();

  // Helper to get the correct pending proposal for response
  const getPendingProposalToRespond = () => {
    if (context === "request" && proposals.length > 0) {
      return proposals.find(
        (p) => p.status === "PENDING" && p.receiverId === currentUserId
      );
    }
    return latestProposal;
  };

  // Fetch proposals for Flow B service requests (client side AND resolver side)
  const fetchProposalsForRequest = async () => {
    if (!request) return;

    try {
      const res = await fetch(`/api/service-requests/${request.id}/proposals`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
      }
    } catch (err) {
      console.error("Error fetching proposals:", err);
    }
  };

  // Fetch resolver's proposal status for Flow B (resolver side)
  const fetchResolverProposalStatus = async () => {
    if (!request || !isResolver) return;

    try {
      const res = await fetch(
        `/api/service-requests/${request.id}/resolver-status/${currentUserId}`
      );
      if (res.ok) {
        const data = await res.json();
        setResolverProposalStatus(data);
      }
    } catch (err) {
      console.error("Error fetching resolver status:", err);
      setResolverProposalStatus(null);
    }
  };

  // Fetch proposals when request context loads (both client and resolver need this)
  useEffect(() => {
    if (context === "request") {
      fetchProposalsForRequest();
    }
  }, [request?.id, context]);

  // Fetch resolver status when request context loads (resolver side)
  useEffect(() => {
    if (context === "request" && isResolver) {
      fetchResolverProposalStatus();
    }
  }, [request?.id, context, isResolver]);

  // Empty State
  if (!booking && !listing && !request && !hasMessages) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900">Reservations</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {booking && (
          <BookingSection booking={booking} currentUserId={currentUserId} />
        )}

        {/* Show proposals section for Flow B before booking is created (client side) */}
        {context === "request" &&
          isClient &&
          hasNoBookingYet &&
          proposals.length > 0 && (
            <ProposalsSection
              proposals={proposals}
              currentUserId={currentUserId}
              onProposalAction={() => {
                fetchProposalsForRequest();
                refreshConversation && refreshConversation();
              }}
            />
          )}

        {listing && <ListingSection listing={listing} />}
        {request && <RequestSection request={request} />}
        {!booking && !listing && !request && hasMessages && <InquirySection />}
      </div>

      <div className="border-t px-6 py-4">
        {/* Flow A: Client booking listing */}
        {context === "listing" && isClient && hasNoBookingYet && (
          <>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md w-full hover:bg-blue-700"
              onClick={() => setRequestModalOpen(true)}
            >
              Request to Book
            </button>
            {isRequestModalOpen && (
              <RequestToBookModal
                onClose={() => setRequestModalOpen(false)}
                conversation={conversation}
                onSuccess={() => {
                  setRequestModalOpen(false);
                  refreshConversation && refreshConversation();
                }}
              />
            )}
          </>
        )}

        {/* Flow B: Resolver offering for request */}
        {context === "request" && isResolver && hasNoBookingYet && (
          <>
            {(() => {
              // Determine the resolver state
              if (!resolverProposalStatus) {
                // No proposal sent yet
                return (
                  <>
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded-md w-full hover:bg-green-700"
                      onClick={() => setRequestModalOpen(true)}
                    >
                      Send Offer to Book
                    </button>
                    {isRequestModalOpen && (
                      <RequestToBookModal
                        onClose={() => setRequestModalOpen(false)}
                        conversation={conversation}
                        isOffer={true}
                        onSuccess={() => {
                          setRequestModalOpen(false);
                          refreshConversation && refreshConversation();
                          fetchProposalsForRequest();
                          fetchResolverProposalStatus();
                        }}
                      />
                    )}
                  </>
                );
              }

              if (resolverProposalStatus.status === "PENDING") {
                // Offer is still awaiting client response
                return (
                  <div className="text-center space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse mr-2"></div>
                        <span className="font-semibold text-amber-800">
                          Offer Sent
                        </span>
                      </div>
                      <p className="text-amber-700 text-sm mb-2">
                        Your service offer is awaiting client response
                      </p>
                      <div className="text-xs text-amber-600 space-y-1">
                        <p>
                          Offered: ₱
                          {Number(resolverProposalStatus.price || 0).toFixed(2)}
                        </p>
                        {resolverProposalStatus.deadline && (
                          <p>
                            Deadline:{" "}
                            {new Date(
                              resolverProposalStatus.deadline
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setRequestModalOpen(true)}
                      className="w-full px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      Update Offer
                    </button>

                    {isRequestModalOpen && (
                      <RespondToRequestModal
                        onClose={() => setRequestModalOpen(false)}
                        proposal={resolverProposalStatus}
                        bookingId={null}
                        currentUserId={currentUserId}
                        context={context}
                        isAlteration={true}
                        onSuccess={() => {
                          setRequestModalOpen(false);
                          refreshConversation && refreshConversation();
                          fetchResolverProposalStatus();
                        }}
                      />
                    )}
                  </div>
                );
              }

              if (resolverProposalStatus.status === "DECLINED") {
                // Proposal was declined — allow sending new offer
                return (
                  <div className="text-center space-y-3">
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                      <div className="flex items-center justify-center mb-2">
                        <span className="text-rose-600 text-lg mr-2">✗</span>
                        <span className="font-semibold text-rose-800">
                          Offer Declined
                        </span>
                      </div>
                      <p className="text-rose-700 text-sm mb-2">
                        {resolverProposalStatus.declineReason ===
                        "Request was assigned to another resolver"
                          ? "This request was assigned to another resolver"
                          : "Your offer was declined by the client"}
                      </p>
                      {resolverProposalStatus.declineReason &&
                        resolverProposalStatus.declineReason !==
                          "Request was assigned to another resolver" && (
                          <div className="bg-rose-100 rounded p-2 mt-2">
                            <p className="text-xs text-rose-600 italic">
                              "{resolverProposalStatus.declineReason}"
                            </p>
                          </div>
                        )}
                    </div>

                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded-md w-full hover:bg-green-700"
                      onClick={() => setRequestModalOpen(true)}
                    >
                      Send New Offer
                    </button>

                    {isRequestModalOpen && (
                      <RequestToBookModal
                        onClose={() => setRequestModalOpen(false)}
                        conversation={conversation}
                        isOffer={true}
                        onSuccess={() => {
                          setRequestModalOpen(false);
                          refreshConversation && refreshConversation();
                          fetchProposalsForRequest();
                          fetchResolverProposalStatus();
                        }}
                      />
                    )}
                  </div>
                );
              }

              // Fallback for other statuses
              return (
                <div className="text-center text-gray-500 text-sm py-4">
                  Continue the conversation to discuss the service request.
                </div>
              );
            })()}
          </>
        )}

        {/* Respond to pending proposal - FIXED VERSION */}
        {hasPendingProposal && (
          <>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md w-full hover:bg-green-700"
              onClick={() => setRespondModalOpen(true)}
            >
              {context === "listing"
                ? "Respond to Booking Request"
                : "Respond to Service Offer"}
            </button>
            {isRespondModalOpen && (
              <RespondToRequestModal
                onClose={() => setRespondModalOpen(false)}
                proposal={getPendingProposalToRespond()}
                bookingId={booking?.id}
                currentUserId={currentUserId}
                context={context}
                onSuccess={() => {
                  setRespondModalOpen(false);
                  refreshConversation && refreshConversation();
                  if (context === "request" && isResolver) {
                    fetchResolverProposalStatus();
                  }
                  if (context === "request") {
                    fetchProposalsForRequest();
                  }
                }}
              />
            )}
          </>
        )}

        {/* Client waiting for offers */}
        {context === "request" &&
          isClient &&
          hasNoBookingYet &&
          proposals.length === 0 &&
          !hasPendingProposal && (
            <div className="text-center space-y-3">
              <div className="text-gray-600 text-sm py-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-medium text-blue-900 mb-1">
                  Waiting for Service Offers
                </div>
                <p className="text-blue-700">
                  Resolvers can send you offers for your service request. You'll
                  be able to review and respond to them here.
                </p>
              </div>
              <div className="text-xs text-gray-500">
                Continue the conversation to discuss your requirements with
                potential resolvers.
              </div>
            </div>
          )}

        {/* Booking exists but no pending proposals */}
        {!hasNoBookingYet && booking && !hasPendingProposal && (
          <div className="text-center text-gray-500 text-sm py-4">
            {booking.status === "CONFIRMED"
              ? "Booking confirmed. Check progress above."
              : booking.status
                ? `Booking status: ${booking.status.replace("_", " ").toLowerCase()}`
                : "Booking details available."}
          </div>
        )}

        {/* No actions available - General inquiry */}
        {!hasPendingProposal && hasNoBookingYet && context === "unknown" && (
          <div className="text-center text-gray-500 text-sm py-4">
            Continue the conversation to discuss booking details.
          </div>
        )}
      </div>
    </div>
  );
}
