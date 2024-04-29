const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "##############com",
  user: "karthickt",
  password: "Karthickt@123!",
  database: "feef",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306,
  timezone: 'Z', // Set timezone for each connection

});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

db.on("error", (err) => {
  console.error("MySQL error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    // Reconnect if the connection is lost
    db.connect();
  } else {
    throw err;
  }
});

module.exports = db;
