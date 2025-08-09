#!/usr/bin/env node

/**
 * Server build script that ensures Next.js build exists before building server
 * This replaces the esbuild command in package.json to ensure .next directory exists
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname);

process.chdir(projectRoot);

async function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`${description}...`);
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
        console.log(`✅ ${description} completed`);
        resolve(code);
      } else {
        console.error(`❌ ${description} failed with code ${code}`);
        reject(new Error(`${description} failed`));
      }
    });
  });
}

async function buildServer() {
  try {
    // Step 1: Ensure Next.js build exists (required for deployment)
    const nextDir = resolve(projectRoot, '.next');
    if (!existsSync(nextDir)) {
      console.log('🚀 Creating Next.js build for deployment...');
      await runCommand('npx', ['next', 'build'], 'Building Next.js application');
      console.log('✅ .next directory created - deployment ready!');
    } else {
      console.log('✅ .next directory exists - deployment ready!');
    }

    // Step 2: Build server bundle
    await runCommand('esbuild', [
      'server/index.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outdir=dist'
    ], 'Building server bundle');

    console.log('\n🎉 Server build completed successfully!');
    console.log('📁 Deployment files ready:');
    console.log('   ✅ .next/ (Next.js production build)');
    console.log('   ✅ dist/ (Server bundle)');

  } catch (error) {
    console.error('\n💥 Server build failed:', error.message);
    process.exit(1);
  }
}

buildServer();