import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cookieParser from 'cookie-parser';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config.js';
import { errorHandler, json } from './lib/api.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user/index.js';

const CLIENT_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

const app = express();

if (config.trustProxy) app.set('trust proxy', 1);

// Security headers. The CSP allows what the React app loads from outside:
// Google Fonts, MUI/emotion inline styles, and images from any https host.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'connect-src': ["'self'", 'https://api.cloudinary.com'],
        // Only force https when deployed, so `npm start` still works on http://localhost.
        'upgrade-insecure-requests': config.isProduction ? [] : null,
      },
    },
  })
);

if (!config.isTest) app.use(morgan(config.isProduction ? 'combined' : 'dev'));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Slow down password guessing and sign-up spam.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.isTest,
  message: { err: 'Too many attempts, please try again later' },
});
app.use(['/api/auth/login', '/api/register'], authLimiter);

app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);

app.use('/api', (req, res) => {
  const { data, status } = json({ err: 'Not found' }, 404);
  res.status(status).json(data);
});

// After `npm run build`, the API also serves the React app, so one server runs everything.
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.use(errorHandler);

export default app;
