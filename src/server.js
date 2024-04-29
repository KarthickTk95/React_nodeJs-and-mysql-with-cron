const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const axios = require("axios");
const db = require("./db");
const ExcelJS = require("exceljs");
const fs = require("fs");
const moment = require("moment-timezone");

// Set the default timezone globally to UTC
moment.tz.setDefault("UTC");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const loginRouter = require("./routes/login");
app.use("/api/login", loginRouter);

// API endpoints
const clientsRouter = require("./routes/clients");
app.use("/api/Clients", clientsRouter);

const summaryRouter = require("./routes/summary");
app.use("/api/getSummary", summaryRouter);

const summaryDeviceRouter = require("./routes/summaryDevice");
app.use("/api/summaryDevice", summaryDeviceRouter);

const stoppedDeviceRouter = require("./routes/stoppedDevice");
app.use("/api/stoppedDevice", stoppedDeviceRouter);

const packetLossReportRouter = require("./routes/packetLossReport");
app.use("/api/packetLossReport", packetLossReportRouter);

const zanDeviceDataTableRouter = require("./routes/zanDeviceDataTable");
app.use("/api/zanDeviceDataTable", zanDeviceDataTableRouter);

const reporting255Router = require("./routes/reporting255");
app.use("/api/reporting255", reporting255Router);

const carParkingRouter = require("./routes/carParking");
app.use("/api/carParking", carParkingRouter);

// ... Add other routers for different endpoints ...

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// ____  cron

app.get("/run-sql-query", async (req, res) => {
  const parkingClient = "synopsys";
  const buildingNamesArray = ["USV-G1", "USV-G2"];
  const currentDate = new Date();
  const formattedCurrentDate = currentDate.toISOString().split("T")[0];

  // Calculate yesterday's date
  const yesterday = new Date(currentDate);
  yesterday.setDate(currentDate.getDate() - 1);
  const formattedYesterday = yesterday.toISOString().split("T")[0];

  // const datesArray = [formattedCurrentDate, formattedYesterday];
  const datesArray = [formattedYesterday];
  const moment = require("moment-timezone");

  try {
    const filePath = "Car parking Report.xlsx";
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Summary"); // Create a single worksheet

    // Iterate through each date
    for (const date of datesArray) {
      // Iterate through each building
      for (const building of buildingNamesArray) {
        const sqlQuery = `SELECT ds.buildingName, CASE WHEN ph.areaId IS NOT NULL THEN convert_tz(ds.deviceTimeStamp, '+00:00', d.TimeZone) ELSE ds.deviceMacId END AS LastReportingTime,COALESCE(ph.areaId, 'Not yet') AS areaId,COALESCE(ph.entrenceNumber, 'started this') AS entrenceNumber,COALESCE(ph.entrenceType, 'Device') AS entrenceType,COALESCE(MAX((convert_tz(ph.deviceTimeStamp, '+00:00', d.TimeZone))), 'today') AS LastDeductionTime,COUNT(*) AS count FROM ${parkingClient}.deviceStatus ds JOIN ${parkingClient}.device d ON ds.deviceMacId = d.deviceId LEFT JOIN ${parkingClient}.parkingHistory ph ON ds.deviceMacId = ph.deviceMacId AND DATE(CONVERT_TZ(ph.deviceTimeStamp, '+00:00', d.TimeZone)) = '${date}' WHERE sensorName = 'ParkingSensor' AND ds.buildingName = '${building}' GROUP BY ds.deviceMacId ORDER BY ph.entrenceType ASC, entrenceNumber;`;

        const result = await executeQuery(sqlQuery);

        // Log the result to the console
        console.log(
          `SQL query result for Date: ${date}, Building: ${building}`,
          result
        );
        // Add headers to the worksheet
        worksheet.addRow([
          "Building Name",
          "Date",
          "Last Reporting Time",
          "Area ID",
          "Entrance Number",
          "Entrance Type",
          "Last Deduction Time",
          "Count",
        ]);
        // Add data rows to the worksheet
        result.forEach((row) => {
          worksheet.addRow([
            row.buildingName,
            date,
            row.LastReportingTime,
            row.areaId,
            row.entrenceNumber,
            row.entrenceType,
            row.LastDeductionTime,
            row.count,
          ]);
        });
        // Calculate InCount, OutCount, and percentage
        const inCount = result
          .filter((row) => row.entrenceType === "IN")
          .reduce((acc, row) => acc + row.count, 0);
        const outCount = result
          .filter((row) => row.entrenceType === "OUT")
          .reduce((acc, row) => acc + row.count, 0);
        const percentage = 100 - (outCount / inCount) * 100;

        // Add InCount, OutCount, and percentage rows
        worksheet.addRow([
          "InCount",
          inCount,
          "OutCount",
          outCount,
          "percentage",
          percentage,
        ]);

        worksheet.addRow(["", "", "", "", ""]);
        worksheet.addRow(["", "", "", "", ""]);
      }
    }

    // Create a worksheet for each building
    for (const building of buildingNamesArray) {
      console.log(formattedYesterday);
      const worksheet = workbook.addWorksheet(building);

      // Execute query for the current building
      const buildingQuery = `
    SELECT ds.buildingName,ds.areaId, DATE(CONVERT_TZ(p.deviceTimeStamp, '+00:00', d.TimeZone)) AS dDate, TIME(CONVERT_TZ(p.deviceTimeStamp, '+00:00', d.TimeZone)) AS dTime, entrenceType, 1 AS CarCount FROM  ${parkingClient}.parkingHistory p JOIN ${parkingClient}.device d ON d.deviceId = p.deviceMacId JOIN ${parkingClient}.deviceStatus ds ON ds.deviceMacId = p.deviceMacId WHERE DATE(CONVERT_TZ(p.deviceTimeStamp, '+00:00', d.TimeZone)) IN (${datesArray
        .map((date) => `'${date}'`)
        .join(
          ","
        )}) AND ds.buildingName = '${building}' ORDER BY  ds.buildingName, entrenceType, dDate, dTime DESC;
  `;
      const buildingResult = await executeQuery(buildingQuery);

      // Add headers to the worksheet
      worksheet.addRow([
        "buildingName",
        "areaId",
        "dDate",
        "dTime",
        "entrenceType",
        "CarCount",
      ]);

      // Process and add data to the worksheet
      buildingResult.forEach((row) => {
        const formattedDate = moment(row.dDate).format("YYYY-MM-DD");

        worksheet.addRow([
          row.buildingName,
          row.areaId,
          formattedDate,
          row.dTime,
          row.entrenceType,
          row.CarCount,
        ]);
      });
    }

    // Save the workbook to the specified file path
    await workbook.xlsx.writeFile(filePath);

    await sendEmail(
      "karthicktamilselvan@zancompute.com",
      "Data Export",
      "Please find the attached Excel file.",
      filePath
    );

    res.json({ message: "Data exported and email sent successfully" });
  } catch (error) {
    console.error("Error in /run-sql-query route:", error);
    res.status(500).send("Internal Server Error");
  }
});

async function executeQuery(sqlQuery) {
  return new Promise((resolve, reject) => {
    db.query(sqlQuery, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// async function writeExcelFile(filePath, data) {
//   console.log("Writing Excel...");
//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet("Sheet 1");

//   // Assuming data is an array of objects, where each object represents a row
//   // Extract values from each object and organize them into an array
//   const rows = data.map((item) => [item.clientName]);
//   // Add the organized rows to the worksheet
//   worksheet.addRows(rows);

//   // Save the workbook to the specified file path
//   await workbook.xlsx.writeFile(filePath);
// }

async function sendEmail(to, subject, text, attachmentPath) {
  try {
    console.log("Sending email...");
    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: "zancompute2013@zancompute.com",
        pass: "Zan@1234",
      },
    });

    // Ensure the attachment file exists
    if (!fs.existsSync(attachmentPath)) {
      throw new Error("Attachment file not found.");
    }

    const currentDate = new Date();
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    const formattedYesterday = yesterday.toISOString().split("T")[0];

    const mailOptions = {
      from: "zancompute2013@zancompute.com",
      to: "cmouli@zancompute.com,ksridharan@zancompute.com,manimegalai@zancompute.com,manogaran@zancompute.com,javier@zancompute.com,janani@zancompute.com,spalomino@zancompute.com,Testing_Team@zancompute.com,embedded@zancompute.com",
      subject: `Synopsys Car Parking Data Report - ${formattedYesterday}`,
      text: `Please find attached the car parking data report  - ${formattedYesterday}.`,
      attachments: [
        {
          filename: "Car parking Report.xlsx",
          path: attachmentPath,
        },
      ],
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Rethrow the error to propagate it to the calling function
  }
}

//cron.schedule("* * * * *", async () => {
cron.schedule("0 9 * * *", async () => {
  try {
    console.log("cron Job start");

    const response = await axios.get("http://localhost:3001/run-sql-query");
    console.log(response.data);
  } catch (error) {
    console.error(error.message);
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
