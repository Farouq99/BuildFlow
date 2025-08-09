import {
  users,
  projects,
  documents,
  budgetCategories,
  activities,
  calculatorResults,
  projectMembers,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Document,
  type InsertDocument,
  type BudgetCategory,
  type InsertBudgetCategory,
  type Activity,
  type InsertActivity,
  type CalculatorResult,
  type InsertCalculatorResult,
  type ProjectMember,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  getProjectMembers(projectId: string): Promise<(ProjectMember & { user: User })[]>;
  addProjectMember(projectId: string, userId: string, role: string): Promise<void>;
  
  // Document operations
  getDocuments(projectId: string): Promise<(Document & { uploader: User })[]>;
  createDocument(document: InsertDocument & { uploadedBy: string }): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  
  // Budget operations
  getBudgetCategories(projectId: string): Promise<BudgetCategory[]>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: string, updates: Partial<InsertBudgetCategory>): Promise<BudgetCategory>;
  
  // Activity operations
  getActivities(projectId: string, limit?: number): Promise<(Activity & { user: User })[]>;
  createActivity(activity: InsertActivity & { userId: string }): Promise<Activity>;
  
  // Calculator operations
  getCalculatorResults(userId: string, projectId?: string): Promise<CalculatorResult[]>;
  saveCalculatorResult(result: InsertCalculatorResult & { userId: string }): Promise<CalculatorResult>;
  
  // Dashboard data
  getDashboardStats(userId: string): Promise<{
    activeProjects: number;
    totalBudget: number;
    teamMembers: number;
    completionRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getProjects(userId: string): Promise<Project[]> {
    // Get projects where user is manager or member
    const managedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.managerId, userId))
      .orderBy(desc(projects.updatedAt));

    const memberProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        location: projects.location,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        budget: projects.budget,
        spent: projects.spent,
        progress: projects.progress,
        managerId: projects.managerId,
        imageUrl: projects.imageUrl,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
      .where(eq(projectMembers.userId, userId))
      .orderBy(desc(projects.updatedAt));

    // Combine and deduplicate
    const allProjects = [...managedProjects, ...memberProjects];
    const uniqueProjects = allProjects.filter((project, index, self) => 
      index === self.findIndex(p => p.id === project.id)
    );

    return uniqueProjects;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(projectData)
      .returning();
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getProjectMembers(projectId: string): Promise<(ProjectMember & { user: User })[]> {
    return await db
      .select({
        id: projectMembers.id,
        projectId: projectMembers.projectId,
        userId: projectMembers.userId,
        role: projectMembers.role,
        joinedAt: projectMembers.joinedAt,
        user: users,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));
  }

  async addProjectMember(projectId: string, userId: string, role: string): Promise<void> {
    await db.insert(projectMembers).values({
      projectId,
      userId,
      role,
    });
  }

  async getDocuments(projectId: string): Promise<(Document & { uploader: User })[]> {
    return await db
      .select({
        id: documents.id,
        projectId: documents.projectId,
        uploadedBy: documents.uploadedBy,
        name: documents.name,
        originalName: documents.originalName,
        fileType: documents.fileType,
        fileSize: documents.fileSize,
        filePath: documents.filePath,
        category: documents.category,
        version: documents.version,
        isLatest: documents.isLatest,
        uploadedAt: documents.uploadedAt,
        uploader: users,
      })
      .from(documents)
      .innerJoin(users, eq(documents.uploadedBy, users.id))
      .where(eq(documents.projectId, projectId))
      .orderBy(desc(documents.uploadedAt));
  }

  async createDocument(documentData: InsertDocument & { uploadedBy: string }): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(documentData)
      .returning();
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async getBudgetCategories(projectId: string): Promise<BudgetCategory[]> {
    return await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.projectId, projectId))
      .orderBy(budgetCategories.name);
  }

  async createBudgetCategory(categoryData: InsertBudgetCategory): Promise<BudgetCategory> {
    const [category] = await db
      .insert(budgetCategories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateBudgetCategory(id: string, updates: Partial<InsertBudgetCategory>): Promise<BudgetCategory> {
    const [category] = await db
      .update(budgetCategories)
      .set(updates)
      .where(eq(budgetCategories.id, id))
      .returning();
    return category;
  }

  async getActivities(projectId: string, limit: number = 10): Promise<(Activity & { user: User })[]> {
    return await db
      .select({
        id: activities.id,
        projectId: activities.projectId,
        userId: activities.userId,
        type: activities.type,
        description: activities.description,
        metadata: activities.metadata,
        createdAt: activities.createdAt,
        user: users,
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.projectId, projectId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activityData: InsertActivity & { userId: string }): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(activityData)
      .returning();
    return activity;
  }

  async getCalculatorResults(userId: string, projectId?: string): Promise<CalculatorResult[]> {
    const conditions = [eq(calculatorResults.userId, userId)];
    if (projectId) {
      conditions.push(eq(calculatorResults.projectId, projectId));
    }

    return await db
      .select()
      .from(calculatorResults)
      .where(and(...conditions))
      .orderBy(desc(calculatorResults.createdAt));
  }

  async saveCalculatorResult(resultData: InsertCalculatorResult & { userId: string }): Promise<CalculatorResult> {
    const [result] = await db
      .insert(calculatorResults)
      .values(resultData)
      .returning();
    return result;
  }

  async getDashboardStats(userId: string): Promise<{
    activeProjects: number;
    totalBudget: number;
    teamMembers: number;
    completionRate: number;
  }> {
    // Get user's projects
    const userProjects = await this.getProjects(userId);
    const activeProjects = userProjects.filter(p => p.status === 'active').length;
    
    // Calculate total budget
    const totalBudget = userProjects.reduce((sum, project) => {
      return sum + (parseFloat(project.budget || '0'));
    }, 0);

    // Get unique team members across all projects
    const allMembers = new Set<string>();
    for (const project of userProjects) {
      const members = await this.getProjectMembers(project.id);
      members.forEach(member => allMembers.add(member.userId));
    }

    // Calculate average completion rate
    const completionRate = userProjects.length > 0 
      ? userProjects.reduce((sum, project) => sum + (project.progress || 0), 0) / userProjects.length
      : 0;

    return {
      activeProjects,
      totalBudget,
      teamMembers: allMembers.size,
      completionRate: Math.round(completionRate),
    };
  }
}

export const storage = new DatabaseStorage();
