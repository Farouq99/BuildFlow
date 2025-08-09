#!/usr/bin/env node

/**
 * Pre-build script that ensures Next.js build runs before Vite build
 * This ensures the .next directory is created for deployment
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname);

console.log('🚀 Pre-build: Ensuring Next.js build for deployment...');

// Set the working directory to the project root
process.chdir(projectRoot);

// Add node_modules/.bin to PATH so we can find next
const binPath = resolve(projectRoot, 'node_modules', '.bin');
process.env.PATH = `${binPath}:${process.env.PATH}`;

async function runNextBuild() {
  return new Promise((resolve, reject) => {
    console.log('📦 Building Next.js application...');
    const nextBuild = spawn('next', ['build'], {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });

    nextBuild.on('error', (error) => {
      console.error('❌ Failed to build Next.js application:', error);
      reject(error);
    });

    nextBuild.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Next.js build completed successfully');
        console.log('✅ .next directory created - deployment ready!');
        resolve(code);
      } else {
        console.error(`❌ Next.js build failed with code ${code}`);
        reject(new Error(`Next.js build failed`));
      }
    });
  });
}

async function main() {
  try {
    // Check if .next already exists
    const nextDir = resolve(projectRoot, '.next');
    if (existsSync(nextDir)) {
      console.log('✅ .next directory already exists, skipping Next.js build');
      return;
    }

    // Run Next.js build to create .next directory
    await runNextBuild();
    
    console.log('🎉 Pre-build completed successfully!');
  } catch (error) {
    console.error('💥 Pre-build failed:', error.message);
    process.exit(1);
  }
}

main();