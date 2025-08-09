#!/usr/bin/env node

/**
 * Deployment build script that mimics the package.json build command
 * but ensures Next.js build runs first to create the .next directory
 * 
 * This script runs: vite build && next build && esbuild server/index.ts...
 * Usage: node deploy-build.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname);

process.chdir(projectRoot);

// Add node_modules/.bin to PATH
const binPath = resolve(projectRoot, 'node_modules', '.bin');
process.env.PATH = `${binPath}:${process.env.PATH}`;

async function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 ${description}...`);
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });

    childProcess.on('error', (error) => {
      console.error(`❌ Failed to ${description.toLowerCase()}:`, error);
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

async function deployBuild() {
  try {
    console.log('🚀 Starting deployment build process...');
    console.log('📋 This will run: vite build + next build + esbuild server bundle');

    // Step 1: Run Vite build (as per package.json)
    await runCommand('vite', ['build'], 'Building Vite client assets');

    // Step 2: Ensure Next.js build exists (CRITICAL for deployment)
    const nextDir = resolve(projectRoot, '.next');
    if (!existsSync(nextDir)) {
      console.log('\n🎯 Creating Next.js build (required for deployment)...');
      await runCommand('next', ['build'], 'Building Next.js application');
    } else {
      console.log('\n✅ Next.js build already exists');
    }

    // Step 3: Build server bundle (as per package.json)
    await runCommand('esbuild', [
      'server/index.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outdir=dist'
    ], 'Building server bundle');

    console.log('\n🎉 Deployment build completed successfully!');
    console.log('📁 Generated files for deployment:');
    console.log('   ✅ .next/ (Next.js production build - REQUIRED)');
    console.log('   ✅ dist/public/ (Vite client assets)');
    console.log('   ✅ dist/index.js (Server bundle)');

    // Verify critical deployment files
    const nextExists = existsSync('.next');
    const distExists = existsSync('dist/index.js');
    
    if (nextExists && distExists) {
      console.log('\n🚀 DEPLOYMENT READY - All required files generated!');
    } else {
      throw new Error('Missing critical deployment files');
    }

  } catch (error) {
    console.error('\n💥 Deployment build failed:', error.message);
    console.error('\n🔍 For manual deployment, run: node deploy-build.js');
    process.exit(1);
  }
}

deployBuild();