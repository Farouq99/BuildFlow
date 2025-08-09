// Next.js production/development server setup
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Change to project root directory
process.chdir(join(__dirname, '..'));

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || '5000';

console.log(`Starting Next.js ${isProduction ? 'production' : 'development'} server on port ${port}...`);

// Choose the appropriate Next.js command based on environment
const command = isProduction ? 'start' : 'dev';
const args = [command, '-p', port];

// Start Next.js server
const nextServer = spawn('npx', ['next', ...args], {
  stdio: 'inherit',
  env: { 
    ...process.env,
    PORT: port,
    // Ensure proper host binding for production deployments
    HOSTNAME: process.env.HOSTNAME || '0.0.0.0'
  },
});

nextServer.on('close', (code) => {
  console.log(`Next.js server exited with code ${code}`);
  // Exit with the same code to propagate the exit status
  process.exit(code || 0);
});

nextServer.on('error', (err) => {
  console.error('Failed to start Next.js server:', err);
  process.exit(1);
});

// Handle graceful shutdown
function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down Next.js server gracefully...`);
  nextServer.kill('SIGTERM');
  
  // Force kill after 30 seconds if graceful shutdown fails
  setTimeout(() => {
    console.log('Force killing Next.js server...');
    nextServer.kill('SIGKILL');
    process.exit(1);
  }, 30000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));