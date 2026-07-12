// THE SEED v2.0 - HTTP Server Entry Point
// Main server startup file

import { startServer } from './index';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Start server
startServer(PORT);

