const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { connectDB, REQUIRED_DB_NAME } = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const shopRoutes = require('./routes/shopRoutes');
const buildRoutes = require('./routes/buildRoutes');
const checklistRoutes = require('./routes/checklistRoutes');
const testRunRoutes = require('./routes/testRunRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Deployment Checklist API is running',
    database: REQUIRED_DB_NAME
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/builds', buildRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/test-runs', testRunRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Validate and connect ONLY to DEPLOYCHECK
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`Server running on port ${PORT}`);
      console.log(`Database: ${REQUIRED_DB_NAME}`);
      console.log(`Database connection successful`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Fatal Server Initialization Error:', error.message);
    process.exit(1);
  }
};

startServer();
