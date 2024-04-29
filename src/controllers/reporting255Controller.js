const db = require('../db');

const reporting255 = (req, res) => {
  const clientNameQuery = "SELECT dbName as clientName FROM appMonitoringConfig ;";

  db.query(clientNameQuery, (error, clientNames) => {
    if (error) {
      console.error("Error executing client name query:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Assuming clientNames is an array of objects with a 'clientName' property
    const results = [];

    // Loop through clientNames and execute the main query for each client
    clientNames.forEach(({ clientName }) => {
      const mainQuery = `SELECT  '${clientName}' AS clientname, ds.deviceMacId, ds.deviceName, ds.deviceSensorId, ds.buildingName, ds.floorName, ds.areaName,convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)  AS lastReportingTime, er.errorCode, er.errorDescription, convert_tz(er.deviceTimestamp,'+00:00',d.TimeZone) as lastErrorMsgTime, ds.sensorValue, ds.batteryValue, ds.rssiValue FROM \`${clientName}\`.deviceStatus ds LEFT JOIN \`${clientName}\`.errorMessageInfo er ON ds.deviceMacId = er.deviceId and er.id=(select max(id) from \`${clientName}\`.errorMessageInfo where deviceId=ds.deviceMacId) join \`${clientName}\`.device d on d.deviceId = ds.deviceMacId and d.deviceId = er.deviceId WHERE ds.sensorName not in ('QR-Janitor','QR-Feedback','BeaconScanner','GateWay')and ds.sensorValue='255' ORDER BY buildingName, floorName, areaName;`;
        console.log(mainQuery);
      db.query(mainQuery, (err, result) => {
        if (err) {
          console.error("Error executing main query:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        // Assuming result is an array of objects, push it to the results array
        results.push(...result);

        // Check if this is the last clientName query
        if (results.length === clientNames.length) {
          res.json(results);
        }
      });
    });
  });
};

module.exports = {
  reporting255,
};
