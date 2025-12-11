"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Badge from "./Badge";
import UserInfo from "./UserInfo";
import { MessageCircle, Send, Handshake, Pencil, Trash2 } from "lucide-react";
import Button from "./Button";
import { useToast } from "./ToastProvider";
import InputBox from "./InputBox";
import Textarea from "./Textarea";

export default function RequestCard({ request, currentUserId, onDataChanged }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeRole, setActiveRole] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description);
  const [minPrice, setMinPrice] = useState(request.minPrice);
  const [maxPrice, setMaxPrice] = useState(request.maxPrice);
  const [deadline, setDeadline] = useState(
    request.deadline?.split("T")[0] || ""
  );

  useEffect(() => {
    const storedRole = localStorage.getItem("activeRole");
    setActiveRole(storedRole);
  }, []);

  const isResolverView = activeRole === "resolver";
  const isOwner = currentUserId === request.client?.userId;

  const { id, client, category, requestedDate, status } = request;
  console.log("🧩 Client data in RequestCard:", client); // 👈 Add this line

  const fullName = [client?.firstName, client?.lastName]
    .filter(Boolean)
    .join(" ");
  const profileImageUrl = client?.profilePicture;
  const trustRating = client?.clientProfile?.trustRating;

  const formattedDeadline =
    deadline &&
    new Date(deadline).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getRelativeTime = (dateString) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffMs = now - then;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "open":
        return <Badge text="Open" variant="success" />;
      case "closed":
        return <Badge text="Closed" variant="danger" />;
      case "inactive":
        return <Badge text="Inactive" variant="warning" />;
      default:
        return null;
    }
  };

  const handleCardClick = () => {
    router.push(`/client/requests/${id}`);
  };

  const handlePostComment = async (e) => {
    e.stopPropagation();

    if (!commentText.trim()) {
      showToast("Comment cannot be empty.", "warning");
      return;
    }

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceRequestId: id,
          commentContent: commentText.trim(),
          role: activeRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post comment");
      }

      showToast(`Comment posted as ${activeRole}`, "success");
      setCommentText("");
      setShowCommentBox(false);
    } catch (error) {
      showToast(error.message || "Something went wrong.", "error");
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="w-full border-b border-gray-200 py-6 px-4 flex flex-col gap-y-3 cursor-pointer hover:bg-gray-50 transition"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <UserInfo
          name={fullName}
          profileImageUrl={profileImageUrl}
          trustRating={trustRating}
        />
        <div className="flex gap-2 flex-wrap justify-end items-center">
          {category?.categoryName && (
            <Badge text={category.categoryName} variant="primary" />
          )}
          {getStatusBadge(status)}

          {isOwner && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
                title="Edit"
                className="text-blue-600 hover:text-blue-800 transition"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  const confirmed = confirm(
                    "Are you sure you want to delete this request?"
                  );
                  if (!confirmed) return;

                  try {
                    const res = await fetch(`/api/requests/${id}`, {
                      method: "DELETE",
                    });

                    if (!res.ok) {
                      const data = await res.json();
                      throw new Error(data.error || "Failed to delete");
                    }

                    showToast("Request deleted successfully", "success");
                    onDataChanged?.(); // Refresh parent list
                  } catch (error) {
                    showToast(error.message, "error");
                  }
                }}
                title="Delete"
                className="text-red-600 hover:text-red-800 transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-[#094074]">{title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-700 line-clamp-3">{description}</p>

      {/* Deadline + Budget */}
      <div className="flex gap-2 flex-wrap mt-3">
        {formattedDeadline && (
          <Badge text={`Deadline: ${formattedDeadline}`} variant="danger" />
        )}
        <Badge text={`₱${minPrice} – ₱${maxPrice}`} variant="warning" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-gray-500">
          Posted {getRelativeTime(requestedDate)}
        </span>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowCommentBox((prev) => !prev);
            }}
            className="flex items-center gap-1 text-sm text-[#094074] hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            Comment
          </button>
        </div>
      </div>

      {/* Inline Comment Box */}
      {showCommentBox && (
        <div
          className="mt-4 flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment..."
            className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#094074]"
            rows={3}
          />
          <div className="flex justify-end items-center gap-3">
            {isResolverView && (
              <Button
                size="sm"
                color="warning"
                onClick={(e) => {
                  e.stopPropagation();
                  showToast("Offer sent!", "success");
                }}
                iconStart={<Handshake className="w-4 h-4" />}
              >
                Send an Offer
              </Button>
            )}
            <Button
              onClick={handlePostComment}
              size="sm"
              color="primary"
              iconStart={<Send className="w-4 h-4" />}
            >
              Post
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto"
            onClick={() => setShowEditModal(false)}
          />
          <div
            className="relative z-50 bg-white rounded-lg p-6 w-full max-w-lg shadow-xl border border-gray-200 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-[#094074] mb-4">
              Edit Request
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch(`/api/requests/${id}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      title,
                      description,
                      minPrice,
                      maxPrice,
                      deadline,
                    }),
                  });

                  if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Update failed");
                  }

                  showToast("Request updated", "success");
                  setShowEditModal(false);
                  onDataChanged?.(); // Refresh parent list
                } catch (err) {
                  showToast(err.message, "error");
                }
              }}
              className="flex flex-col gap-4"
            >
              <InputBox
                label="Title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter request title"
                required
              />
              <Textarea
                label="Description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your request"
                required
              />
              <InputBox
                label="Deadline"
                type="date"
                name="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
              <div className="flex justify-between gap-3">
                <div className="w-1/2">
                  <InputBox
                    label="Min Price"
                    name="minPrice"
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="w-1/2">
                  <InputBox
                    label="Max Price"
                    name="maxPrice"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button
                  onClick={() => setShowEditModal(false)}
                  color="secondary"
                  variant="outline"
                  size="base"
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  variant="filled"
                  size="base"
                  type="submit"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
