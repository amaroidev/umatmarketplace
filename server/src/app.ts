import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import env from './config/env';
import connectDB from './config/db';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { setupSocketHandlers } from './socket';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:19006'],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// Setup Socket.io event handlers (auth, messaging, typing, presence)
setupSocketHandlers(io);

// ========================
// Middleware
// ========================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:19006'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing — capture raw body for Paystack webhook signature validation
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      // Store raw body for webhook signature verification
      if (req.originalUrl === '/api/payments/webhook') {
        req.rawBody = buf.toString();
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// ========================
// Routes
// ========================
app.use('/api', routes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'CampusMarketplace API',
    version: '1.0.0',
    description: 'Marketplace for buyers and sellers on UMaT Campus',
    docs: '/api/health',
  });
});

// ========================
// Error Handling
// ========================
app.use(notFoundHandler);
app.use(errorHandler);

// ========================
// Start Server
// ========================
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    httpServer.listen(env.PORT, () => {
      console.log('='.repeat(50));
      console.log(`  CampusMarketplace API Server`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`  Port: ${env.PORT}`);
      console.log(`  URL: http://localhost:${env.PORT}`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io };
