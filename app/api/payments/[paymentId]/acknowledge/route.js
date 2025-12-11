// /api/payments/[paymentId]/acknowledge/route.js

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const paymentId = parseInt(params.paymentId);
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get the payment log
    const paymentLog = await prisma.paymentLog.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            serviceListing: true,
            serviceRequest: true,
          },
        },
      },
    });

    if (!paymentLog) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Determine if user is provider or client
    const isProvider =
      paymentLog.booking.serviceListing?.resolverId === userId ||
      paymentLog.booking.serviceRequest?.resolverId === userId;
    const isClient = paymentLog.booking.clientId === userId;

    if (!isProvider && !isClient) {
      return NextResponse.json(
        { error: "Unauthorized to acknowledge this payment" },
        { status: 403 }
      );
    }

    // Update acknowledgment
    const updateData = {};
    if (isProvider && !paymentLog.providerAcknowledged) {
      updateData.providerAcknowledged = true;
      updateData.providerAcknowledgedAt = new Date();
    }
    if (isClient && !paymentLog.clientAcknowledged) {
      updateData.clientAcknowledged = true;
      updateData.clientAcknowledgedAt = new Date();
    }

    const updatedPayment = await prisma.paymentLog.update({
      where: { id: paymentId },
      data: updateData,
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

    // If both parties have acknowledged, update booking payment status
    if (
      updatedPayment.providerAcknowledged &&
      updatedPayment.clientAcknowledged
    ) {
      // Calculate total paid (only fully acknowledged payments)
      const allAcknowledgedPayments = await prisma.paymentLog.findMany({
        where: {
          bookingId: paymentLog.bookingId,
          providerAcknowledged: true,
          clientAcknowledged: true,
        },
      });

      const totalPaid = allAcknowledgedPayments.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0
      );

      const totalPrice = parseFloat(paymentLog.booking.totalPrice);
      const remainingBalance = totalPrice - totalPaid;

      // Update booking payment status
      let newPaymentStatus = "PENDING";

      if (remainingBalance <= 0.01) {
        // Allow for small floating point differences
        newPaymentStatus = "PAID";
      } else if (totalPaid > 0) {
        newPaymentStatus = "PARTIAL";
      }

      await prisma.booking.update({
        where: { id: paymentLog.bookingId },
        data: {
          paymentStatus: newPaymentStatus,
        },
      });
    }

    return NextResponse.json({
      payment: {
        ...updatedPayment,
        loggedByName: `${updatedPayment.logger.firstName} ${updatedPayment.logger.lastName}`,
      },
    });
  } catch (error) {
    console.error("Error acknowledging payment:", error);
    return NextResponse.json(
      {
        error: "Failed to acknowledge payment",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
