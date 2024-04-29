const express = require('express');
const router = express.Router();
const zanDeviceDataTableController = require('../controllers/zanDeviceDataTableController');

router.get('/getZanDeviceDataTopic', zanDeviceDataTableController.zanDeviceTopic);
router.get('/getZanDeviceData', zanDeviceDataTableController.zanDeviceData);



module.exports = router;