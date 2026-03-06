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
app.use('/api/admin/attendance', require('./routes/adminAttendanceRoutes'));
app.use('/api/admin/fees', require('./routes/adminFeeRoutes'));
app.use('/api/admin/notices', require('./routes/adminNoticeRoutes'));
app.use('/api/admin/reports', require('./routes/adminReportRoutes'));

app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/parent', require('./routes/parentRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.send('Tuition Center Management System API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
