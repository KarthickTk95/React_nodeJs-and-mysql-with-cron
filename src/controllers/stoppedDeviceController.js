const db = require('../db');
const ExcelJS = require('exceljs');


//app.get("/api/getClientData",
// getStoppedDevices devices
const stoppedDevices = (req, res) => {
  const clientname = req.query.clientName;
  const startDateTime = req.query.startDateTime;
  const endDateTime = req.query.endDateTime;


  console.log("clientname:", clientname);
console.log("startDateTime:", startDateTime);
console.log("endDateTime:", endDateTime);

  const query = `
  SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId WHERE ds.sensorName NOT IN ('QR-Janitor', 'QR-Feedback') and ds.deviceTimeStamp between '${startDateTime}' and '${endDateTime}' ORDER BY buildingName, floorName, areaName;
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


//Stopped device EXCEL getExportIntoRawDataExcelFile
//app.get("/api/getExportIntoRawDataExcelFile"
const StoppedExport = (req, res) => {
  const clientNames = req.query.clientNames.split(',');
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  
  const workbook = new ExcelJS.Workbook();
  const summaryWorksheet = workbook.addWorksheet('Summary');
  summaryWorksheet.addRow(['Client Name', 'Total Device Count', 'Stopped Device Count', 'Active Device Count', 'BLEGateWay', 'BleDevices', 'IntrafficDevices', 'Feedback', 'OccupancyDisplay', 'BatteryLow', 'NotYetReporting']);

  clientNames.forEach((clientname, index) => {
    const queryDeviceStatus = `
      SELECT ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName, convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone) AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimeStamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientname}\`.deviceStatus ds LEFT JOIN \`${clientname}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id = ( SELECT MAX(id) FROM \`${clientname}\`.errorMessageInfo WHERE deviceId = ds.deviceMacId ) JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId WHERE ds.sensorName NOT IN ('QR-Janitor', 'QR-Feedback') and ds.deviceTimeStamp not between '${startDate}' and '${endDate}' ORDER BY buildingName, floorName, areaName;
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
        'areaName', 'lastReportingTime', 'errorCode', 'errorDescription', 'lastErrorMsgTime', 
        'sensorValue', 'batteryValue', 'rssiValue'
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
  StoppedExport,stoppedDevices
};