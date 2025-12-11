// app/api/service-requests/[id]/proposals/route.js
// app/api/service-requests/[id]/proposals/route.js
import { getCurrentUser } from "@/app/lib/getCurrentUser";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const requestId = parseInt(params.id);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 }
      );
    }

    // Verify the service request exists
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { clientId: true },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: "Service request not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this service request
    const isClient = serviceRequest.clientId === user.userId;

    let hasResolverAccess = false;
    if (!isClient) {
      // Check if this resolver has sent any proposals for this request
      const resolverProposal = await prisma.bookingProposal.findFirst({
        where: {
          serviceRequestId: requestId,
          senderId: user.userId,
        },
      });
      hasResolverAccess = !!resolverProposal;
    }

    if (!isClient && !hasResolverAccess) {
      return NextResponse.json(
        { error: "Not authorized to view these proposals" },
        { status: 403 }
      );
    }

    // Fetch all proposals for this service request
    const proposals = await prisma.bookingProposal.findMany({
      where: {
        serviceRequestId: requestId,
      },
      include: {
        sender: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
          },
        },
        receiver: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        booking: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "desc" }, // Then newest first
      ],
    });

    // Group proposals by resolver to ensure one pending per resolver
    const proposalsByResolver = proposals.reduce((acc, proposal) => {
      const resolverId = proposal.senderId;
      if (!acc[resolverId]) {
        acc[resolverId] = [];
      }
      acc[resolverId].push(proposal);
      return acc;
    }, {});

    // Return all proposals with additional metadata
    const proposalsWithMetadata = proposals.map((proposal) => ({
      ...proposal,
      isLatestFromResolver:
        proposalsByResolver[proposal.senderId][0].id === proposal.id,
      resolverProposalCount: proposalsByResolver[proposal.senderId].length,
    }));

    return NextResponse.json({
      proposals: proposalsWithMetadata,
      totalProposals: proposals.length,
      pendingCount: proposals.filter((p) => p.status === "PENDING").length,
      uniqueResolvers: Object.keys(proposalsByResolver).length,
    });
  } catch (error) {
    console.error("Error fetching service request proposals:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
