#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

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
  // Production mode
  console.log('Starting ConstructPro in production mode...');
  
  // Check if .next directory exists, if not build it first
  const nextDir = resolve(projectRoot, '.next');
  if (!existsSync(nextDir)) {
    console.log('Next.js build not found, building application...');
    const buildProcess = spawn('next', ['build'], {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });
    
    buildProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('Build completed successfully, starting production server...');
        startProductionServer();
      } else {
        console.error('Build failed with code', code);
        process.exit(1);
      }
    });
  } else {
    console.log('Next.js build found, starting production server...');
    startProductionServer();
  }
}

function startProductionServer() {
  // Spawn the Next.js production server
  const nextServer = spawn('next', ['start'], {
    stdio: 'inherit',
    shell: true,
    env: process.env
  });

  // Handle server process events
  nextServer.on('error', (error) => {
    console.error('Failed to start Next.js production server:', error);
    process.exit(1);
  });

  nextServer.on('exit', (code, signal) => {
    if (code !== null) {
      console.log(`Next.js production server exited with code ${code}`);
    } else if (signal !== null) {
      console.log(`Next.js production server terminated by signal ${signal}`);
    }
    process.exit(code || 0);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nGracefully shutting down Next.js production server...');
    nextServer.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\nGracefully shutting down Next.js production server...');
    nextServer.kill('SIGTERM');
  });
}