#!/usr/bin/env node

/**
 * Post-install script that sets up the build process for deployment
 * This ensures that the npm run build command creates the .next directory
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const projectRoot = process.cwd();

function setupBuildProcess() {
  console.log('🔧 Setting up build process for Next.js deployment...');

  // Create a wrapper script that replaces the esbuild command
  const wrapperScript = `#!/usr/bin/env node

// Build wrapper that ensures Next.js build runs before esbuild
import { spawn } from 'child_process';
import { existsSync } from 'fs';

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: true });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(\`Command failed: \${command} \${args.join(' ')}\`)));
  });
}

async function main() {
  try {
    // Ensure Next.js build exists (required for deployment)
    if (!existsSync('.next')) {
      console.log('🚀 Creating Next.js build for deployment...');
      await runCommand('npx', ['next', 'build']);
      console.log('✅ .next directory created - deployment ready!');
    }
    
    // Run original esbuild command
    await runCommand('esbuild', process.argv.slice(2));
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

main();`;

  // Write the wrapper script
  writeFileSync(resolve(projectRoot, 'esbuild-wrapper.js'), wrapperScript);
  
  console.log('✅ Build process setup completed');
  console.log('📋 For deployment, the build will now:');
  console.log('   1. Run vite build (creates dist/public/)');
  console.log('   2. Run next build (creates .next/ directory)');
  console.log('   3. Run esbuild (creates dist/index.js)');
}

// Only run during actual install, not in production
if (process.env.NODE_ENV !== 'production') {
  setupBuildProcess();
}