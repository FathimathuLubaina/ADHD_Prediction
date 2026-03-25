require('dotenv').config();  // MUST be first

// Check if Supabase environment variables are loading
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "Loaded" : "Missing"
);

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const initAdmin = require('./config/initAdmin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS: allow localhost dev + optional Netlify frontend URL
const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (curl/postman) with no Origin header
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      // IMPORTANT: don't throw on Vercel; returning an error here causes 500s for every request.
      // If you also want to allow hitting the API directly from the Vercel domain, permit *.vercel.app.
      if (process.env.VERCEL) {
        try {
          const hostname = new URL(origin).hostname;
          if (/\.vercel\.app$/i.test(hostname)) return cb(null, true);
        } catch (e) {
          // Invalid origin format (e.g. "null") should not crash the function.
          return cb(null, false);
        }
      }
      // Disallow by omitting CORS headers (browser will block). Do not crash the function.
      return cb(null, false);
    },
    credentials: true
  })
);
app.use(express.json());
app.use(morgan('dev'));

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Backend is running successfully 🚀' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// Start server (skip when deployed to Vercel - it uses the exported app)
if (!process.env.VERCEL) {
  // Initialize admin user
  initAdmin().then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  });
} else {
  // Run it anyway on cold start for Vercel
  initAdmin();
}

// Export for Vercel serverless
module.exports = app;