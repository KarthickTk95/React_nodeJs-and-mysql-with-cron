// D:\REACT AND SQL\REACT REPORTS\Back_End\routes\clients.js

const express = require('express');
const router = express.Router();

// Import your controller
const clientsController = require('../controllers/clientsController');

// Define the route for handling GET requests to '/getClients'
router.get('/getClients', clientsController.getClients);

// Export the router
module.exports = router;
