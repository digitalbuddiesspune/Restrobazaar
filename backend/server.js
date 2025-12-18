import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'RestroBazaar API is running!' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
});

// Example API routes (you can expand these based on your needs)
app.get('/api/categories', (req, res) => {
  res.json({ 
    categories: [
      { id: 1, name: 'Food Packaging', description: 'Various food packaging solutions' },
      { id: 2, name: 'Custom Printing', description: 'Custom printed packaging materials' },
      { id: 3, name: 'Beverage Containers', description: 'Containers for beverages' }
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
});


