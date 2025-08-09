// Start Next.js dev server directly since this project is Next.js based
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Change to project root directory
process.chdir(join(__dirname, '..'));

console.log('Starting Next.js dev server on port 5000...');

// Start Next.js dev server
const nextServer = spawn('npx', ['next', 'dev', '-p', '5000'], {
  stdio: 'inherit',
  env: { ...process.env },
});

nextServer.on('close', (code) => {
  console.log(`Next.js server exited with code ${code}`);
});

nextServer.on('error', (err) => {
  console.error('Failed to start Next.js server:', err);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Next.js server...');
  nextServer.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down Next.js server...');
  nextServer.kill();
  process.exit(0);
});