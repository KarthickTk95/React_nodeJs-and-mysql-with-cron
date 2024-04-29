const express = require('express');
const router = express.Router();
const summaryDeviceController = require('../controllers/summaryDeviceController');


router.get('/getTotalDevices', summaryDeviceController.total);
router.get('/getActiveDevices',summaryDeviceController.active);
router.get('/getStoppedDevices',summaryDeviceController.stopped);
router.get('/getNotyetDevices',summaryDeviceController.notyet);
router.get('/getBleDevices',summaryDeviceController.bleDevices); //
router.get('/getBlegatewayDevices',summaryDeviceController.bleGateway); //
router.get('/getIntrafficDevices',summaryDeviceController.intraffic); //
router.get('/getfeedbackDevices',summaryDeviceController.feedback);  //
router.get('/getoccupancyDisplayDevices',summaryDeviceController.occupancy); //
router.get('/getBatterylowDevices',summaryDeviceController.battery); //
router.get('/getPreStoppedDevices',summaryDeviceController.preStopped);

module.exports = router;
