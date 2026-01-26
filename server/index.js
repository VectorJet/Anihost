import app from './app.js';
import { serve } from 'bun';

const port = process.env.PORT || 4001;
const bunApp = serve({
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
  idleTimeout: 20,
});

console.log(`server is running visit ${bunApp.url}doc for docs`);
