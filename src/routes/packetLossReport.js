const express = require('express');
const router = express.Router();
const packetLossController = require('../controllers/packetLossReportController');

router.get('/getPacketlossReprt', packetLossController.packetLoss);
router.get('/getExportIntoPacketlossRawDataExcelFile', packetLossController.packetLossExport);


module.exports = router;