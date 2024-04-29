const db = require('../db');

// TOTAL devices
const zanDeviceTopic = (req, res) => {
    const yearmonth = req.query.yearmonth;
    const deviceMacId = req.query.deviceMacId;
    const query = `SELECT topic FROM zanDeviceData.sensorData_${yearmonth} WHERE deviceMacId = '${deviceMacId}' GROUP BY topic`;
    
    console.log(query);
    db.query(query, [deviceMacId], (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      res.json(results);
    });
  };



  const zanDeviceData = (req, res) => {
    const yearmonth = req.query.yearmonth;
    const deviceMacId = req.query.deviceMacId;
    const topic = req.query.topic;
     // Assuming deviceMacId is part of the request query
  
    const query = `select * from zanDeviceData.sensorData_${yearmonth} where deviceMacId = '${deviceMacId}' and topic = '${topic}' order by id desc limit 100;`;
    
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
  



module.exports = {
    zanDeviceData,zanDeviceTopic
  };