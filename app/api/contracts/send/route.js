// app/api/contracts/send/route.js
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { bookingId, proposalId, receiverId, providerId, text, fileUrl } =
      body;

    // Basic validation
    if (!bookingId || !proposalId || !receiverId || !providerId || !text) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Ensure booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    // Create the contract
    const contract = await prisma.contract.create({
      data: {
        bookingId,
        proposalId,
        receiverId,
        providerId,
        text,
        fileUrl: fileUrl || "",
        status: "PENDING",
      },
    });

    return NextResponse.json({ contract });
  } catch (err) {
    console.error("Error creating contract:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
