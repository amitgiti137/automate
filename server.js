const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: '*', methods: 'GET,POST,PUT,DELETE', allowedHeaders: 'Content-Type, Authorization', credentials: true }));
app.use(express.json());

// This is the route that will display "Hello, World!" on the homepage
app.get('/', (req, res) => {
    res.send('<h1>Hello, World!</h1>');  // Respond with HTML
  });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/task'));
app.use('/api/create', require('./routes/create'));
app.use('/api/taskall', require('./routes/taskall'));
app.use('/api/trash', require('./routes/trash'));
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;
