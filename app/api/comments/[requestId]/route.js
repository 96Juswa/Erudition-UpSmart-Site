import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/getCurrentUser';

export async function GET(request, context) {
  const { requestId } = await context.params;

  if (!requestId || isNaN(parseInt(requestId))) {
    return NextResponse.json(
      { error: 'Invalid or missing requestId' },
      { status: 400 }
    );
  }

  try {
    const comments = await prisma.comment.findMany({
      where: {
        serviceRequestId: parseInt(requestId),
        parentCommentId: null,
      },
      include: {
        commenter: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true,
            clientProfile: {
              select: { trustRating: true },
            },
          },
        },
        replies: {
          include: {
            commenter: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true,
                clientProfile: {
                  select: { trustRating: true },
                },
              },
            },
          },
          orderBy: { commentDate: 'asc' },
        },
      },
      orderBy: { commentDate: 'desc' },
    });

    const formatted = comments.map((c) => ({
      id: c.id,
      content: c.commentContent,
      timestamp: c.commentDate,
      role: c.role || 'guest', // ✅ Use stored role
      author: {
        name:
          [c.commenter?.firstName, c.commenter?.lastName]
            .filter(Boolean)
            .join(' ') || 'Anonymous',
        profileImageUrl: c.commenter?.profilePicture || '/default-avatar.png',
        trustRating: c.commenter?.clientProfile?.trustRating || 0,
        userId: c.commenter?.userId,
      },
      replies: c.replies.map((r) => ({
        id: r.id,
        content: r.commentContent,
        timestamp: r.commentDate,
        role: r.role || 'guest', // ✅ Use stored role
        author: {
          name:
            [r.commenter?.firstName, r.commenter?.lastName]
              .filter(Boolean)
              .join(' ') || 'Anonymous',
          profileImageUrl: r.commenter?.profilePicture || '/default-avatar.png',
          trustRating: r.commenter?.clientProfile?.trustRating || 0,
          userId: r.commenter?.userId,
        },
      })),
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('❌ Failed to fetch comments:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req, context) {
  const { requestId } = await context.params;
  const user = await getCurrentUser();

  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!requestId || isNaN(parseInt(requestId))) {
    return NextResponse.json(
      { error: 'Invalid or missing requestId' },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { commentContent, parentCommentId, role } = body;

  if (!commentContent?.trim()) {
    return NextResponse.json(
      { error: 'Missing comment content' },
      { status: 400 }
    );
  }

  if (!role || !['client', 'resolver'].includes(role)) {
    return NextResponse.json(
      { error: 'Missing or invalid role' },
      { status: 400 }
    );
  }

  try {
    const newComment = await prisma.comment.create({
      data: {
        commenterId: user.userId,
        serviceRequestId: parseInt(requestId),
        commentContent: commentContent.trim(),
        parentCommentId: parentCommentId || null,
        role, // ✅ Store role from frontend
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
