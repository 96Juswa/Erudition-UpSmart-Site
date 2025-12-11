"use client";

import Image from "next/image";
import Button from "./Button";
import { Send, Book } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ServiceRequestCard({
  title,
  description,
  client,
  budget,
  category,
  deadline,
  postedTime,
  urgency,
  clientImageUrl,
  responses,
  requestId,
}) {
  const getUrgencyVariant = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "info";
    }
  };

  const router = useRouter();

  const handleSeeDetails = () => {
    router.push(`/client/requests/${requestId}`);
  };

  const getBadgeClasses = (variant) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (variant) {
      case "danger":
        return `${baseClasses} bg-red-100 text-red-700`;
      case "warning":
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case "success":
        return `${baseClasses} bg-green-100 text-green-700`;
      case "info":
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case "primary":
        return `${baseClasses} bg-[#094074]/10 text-[#094074]`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 w-80 flex-shrink-0 border border-gray-100 hover:border-[#c89933]/30">
      {/* Header with urgency and category */}
      <div className="flex justify-between items-start mb-4">
        <span className={getBadgeClasses(getUrgencyVariant(urgency))}>
          {urgency?.charAt(0).toUpperCase() + urgency?.slice(1)} Priority
        </span>
        <span className={getBadgeClasses("primary")}>{category}</span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-[#094074] mb-3 line-clamp-2 min-h-[3.5rem] leading-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-700 text-sm mb-4 line-clamp-3 min-h-[4rem] leading-relaxed">
        {description}
      </p>

      {/* Budget and Deadline */}
      <div className="flex justify-between items-center mb-4 py-3 px-4 bg-gray-50 rounded-lg">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            Budget
          </span>
          <p className="text-[#094074] font-medium text-sm mt-1">₱{budget}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            Deadline
          </span>
          <p className="text-[#094074] font-medium text-sm mt-1">{deadline}</p>
        </div>
      </div>

      {/* Client Info */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image
              src={clientImageUrl}
              alt={client}
              fill
              className="rounded-full object-cover shadow-sm"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-[#094074]">{client}</p>
            <p className="text-xs text-gray-500">{postedTime}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">{responses}</p>
          <p className="text-xs text-gray-500">responses</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full">
        <Button
          size="sm"
          color="primary"
          iconStart={<Book className="w-4 h-4" />}
          onClick={handleSeeDetails}
          className="w-full"
        >
          See Details
        </Button>
      </div>
    </div>
  );
}
