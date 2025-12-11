"use client";

import { useState, useMemo, useEffect } from "react";
import RequestCard from "@/components/RequestCard";
import Dropdown from "@/components/Dropdown";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import CreateRequestModal from "./CreateRequestModal";
import InputBox from "./InputBox";
import { useToast } from "./ToastProvider";

export default function RequestsContent({ user }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [createdByFilter, setCreatedByFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(5);
  const [hydrated, setHydrated] = useState(false);
  const [activeRole, setActiveRole] = useState("client");
  const [showModal, setShowModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [newRequestData, setNewRequestData] = useState({
    title: "",
    description: "",
    category: "",
    deadline: "",
    minPrice: "",
    maxPrice: "",
  });
  const { showToast } = useToast();

  const isClient = useMemo(() => activeRole === "client", [activeRole]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests");
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("activeRole");
    if (stored) setActiveRole(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, []);

  const categoryOptions = useMemo(() => {
    const categories = requests
      .map((r) => r.category?.categoryName)
      .filter(Boolean);
    return ["All", ...Array.from(new Set(categories))];
  }, [requests]);

  // Sorting & Ranking
  const [sortOrder, setSortOrder] = useState("desc"); // descending trustRating
  const [sortField, setSortField] = useState("trustRating");

  const toggleSortOrder = () =>
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));

  const toggleSortField = () => {
    setSortField((prev) =>
      prev === "trustRating" ? "deadline" : "trustRating"
    );
    setSortOrder("desc");
  };

  const filteredAndRankedRequests = useMemo(() => {
    const filtered = requests
      .filter((req) => {
        const query = searchQuery.trim().toLowerCase();
        return (
          req.title.toLowerCase().includes(query) ||
          req.description?.toLowerCase().includes(query)
        );
      })
      .filter((req) => {
        return (
          selectedCategory === "All" ||
          req.category?.categoryName === selectedCategory
        );
      })
      .filter((req) => {
        if (createdByFilter === "Me")
          return req.client?.userId === user?.userId;
        return true;
      });

    const sorted = [...filtered].sort((a, b) => {
      if (sortField === "trustRating") {
        const ratingA = parseFloat(
          a.resolver?.resolverProfile?.trustRating || 0
        );
        const ratingB = parseFloat(
          b.resolver?.resolverProfile?.trustRating || 0
        );
        return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
      } else if (sortField === "deadline") {
        return sortOrder === "asc"
          ? new Date(a.deadline) - new Date(b.deadline)
          : new Date(b.deadline) - new Date(a.deadline);
      }
      return 0;
    });

    return sorted.map((req, index) => {
      let badgeColor = "bg-gray-400 text-white"; // 4th-5th
      if (index === 0)
        badgeColor = "bg-yellow-400 text-white"; // Gold
      else if (index === 1)
        badgeColor = "bg-gray-300 text-black"; // Silver
      else if (index === 2) badgeColor = "bg-orange-600 text-white"; // Bronze

      return {
        ...req,
        rank: index + 1,
        isTopRanked: index < 5,
        badgeColor,
      };
    });
  }, [
    requests,
    searchQuery,
    selectedCategory,
    createdByFilter,
    sortOrder,
    sortField,
    user?.userId,
  ]);

  const visibleRequests = filteredAndRankedRequests.slice(0, visibleCount);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 100
      ) {
        setVisibleCount((prev) =>
          Math.min(prev + 5, filteredAndRankedRequests.length)
        );
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filteredAndRankedRequests.length]);

  const handleCreateRequest = async () => {
    try {
      const payload = {
        title: newRequestData.title.trim(),
        description: newRequestData.description.trim(),
        deadline: new Date(newRequestData.deadline).toISOString(),
        minPrice: parseFloat(newRequestData.minPrice),
        maxPrice: parseFloat(newRequestData.maxPrice),
        categoryId:
          typeof newRequestData.category === "object" &&
          newRequestData.category !== null &&
          "id" in newRequestData.category
            ? String(newRequestData.category.id)
            : "",
      };
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create request");
      }
      await fetchRequests();
      setShowModal(false);
      setNewRequestData({
        title: "",
        description: "",
        category: "",
        deadline: "",
        minPrice: "",
        maxPrice: "",
      });
      showToast("Request submitted successfully!", "success");
    } catch (error) {
      console.error("❌ Submission error:", error);
      showToast(
        error.message || "Something went wrong while submitting your request.",
        "error"
      );
    }
  };

  return (
    <div className="py-10 px-4 md:px-20">
      <h1 className="text-2xl sm:text-3xl text-[#094074] mb-6 break-words">
        <span className="text-[#c89933]">Service</span> Requests
      </h1>

      {hydrated && (
        <div className=" top-0 bg-white py-4 border-b border-gray-200 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <InputBox
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Title or Description..."
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 flex-1">
              <Dropdown
                label="Category"
                options={categoryOptions}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                className="flex-1 min-w-[120px]"
              />
              <Dropdown
                label="Created By"
                options={["All", "Me"]}
                selected={createdByFilter}
                onSelect={setCreatedByFilter}
                className="flex-1 min-w-[120px]"
              />
              <button
                onClick={toggleSortField}
                className="bg-[#094074] text-white px-3 py-2 rounded-md hover:bg-[#072c57] transition flex-1 min-w-[120px]"
              >
                Sort:{" "}
                {sortField === "trustRating" ? "Trust Rating" : "Deadline"}
              </button>
              <button
                onClick={toggleSortOrder}
                className="bg-[#094074] text-white px-3 py-2 rounded-md hover:bg-[#072c57] transition flex-1 min-w-[120px]"
              >
                Order: {sortOrder === "asc" ? "Asc" : "Desc"}
              </button>
              {isClient && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-[#094074] text-white px-3 py-2 rounded-md hover:bg-[#072c57] transition flex-1 min-w-[120px]"
                >
                  Create Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 mt-4">
        {visibleRequests.length > 0 ? (
          visibleRequests.map((req) => (
            <div key={req.id} className="relative">
              {req.isTopRanked && (
                <span
                  className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold z-10 ${req.badgeColor}`}
                >
                  #{req.rank}
                </span>
              )}
              <RequestCard
                request={req}
                currentUserId={user?.userId}
                onDataChanged={fetchRequests}
              />
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm mt-4">
            No matching requests found.
          </p>
        )}
      </div>

      {visibleCount < filteredAndRankedRequests.length && (
        <p className="text-center text-sm text-gray-400 mt-6">
          Loading more requests...
        </p>
      )}

      <ScrollToTopButton />

      <CreateRequestModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateRequest}
        requestData={newRequestData}
        setRequestData={setNewRequestData}
      />
    </div>
  );
}
