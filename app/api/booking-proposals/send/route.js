// app/api/booking-proposals/send/route.js
import { getCurrentUser } from "@/app/lib/getCurrentUser";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const {
      conversationId,
      receiverId,
      serviceListingId,
      serviceRequestId,
      description,
      price,
      startDate,
      deadline,
      attachment,
    } = await request.json();

    // Validation
    if (!conversationId || !receiverId || !description || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    // Verify conversation exists and user is participant
    const conversation = await prisma.conversation.findUnique({
      where: { conversationId: parseInt(conversationId) },
      include: {
        participants: { select: { userId: true } },
        listing: true,
        request: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId === user.userId
    );
    if (!isParticipant) {
      return NextResponse.json(
        { error: "Not authorized for this conversation" },
        { status: 403 }
      );
    }

    // Determine context and validate permissions
    let context = "general";
    let bookingId = null;

    if (serviceListingId) {
      // Flow A: Client requesting to book a service listing (UNCHANGED)
      context = "listing";

      const listing = await prisma.serviceListing.findUnique({
        where: { id: serviceListingId },
        select: { resolverId: true },
      });

      if (!listing) {
        return NextResponse.json(
          { error: "Service listing not found" },
          { status: 404 }
        );
      }

      // Client should be sending to resolver
      if (listing.resolverId !== receiverId) {
        return NextResponse.json(
          { error: "Invalid receiver for this listing" },
          { status: 400 }
        );
      }

      // Create initial booking for listing request (FLOW A UNCHANGED)
      const newBooking = await prisma.booking.create({
        data: {
          clientId: user.userId,
          serviceListingId: serviceListingId,
          bookingDate: new Date(),
          totalPrice: parsedPrice,
          paymentStatus: "PENDING",
          paymentDue: deadline
            ? new Date(deadline)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
          status: "SERVICE_REQUESTED",
          startDate: startDate ? new Date(startDate) : null,
        },
      });

      bookingId = newBooking.id;

      // Link conversation to booking (FLOW A UNCHANGED)
      await prisma.conversation.update({
        where: { conversationId: parseInt(conversationId) },
        data: { bookingId: newBooking.id },
      });
    } else if (serviceRequestId) {
      // Flow B: Resolver offering to fulfill a service request
      context = "request";

      const request = await prisma.serviceRequest.findUnique({
        where: { id: serviceRequestId },
        select: { clientId: true },
      });

      if (!request) {
        return NextResponse.json(
          { error: "Service request not found" },
          { status: 404 }
        );
      }

      // Resolver should be sending to client
      if (request.clientId !== receiverId) {
        return NextResponse.json(
          { error: "Invalid receiver for this request" },
          { status: 400 }
        );
      }

      // Check if this resolver already has a pending proposal for this request
      const existingProposal = await prisma.bookingProposal.findFirst({
        where: {
          serviceRequestId: serviceRequestId,
          senderId: user.userId,
          status: "PENDING",
        },
      });

      if (existingProposal) {
        return NextResponse.json(
          { error: "You already have a pending proposal for this request" },
          { status: 400 }
        );
      }

      // Flow B: Don't create booking yet - only create proposal
      // Booking will be created when client accepts the proposal
    }

    // Create the booking proposal
    const proposal = await prisma.bookingProposal.create({
      data: {
        senderId: user.userId,
        receiverId: receiverId,
        serviceListingId: serviceListingId || null,
        serviceRequestId: serviceRequestId || null,
        description: description,
        price: parsedPrice,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        attachments: attachment || null,
        status: "PENDING",
        bookingId: bookingId, // null for Flow B until accepted
      },
      include: {
        sender: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
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
        listing: {
          include: {
            service: { include: { category: true } },
          },
        },
        request: {
          include: {
            category: true,
          },
        },
      },
    });
    console.log("🔍 Creating proposal with:", {
      senderId: user.userId,
      receiverId: receiverId,
      serviceRequestId: serviceRequestId,
      context: context,
    });
    // Update booking with latest proposal if it was created (Flow A only)
    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          latestProposalId: proposal.id,
          status: "SERVICE_PROPOSAL_SENT",
        },
      });
    }

    return NextResponse.json({
      proposal: proposal,
      bookingId: bookingId,
      context: context,
    });
  } catch (error) {
    console.error("Error sending booking proposal:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
