"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ButtonIcon from "./ButtonIcon";
import ServiceImage from "./ServiceImage";
import PortfolioCarousel from "./PortfolioCarousel";
import PortfolioModal from "./PortfolioModal";
import Divider from "./Divider";
import UserInfo from "./UserInfo";
import Badge from "./Badge";
import ReviewsSection from "./ReviewsSection";
import { Flag } from "lucide-react";
import ReportModal from "./ReportModal";

export default function ServiceDetailContent({ service, currentUser }) {
  const router = useRouter();
  const goBack = () => router.push("/client/services");

  const [selectedItem, setSelectedItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsError, setReviewsError] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // 🔹 NEW STATE: track service image dynamically
  const [serviceImageUrl, setServiceImageUrl] = useState(service.serviceImage);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews/${service.id}`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        console.error("Review Fetch Error:", err);
        setReviewsError(err.message);
      }
    }

    if (service?.id) fetchReviews();
  }, [service?.id]);

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const res = await fetch(`/api/fetch-portfolio/${service.id}`);
        if (!res.ok) throw new Error("Failed to fetch portfolio items");
        const data = await res.json();

        // Flatten out files for the carousel
        const formatted = data.flatMap((item) =>
          item.files.map((file) => ({
            type: file.type,
            url: file.url,
            isThumbnail: file.isThumbnail, // 🔹 keep track of thumbnail
          }))
        );

        setPortfolioItems(formatted);

        // 🔹 Update service image if a thumbnail exists
        const thumbnailFile = formatted.find((f) => f.isThumbnail);
        if (thumbnailFile) setServiceImageUrl(thumbnailFile.url);
      } catch (err) {
        console.error("Portfolio Fetch Error:", err);
      }
    }

    if (service?.id) fetchPortfolio();
  }, [service?.id]);

  const handleContactProvider = async () => {
    try {
      const conversationRes = await fetch("/api/messages/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: service.resolverId,
          listingId: service.id, // ✅ Correct key
        }),
      });

      if (!conversationRes.ok) {
        const errorText = await conversationRes.text();
        console.error("Failed to start conversation:", errorText);
        throw new Error("Failed to start conversation");
      }

      const { conversationId } = await conversationRes.json();
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      console.error("Contact initiation failed:", err);
      alert("Something went wrong starting the conversation.");
    }
  };

  return (
    <div className="px-4 sm:px-10 py-4 sm:py-6 flex flex-col gap-6">
      {/* Back Button */}
      <ButtonIcon
        onClick={goBack}
        icon={ArrowLeft}
        ariaLabel="Go back"
        className="w-fit"
      />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Service Image */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <ServiceImage imageUrl={serviceImageUrl} title={service.title} />
        </div>

        {/* Right Column: Details & Portfolio */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 pr-0 lg:pr-2 justify-between">
          {/* Title & Price */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#094074]">
              {service.title}
            </h2>
            <span className="text-[#c89933] bg-[#fcf5e7] text-lg sm:text-xl font-semibold px-3 py-1.5 rounded-full shadow-sm">
              ₱{service.minPrice} - ₱{service.maxPrice}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-700 leading-relaxed">{service.description}</p>

          {/* Info Tags */}
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge text={service.category} variant="primary" />
            <Badge
              text={service.location}
              variant={service.location === "Onsite" ? "success" : "warning"}
              className="capitalize"
            />
            <Badge
              text={service.availability}
              variant={
                service.availability === "Available"
                  ? "success"
                  : service.availability === "Busy"
                    ? "warning"
                    : "info"
              }
            />
          </div>

          {/* Portfolio */}
          {portfolioItems.length > 0 && (
            <>
              <Divider orientation="horizontal" />
              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-bold text-[#094074] mb-2">
                  Portfolio
                </h3>
                <PortfolioCarousel
                  items={portfolioItems}
                  onItemClick={setSelectedItem}
                />
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm text-red-600 hover:underline"
                  onClick={() => setReportModalOpen(true)}
                >
                  <Flag className="w-4 h-4" />
                  Report Listing
                </button>
              </div>
            </>
          )}

          <Divider orientation="horizontal" />

          {/* Provider Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
            <UserInfo
              name={service.provider}
              profileImageUrl={service.profileImageUrl}
              trustRating={service.trustRating}
            />
            <button
              className="bg-[#094074] hover:bg-[#072c57] text-white text-sm font-medium px-4 py-2 rounded-full shadow transition w-full sm:w-auto"
              onClick={handleContactProvider}
            >
              Contact Provider
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-4">
        {reviewsError ? (
          <div className="text-red-600 text-center py-4 font-medium">
            Failed to load reviews: {reviewsError}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No reviews yet.</p>
        ) : (
          <ReviewsSection reviews={reviews} />
        )}
      </div>

      {/* Modals */}
      {selectedItem && (
        <PortfolioModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reporterId={currentUser?.userId}
        reportedUserId={service?.resolverId}
      />
    </div>
  );
}
