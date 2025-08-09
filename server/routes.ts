import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertDocumentSchema, insertBudgetCategorySchema, insertActivitySchema, insertCalculatorResultSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        managerId: userId,
      });
      
      const project = await storage.createProject(validatedData);
      
      // Create default budget categories
      const defaultCategories = [
        { name: 'Materials', budgeted: '0', color: '#FF6B35' },
        { name: 'Labor', budgeted: '0', color: '#1A659E' },
        { name: 'Equipment', budgeted: '0', color: '#10B981' },
        { name: 'Permits & Fees', budgeted: '0', color: '#8B5CF6' },
      ];

      for (const category of defaultCategories) {
        await storage.createBudgetCategory({
          projectId: project.id,
          ...category,
        });
      }

      // Log activity
      await storage.createActivity({
        projectId: project.id,
        userId,
        type: 'project_created',
        description: `Created project "${project.name}"`,
      });

      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      const project = await storage.updateProject(req.params.id, updates);
      
      // Log activity
      await storage.createActivity({
        projectId: project.id,
        userId,
        type: 'project_updated',
        description: `Updated project "${project.name}"`,
      });

      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      await storage.deleteProject(req.params.id);
      
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Project members routes
  app.get('/api/projects/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const members = await storage.getProjectMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  app.post('/api/projects/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const { userId, role } = req.body;
      await storage.addProjectMember(req.params.id, userId, role);
      res.json({ message: "Member added successfully" });
    } catch (error) {
      console.error("Error adding project member:", error);
      res.status(500).json({ message: "Failed to add project member" });
    }
  });

  // Document routes
  app.get('/api/projects/:id/documents', isAuthenticated, async (req: any, res) => {
    try {
      const documents = await storage.getDocuments(req.params.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/projects/:id/documents', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const documentData = {
        projectId: req.params.id,
        uploadedBy: userId,
        name: req.body.name || file.originalname,
        originalName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        filePath: file.path,
        category: req.body.category || 'general',
      };

      const document = await storage.createDocument(documentData);
      
      // Log activity
      await storage.createActivity({
        projectId: req.params.id,
        userId,
        type: 'document_uploaded',
        description: `Uploaded document "${document.name}"`,
      });

      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Budget routes
  app.get('/api/projects/:id/budget', isAuthenticated, async (req: any, res) => {
    try {
      const categories = await storage.getBudgetCategories(req.params.id);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching budget categories:", error);
      res.status(500).json({ message: "Failed to fetch budget categories" });
    }
  });

  app.post('/api/projects/:id/budget', isAuthenticated, async (req: any, res) => {
    try {
      const categoryData = insertBudgetCategorySchema.parse({
        ...req.body,
        projectId: req.params.id,
      });
      
      const category = await storage.createBudgetCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating budget category:", error);
      res.status(500).json({ message: "Failed to create budget category" });
    }
  });

  app.patch('/api/budget/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updates = req.body;
      const category = await storage.updateBudgetCategory(req.params.id, updates);
      res.json(category);
    } catch (error) {
      console.error("Error updating budget category:", error);
      res.status(500).json({ message: "Failed to update budget category" });
    }
  });

  // Activity routes
  app.get('/api/projects/:id/activities', isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getActivities(req.params.id, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Calculator routes
  app.get('/api/calculator/results', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = req.query.projectId as string;
      const results = await storage.getCalculatorResults(userId, projectId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching calculator results:", error);
      res.status(500).json({ message: "Failed to fetch calculator results" });
    }
  });

  app.post('/api/calculator/results', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const resultData = insertCalculatorResultSchema.parse({
        ...req.body,
        userId,
      });
      
      const result = await storage.saveCalculatorResult(resultData);
      res.json(result);
    } catch (error) {
      console.error("Error saving calculator result:", error);
      res.status(500).json({ message: "Failed to save calculator result" });
    }
  });

  // File serving route
  app.get('/api/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Broadcast to all connected clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
