const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');

router.get('/getSummary', summaryController.Summary);


module.exports = router;
