#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, rmSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname);

console.log('Starting ConstructPro build process...');

// Set the working directory to the project root
process.chdir(projectRoot);

// Add node_modules/.bin to PATH so we can find next
const binPath = resolve(projectRoot, 'node_modules', '.bin');
process.env.PATH = `${binPath}:${process.env.PATH}`;

async function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n${description}...`);
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });

    childProcess.on('error', (error) => {
      console.error(`Failed to ${description.toLowerCase()}:`, error);
      reject(error);
    });

    childProcess.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve(code);
      } else {
        console.error(`❌ ${description} failed with code ${code}`);
        reject(new Error(`${description} failed`));
      }
    });
  });
}

async function build() {
  try {
    // Clean previous builds
    const nextDir = resolve(projectRoot, '.next');
    if (existsSync(nextDir)) {
      console.log('🧹 Cleaning previous Next.js build...');
      rmSync(nextDir, { recursive: true, force: true });
    }

    const distDir = resolve(projectRoot, 'dist');
    if (existsSync(distDir)) {
      console.log('🧹 Cleaning previous dist directory...');
      rmSync(distDir, { recursive: true, force: true });
    }

    // Step 1: Build Next.js application (this creates .next directory)
    await runCommand('next', ['build'], 'Building Next.js application');

    // Step 2: Build Vite client assets (for compatibility)
    await runCommand('vite', ['build'], 'Building Vite client assets');

    // Step 3: Build server bundle
    await runCommand('esbuild', [
      'server/index.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outdir=dist'
    ], 'Building server bundle');

    console.log('\n🎉 Build completed successfully!');
    console.log('📁 Generated files:');
    console.log('   - .next/ (Next.js production build)');
    console.log('   - dist/public/ (Vite client assets)');
    console.log('   - dist/index.js (Server bundle)');

  } catch (error) {
    console.error('\n💥 Build failed:', error.message);
    process.exit(1);
  }
}

build();