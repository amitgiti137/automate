const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Add other routes here

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
