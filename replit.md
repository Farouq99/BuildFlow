# ConstructPro - Construction Project Management Platform

## Overview

ConstructPro is a comprehensive construction management platform that combines project management, file sharing, and built-in calculators in a unified solution. The application provides construction teams with tools for project tracking, document management, team collaboration, and specialized construction calculations for materials, costs, and concrete estimation.

The platform is designed to streamline construction workflows by offering real-time project tracking, seamless file uploads with drag-and-drop functionality, and professional-grade calculators for accurate construction estimates. It features a modern web interface with responsive design and comprehensive user management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing without React Router overhead
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with custom construction-themed color palette and design system
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js for RESTful API endpoints
- **Language**: TypeScript throughout the entire stack for consistency
- **Authentication**: Replit Auth integration with OpenID Connect (OIDC) for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **File Handling**: Multer middleware for multipart file uploads with local filesystem storage
- **API Design**: RESTful endpoints with proper HTTP methods and status codes

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Management**: Centralized schema definitions in shared directory for frontend/backend consistency
- **Key Entities**: Users, Projects, Documents, Budget Categories, Activities, Calculator Results, Project Members

### Authentication & Authorization
- **Authentication Provider**: Replit Auth with OIDC protocol
- **Session Storage**: PostgreSQL-backed sessions for scalability
- **User Roles**: Role-based system (admin, project_manager, engineer, subcontractor, client)
- **Security**: HTTP-only cookies, secure session configuration, and proper CORS handling

### File Management System
- **Upload Strategy**: Local filesystem storage with organized directory structure
- **File Processing**: Support for multiple file types with size limits (50MB)
- **Organization**: Project-based file categorization with metadata tracking
- **Access Control**: Project-member-based file access permissions

### Calculator Engine
- **Concrete Calculator**: Volume calculations, bag estimation, and cost projections
- **Material Estimator**: Multi-material calculations for flooring, framing, and other construction materials
- **Cost Calculator**: Project cost estimation with overhead, profit margins, and labor rate calculations
- **Result Storage**: Calculator results can be saved and associated with projects

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **WebSocket Support**: Real-time capabilities through ws library for Neon connections

### Authentication Services
- **Replit Auth**: OIDC-compliant authentication service for user management
- **OpenID Client**: Standard OIDC client implementation for secure authentication flows

### Development & Build Tools
- **Vite**: Frontend build tool with hot module replacement and optimized bundling
- **TypeScript**: Type checking and compilation for both frontend and backend
- **ESBuild**: Fast JavaScript bundler for server-side code compilation
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer

### UI & Component Libraries
- **Radix UI**: Headless UI components for accessibility and consistency
- **Lucide React**: Icon library for modern, consistent iconography
- **React Hook Form**: Form management with validation and performance optimization
- **Date-fns**: Date manipulation and formatting utilities

### File Upload & Processing
- **Multer**: Express middleware for handling multipart/form-data file uploads
- **React Dropzone**: Drag-and-drop file upload interface with preview capabilities

### State Management & Data Fetching
- **TanStack Query**: Server state management, caching, and synchronization
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Client-side form state management and validation