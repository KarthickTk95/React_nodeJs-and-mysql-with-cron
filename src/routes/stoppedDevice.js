const express = require('express');
const router = express.Router();
const stoppedDeviceController = require('../controllers/stoppedDeviceController');

router.get('/getClientData', stoppedDeviceController.stoppedDevices);
router.get('/getExportIntoRawDataExcelFile', stoppedDeviceController.StoppedExport);


module.exports = router;
