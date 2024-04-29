const express = require('express');
const router = express.Router();

// Import your controller
const carParkingController = require('../controllers/carParkingController');

// Define the route for handling GET requests to '/getClients'
router.get('/getParkingClients', carParkingController.parkingClient);
router.get('/getParkingBuildings', carParkingController.parkingBuildings);

router.get('/synopsys-summary', carParkingController.carParkingSummary);
router.get('/getBuildingInfo', carParkingController.getBuildingCurrentTime);

router.get('/exportToExcelSeprateBuilding', carParkingController.parkingExport);
// router.get('/getParkingExcelData2', carParkingController.parkingExport2);






// Export the router
module.exports = router;

