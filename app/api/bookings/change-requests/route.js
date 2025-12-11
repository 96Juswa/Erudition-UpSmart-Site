import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(req) {
  try {
    const {
      bookingId,
      requesterId,
      type,
      reason,
      newPrice,
      newDeadline,
      newStartDate, // ✅ Added this field
    } = await req.json();

    console.log("Received change request:", {
      bookingId,
      requesterId,
      type,
      reason,
      newPrice,
      newDeadline,
      newStartDate, // ✅ Added this field
    });

    if (!bookingId || !requesterId || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const bookingIdInt = parseInt(bookingId, 10);
    const requesterIdInt = parseInt(requesterId, 10);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingIdInt },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const changeRequestData = {
      bookingId: bookingIdInt,
      requesterId: requesterIdInt,
      type,
      reason,
    };

    // ✅ Handle optional fields properly
    if (newPrice !== undefined && newPrice !== null) {
      changeRequestData.newPrice = parseFloat(newPrice);
    }

    if (newDeadline) {
      changeRequestData.newDeadline = new Date(newDeadline);
    }

    // ✅ Added newStartDate handling
    if (newStartDate) {
      changeRequestData.newStartDate = new Date(newStartDate);
    }

    const changeRequest = await prisma.bookingChangeRequest.create({
      data: changeRequestData,
    });

    return NextResponse.json({ success: true, changeRequest });
  } catch (error) {
    console.error("Booking Change Request Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
