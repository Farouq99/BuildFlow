#!/usr/bin/env node

/**
 * Build hook that ensures Next.js build happens before esbuild
 * This script runs as part of the package.json build process
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname);

async function ensureNextBuild() {
  const nextDir = resolve(projectRoot, '.next');
  
  // If .next already exists, skip rebuild
  if (existsSync(nextDir)) {
    console.log('✅ .next directory exists - deployment ready!');
    return;
  }

  console.log('🚀 Creating Next.js build for deployment...');
  
  return new Promise((resolve, reject) => {
    const nextBuild = spawn('npx', ['next', 'build'], {
      stdio: 'inherit',
      shell: true,
      env: process.env,
      cwd: projectRoot
    });

    nextBuild.on('error', (error) => {
      console.error('❌ Failed to build Next.js:', error);
      reject(error);
    });

    nextBuild.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Next.js build completed - .next directory created!');
        resolve(code);
      } else {
        console.error(`❌ Next.js build failed with code ${code}`);
        reject(new Error('Next.js build failed'));
      }
    });
  });
}

// Run the build hook
ensureNextBuild().catch((error) => {
  console.error('💥 Build hook failed:', error);
  process.exit(1);
});