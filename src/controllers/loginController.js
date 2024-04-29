const db = require('../db');

const login = (req, res) => {
  const { username, password } = req.body;
  const encodedPassword = btoa(password);

  const sql = "SELECT COUNT(*) AS count FROM prdApp.member WHERE username = ? AND password = ?";

  db.query(sql, [username, encodedPassword], (error, result) => {
    if (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Internal Server Error" });
    } else {
      const count = result[0].count;
      if (count > 0) {
        res.status(200).json({ message: "Login successful" });
      } else {
        res.status(401).json({ message: "Invalid username or password" });
      }
    }
  });
};

module.exports = {
  login,
};
