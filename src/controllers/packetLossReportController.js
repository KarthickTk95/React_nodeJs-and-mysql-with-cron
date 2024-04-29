const db = require('../db');
const ExcelJS = require('exceljs');

const moment = require('moment-timezone');
process.env.TZ = 'UTC';


// device getPacketlossReprt  

const packetLoss = (req, res) => {
    const clientname = req.query.clientName;
    const startDateString = req.query.startDateTime; // Define startDate
    const endDateString = req.query.endDateTime; // Define endDate
  
    console.log(req.query.startDateTime);
    const startDate = new Date(startDateString); // Convert startDate to Date object
    const endDate = new Date(endDateString); // Convert endDate to Date object

  
  
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    
    const dynamicTableName = `zanDeviceData.sensorData_${year}_${month}`;
  
    console.log("clientname:", clientname);
    console.log("startDate:", startDate);
    console.log("endDate:", endDate);
    console.log("dynamicTableName:", dynamicTableName);
  
    const query = `
      SELECT *,
      ROUND(100 - (received/exp) * 100) AS lossP
      FROM (
        SELECT ds.deviceMacId,ds.deviceSensorId,ds.deviceName,ds.buildingName,ds.floorName,ds.areaName,ds.sensorName,CONVERT_TZ(ds.deviceTimeStamp, '+00:00', d.TimeZone) AS deviceTimestamp,ds.sensorValue,ds.batteryValue,ds.rssiValue,(SELECT errorCode FROM ${clientname}.errorMessageInfo em WHERE em.deviceId = ds.deviceMacId AND em.id = (SELECT MAX(id) FROM ${clientname}.errorMessageInfo WHERE deviceId = ds.deviceMacId)) AS ErrorCode,
          CASE
            WHEN sensorName IN ('BLEGateWay', 'OccupancyDisplay') THEN TIMESTAMPDIFF(hour, '${startDateString}', '${endDateString}') * 1
            WHEN sensorName IN ('WetnessDetector', 'AirQuality') THEN TIMESTAMPDIFF(hour, '${startDateString}', '${endDateString}') * 12
            ELSE TIMESTAMPDIFF(hour, '${startDateString}', '${endDateString}') * 2
          END AS exp,
          CASE
            WHEN sensorName = 'BLEGateWay' THEN (SELECT COUNT(*) FROM ${clientname}.gateway_status WHERE gatewayId = ds.deviceMacId AND CONVERT_TZ(updatedTime, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}')
            WHEN sensorName = 'OccupancyDisplay' THEN (SELECT COUNT(*) FROM ${clientname}.aliveStatus WHERE deviceMacId = ds.deviceMacId AND CONVERT_TZ(serverTimeStamp, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}')
            WHEN sensorName = 'WetnessDetector' THEN (SELECT COUNT(*) FROM ${clientname}.wetnessData WHERE deviceMacId = ds.deviceMacId AND CONVERT_TZ(updatedTime, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}')
            WHEN sensorName = 'AirQuality' THEN (SELECT COUNT(*) FROM ${clientname}.sensor_value WHERE deviceSensorId = ds.deviceSensorId AND CONVERT_TZ(deviceTimeStamp, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}')
            WHEN ds.deviceName LIKE '%CassiaGateway%' THEN (SELECT COUNT(*) FROM ${dynamicTableName} AS sd WHERE deviceMacId = ds.deviceMacId AND CONVERT_TZ(publishedTime, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}')
            WHEN ds.sensorName = 'BeaconScanner' THEN (SELECT COUNT(*) FROM ${clientname}.aliveStatus WHERE deviceMacId = ds.deviceMacId AND CONVERT_TZ(serverTimeStamp, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}')
            ELSE (SELECT COUNT(sensorData) FROM ${clientname}.sensor_value WHERE deviceSensorId = ds.deviceSensorId AND CONVERT_TZ(deviceTimeStamp, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}') END AS received FROM ${clientname}.deviceStatus ds JOIN ${clientname}.device d ON d.deviceId = ds.deviceMacId WHERE ds.sensorName NOT IN ('QR-Janitor', 'QR-Feedback') ORDER BY sensorName, buildingName, floorName, areaName) a GROUP BY deviceMacId
    `;
  
    console.log(query);
  
    db.query(query, (error, results) => {
      if (error) {
          console.error("Error executing query: " + error.stack);
          res.status(500).json({ error: "Internal Server Error" });
          return;
      }
  
      // Assuming 'results' is an array of objects with a 'deviceTimestamp' property
      const formattedResults = results.map(result => ({
        ...result,
        formattedDate: moment.utc(result.deviceTimestamp).format("YYYY-MM-DD HH:mm:ss"),
    }));
  
      res.json(formattedResults);
  });
  };
  
  
  
  
  
  //Stopped device EXCEL getExportIntoPacketlossRawDataExcelFile  
  
  const packetLossExport = (req, res) => {
    const clientNames = req.query.clientNames ? req.query.clientNames.split(',') : [];
    const startDateString = req.query.startDateTime; // Define startDate
    const endDateString = req.query.endDateTime; // Define endDate
  
    console.log(req.query.startDateTime);
    const startDate = new Date(startDateString); // Convert startDate to Date object
  
  
  
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    
    const dynamicTableName = `zanDeviceData.sensorData_${year}_${month}`;
    
    const workbook = new ExcelJS.Workbook();
    const summaryWorksheet = workbook.addWorksheet('Summary');
    summaryWorksheet.addRow(['Client Name', 'Total Device Count', 'Stopped Device Count', 'Active Device Count', 'BLEGateWay', 'BleDevices', 'IntrafficDevices', 'Feedback', 'OccupancyDisplay', 'BatteryLow', 'NotYetReporting']);
  
    clientNames.forEach((clientname, index) => {
      const queryDeviceStatus = `SELECT *,
      ROUND(100 - (received/exp) * 100) AS lossP
      FROM (
        SELECT ds.deviceMacId,ds.deviceSensorId,ds.deviceName,ds.buildingName,ds.floorName,ds.areaName,ds.sensorName,CONVERT_TZ(ds.deviceTimeStamp, '+00:00', d.TimeZone) AS deviceTimestamp,ds.sensorValue,ds.batteryValue,ds.rssiValue,(SELECT errorCode FROM ${clientname}.errorMessageInfo em WHERE em.deviceId = ds.deviceMacId AND em.id = (SELECT MAX(id) FROM ${clientname}.errorMessageInfo WHERE deviceId = ds.deviceMacId)) AS ErrorCode,
          CASE
            WHEN sensorName IN ('BLEGateWay', 'OccupancyDisplay') THEN TIMESTAMPDIFF(hour, '${startDateString}', '${endDateString}') * 1
            WHEN sensorName IN ('WetnessDetector', 'AirQuality') THEN TIMESTAMPDIFF(hour, '${startDateString}', '${endDateString}') * 12
            WHEN ds.deviceName like '%Capacitive%' THEN TIMESTAMPDIFF(hour, '${startDateString}', '${endDateString}') * 2/2
            ELSE TIMESTAMPDIFF(hour, '${startDateString}', '${endDateString}') * 2
          END AS exp,
          CASE
            WHEN sensorName = 'BLEGateWay' THEN (SELECT COUNT(*) FROM ${clientname}.gateway_status WHERE gatewayId = ds.deviceMacId AND CONVERT_TZ(updatedTime, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}')
            WHEN sensorName = 'OccupancyDisplay' THEN (SELECT COUNT(*) FROM ${clientname}.aliveStatus WHERE deviceMacId = ds.deviceMacId AND CONVERT_TZ(serverTimeStamp, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}')
            WHEN sensorName = 'WetnessDetector' THEN (SELECT COUNT(*) FROM ${clientname}.wetnessData WHERE deviceMacId = ds.deviceMacId AND CONVERT_TZ(updatedTime, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}')
            WHEN sensorName = 'AirQuality' THEN (SELECT COUNT(*) FROM ${clientname}.sensor_value WHERE deviceSensorId = ds.deviceSensorId AND CONVERT_TZ(deviceTimeStamp, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}')
            WHEN ds.deviceName LIKE '%CassiaGateway%' THEN (SELECT COUNT(*) FROM ${dynamicTableName} AS sd WHERE deviceMacId = ds.deviceMacId AND CONVERT_TZ(publishedTime, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}')
            WHEN ds.sensorName = 'BeaconScanner' THEN (SELECT COUNT(*) FROM ${clientname}.aliveStatus WHERE deviceMacId = ds.deviceMacId AND CONVERT_TZ(serverTimeStamp, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}')
            ELSE (SELECT COUNT(sensorData) FROM ${clientname}.sensor_value WHERE deviceSensorId = ds.deviceSensorId AND CONVERT_TZ(deviceTimeStamp, '+00:00', d.TimeZone) BETWEEN '${startDateString}' AND '${endDateString}') END AS received FROM ${clientname}.deviceStatus ds JOIN ${clientname}.device d ON d.deviceId = ds.deviceMacId WHERE ds.sensorName NOT IN ('QR-Janitor', 'QR-Feedback') ORDER BY sensorName, buildingName, floorName, areaName) a GROUP BY deviceMacId
    `;
  
      const querySummary = `
        SELECT
          COUNT(*) AS Total,
          sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)>now()-interval 24 hour,1,0)) Active,
          sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<=now()-interval 24 hour,1,0)) Stopped,
          sum(if(ds.deviceTimestamp is null,1,0)) NotYetReporting,
          sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<=now()-interval 24 hour and sensorName='BLEGateWay',1,0)) BLEGateWay,
          sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<=now()-interval 24 hour and sensorName not in ('PeopleCount','ZanInTraffic','ZanOpenAreaTraffic','TOF','BLEGateWay'),1,0)) BleDevices,
          sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<=now()-interval 24 hour and sensorName in ('PeopleCount','ZanInTraffic','ZanOpenAreaTraffic','TOF'),1,0)) as IntrafficDevices,
          sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<=now()-interval 24 hour and sensorName in ('GateWay'),1,0)) Feedback,
          sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<=now()-interval 24 hour and sensorName like '%Occupancy%',1,0)) OccupancyDisplay,
          sum(if(batteryValue<=70 and batteryValue != -3,1,0)) BatteryLow,
          sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<now()-interval 48 hour,1,0)) PreStopped
        FROM \`${clientname}\`.deviceStatus ds
        JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId
        WHERE sensorName NOT IN ('QR-Janitor','QR-Feedback','BeaconScanner');
      `;
  
      db.query(queryDeviceStatus, (error, results) => {
        
        if (error) {
          console.error(`Error executing query for client ${clientname}: ${error.stack}`);
          res.status(500).json({ error: `Internal Server Error for client ${clientname}` });
          return;
        }

        
  
        const worksheet = workbook.addWorksheet(`${clientname}`);
        const headers = [
          'deviceMacId', 'deviceName', 'deviceSensorId', 'buildingName', 'floorName', 
          'areaName','sensoName', 'lastReportingTime','sensorValue', 'batteryValue', 'rssiValue', 'errorCode', 'expected', 'received', 'Loss %'
          
        ];
  
        worksheet.addRow(headers);
  
        results.forEach(row => {
          worksheet.addRow(Object.values(row));
        });
  
        // Calculate counts from the summary query
        db.query(querySummary, (summaryError, summaryResults) => {
          if (summaryError) {
            console.error(`Error executing summary query for client ${clientname}: ${summaryError.stack}`);
            res.status(500).json({ error: `Internal Server Error for client ${clientname}` });
            return;
          }
  
          const summaryRow = summaryResults[0];
          const totalDeviceCount = summaryRow.Total;
          const stoppedDeviceCount = summaryRow.Stopped;
  
          // Write counts to the summary worksheet
          summaryWorksheet.addRow([
            clientname, 
            totalDeviceCount, 
            stoppedDeviceCount,
            summaryRow.Active,
            summaryRow.BLEGateWay,
            summaryRow.BleDevices,
            summaryRow.IntrafficDevices,
            summaryRow.Feedback,
            summaryRow.OccupancyDisplay,
            summaryRow.BatteryLow,
            summaryRow.NotYetReporting,
           
          ]);
  
          if (index === clientNames.length - 1) {
            // Set content type and disposition including a filename
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=exported_data-${clientNames.join('_')}.xlsx`);
  
            // Write the workbook to the response
            workbook.xlsx.write(res).then(() => {
              // End the response stream
              res.end();
            });
          }
        });
      });
    });
  };

  module.exports = {
    packetLoss,packetLossExport
  };