require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Connect Database
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin/students', require('./routes/adminStudentRoutes'));
app.use('/api/admin/classes', require('./routes/adminClassRoutes'));
app.use('/api/admin/fees', require('./routes/adminFeeRoutes'));
app.use('/api/admin/notices', require('./routes/adminNoticeRoutes'));
app.use('/api/admin/reports', require('./routes/adminReportRoutes'));
app.use('/api/admin/dashboard', require('./routes/adminDashboardRoutes'));
app.use('/api/admin/events', require('./routes/adminEventRoutes'));

app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/parent', require('./routes/parentRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.send('Tuition Center Management System API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Set up automated Monthly Fee Generation
  const cron = require('node-cron');
  const { processMonthlyFees } = require('./controllers/adminFeeController');

  // Run on the 1st of every month at 00:05 AM
  cron.schedule('5 0 1 * *', async () => {
    console.log('Running automated monthly fee generation...');
    const result = await processMonthlyFees();
    if (result.success) {
      console.log(`Automated fee generation completed successfully. Generated ${result.count} records for ${result.month}.`);
    } else {
      console.error(`Automated fee generation failed:`, result.error);
    }
  });
  console.log('Automated billing cron job initialized.');
});
