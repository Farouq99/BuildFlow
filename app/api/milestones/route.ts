import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { milestones, projects } from '@/lib/schema';
import { eq, and, asc } from 'drizzle-orm';
import { insertMilestoneSchema } from '@/lib/schema';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

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

    // Get milestones ordered by position
    const projectMilestones = await db.select()
      .from(milestones)
      .where(eq(milestones.projectId, projectId))
      .orderBy(asc(milestones.position));

    return NextResponse.json(projectMilestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const validatedData = insertMilestoneSchema.parse(body);

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

    const [newMilestone] = await db.insert(milestones)
      .values(validatedData)
      .returning();

    return NextResponse.json(newMilestone, { status: 201 });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json(
      { error: 'Failed to create milestone' },
      { status: 500 }
    );
  }
});