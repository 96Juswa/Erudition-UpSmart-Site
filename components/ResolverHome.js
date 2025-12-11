import { getCurrentUser } from "@/app/lib/getCurrentUser";
import ServiceRequestCard from "@/components/ServiceRequestCard";
import prisma from "@/app/lib/prisma";

export default async function ResolverHome() {
  const user = await getCurrentUser();

  // Fetch service requests that are still open and have a future deadline
  const requestsRaw = await prisma.serviceRequest.findMany({
    where: {
      status: "Open",
      deadline: { gte: new Date() },
    },
    orderBy: { requestedDate: "desc" },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          profilePicture: true,
          clientProfile: { select: { trustRating: true } },
        },
      },
      category: { select: { categoryName: true } },
      comments: true,
    },
  });

  // Map requests to match ServiceRequestCard props & filter for high priority (deadline within 5 days)
  const urgentRequests = requestsRaw
    .map((req) => {
      const diffDays =
        (new Date(req.deadline) - new Date()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 5) {
        return {
          requestId: req.id,
          title: req.title,
          description: req.description,
          client: `${req.client.firstName} ${req.client.lastName}`,
          budget:
            req.minPrice && req.maxPrice
              ? `${req.minPrice}-${req.maxPrice}`
              : "N/A",
          category: req.category?.categoryName || "N/A",
          deadline: req.deadline
            ? new Date(req.deadline).toLocaleDateString()
            : "N/A",
          postedTime: req.requestedDate
            ? new Date(req.requestedDate).toLocaleString()
            : "N/A",
          urgency: "high",
          clientImageUrl:
            req.client.profilePicture || "/images/default-avatar.jpg",
          responses: req.comments?.length || 0,
        };
      }
      return null;
    })
    .filter(Boolean); // remove nulls (non-high-priority requests)

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="px-4 sm:px-10 pt-4 sm:pt-10">
        <div className="flex flex-col gap-8 py-8 sm:py-10 px-4 sm:px-20">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl text-[#094074]">
              <span className="text-[#c89933]">🔥 Urgent</span> Service Requests
            </h1>
          </div>

          {/* Urgent Requests Section */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 px-4 sm:px-20 max-h-[70vh] overflow-y-auto">
              {urgentRequests.map((request, index) => (
                <ServiceRequestCard
                  key={index}
                  {...request}
                  className="w-full sm:w-[300px] mx-auto"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
