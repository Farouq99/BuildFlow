import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { milestones } from '@/lib/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createMilestoneSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignedTo: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  order: z.number().default(0),
});

const updateMilestoneSchema = createMilestoneSchema.partial();

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

    const projectMilestones = await db
      .select()
      .from(milestones)
      .where(eq(milestones.projectId, projectId))
      .orderBy(milestones.order);

    return NextResponse.json(projectMilestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
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
    const validatedData = createMilestoneSchema.parse(body);

    const [newMilestone] = await db
      .insert(milestones)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newMilestone);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle milestone reordering
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pathname } = new URL(request.url);
    
    // Handle reorder endpoint
    if (pathname.endsWith('/reorder')) {
      const body = await request.json();
      const { milestones: reorderedMilestones } = body;

      // Update each milestone's order
      const updates = reorderedMilestones.map((milestone: any) =>
        db
          .update(milestones)
          .set({ order: milestone.order, updatedAt: new Date() })
          .where(eq(milestones.id, milestone.id))
      );

      await Promise.all(updates);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
  } catch (error) {
    console.error('Error reordering milestones:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}