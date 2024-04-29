const db = require('../db');

const getClients = (req, res) => {
  db.query("SELECT dbName as clientName FROM appMonitoringConfig;", (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).json(result);
    }
  });
};

module.exports = {
  getClients,
};
