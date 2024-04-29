const express = require('express');
const router = express.Router();
const reporting255Controller = require('../controllers/reporting255Controller');

router.get('/getAllClientDevicesList', reporting255Controller.reporting255);



module.exports = router;