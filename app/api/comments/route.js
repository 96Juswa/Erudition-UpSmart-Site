import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import { getCurrentUser } from '../../lib/getCurrentUser';

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { serviceRequestId, commentContent, role } = body;

    if (!serviceRequestId || !commentContent?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!role || typeof role !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid role' },
        { status: 400 }
      );
    }

    const newComment = await prisma.comment.create({
      data: {
        commenterId: user.userId,
        serviceRequestId: parseInt(serviceRequestId),
        commentContent: commentContent.trim(),
        role, // ✅ Store the role
      },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('❌ Failed to post comment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
