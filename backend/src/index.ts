import app from './app';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[server]: DSA Progress Tracker API running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[server]: SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[server]: HTTP server closed');
  });
});
