import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { milestones, projects } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateMilestoneSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  color: z.string().optional(),
  position: z.number().optional(),
});

export const PATCH = withAuth(async (request, user, { params }) => {
  try {
    const milestoneId = params.id;

    if (!milestoneId) {
      return NextResponse.json(
        { error: 'Milestone ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateMilestoneSchema.parse(body);

    // Find the milestone and verify user has access
    const [milestone] = await db.select({
      id: milestones.id,
      projectId: milestones.projectId,
    })
    .from(milestones)
    .leftJoin(projects, eq(milestones.projectId, projects.id))
    .where(and(
      eq(milestones.id, milestoneId),
      eq(projects.managerId, user.id)
    ))
    .limit(1);

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found or access denied' },
        { status: 404 }
      );
    }

    // Update the milestone
    const [updatedMilestone] = await db.update(milestones)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(milestones.id, milestoneId))
      .returning();

    return NextResponse.json(updatedMilestone);
  } catch (error) {
    console.error('Error updating milestone:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const milestoneId = params.id;

    if (!milestoneId) {
      return NextResponse.json(
        { error: 'Milestone ID is required' },
        { status: 400 }
      );
    }

    // Find the milestone and verify user has access
    const [milestone] = await db.select({
      id: milestones.id,
      projectId: milestones.projectId,
    })
    .from(milestones)
    .leftJoin(projects, eq(milestones.projectId, projects.id))
    .where(and(
      eq(milestones.id, milestoneId),
      eq(projects.managerId, user.id)
    ))
    .limit(1);

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the milestone
    await db.delete(milestones)
      .where(eq(milestones.id, milestoneId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json(
      { error: 'Failed to delete milestone' },
      { status: 500 }
    );
  }
});