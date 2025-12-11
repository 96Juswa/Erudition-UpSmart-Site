"use client";

import { useState, useEffect } from "react";
import { Clock, History, Send, Handshake, MessageCircle } from "lucide-react";
import Button from "./Button";
import CommentItem from "./CommentItem";
import { useToast } from "./ToastProvider";
import { useRouter } from "next/navigation";

export default function CommentThread({
  requestId,
  clientId, // ✅ pass the clientId from parent
  comments: initialComments = [],
}) {
  const [sortOrder, setSortOrder] = useState("newest");
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const storedRole = localStorage.getItem("activeRole");
    setActiveRole(storedRole);
  }, []);

  const isResolverView = activeRole === "resolver";

  const sortedComments = [...comments].sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments/${requestId}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ Failed to fetch comments: ${res.status}`, errorText);
        showToast("Failed to load comments.", "error");
        return;
      }

      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error("❌ Comment fetch error:", err);
      showToast("Something went wrong while loading comments.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [requestId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/comments/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentContent: newComment.trim(),
          role: activeRole,
        }),
      });

      if (!res.ok) throw new Error("Failed to post comment");
      setNewComment("");
      showToast("Comment posted successfully!", "success");

      fetchComments();
    } catch (err) {
      console.error("❌ Post error:", err);
      showToast("Could not post comment.", "error");
    }
  };

  const handleSendOffer = () => {
    showToast("Offer sent!", "success");
  };

  const handleMessageClient = async () => {
    if (!clientId) {
      showToast("Client ID not found.", "error");
      return;
    }

    try {
      const res = await fetch("/api/messages/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: clientId,
          requestId: requestId,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Failed to start conversation:", errorText);
        throw new Error("Failed to start conversation");
      }

      const { conversationId } = await res.json();
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      console.error("❌ Message client error:", err);
      showToast("Failed to start conversation with client.", "error");
    }
  };

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* Header and Sort */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#094074]">Comments</h3>
        <Button
          onClick={toggleSortOrder}
          color="primary"
          variant="outline"
          size="sm"
          iconStart={
            sortOrder === "newest" ? (
              <Clock className="w-4 h-4" />
            ) : (
              <History className="w-4 h-4" />
            )
          }
        >
          {sortOrder === "newest" ? "Newest First" : "Oldest First"}
        </Button>
      </div>

      {/* Add Comment */}
      <div className="flex flex-col gap-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full border border-gray-300 rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#094074]"
          rows={3}
        />
        <div className="flex items-center justify-end gap-3">
          {isResolverView && (
            <>
              <Button
                onClick={handleMessageClient}
                color="primary"
                size="sm"
                iconStart={<MessageCircle className="w-4 h-4" />}
              >
                Message Client
              </Button>
            </>
          )}
          <Button
            onClick={handleAddComment}
            color="primary"
            size="sm"
            iconStart={<Send className="w-4 h-4" />}
          >
            Post Comment
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex flex-col">
        {loading ? (
          <p className="text-sm text-gray-500">Loading comments...</p>
        ) : sortedComments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet.</p>
        ) : (
          sortedComments.map((comment, index) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              showDivider={index < sortedComments.length - 1}
              isOwnComment={false}
              role={comment.role}
            />
          ))
        )}
      </div>
    </div>
  );
}
