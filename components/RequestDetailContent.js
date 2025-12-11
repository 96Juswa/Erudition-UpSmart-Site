"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flag } from "lucide-react";
import ButtonIcon from "./ButtonIcon";
import Divider from "./Divider";
import UserInfo from "./UserInfo";
import Badge from "./Badge";
import CommentThread from "./CommentThread";
import ReportModal from "./ReportModal";

export default function RequestDetailContent({
  request,
  comments,
  currentUser,
}) {
  const router = useRouter();
  const goBack = () => router.push("/client/requests");

  const [reportModalOpen, setReportModalOpen] = useState(false);

  const {
    id: requestId,
    title,
    description,
    minPrice,
    maxPrice,
    deadline,
    requestedDate,
    category,
    status,
    client,
  } = request;

  const fullName = [client.firstName, client.lastName]
    .filter(Boolean)
    .join(" ");
  const profileImageUrl = client.profilePicture || "/default-avatar.png";
  const trustRating = client.clientProfile?.trustRating;

  const formattedDeadline = deadline
    ? new Date(deadline).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const formattedPosted = new Date(requestedDate).toLocaleDateString(
    undefined,
    { year: "numeric", month: "long", day: "numeric" }
  );

  const getStatusVariant = (status) => {
    switch (status) {
      case "open":
        return "success";
      case "closed":
        return "danger";
      case "inactive":
        return "neutral";
      default:
        return "info";
    }
  };

  return (
    <div className="px-4 sm:px-10 py-4 sm:py-6 flex flex-col gap-6">
      <ButtonIcon
        onClick={goBack}
        icon={ArrowLeft}
        ariaLabel="Go back"
        className="w-fit"
      />

      <div className="flex flex-col gap-6">
        {/* Title + Price */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#094074] break-words">
            {title}
          </h2>
          <span className="text-[#c89933] bg-[#fcf5e7] text-lg sm:text-xl font-semibold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap">
            ₱{minPrice} – ₱{maxPrice}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">
          {description}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 sm:gap-3 text-sm">
          {category?.categoryName && (
            <Badge text={category.categoryName} variant="primary" />
          )}
          {formattedDeadline && (
            <Badge text={`Deadline: ${formattedDeadline}`} variant="danger" />
          )}
          <Badge text={`Posted: ${formattedPosted}`} variant="neutral" />
          <Badge
            text={status}
            variant={getStatusVariant(status)}
            className="capitalize"
          />
        </div>

        <Divider orientation="horizontal" />

        {/* User Info + Report */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <UserInfo
            name={fullName}
            profileImageUrl={profileImageUrl}
            trustRating={trustRating}
          />
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-1 text-sm text-red-600 hover:underline"
          >
            <Flag className="w-4 h-4" /> Report Request
          </button>
        </div>

        {/* Comment Section */}
        <CommentThread
          requestId={requestId}
          comments={comments}
          currentUser={currentUser}
          clientId={client.userId}
        />
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reporterId={currentUser?.userId}
        reportedUserId={client.userId}
      />
    </div>
  );
}
