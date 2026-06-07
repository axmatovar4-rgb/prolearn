require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/salary', require('./routes/salary'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/export', require('./routes/export'));
app.use('/api/vacation', require('./routes/vacation'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/db', require('./routes/database'));
app.use('/api/recruitment', require('./routes/recruitment'));
app.use('/api/evaluation', require('./routes/evaluation'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/reports', require('./routes/reports'));
app.use('/uploads/docs', require('express').static(require('path').join(__dirname, 'uploads/docs')));

app.listen(PORT, () => {
  console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
  // AutoWorker — har 30 daqiqada yangi xodim qo'shiladi
  const { startAutoWorker } = require('./autoWorker');
  startAutoWorker();
});
