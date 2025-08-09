#!/usr/bin/env node

/**
 * NPM Build Fix for Next.js Deployment
 * 
 * This script replicates the exact npm run build command but ensures
 * the .next directory is created for successful Next.js deployment.
 * 
 * Use this script if deployment platforms call `npm run build` and fail
 * because the .next directory is missing.
 * 
 * Usage: node npm-build-fix.js
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

async function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`${description}...`);
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });

    child.on('error', (error) => {
      console.error(`Failed: ${error.message}`);
      reject(error);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed`);
        resolve();
      } else {
        console.error(`❌ ${description} failed (code ${code})`);
        reject(new Error(`${description} failed`));
      }
    });
  });
}

async function npmBuildFix() {
  console.log('🔧 Running fixed npm build process...');
  console.log('📋 Replicating: vite build && esbuild server/index.ts...');
  console.log('💡 Plus ensuring Next.js .next directory is created');

  try {
    // Step 1: Vite build (original npm run build command)
    await runCommand('vite', ['build'], 'Building Vite client assets');

    // Step 2: Next.js build (CRITICAL for deployment)
    if (!existsSync('.next')) {
      console.log('\n🎯 Creating missing .next directory for deployment...');
      await runCommand('next', ['build'], 'Building Next.js application');
    } else {
      console.log('\n✅ .next directory exists');
    }

    // Step 3: ESBuild server (original npm run build command)
    await runCommand('esbuild', [
      'server/index.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outdir=dist'
    ], 'Building server bundle');

    console.log('\n🎉 NPM BUILD FIX COMPLETED SUCCESSFULLY!');
    console.log('✅ All files generated for Next.js deployment:');
    console.log('   - .next/ (Next.js production build)');
    console.log('   - dist/public/ (Vite client assets)');
    console.log('   - dist/index.js (Server bundle)');

  } catch (error) {
    console.error('\n💥 NPM build fix failed:', error.message);
    console.error('\n🔍 Manual fix: node npm-build-fix.js');
    process.exit(1);
  }
}

npmBuildFix();