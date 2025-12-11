// app/api/contracts/inbox/route.js
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = parseInt(searchParams.get("userId"), 10);
  const bookingId = parseInt(searchParams.get("bookingId"), 10);

  if (!userId) {
    return NextResponse.json(
      { error: "Missing or invalid userId" },
      { status: 400 }
    );
  }

  if (!bookingId) {
    return NextResponse.json(
      { error: "Missing or invalid bookingId" },
      { status: 400 }
    );
  }

  try {
    const contracts = await prisma.contract.findMany({
      where: {
        receiverId: userId,
        bookingId: bookingId,
      },
      include: {
        booking: {
          include: {
            serviceListing: {
              include: {
                resolver: true, // Include full resolver data for service listings
              },
            },
            serviceRequest: true, // Service request data
            latestProposal: {
              include: {
                sender: true, // This contains resolver data for service requests
                receiver: true,
              },
            },
          },
        },
        provider: true,
      },
    });

    // Map null-safe defaults
    const safeContracts = contracts.map((c) => ({
      id: c.id,
      text: c.text || "",
      status: c.status || "PENDING",
      createdAt: c.createdAt,
      booking: c.booking || {},
      provider: c.provider || {},
    }));

    return NextResponse.json({ contracts: safeContracts });
  } catch (err) {
    console.error("Inbox API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}
