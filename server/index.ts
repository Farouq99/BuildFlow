#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const isDevelopment = process.env.NODE_ENV === 'development';
const command = isDevelopment ? 'next' : 'next';
const args = isDevelopment ? ['dev'] : ['start'];

// Set the working directory to the project root
process.chdir(projectRoot);

// Add node_modules/.bin to PATH so we can find next
const binPath = resolve(projectRoot, 'node_modules', '.bin');
process.env.PATH = `${binPath}:${process.env.PATH}`;

console.log(`Starting ConstructPro in ${isDevelopment ? 'development' : 'production'} mode...`);

// Spawn the Next.js server
const nextServer = spawn(command, args, {
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