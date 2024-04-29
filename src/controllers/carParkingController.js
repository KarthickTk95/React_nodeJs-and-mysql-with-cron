const ExcelJS = require("exceljs");

const db = require("../db");


const parkingClient = (req, res) => {
 

  db.query(
    "SELECT client FROM MasterDB.device_client WHERE sensorName = 'ParkingSensor' GROUP BY client;",
    (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).json(result);
      }
    }
  );
};

const parkingBuildings = (req, res) => {
  const parkingClient = req.query.parkingClient;

  const query = `SELECT DISTINCT buildingName FROM \`${parkingClient}\`.deviceStatus WHERE sensorName = 'ParkingSensor';`;
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

const carParkingSummary = (req, res) => {
  const parkingClient = req.query.parkingClient;
  const buildingNames = req.query.parkingBuildings; // corrected variable name
  const dates = req.query.dates; // corrected variable name

  // Check if required parameters are provided
  if (!parkingClient || !buildingNames || !dates) {
    res.status(400).json({ error: "Missing required parameters" });
    return;
  }
  const buildingNamesArray = buildingNames.split(",");

  // Assuming you have a MySQL connection pool named 'pool'
  const query = `
        SELECT ds.buildingName,
            CASE 
                WHEN ph.areaId IS NOT NULL THEN convert_tz(ds.deviceTimeStamp, '+00:00', d.TimeZone) 
                ELSE ds.deviceMacId 
            END AS LastReportingTime,
            COALESCE(ph.areaId, 'Not yet') AS areaId,
            COALESCE(ph.entrenceNumber, 'started this') AS entrenceNumber,
            COALESCE(ph.entrenceType, 'Device') AS entrenceType,
            COALESCE(MAX((convert_tz(ph.deviceTimeStamp, '+00:00', d.TimeZone))), 'today') AS LastDeductionTime,
            COUNT(*) AS count 
        FROM ${parkingClient}.deviceStatus ds 
        JOIN ${parkingClient}.device d ON ds.deviceMacId = d.deviceId 
        LEFT JOIN ${parkingClient}.parkingHistory ph ON ds.deviceMacId = ph.deviceMacId 
            AND DATE(CONVERT_TZ(ph.deviceTimeStamp, '+00:00', d.TimeZone)) = '${dates}' 
        WHERE sensorName = 'ParkingSensor' 
            AND ds.buildingName IN ('${buildingNamesArray.join("','")}')
        GROUP BY ds.deviceMacId 
        ORDER BY ph.entrenceType ASC, entrenceNumber;`;


  // Assuming you have a MySQL connection named 'db'
  db.query(query, (error, results) => {
    if (error) {
      console.error("Error executing query: " + error.stack);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.json(results);
  });
};

const getBuildingCurrentTime = (req, res) => {
  const parkingClient = req.query.parkingClient;
  const buildingNames = req.query.parkingBuildings;

  const buildingNamesArray = buildingNames.split(",");

  try {
    const query = `
            SELECT buildingName, CONVERT_TZ(NOW(), '+00:00', timeZone) AS clientTime
            FROM ${parkingClient}.building
            WHERE buildingName IN ('${buildingNamesArray.join("','")}');
        `;

    // Assuming you have a MySQL connection pool or client
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error executing query: " + error.stack);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.json(results);
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ---------------------------------------------EXCEL WRITE ---------------------------------

const parkingExport = (req, res) => {
  const parkingClient = req.query.parkingClient;
  const buildingNames = req.query.parkingBuildings;
  const dates = req.query.dates;
  const moment = require("moment-timezone");

  // Check if required parameters are provided
  if (!parkingClient || !buildingNames || !dates) {
    res.status(400).json({ error: "Missing required parameters" });
    return;
  }

  const buildingNamesArray = buildingNames.split(",");
  const datesArray = dates.split(",");

  const workbook = new ExcelJS.Workbook();
  
  const worksheet = workbook.addWorksheet("Summary");

  // Initialize an object to store the sums for each entranceType
  const dateBuildingSumCounts = {};

  // Execute the new data query outside the loop
  const newDataQuery = `
    SELECT
      ds.buildingName,
      ds.areaId,
      DATE(CONVERT_TZ(p.deviceTimeStamp, '+00:00',d.TimeZone)) AS dDate,
      TIME(CONVERT_TZ(p.deviceTimeStamp, '+00:00',d.TimeZone)) AS dTime,
      entrenceType,
      1 AS CarCount
    FROM
      ${parkingClient}.parkingHistory p
    JOIN ${parkingClient}.device d ON d.deviceId = p.deviceMacId
    JOIN ${parkingClient}.deviceStatus ds ON ds.deviceMacId = p.deviceMacId
    WHERE
      DATE(CONVERT_TZ(p.deviceTimeStamp, '+00:00',d.TimeZone)) IN (${datesArray
        .map((date) => `'${date}'`)
        .join(",")})
      AND ds.buildingName IN (${buildingNamesArray
        .map((building) => `'${building}'`)
        .join(",")})
    ORDER BY
      ds.buildingName, entrenceType,date(CONVERT_TZ(p.deviceTimeStamp, '+00:00',d.TimeZone)),TIME(CONVERT_TZ(p.deviceTimeStamp, '+00:00',d.TimeZone)) desc;
  `;
  console.log(newDataQuery);
  // Execute the new query and handle the results
  db.query(newDataQuery, (error, newResults) => {
    if (error) {
      console.error("Error executing new query: " + error.stack);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    // Iterate through each building and create a worksheet
    buildingNamesArray.forEach((building) => {
      const currentWorksheet = workbook.addWorksheet(`${building}`);

      // Filter results for the current building
      const buildingResults = newResults.filter(
        (result) => result.buildingName === building
      );

      // Add headers to the worksheet
      currentWorksheet.addRow([
        "Building Name",
        "Area ID",
        "Date",
        "Time",
        "Entrance Type",
        "Car Count",
      ]);
      

      // Add data rows to the worksheet
      buildingResults.forEach((result) => {
        // Format date and time using moment-timezone
        const formattedDate = moment(result.dDate).format("YYYY-MM-DD");
       // console.log(newDataQuery);

        currentWorksheet.addRow([
          result.buildingName,
          result.areaId,
          formattedDate,
          result.dTime,
          result.entrenceType,
          result.CarCount,
        ]);
      });
    });

    // Iterate through each date and building combination
    datesArray.forEach((date) => {
      const buildingSumCounts = {};

      buildingNamesArray.forEach((building) => {
        const query = `
            SELECT ds.buildingName,
              CASE 
                WHEN ph.areaId IS NOT NULL THEN convert_tz(ds.deviceTimeStamp, '+00:00', d.TimeZone) 
                ELSE ds.deviceMacId 
              END AS LastReportingTime,
              COALESCE(ph.areaId, 'Not yet') AS areaId,
              COALESCE(ph.entrenceNumber, 'started this') AS entrenceNumber,
              COALESCE(ph.entrenceType, 'Device') AS entrenceType,
              COALESCE(MAX((convert_tz(ph.deviceTimeStamp, '+00:00', d.TimeZone))), 'today') AS LastDeductionTime,
              COUNT(*) AS count 
            FROM ${parkingClient}.deviceStatus ds 
            JOIN ${parkingClient}.device d ON ds.deviceMacId = d.deviceId 
            LEFT JOIN ${parkingClient}.parkingHistory ph ON ds.deviceMacId = ph.deviceMacId 
              AND DATE(CONVERT_TZ(ph.deviceTimeStamp, '+00:00', d.TimeZone)) = '${date}' 
            WHERE sensorName = 'ParkingSensor' 
              AND ds.buildingName = '${building}'
            GROUP BY ds.deviceMacId 
            ORDER BY ph.entrenceType ASC, entrenceNumber;`;

        db.query(query, (error, results) => {
          if (error) {
            console.error("Error executing query: " + error.stack);
            res.status(500).json({ error: "Internal Server Error" });
            return;
          }

         // console.log("Current Date:", date);
         // console.log("Current Building:", building);
          worksheet.addRow(["DATE:", date, "Building Name:", building]);
          // Add headers to the worksheet
          worksheet.addRow([
            "Building Name",
            "Last Reporting Time",
            "Area ID",
            "Entrance Number",
            "Entrance Type",
            "Last Deduction Time",
            "Count",
          ]);

          // Add data rows to the worksheet
          results.forEach((result) => {
            worksheet.addRow([
              result.buildingName,
              result.LastReportingTime,
              result.areaId,
              result.entrenceNumber,
              result.entrenceType,
              result.LastDeductionTime,
              result.count,
            ]);

            // Calculate the sum for each entrenceType, building, and date
            const key = `${building}_${result.entrenceType}`;
            const dateKey = `${date}_${key}`;

            if (!dateBuildingSumCounts[dateKey]) {
              dateBuildingSumCounts[dateKey] = result.count;
            } else {
              dateBuildingSumCounts[dateKey] += result.count;
            }
          });

          // Add an empty row between data and summary
          worksheet.addRow([]);

          // Add summary section headers
          worksheet.addRow([
            "",
            "IN COUNT",
            "OUT COUNT",
            "TOTAL",
            "PERCENTAGE",
          ]);

          // Calculate and add summary rows for each date and building
          buildingNamesArray.forEach((summaryBuilding) => {
            if (summaryBuilding === building) {
              buildingSumCounts[`${summaryBuilding}_IN`] = 0; // Start from 0 for each building
              buildingSumCounts[`${summaryBuilding}_OUT`] = 0;

              // Sum counts for each entrenceType
              results.forEach((result) => {
                const key = `${summaryBuilding}_${result.entrenceType}`;
                buildingSumCounts[key] += result.count;
              });

              const inCount = buildingSumCounts[`${summaryBuilding}_IN`] || 0;
              const outCount = buildingSumCounts[`${summaryBuilding}_OUT`] || 0;
              const totalCount = inCount + outCount;
              const decimalPlaces = 2; // You can adjust this based on your rounding requirements
              const percentage =
                totalCount > 0
                  ? (100 - (outCount / inCount) * 100).toFixed(decimalPlaces)
                  : 0;
              const percentageAsNumber = parseFloat(percentage);
              worksheet.addRow([
                "",
                inCount,
                outCount,
                totalCount,
                percentageAsNumber,
              ]);

              worksheet.addRow(["", "", "", "", ""]);
              worksheet.addRow(["", "", "", "", ""]);
            }
          });

          // Print the sums for each date
         // console.log(`Sum of counts by date, building, and entrenceType for ${date}:`,dateBuildingSumCounts);

          // If this is the last combination, send the response
          if (
            date === datesArray[datesArray.length - 1] &&
            building === buildingNamesArray[buildingNamesArray.length - 1]
          ) {
            // Set content type and header for the response
            res.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
              "Content-Disposition",
              "attachment; filename=ParkingData.xlsx"
            );

            // Write the workbook to the response
            workbook.xlsx
              .write(res)
              .then(() => {
                res.end();
              })
              .catch((err) => {
                console.error("Error writing workbook to response:", err);
                res.status(500).json({ error: "Internal Server Error" });
              });
          }
        });
      });
    });
  });
};

module.exports = {
  parkingClient,
  parkingBuildings,
  carParkingSummary,
  getBuildingCurrentTime,
  parkingExport,
};
