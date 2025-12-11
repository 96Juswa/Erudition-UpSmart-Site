"use client";

import { useState, useEffect, useRef } from "react";
import { format, isToday, isYesterday } from "date-fns";
import Badge from "./Badge";

export default function MessageThread({
  conversationId,
  currentUserId,
  selectedConversation,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `/api/messages?conversationId=${conversationId}`
        );
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    // Initial fetch
    fetchMessages();

    // Set interval to refresh every 3 seconds
    const interval = setInterval(fetchMessages, 3000);

    // Cleanup on unmount or conversation change
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (!conversationId) return alert("No conversation selected");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, messageContent: newMessage }),
    });

    const saved = await res.json();
    setMessages((prev) => [...prev, saved]);
    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherUser = selectedConversation?.participants.find(
    (u) => u.userId !== currentUserId
  );

  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.createdAt);
    const dateKey = isNaN(date.getTime())
      ? "Invalid Date"
      : isToday(date)
        ? "Today"
        : isYesterday(date)
          ? "Yesterday"
          : format(date, "MMM dd, yyyy");

    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {selectedConversation && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-base">
            {otherUser?.firstName?.[0] || "U"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {otherUser?.firstName} {otherUser?.lastName}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {otherUser?.email}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center text-xs text-gray-400 whitespace-nowrap">
            {selectedConversation?.listingId
              ? `Listing ID: ${selectedConversation.listingId}`
              : selectedConversation?.requestId
                ? `Request ID: ${selectedConversation.requestId}`
                : "No ID"}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            <span className="animate-spin border-t-transparent border-blue-500 border-2 rounded-full h-5 w-5 mr-2" />
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10 px-4">
            {conversationId ? (
              <>
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs mt-1">Start the conversation now.</p>
              </>
            ) : (
              <>
                <p className="text-base font-medium">Welcome to Messages</p>
                <p className="text-sm mt-1">
                  Select a conversation to begin chatting.
                </p>
              </>
            )}
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
            <div key={dateKey}>
              <div className="text-center text-xs text-gray-400 mb-2">
                {dateKey}
              </div>

              {dayMessages.map((msg, index) => {
                const isCurrentUser = msg.senderId === currentUserId;
                const showAvatar =
                  index === 0 ||
                  dayMessages[index - 1].senderId !== msg.senderId;

                const formattedTime = format(
                  new Date(msg.createdAt),
                  "hh:mm a"
                );

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${
                      isCurrentUser ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full ${
                        showAvatar ? "visible" : "invisible"
                      }`}
                    >
                      {isCurrentUser ? (
                        <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full text-white flex items-center justify-center text-xs font-semibold">
                          M
                        </div>
                      ) : (
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white flex items-center justify-center text-xs font-semibold">
                          {otherUser?.firstName?.[0] || "U"}
                        </div>
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[75%] flex flex-col text-sm ${
                        isCurrentUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-2 rounded-xl ${
                          isCurrentUser
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                        }`}
                      >
                        {msg.messageContent}
                      </div>
                      <span className="text-xs text-gray-400 mt-1">
                        {formattedTime}
                        {isCurrentUser &&
                          (msg.readStatus ? " · Seen" : " · Delivered")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {conversationId && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex items-center rounded-full border border-gray-300 bg-gray-50 px-3 py-2 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-sm">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm placeholder-gray-500"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className={`ml-2 rounded-full p-2 transition ${
                newMessage.trim()
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "text-gray-300 cursor-not-allowed"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
