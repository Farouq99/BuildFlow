import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'project_manager', 
  'engineer',
  'subcontractor',
  'client'
]);

// Project status enum
export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'active',
  'on_hold',
  'completed',
  'cancelled'
]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('client'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  status: projectStatusEnum("status").default('planning'),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  spent: decimal("spent", { precision: 12, scale: 2 }).default('0'),
  progress: integer("progress").default(0), // 0-100
  managerId: varchar("manager_id").references(() => users.id),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project team members
export const projectMembers = pgTable("project_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role", { length: 100 }),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Budget categories
export const budgetCategories = pgTable("budget_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  budgeted: decimal("budgeted", { precision: 12, scale: 2 }).notNull(),
  spent: decimal("spent", { precision: 12, scale: 2 }).default('0'),
  color: varchar("color", { length: 7 }).default('#FF6B35'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents/Files
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }),
  fileSize: integer("file_size"),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }),
  version: integer("version").default(1),
  isLatest: boolean("is_latest").default(true),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Activity log
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type", { length: 100 }).notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calculator results (for saving/sharing calculations)
export const calculatorResults = pgTable("calculator_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id),
  calculatorType: varchar("calculator_type", { length: 100 }).notNull(),
  inputs: jsonb("inputs").notNull(),
  results: jsonb("results").notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  managedProjects: many(projects),
  projectMemberships: many(projectMembers),
  uploadedDocuments: many(documents),
  activities: many(activities),
  calculatorResults: many(calculatorResults),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  manager: one(users, {
    fields: [projects.managerId],
    references: [users.id],
  }),
  members: many(projectMembers),
  budgetCategories: many(budgetCategories),
  documents: many(documents),
  activities: many(activities),
  calculatorResults: many(calculatorResults),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ one }) => ({
  project: one(projects, {
    fields: [budgetCategories.projectId],
    references: [projects.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  project: one(projects, {
    fields: [activities.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const calculatorResultsRelations = relations(calculatorResults, ({ one }) => ({
  user: one(users, {
    fields: [calculatorResults.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [calculatorResults.projectId],
    references: [projects.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  location: true,
  startDate: true,
  endDate: true,
  budget: true,
  managerId: true,
  imageUrl: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  projectId: true,
  name: true,
  originalName: true,
  fileType: true,
  fileSize: true,
  filePath: true,
  category: true,
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).pick({
  projectId: true,
  name: true,
  budgeted: true,
  color: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  projectId: true,
  type: true,
  description: true,
  metadata: true,
});

export const insertCalculatorResultSchema = createInsertSchema(calculatorResults).pick({
  projectId: true,
  calculatorType: true,
  inputs: true,
  results: true,
  name: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type CalculatorResult = typeof calculatorResults.$inferSelect;
export type InsertCalculatorResult = z.infer<typeof insertCalculatorResultSchema>;

export type ProjectMember = typeof projectMembers.$inferSelect;
