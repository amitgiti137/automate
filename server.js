const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// This is the route that will display "Hello, World!" on the homepage
app.get('/', (req, res) => {
    res.send('<h1>Hello, World!</h1>');  // Respond with HTML
  });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/task'));

/* const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); */
module.exports = app;
