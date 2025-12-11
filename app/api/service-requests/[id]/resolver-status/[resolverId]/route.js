// app/api/service-requests/[id]/resolver-status/[resolverId]/route.js
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
    const resolverId = parseInt(params.resolverId);

    if (isNaN(requestId) || isNaN(resolverId)) {
      return NextResponse.json(
        { error: "Invalid request or resolver ID" },
        { status: 400 }
      );
    }

    // Verify user is the resolver requesting their own status
    if (user.userId !== resolverId) {
      return NextResponse.json(
        { error: "Not authorized to view this status" },
        { status: 403 }
      );
    }

    // Get the resolver's latest proposal for this service request
    const proposal = await prisma.bookingProposal.findFirst({
      where: {
        serviceRequestId: requestId,
        senderId: resolverId,
      },
      orderBy: {
        createdAt: "desc", // Get most recent proposal
      },
      include: {
        sender: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            status: true,
            clientId: true,
          },
        },
        booking: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!proposal) {
      // No proposal found - resolver hasn't sent an offer yet
      return NextResponse.json(null);
    }

    // Return the proposal status with additional context
    return NextResponse.json({
      id: proposal.id,
      status: proposal.status,
      price: proposal.price,
      description: proposal.description,
      startDate: proposal.startDate,
      deadline: proposal.deadline,
      declineReason: proposal.declineReason,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      hasBooking: !!proposal.booking,
      bookingStatus: proposal.booking?.status,
      requestStatus: proposal.request?.status,
      attachments: proposal.attachments,
    });
  } catch (error) {
    console.error("Error fetching resolver status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
