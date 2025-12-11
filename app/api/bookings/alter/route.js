import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// POST: Send a new alteration request
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      bookingId,
      requesterId,
      newPrice,
      newStartDate,
      newDeadline,
      reason,
    } = body;

    if (!bookingId || !requesterId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if there's already a pending alteration request
    const existingRequest = await prisma.bookingChangeRequest.findFirst({
      where: {
        bookingId: parseInt(bookingId),
        status: "PENDING",
        type: "ALTERATION",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error:
            "There is already a pending alteration request for this booking",
        },
        { status: 400 }
      );
    }

    // Verify booking exists and user is authorized
    // Verify booking exists and user is authorized
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        serviceListing: { select: { resolverId: true } },
        serviceRequest: { select: { resolverId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // --- NEW: Prevent alterations if booking is not CONFIRMED ---
    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        {
          error: "Alteration requests can only be made for confirmed bookings",
        },
        { status: 400 }
      );
    }

    // Check if user is authorized (client or resolver)
    const resolverId =
      booking.serviceListing?.resolverId || booking.serviceRequest?.resolverId;
    const isAuthorized =
      requesterId === booking.clientId || requesterId === resolverId;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Not authorized to modify this booking" },
        { status: 403 }
      );
    }

    // Validate at least one change is requested
    if (!newPrice && !newStartDate && !newDeadline) {
      return NextResponse.json(
        {
          error:
            "At least one modification (price, start date, or deadline) must be specified",
        },
        { status: 400 }
      );
    }

    // Create the alteration request
    const alteration = await prisma.bookingChangeRequest.create({
      data: {
        bookingId: parseInt(bookingId),
        requesterId: parseInt(requesterId),
        type: "ALTERATION",
        newPrice: newPrice ? parseFloat(newPrice) : null,
        newStartDate: newStartDate ? new Date(newStartDate) : null,
        newDeadline: newDeadline ? new Date(newDeadline) : null,
        reason: reason || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        alteration,
        message: "Modification request sent successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Alteration request error:", err);
    return NextResponse.json(
      { error: "Failed to create alteration request", details: err.message },
      { status: 500 }
    );
  }
}

// PATCH: Approve or decline an alteration
// PATCH: Approve or decline an alteration
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { changeRequestId, action } = body;

    if (!changeRequestId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["APPROVE", "DECLINE"].includes(action.toUpperCase())) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const changeRequest = await prisma.bookingChangeRequest.findUnique({
      where: { id: parseInt(changeRequestId) },
      include: { booking: true },
    });

    if (!changeRequest) {
      return NextResponse.json(
        { error: "Change request not found" },
        { status: 404 }
      );
    }

    if (changeRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This change request has already been processed" },
        { status: 400 }
      );
    }

    const newStatus =
      action.toUpperCase() === "APPROVE" ? "APPROVED" : "DECLINED";

    await prisma.bookingChangeRequest.update({
      where: { id: changeRequest.id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // --- Log previous booking status for traceability ---
    const previousBookingStatus = changeRequest.booking.status;
    console.log(
      `Change Request ${changeRequest.id} (${newStatus}) for Booking ${changeRequest.bookingId}`
    );
    console.log("Previous booking status:", previousBookingStatus);

    let updatedBooking = null;

    if (newStatus === "APPROVED") {
      const bookingUpdate = {
        status: "CONFIRMED",
      };

      if (changeRequest.newPrice != null)
        bookingUpdate.totalPrice = changeRequest.newPrice;
      if (changeRequest.newStartDate != null)
        bookingUpdate.startDate = new Date(changeRequest.newStartDate);
      if (changeRequest.newDeadline != null) {
        bookingUpdate.deadline = new Date(changeRequest.newDeadline);
        bookingUpdate.paymentDue = new Date(changeRequest.newDeadline);
      }

      console.log("Booking update payload:", bookingUpdate);

      updatedBooking = await prisma.booking.update({
        where: { id: changeRequest.bookingId },
        data: bookingUpdate,
      });

      // Update latest proposal if exists
      if (changeRequest.booking.latestProposalId) {
        const proposalUpdate = {};
        if (changeRequest.newPrice != null)
          proposalUpdate.price = changeRequest.newPrice;
        if (changeRequest.newStartDate != null)
          proposalUpdate.startDate = new Date(changeRequest.newStartDate);
        if (changeRequest.newDeadline != null)
          proposalUpdate.deadline = new Date(changeRequest.newDeadline);

        if (Object.keys(proposalUpdate).length > 0) {
          await prisma.bookingProposal.update({
            where: { id: changeRequest.booking.latestProposalId },
            data: { ...proposalUpdate, updatedAt: new Date() },
          });
          console.log("Latest proposal updated with new values");
        }
      }
    } else {
      // If DECLINED, booking stays exactly the same
      updatedBooking = await prisma.booking.findUnique({
        where: { id: changeRequest.bookingId },
      });
      console.log("Booking unchanged because alteration was declined.");
    }

    return NextResponse.json(
      {
        success: true,
        message:
          newStatus === "APPROVED"
            ? "Modification request approved and booking updated"
            : "Modification request declined. Booking remains unchanged.",
        booking: updatedBooking,
        previousBookingStatus,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Alteration response error:", err);
    return NextResponse.json(
      { error: "Failed to process alteration request", details: err.message },
      { status: 500 }
    );
  }
}
