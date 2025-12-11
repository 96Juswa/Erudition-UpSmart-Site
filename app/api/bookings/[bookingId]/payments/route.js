// /api/bookings/[bookingId]/payments/route.js

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch payments for a booking
export async function GET(request, { params }) {
  try {
    const bookingId = parseInt(params.bookingId);

    const payments = await prisma.paymentLog.findMany({
      where: { bookingId },
      include: {
        milestone: true,
        logger: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        attachments: true,
      },
      orderBy: { loggedAt: "desc" },
    });

    // Transform the data to include logger name
    const paymentsWithNames = payments.map((payment) => ({
      ...payment,
      loggedByName: `${payment.logger.firstName} ${payment.logger.lastName}`,
    }));

    return NextResponse.json({ payments: paymentsWithNames });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST - Log a new payment
export async function POST(request, { params }) {
  try {
    const bookingId = parseInt(params.bookingId);
    const body = await request.json();
    const { milestoneId, loggedBy, amount, paymentMethod, notes, attachments } =
      body;

    // Validate required fields
    if (!milestoneId || !loggedBy || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if payment already exists for this milestone
    const existingPayment = await prisma.paymentLog.findFirst({
      where: {
        milestoneId,
        bookingId,
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "Payment already logged for this milestone" },
        { status: 400 }
      );
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceListing: true,
        serviceRequest: true,
        paymentPlan: {
          include: {
            milestones: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Determine who logged the payment (provider or client)
    const isProvider =
      booking.serviceListing?.resolverId === loggedBy ||
      booking.serviceRequest?.resolverId === loggedBy;
    const isClient = booking.clientId === loggedBy;

    // Create payment log with attachments
    const paymentLog = await prisma.paymentLog.create({
      data: {
        milestoneId,
        bookingId,
        loggedBy,
        amount: parseFloat(amount),
        paymentMethod,
        notes,
        providerAcknowledged: isProvider,
        providerAcknowledgedAt: isProvider ? new Date() : null,
        clientAcknowledged: isClient,
        clientAcknowledgedAt: isClient ? new Date() : null,
        attachments:
          attachments && attachments.length > 0
            ? {
                create: attachments.map((att) => ({
                  fileName: att.fileName,
                  fileUrl: att.fileUrl,
                  fileType: att.fileType,
                  fileSize: att.fileSize,
                })),
              }
            : undefined,
      },
      include: {
        attachments: true,
        logger: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Also create entry in the main Payment table
    await prisma.payment.create({
      data: {
        bookingId,
        paymentAmount: parseFloat(amount),
        paymentDate: new Date(),
        paymentMethod,
      },
    });

    // Calculate total paid so far (only fully acknowledged payments)
    const allPayments = await prisma.paymentLog.findMany({
      where: {
        bookingId,
        providerAcknowledged: true,
        clientAcknowledged: true,
      },
    });

    const totalPaid = allPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount),
      0
    );

    const totalPrice = parseFloat(booking.totalPrice);
    const remainingBalance = totalPrice - totalPaid;

    // Update booking payment status
    let newPaymentStatus = booking.paymentStatus;

    if (remainingBalance <= 0) {
      newPaymentStatus = "PAID";
    } else if (totalPaid > 0) {
      newPaymentStatus = "PARTIAL";
    } else {
      newPaymentStatus = "PENDING";
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: newPaymentStatus,
      },
    });

    return NextResponse.json(
      {
        payment: {
          ...paymentLog,
          loggedByName: `${paymentLog.logger.firstName} ${paymentLog.logger.lastName}`,
        },
        bookingUpdated: {
          paymentStatus: newPaymentStatus,
          totalPaid,
          remainingBalance,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error logging payment:", error);
    return NextResponse.json(
      {
        error: "Failed to log payment",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
