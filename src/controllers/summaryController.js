const db = require('../db');


// get Summary
const Summary = (req, res) => {
    // Fetch the list of clients first
    db.query("SELECT dbName as clientName FROM appMonitoringConfig", (clientsError, clientsResult) => {
      if (clientsError) {
        console.error("Error fetching clients: " + clientsError.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      // Extract client names from the result
      const clientNames = clientsResult.map(client => client.clientName);
  
      // Check if there are no clients
      if (clientNames.length === 0) {
        res.json({ message: "No clients found" });
        return;
      }
  
      // Now proceed to get the summary for each client
      const summaries = [];
  
      const fetchSummary = (clientname, callback) => {
        const query = `SELECT COUNT(*) AS Total,sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)>now()-interval 24 hour,1,0)) Active,sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<=now()-interval 24 hour,1,0)) Stopped,sum(if(ds.deviceTimestamp is null,1,0)) NotYetReporting,sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<=now()-interval 24 hour and sensorName='BLEGateWay',1,0)) BLEGateWay,sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<=now()-interval 24 hour and sensorName not in ('PeopleCount','ZanInTraffic','ZanOpenAreaTraffic','TOF','BLEGateWay'),1,0)) BleDevices,sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<=now()-interval 24 hour and sensorName in ('PeopleCount','ZanInTraffic','ZanOpenAreaTraffic','TOF'),1,0)) as IntrafficDevices,sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<=now()-interval 24 hour and sensorName in ('GateWay'),1,0)) Feedback,sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<=now()-interval 24 hour and sensorName like '%Occupancy%',1,0)) OccupancyDisplay,sum(if(batteryValue<=70 and batteryValue != -3,1,0)) BatteryLow,sum(if(convert_tz(ds.deviceTimestamp,'+00:00',d.TimeZone)<now()-interval 48 hour,1,0)) PreStopped FROM \`${clientname}\`.deviceStatus ds JOIN \`${clientname}\`.device d ON d.deviceId = ds.deviceMacId WHERE sensorName NOT IN ('QR-Janitor','QR-Feedback','BeaconScanner');`;
        db.query(query, (error, results) => {
          if (error) {
            console.error("Error executing query: " + error.stack);
            callback(error);
          } else {
            const summaryObject = results[0];
            summaryObject.clientname = clientname;
            summaries.push([summaryObject]);
            callback();
          }
        });
      };
  
      // Use async function to manage asynchronous calls
      const fetchAllSummaries = async () => {
        for (const clientname of clientNames) {
          await new Promise((resolve) => {
            fetchSummary(clientname, resolve);
          });
        }
  
        res.json(summaries);
      };
  
      fetchAllSummaries();
    });
  };
  

  module.exports = {
    Summary
  };