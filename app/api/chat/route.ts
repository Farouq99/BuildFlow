import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { chatMessages, projects, users } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { insertChatMessageSchema } from '@/lib/schema';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to the project
    const [project] = await db.select({
      id: projects.id,
    })
    .from(projects)
    .where(and(
      eq(projects.id, projectId),
      eq(projects.managerId, user.id)
    ))
    .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get recent messages with user info
    const messages = await db.select({
      id: chatMessages.id,
      projectId: chatMessages.projectId,
      userId: chatMessages.userId,
      message: chatMessages.message,
      messageType: chatMessages.messageType,
      metadata: chatMessages.metadata,
      replyTo: chatMessages.replyTo,
      isEdited: chatMessages.isEdited,
      editedAt: chatMessages.editedAt,
      createdAt: chatMessages.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(chatMessages)
    .leftJoin(users, eq(chatMessages.userId, users.id))
    .where(eq(chatMessages.projectId, projectId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

    // Return in ascending order (oldest first)
    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const validatedData = insertChatMessageSchema.parse({
      ...body,
      userId: user.id,
    });

    // Verify user has access to the project
    const [project] = await db.select({
      id: projects.id,
    })
    .from(projects)
    .where(and(
      eq(projects.id, validatedData.projectId),
      eq(projects.managerId, user.id)
    ))
    .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const [newMessage] = await db.insert(chatMessages)
      .values(validatedData)
      .returning();

    // Get message with user info for real-time broadcasting
    const [messageWithUser] = await db.select({
      id: chatMessages.id,
      projectId: chatMessages.projectId,
      userId: chatMessages.userId,
      message: chatMessages.message,
      messageType: chatMessages.messageType,
      metadata: chatMessages.metadata,
      replyTo: chatMessages.replyTo,
      isEdited: chatMessages.isEdited,
      editedAt: chatMessages.editedAt,
      createdAt: chatMessages.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(chatMessages)
    .leftJoin(users, eq(chatMessages.userId, users.id))
    .where(eq(chatMessages.id, newMessage.id))
    .limit(1);

    return NextResponse.json(messageWithUser, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
});