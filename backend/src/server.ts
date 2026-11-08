import { createApp } from './app.js';
import { env } from './config/env.js';

/**
 * Starts the HTTP server and attaches graceful shutdown listeners.
 */
function startServer(): void {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(
      `[Coffee Ninja API] Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`
    );
  });

  server.timeout = 15000;

  const shutdown = (signal: string): void => {
    console.log(`[Coffee Ninja API] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer();

