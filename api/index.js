const app = require('../server');

module.exports = (req, res) => {
  const server = app.listen(); // Start Express server if needed
  app(req, res);
  server.close(); // Close server after request
};