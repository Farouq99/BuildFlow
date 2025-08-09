#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const isDevelopment = process.env.NODE_ENV === 'development';

// Set the working directory to the project root
process.chdir(projectRoot);

// Add node_modules/.bin to PATH so we can find next
const binPath = resolve(projectRoot, 'node_modules', '.bin');
process.env.PATH = `${binPath}:${process.env.PATH}`;

if (isDevelopment) {
  console.log('Starting ConstructPro in development mode...');
  
  // Spawn the Next.js development server
  const nextServer = spawn('next', ['dev'], {
    stdio: 'inherit',
    shell: true,
    env: process.env
  });

  // Handle server process events
  nextServer.on('error', (error) => {
    console.error('Failed to start Next.js server:', error);
    process.exit(1);
  });

  nextServer.on('exit', (code, signal) => {
    if (code !== null) {
      console.log(`Next.js server exited with code ${code}`);
    } else if (signal !== null) {
      console.log(`Next.js server terminated by signal ${signal}`);
    }
    process.exit(code || 0);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nGracefully shutting down Next.js server...');
    nextServer.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\nGracefully shutting down Next.js server...');
    nextServer.kill('SIGTERM');
  });
} else {
  // Production mode - this file is created by the build process
  console.log('Starting ConstructPro in production mode...');
  
  // Import and start the Next.js production server
  import('next').then((nextModule) => {
    import('http').then((httpModule) => {
      const next = nextModule.default;
      const app = next({ dev: false });
      const handle = app.getRequestHandler();
      
      app.prepare().then(() => {
        const server = httpModule.createServer((req: any, res: any) => {
          handle(req, res);
        });
        
        const port = parseInt(process.env.PORT || '5000', 10);
        server.listen(port, '0.0.0.0', () => {
          console.log(`> Ready on http://0.0.0.0:${port}`);
        });
      });
    });
  }).catch((error) => {
    console.error('Failed to start Next.js production server:', error);
    process.exit(1);
  });
}