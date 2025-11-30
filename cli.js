#!/usr/bin/env node

/**
 * CLI wrapper for xiaohongshu-mcp
 * Allows running the MCP server directly via npx or npm scripts
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if build directory exists
const buildPath = join(__dirname, 'build', 'index.js');

try {
  // Spawn the MCP server process
  const server = spawn('node', [buildPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--experimental-modules'
    }
  });

  // Handle process exit
  server.on('exit', (code) => {
    process.exit(code || 0);
  });

  // Handle errors
  server.on('error', (err) => {
    console.error('Failed to start xiaohongshu-mcp:', err);
    process.exit(1);
  });

} catch (error) {
  console.error('Error starting xiaohongshu-mcp:', error);
  process.exit(1);
}
