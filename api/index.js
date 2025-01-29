const app = require('../server');  // Import the Express app from server.js

module.exports = (req, res) => {
  // Forward the request to your Express app
  app(req, res);
};