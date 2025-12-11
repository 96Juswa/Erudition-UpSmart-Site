import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { recalculateTrustRating } from "@/app/lib/trustRating";
import { updateCounters } from "@/app/lib/updateCounters";

export async function POST(req, contextPromise) {
  const { params } = await contextPromise;

  try {
    const bookingId = Number(params.bookingId);
    const body = await req.json();
    const { description, mediaUrls, updaterId, status } = body;

    console.log("🚀 Incoming Progress Update:", {
      bookingId,
      updaterId,
      status,
      description,
      mediaUrls,
    });

    if (!bookingId || !updaterId || !status) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Validate the booking exists and user has permission
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceListing: {
          select: { resolverId: true },
        },
        serviceRequest: {
          select: { resolverId: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    // Determine booking type and get resolver ID
    const isServiceListing = !!booking.serviceListingId;
    const isServiceRequest = !!booking.serviceRequestId;

    let resolverId = null;

    if (isServiceListing && booking.serviceListing) {
      resolverId = booking.serviceListing.resolverId;
    } else if (isServiceRequest && booking.serviceRequest) {
      resolverId = booking.serviceRequest.resolverId;
    }

    if (!resolverId) {
      return NextResponse.json(
        { error: "Could not determine resolver for this booking." },
        { status: 400 }
      );
    }

    // Only resolver or client can update progress
    if (updaterId !== resolverId && updaterId !== booking.clientId) {
      return NextResponse.json(
        { error: "Unauthorized to update this booking." },
        { status: 403 }
      );
    }

    // Validate status transitions
    const validStatuses = [
      "AWAITING_START",
      "IN_PROGRESS",
      "COMPLETED",
      "AWAITING_REVIEW",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    // Create the progress update
    const newUpdate = await prisma.progressUpdate.create({
      data: {
        bookingId,
        updaterId,
        status,
        message: description || null,
        imageUrl: mediaUrls?.imageUrl || null,
        videoUrl: mediaUrls?.videoUrl || null,
        fileUrl: mediaUrls?.fileUrl || null,
      },
    });

    // Update booking based on status
    const updateBookingData = {};
    switch (status) {
      case "IN_PROGRESS":
        updateBookingData.status = "IN_PROGRESS";
        if (booking.clientAcknowledged === false) {
          updateBookingData.clientAcknowledged = null;
        }
        break;

      case "COMPLETED":
        updateBookingData.status = "COMPLETED";
        updateBookingData.completedAt = new Date();
        updateBookingData.clientAcknowledged = null;

        break;

      case "REVIEW_COMPLETED":
        updateBookingData.status = "REVIEW_COMPLETED";
        updateBookingData.clientAcknowledged = null;

        try {
          // Recalculate trust ratings
          await recalculateTrustRating(booking.clientId, "client");
          await recalculateTrustRating(resolverId, "resolver");

          // Increment completed booking counter only if not already counted
          if (!booking.completedBookingCounted) {
            await updateCounters("REVIEW_COMPLETED", {
              resolverId,
              clientId: booking.clientId,
            });

            await prisma.booking.update({
              where: { id: bookingId },
              data: { completedBookingCounted: true },
            });

            console.log(`✅ Booking counters incremented for REVIEW_COMPLETED`);
          }
        } catch (err) {
          console.error(
            "⚠️ Error updating counters/trust after REVIEW_COMPLETED:",
            err
          );
        }
        break;

      case "AWAITING_START":
        updateBookingData.status = "CONFIRMED";
        break;

      case "AWAITING_REVIEW":
        updateBookingData.status = "AWAITING_REVIEW";
        break;

      default:
        updateBookingData.status = status;
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: updateBookingData,
    });

    // Optional: notify client if completed
    if (status === "COMPLETED") {
      const bookingType = isServiceListing
        ? "service listing"
        : "service request";
      console.log(
        `📧 Should notify client ${booking.clientId} that ${bookingType} booking ${bookingId} is completed`
      );
    }

    return NextResponse.json(
      {
        message: "Progress update saved successfully",
        progressUpdate: newUpdate,
        bookingStatus: updateBookingData.status,
        bookingType: isServiceListing ? "SERVICE_LISTING" : "SERVICE_REQUEST",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error in POST /progress:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
