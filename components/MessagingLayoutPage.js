"use client";

import { useState, useEffect } from "react";
import MessageThread from "./MessageThread";
import MessageSidebar from "./MessageSidebar";
import BookingDetails from "./MessageBookingDetails";

export default function MessagingLayoutPage({
  currentUserId,
  targetUserId,
  listingId,
  requestId,
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [initialAutoSelectConversationId, setInitialAutoSelectConversationId] =
    useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  // Fetch and sort conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages/threads");

      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          "❌ Failed to fetch conversations:",
          res.status,
          errorText
        );
        return [];
      }

      const data = await res.json();
      if (!Array.isArray(data)) return [];

      const sorted = data.sort((a, b) => {
        const getTime = (conv) => {
          if (conv.messages?.length > 0) {
            return new Date(conv.messages[0].sentDate).getTime();
          }
          return new Date(conv.createdAt || conv.updatedAt || 0).getTime();
        };
        return getTime(b) - getTime(a);
      });

      setConversations(sorted);
      return sorted;
    } catch (err) {
      console.error("❌ Error parsing conversations:", err);
      return [];
    }
  };

  // 🆕 NEW: Refresh single conversation after proposal actions
  const refreshSelectedConversation = async () => {
    if (!selectedConversation?.conversationId) return;

    try {
      const res = await fetch("/api/messages/threads");
      if (!res.ok) return;

      const allConversations = await res.json();
      const updated = allConversations.find(
        (c) => c.conversationId === selectedConversation.conversationId
      );

      if (updated) {
        setSelectedConversation(updated);
        // Also update the conversations list
        setConversations(
          allConversations.sort((a, b) => {
            const getTime = (conv) => {
              if (conv.messages?.length > 0) {
                return new Date(conv.messages[0].sentDate).getTime();
              }
              return new Date(conv.createdAt || conv.updatedAt || 0).getTime();
            };
            return getTime(b) - getTime(a);
          })
        );

        console.log("🔄 Conversation refreshed:", {
          conversationId: updated.conversationId,
          hasBooking: !!updated.booking,
          latestProposal: updated.booking?.latestProposal?.id,
          proposalStatus: updated.booking?.latestProposal?.status,
        });
      }
    } catch (err) {
      console.error("❌ Error refreshing conversation:", err);
    }
  };

  const handleStartConversation = async ({
    targetUserId,
    listingId,
    requestId,
  }) => {
    try {
      const res = await fetch("/api/messages/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: Number(targetUserId),
          listingId: listingId ? Number(listingId) : null,
          requestId: requestId ? Number(requestId) : null,
        }),
      });
      const data = await res.json();

      const allConversations = await fetchConversations();
      const selected = allConversations.find(
        (c) => c.conversationId === data.conversationId
      );

      setSelectedConversation(selected);
      setInitialAutoSelectConversationId(selected?.conversationId);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (targetUserId) {
        await handleStartConversation({ targetUserId, listingId, requestId });
      } else {
        const allConversations = await fetchConversations();
        if (!selectedConversation && allConversations.length > 0) {
          setSelectedConversation(allConversations[0]);
          setInitialAutoSelectConversationId(
            allConversations[0]?.conversationId
          );
        }
      }
    };
    init();
  }, [targetUserId, listingId, requestId]);

  // 🆕 NEW: Auto-refresh when proposals might be sent
  useEffect(() => {
    if (!selectedConversation?.conversationId) return;

    const interval = setInterval(() => {
      refreshSelectedConversation();
    }, 3000); // Refresh every 3 seconds when conversation is selected

    return () => clearInterval(interval);
  }, [selectedConversation?.conversationId]);

  return (
    <div className="relative w-full">
      {/* Backdrop for mobile sidebar */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Mobile-only header actions */}
      <div className="md:hidden px-4 py-2 flex justify-between gap-2 border-b border-gray-200 bg-white">
        <button
          onClick={() => setShowSidebar(true)}
          className="text-sm text-black-600 font-medium"
        >
          📬 Open Messages
        </button>
        {selectedConversation && (
          <button
            onClick={() => setShowBookingDetails(true)}
            className="text-sm text-black-600 font-medium"
          >
            📋 Booking Details
          </button>
        )}
      </div>

      {/* Layout */}
      <div className="flex h-[85vh] bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100 relative z-40">
        {/* Sidebar */}
        <MessageSidebar
          conversations={conversations}
          currentUserId={currentUserId}
          selectedConversation={selectedConversation}
          onSelectConversation={(conv) => {
            setSelectedConversation(conv);
            setShowSidebar(false);
          }}
          initialAutoSelectConversationId={initialAutoSelectConversationId}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
        />

        {/* Message Thread */}
        <div className="flex-[2] flex flex-col bg-gray-50/30">
          <MessageThread
            conversationId={selectedConversation?.conversationId}
            currentUserId={currentUserId}
            selectedConversation={selectedConversation}
            onMessageSent={async () => {
              const allConversations = await fetchConversations();
              setSelectedConversation((prev) => {
                const updated = allConversations.find(
                  (c) => c.conversationId === prev?.conversationId
                );
                return updated || prev;
              });
            }}
            onProposalSent={refreshSelectedConversation} // 🆕 NEW: Add this prop
          />
        </div>

        {/* Booking Info */}
        <div className="w-96 border-l border-gray-200 bg-white hidden md:block">
          {selectedConversation ? (
            <BookingDetails
              conversation={selectedConversation}
              currentUserId={currentUserId}
              onProposalAction={refreshSelectedConversation} // 🆕 NEW: Add this prop
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <p>Select a conversation</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Booking Details Drawer */}
      {showBookingDetails && selectedConversation && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto shadow-xl md:hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
            <button
              onClick={() => setShowBookingDetails(false)}
              className="text-sm text-red-500 underline"
            >
              Close
            </button>
          </div>
          <div className="px-4 pb-6">
            <BookingDetails
              conversation={selectedConversation}
              currentUserId={currentUserId}
              onProposalAction={refreshSelectedConversation} // 🆕 NEW: Add this prop
            />
          </div>
        </div>
      )}
    </div>
  );
}
