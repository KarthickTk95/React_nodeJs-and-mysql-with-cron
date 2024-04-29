const db = require('../db');

// TOTAL devices
const total= (req, res) => {
    const clientname = req.query.clientname;
    const query = `
    SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId WHERE ds.sensorName NOT IN ('QR-Janitor', 'QR-Feedback') ORDER BY buildingName, floorName, areaName;
    `;
  
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      res.json(results);
    });
  };
  
  // getActiveDevices
  const active = (req, res) => {
    const clientname = req.query.clientname;
    const query = `SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId  WHERE ds.sensorName NOT IN ('QR-Janitor','QR-Feedback','BeaconScanner','GateWay') AND (ds.deviceTimestamp >= now()-interval 24 hour ) ORDER BY buildingName, floorName, areaName;
    `;
  
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      res.json(results);
    });
  };
  
  // getStoppedDevices devices
  const stopped = (req, res) => {
    const clientname = req.query.clientname;
    const query = `SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId  WHERE ds. sensorName not in ('QR-Janitor','QR-Feedback','BeaconScanner','GateWay') AND (ds.deviceTimestamp <= now()-interval 24 hour ) ORDER BY buildingName, floorName, areaName;
    `;
  
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      res.json(results);
    });
  };
  
  // getNotyetDevices devices
 const notyet =  (req, res) => {
    const clientname = req.query.clientname;
    const query = `SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId   WHERE  ds. sensorName not in ('QR-Janitor','QR-Feedback','BeaconScanner','GateWay')  AND (ds.deviceTimestamp is null ) ORDER BY buildingName, floorName, areaName;
    `;
  
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      res.json(results);
    });
  };
  
  // getBleDevices devices
  const bleDevices = (req, res) => {
    const clientname = req.query.clientname;
    const query = `SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId  WHERE ds. sensorName not in ('QR-Janitor','QR-Feedback','BeaconScanner','GateWay','PeopleCount','ZanInTraffic','ZanOpenAreaTraffic','TOF','BLEGateWay') AND (convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) <= NOW() - INTERVAL 24 HOUR) ORDER BY buildingName, floorName, areaName;
    `;
    console.log(query);

    db.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      res.json(results);
    });
  };
  
  // getBlegatewayDevices devices
 const bleGateway = (req, res) => {
    const clientname = req.query.clientname;
    const query = `SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId  WHERE  (ds.deviceTimestamp <= now()-interval 24 hour ) and ds.sensorName='BLEGateWay' ORDER BY buildingName, floorName, areaName;
    `;
  
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      res.json(results);
    });
  };
  
  // getIntrafficDevices devices
  const intraffic = (req, res) => {
    const clientname = req.query.clientname;
    const query = `SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId  WHERE   ds. sensorName  in ('PeopleCount','ZanInTraffic','ZanOpenAreaTraffic','TOF') AND (ds.deviceTimestamp <= now()-interval 24 hour ) ORDER BY buildingName, floorName, areaName;
    `;
  
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      res.json(results);
    });
  };
  
  // getfeedbackDevices devices
  const feedback = (req, res) => {
    const clientname = req.query.clientname;
    const query = `SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId  WHERE ds. sensorName='GateWay' AND (ds.deviceTimestamp <= now()-interval 24 hour ) ORDER BY buildingName, floorName, areaName;
    `;
  
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      res.json(results);
    });
  };
  
  // getoccupancyDisplayDevices devices
  const occupancy = (req, res) => {
    const clientname = req.query.clientname;
    const query = `SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId  WHERE  ds. sensorName like '%Occupancy%' AND (ds.deviceTimestamp <= now()-interval 24 hour )  ORDER BY buildingName, floorName, areaName;
    `;
  
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      res.json(results);
    });
  };
  
  // getBatterylowDevices devices
  const battery = (req, res) => {
    const clientname = req.query.clientname;
    const query = `SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId  WHERE ds.batteryValue <=70 and batteryValue != -3 AND (ds.deviceTimestamp <= now()-interval 24 hour ) ORDER BY buildingName, floorName, areaName;
    `;
  
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      res.json(results);
    });
  };
  
  // getPreStoppedDevices devices
  const preStopped = (req, res) => {
    const clientname = req.query.clientname;
    const query = `
    SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId WHERE ds.sensorName NOT IN ('QR-Janitor', 'QR-Feedback') AND (ds.deviceTimestamp <= now()-interval 48 hour ) ORDER BY buildingName, floorName, areaName;
    `;
  
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      res.json(results);
    });
  };


  module.exports = {
    total,feedback,active,battery,bleDevices,bleGateway,intraffic,notyet,occupancy,preStopped,stopped,
  };