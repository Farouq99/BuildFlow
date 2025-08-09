# ConstructPro Deployment Guide

## Build Process Overview

The application uses a dual build system to ensure compatibility with different deployment platforms:

### 1. Next.js Production Build (Primary)
- **Command**: `node build.js` or `./scripts/build.sh`
- **Output**: Creates `.next/` directory with optimized Next.js production files
- **Purpose**: Required for Next.js production deployment

### 2. Vite Client Build (Compatibility)
- **Command**: Included in the main build process
- **Output**: Creates `dist/public/` with static client assets
- **Purpose**: Ensures compatibility with deployment platforms expecting static assets

### 3. Server Bundle
- **Command**: Included in the main build process  
- **Output**: Creates `dist/index.js` with the production server
- **Purpose**: Standalone server bundle for production deployment

## Deployment Commands

### For Next.js Deployment Platforms (Recommended)
```bash
# Build
node build.js

# Start (Production)
NODE_ENV=production node dist/index.js
```

### For Generic Deployment Platforms
```bash
# Build (creates both .next and static assets)
npm run build

# Start (Production)  
npm run start
```

## Key Files Generated

1. **`.next/`** - Next.js production build (essential for deployment)
2. **`dist/public/`** - Static client assets (compatibility)
3. **`dist/index.js`** - Production server bundle

## Production Server Features

- Automatically detects missing `.next` build and rebuilds if needed
- Serves Next.js application with server-side rendering
- Handles static assets and API routes
- Graceful shutdown handling
- Environment-based configuration

## Environment Variables Required

- `NODE_ENV=production` (for production deployment)
- `PORT` (optional, defaults to 5000)
- `DATABASE_URL` (for database connection)
- Other environment variables as defined in `next.config.js`

## Troubleshooting

### Missing .next Directory
The production server will automatically run `next build` if the `.next` directory is missing.

### Build Failures
Ensure all dependencies are installed:
```bash
npm install
```

### Port Conflicts
The server defaults to port 5000. Set `PORT` environment variable to use a different port.