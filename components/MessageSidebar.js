"use client";

import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";

export default function MessageSidebar({
  conversations,
  currentUserId,
  onSelectConversation,
  selectedConversation,
  initialAutoSelectConversationId,
  showSidebar,
  setShowSidebar,
}) {
  const [localConversations, setLocalConversations] = useState(conversations);
  const [searchTerm, setSearchTerm] = useState("");
  const hasSkippedAutoRead = useRef(false);

  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  const handleSelectConversation = async (conv) => {
    onSelectConversation(conv);

    if (
      conv.conversationId === initialAutoSelectConversationId &&
      !hasSkippedAutoRead.current
    ) {
      hasSkippedAutoRead.current = true;
      return;
    }

    setLocalConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conv.conversationId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.receiverId === currentUserId ? { ...m, readStatus: true } : m
              ),
            }
          : c
      )
    );

    try {
      await fetch(`/api/messages/${conv.conversationId}/mark-read`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  };

  // Filter conversations and pick the last matching message
  const filteredConversations = localConversations
    .map((conv) => {
      const otherUser = conv.participants.find(
        (u) => u.userId !== currentUserId
      );
      const fullName =
        `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.toLowerCase();

      // Find the last message that matches the search term
      const matchingMessage = conv.messages
        ?.slice() // copy to avoid mutating original
        .reverse()
        .find((m) =>
          m.messageContent?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) || matchingMessage;

      return matchesSearch
        ? {
            ...conv,
            lastMessage:
              matchingMessage || conv.messages?.[conv.messages.length - 1],
            otherUser,
          }
        : null;
    })
    .filter(Boolean); // remove nulls

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-40 w-full max-w-sm bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${showSidebar ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:flex md:w-80 md:max-w-none
        flex flex-col h-full
        safe-area-inset
      `}
    >
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-4 md:mb-2">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <button
            onClick={() => setShowSidebar(false)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors pl-10"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <svg
              className="w-12 h-12 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-gray-600 font-medium mb-1">
              No conversations found
            </p>
            <p className="text-gray-500 text-sm">
              {searchTerm
                ? "Try a different search term"
                : "Start a new conversation"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conv) => {
              const { otherUser, lastMessage } = conv;
              const snippet = lastMessage?.messageContent || "No messages yet";
              const time = lastMessage?.sentDate
                ? formatDistanceToNow(new Date(lastMessage.sentDate), {
                    addSuffix: true,
                  })
                : "";

              const hasUnread = conv.messages.some(
                (m) => !m.readStatus && m.receiverId === currentUserId
              );

              const unreadCount = conv.messages.filter(
                (m) => !m.readStatus && m.receiverId === currentUserId
              ).length;

              const isSelected =
                conv.conversationId === selectedConversation?.conversationId;

              return (
                <div
                  key={conv.conversationId}
                  onClick={() => handleSelectConversation(conv)}
                  className={`
                    cursor-pointer p-4 transition-all duration-200 border-l-4 active:bg-gray-100
                    ${
                      isSelected
                        ? "bg-blue-50 border-l-blue-500 md:hover:bg-blue-100"
                        : "border-l-transparent hover:bg-gray-50 hover:border-l-gray-200"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                        {otherUser?.firstName?.[0]?.toUpperCase() || "U"}
                      </div>

                      {/* Unread badge */}
                      {hasUnread && (
                        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 border-2 border-white rounded-full text-xs text-white flex items-center justify-center font-semibold px-1">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`font-semibold truncate text-gray-900 text-base ${
                            hasUnread ? "font-bold" : ""
                          }`}
                        >
                          {otherUser?.firstName} {otherUser?.lastName}
                        </h3>

                        {time && (
                          <time
                            className={`text-xs flex-shrink-0 ${
                              hasUnread
                                ? "text-blue-600 font-semibold"
                                : "text-gray-400"
                            }`}
                          >
                            {time}
                          </time>
                        )}
                      </div>

                      <p
                        className={`text-sm truncate mt-1 ${
                          hasUnread
                            ? "font-semibold text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {snippet ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: snippet.replace(
                                new RegExp(`(${searchTerm})`, "gi"),
                                '<mark class="bg-yellow-200">$1</mark>'
                              ),
                            }}
                          />
                        ) : (
                          "No messages yet"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
