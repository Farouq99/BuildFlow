import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatMessages } from '@/lib/schema';
import { requireAuth } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const createMessageSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['text', 'file', 'system']).default('text'),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.projectId, projectId))
      .orderBy(chatMessages.timestamp)
      .limit(100);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createMessageSchema.parse(body);

    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        ...validatedData,
        timestamp: new Date(),
      })
      .returning();

    return NextResponse.json(newMessage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error creating chat message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}